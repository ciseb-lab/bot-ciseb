import { createHash, randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { isIP } from 'node:net';
import { getConfig } from './config.ts';
import { isInstitutionalEmail } from '../shared/authPolicy.ts';
import {
  AuthenticationError,
  readBearerToken,
  verifySupabaseAccessToken,
} from './supabaseAuth.ts';
import { getSupabaseAdminClient } from './supabaseAdmin.ts';

export interface AuthenticatedIdentity {
  uid: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      identity?: AuthenticatedIdentity;
    }
  }
}

export interface RateLimitPolicy {
  scope: string;
  uidMinuteLimit: number;
  uidDailyLimit?: number;
  ipMinuteLimit: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimitAttempt {
  policy: RateLimitPolicy;
  identity: AuthenticatedIdentity;
  clientIp: string;
  now: number;
}

type RateLimitCheck = (attempt: RateLimitAttempt) => Promise<RateLimitDecision>;
const configuredLimits = getConfig();

export function hasVerifiedInstitutionalIdentity(identity: {
  uid?: unknown;
  email?: unknown;
}): identity is { uid: string; email: string } {
  return typeof identity.uid === 'string'
    && identity.uid.length > 0
    && typeof identity.email === 'string'
    && isInstitutionalEmail(identity.email);
}

export const securityLimits = {
  chatPerMinute: configuredLimits.chatPerMinute,
  chatPerDay: configuredLimits.chatPerDay,
  apiPerIpMinute: configuredLimits.apiPerIpMinute,
  pdfPerMinute: configuredLimits.pdfPerMinute,
  pdfPerIpMinute: configuredLimits.pdfPerIpMinute,
  chatMaxChars: configuredLimits.chatMaxInputChars,
  historyMaxChars: configuredLimits.chatHistoryMaxChars,
  maxChatConcurrency: configuredLimits.chatMaxConcurrencyPerUser,
};

export function validateChatPayload(req: Request, res: Response, next: NextFunction): void {
  const rawMessage = req.body?.message;
  if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
    res.status(400).json({ error: 'Mensagem inválida.' });
    return;
  }
  if (rawMessage.trim().length > securityLimits.chatMaxChars) {
    res.status(413).json({ error: 'A mensagem excede o limite permitido.' });
    return;
  }
  const history = req.body?.history;
  if (history !== undefined && (!Array.isArray(history) || history.length > 6
    || history.some((item: unknown) => !item || typeof item !== 'object'
      || !('role' in item) || !('content' in item)
      || !(['user', 'assistant'].includes(String(item.role)))
      || typeof item.content !== 'string'))) {
    res.status(400).json({ error: 'O contexto recente da conversa é inválido.' });
    return;
  }
  next();
}

export function validatePdfPayload(req: Request, res: Response, next: NextFunction): void {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  if (!title || !content) {
    res.status(400).json({ error: 'Informe um título e conteúdo para gerar o PDF.' });
    return;
  }
  if (title.length > 180 || Buffer.byteLength(content, 'utf8') > 150_000) {
    res.status(413).json({ error: 'O material excede o limite permitido para exportação.' });
    return;
  }
  next();
}

export function validateCurriculumQuery(req: Request, res: Response, next: NextFunction): void {
  for (const key of ['stage', 'component', 'theme', 'code']) {
    const value = req.query[key];
    if (value !== undefined && (typeof value !== 'string' || value.length > 100)) {
      res.status(400).json({ error: 'Os filtros informados são inválidos.' });
      return;
    }
  }
  next();
}

export function validateCurriculumCode(req: Request, res: Response, next: NextFunction): void {
  if (req.params.code.length > 32 || !/^[a-zA-Z0-9._-]+$/.test(req.params.code)) {
    res.status(400).json({ valid: false, error: 'O código curricular informado é inválido.' });
    return;
  }
  next();
}

export async function requireInstitutionalIdentity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identity = await verifySupabaseAccessToken(
      readBearerToken(req.header('Authorization')),
      getConfig(),
    );
    if (!hasVerifiedInstitutionalIdentity(identity)) {
      res.status(403).json({ code: 'GOOGLE_INSTITUTIONAL_ACCOUNT_REQUIRED', error: 'Acesse com uma conta Google verificada de um domínio institucional autorizado.' });
      return;
    }
    req.identity = identity;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.status).json({ code: error.responseCode, error: error.message });
      return;
    }
    console.error(JSON.stringify({
      severity: 'ERROR',
      event: 'supabase_identity_verification_failed',
      errorName: error instanceof Error ? error.name : 'UnknownError',
    }));
    res.status(503).json({
      code: 'AUTH_VERIFICATION_UNAVAILABLE',
      error: 'Não foi possível validar sua sessão no servidor. Tente novamente em instantes.',
    });
  }
}

function getClientIp(req: Request): string {
  const candidate = req.ip || req.socket.remoteAddress || '';
  const normalized = candidate.startsWith('::ffff:') ? candidate.slice(7) : candidate;
  return isIP(normalized) ? normalized : 'unknown';
}

async function consumeRateLimit({
  policy, identity, clientIp,
}: RateLimitAttempt): Promise<RateLimitDecision> {
  const client = await getSupabaseAdminClient();
  const clientIpHash = createHash('sha256').update(clientIp).digest('hex');
  const { data, error } = await client.rpc('consume_request_rate_limit', {
    p_scope: policy.scope,
    p_user_id: identity.uid,
    p_client_ip_hash: clientIpHash,
    p_uid_minute_limit: policy.uidMinuteLimit,
    p_uid_daily_limit: policy.uidDailyLimit ?? null,
    p_ip_minute_limit: policy.ipMinuteLimit,
  });
  if (error) throw error;
  const decision = Array.isArray(data) ? data[0] : data;
  if (!decision || typeof decision !== 'object' || !('allowed' in decision)
    || !('retry_after_seconds' in decision)) throw new Error('Invalid rate limit response.');
  return {
    allowed: decision.allowed === true,
    retryAfterSeconds: Number(decision.retry_after_seconds) || 0,
  };
}

export function createRateLimitMiddleware(
  policy: RateLimitPolicy,
  check: RateLimitCheck = consumeRateLimit,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identity = req.identity;
    if (!identity) {
      res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Entre com seu e-mail institucional para continuar.' });
      return;
    }
    try {
      const decision = await check({ policy, identity, clientIp: getClientIp(req), now: Date.now() });
      if (!decision.allowed) {
        res.setHeader('Retry-After', String(decision.retryAfterSeconds));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + decision.retryAfterSeconds));
        res.setHeader('X-RateLimit-Limit', String(policy.uidMinuteLimit));
        res.status(429).json({ error: 'O limite de solicitações foi atingido. Aguarde antes de tentar novamente.', retryAfterSeconds: decision.retryAfterSeconds });
        return;
      }
      res.setHeader('X-RateLimit-Limit', String(policy.uidMinuteLimit));
      next();
    } catch {
      console.error(JSON.stringify({ severity: 'ERROR', event: 'rate_limit_check_failed', scope: policy.scope }));
      res.status(503).json({ error: 'Não foi possível verificar o limite de uso com segurança. Tente novamente em instantes.' });
    }
  };
}

export function rateLimit(policy: RateLimitPolicy) {
  return createRateLimitMiddleware(policy);
}

export function limitConcurrentChats(maxActive: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identity = req.identity;
    if (!identity) {
      res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Entre com seu e-mail institucional para continuar.' });
      return;
    }
    const client = await getSupabaseAdminClient().catch(() => null);
    if (!client) {
      res.status(503).json({ error: 'O controle de concorrência ainda não está configurado.' });
      return;
    }

    const requestId = randomUUID();
    try {
      const { data, error } = await client.rpc('acquire_chat_lease', {
        p_user_id: identity.uid,
        p_request_id: requestId,
        p_max_active: maxActive,
        p_lease_ms: 120_000,
      });
      if (error) throw error;
      const decision = Array.isArray(data) ? data[0] : data;
      if (!decision || typeof decision !== 'object' || !('allowed' in decision)
        || !('retry_after_seconds' in decision)) throw new Error('Invalid concurrency response.');
      const retryAfterSeconds = Number(decision.retry_after_seconds) || 0;
      if (decision.allowed !== true) {
        res.setHeader('Retry-After', String(retryAfterSeconds));
        res.status(429).json({ error: 'Você já tem solicitações em andamento. Aguarde a conclusão antes de enviar outra.', retryAfterSeconds });
        return;
      }

      let released = false;
      const release = async () => {
        if (released) return;
        released = true;
        try {
          const { error } = await client.rpc('release_chat_lease', { p_request_id: requestId });
          if (error) throw error;
        } catch {
          console.error(JSON.stringify({ severity: 'WARNING', event: 'chat_concurrency_release_failed' }));
        }
      };
      res.once('finish', () => { void release(); });
      res.once('close', () => { void release(); });
      next();
    } catch {
      console.error(JSON.stringify({ severity: 'ERROR', event: 'chat_concurrency_check_failed' }));
      res.status(503).json({ error: 'Não foi possível verificar as solicitações em andamento. Tente novamente.' });
    }
  };
}
