import { createHash, randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { isIP } from 'node:net';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAppCheck, adminAuth, adminFirestore } from './firebaseAdmin.ts';
import { isInstitutionalEmail } from '../src/config/authPolicy.ts';

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

function configuredPositiveInteger(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const securityLimits = {
  chatPerMinute: configuredPositiveInteger('CHAT_RATE_LIMIT_PER_MINUTE', 10),
  chatPerDay: configuredPositiveInteger('CHAT_RATE_LIMIT_PER_DAY', 100),
  apiPerIpMinute: configuredPositiveInteger('API_RATE_LIMIT_PER_IP_PER_MINUTE', 30),
  pdfPerMinute: configuredPositiveInteger('PDF_RATE_LIMIT_PER_MINUTE', 5),
  pdfPerIpMinute: configuredPositiveInteger('PDF_RATE_LIMIT_PER_IP_PER_MINUTE', 10),
  chatMaxChars: configuredPositiveInteger('CHAT_MAX_INPUT_CHARS', 4000),
  historyMaxChars: configuredPositiveInteger('CHAT_HISTORY_MAX_CHARS', 1200),
  maxChatConcurrency: configuredPositiveInteger('CHAT_MAX_CONCURRENCY_PER_USER', 2),
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

export function hasVerifiedInstitutionalIdentity(claims: { uid?: unknown; email?: unknown; email_verified?: unknown }): claims is { uid: string; email: string; email_verified: true } {
  return typeof claims.uid === 'string'
    && claims.uid.length > 0
    && claims.email_verified === true
    && typeof claims.email === 'string'
    && isInstitutionalEmail(claims.email);
}

export async function requireAppCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  const isRequired = process.env.APP_CHECK_REQUIRED === 'true';
  const token = req.header('X-Firebase-AppCheck');
  if (!token && !isRequired) return next();
  if (!token) {
    res.status(401).json({ code: 'APP_CHECK_REQUIRED', error: 'Não foi possível validar este aplicativo. Atualize a página e tente novamente.' });
    return;
  }
  if (!adminAppCheck) {
    res.status(503).json({ code: 'APP_CHECK_UNAVAILABLE', error: 'A validação segura do aplicativo ainda não está configurada.' });
    return;
  }
  try {
    await adminAppCheck.verifyToken(token);
    next();
  } catch {
    res.status(401).json({ code: 'APP_CHECK_INVALID', error: 'A validação do aplicativo expirou. Atualize a página e tente novamente.' });
  }
}

export async function requireInstitutionalIdentity(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!adminAuth) {
    res.status(503).json({ error: 'A autenticação do servidor ainda não está configurada.' });
    return;
  }
  const authorization = req.header('Authorization') || '';
  const match = authorization.match(/^Bearer ([A-Za-z0-9._~-]+)$/);
  if (!match) {
    res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Entre com seu e-mail institucional para continuar.' });
    return;
  }
  try {
    const decoded = await adminAuth.verifyIdToken(match[1], true);
    if (!hasVerifiedInstitutionalIdentity(decoded)) {
      res.status(403).json({ code: 'EMAIL_NOT_VERIFIED_OR_DOMAIN_NOT_ALLOWED', error: 'Verifique seu e-mail institucional autorizado antes de acessar este recurso.' });
      return;
    }
    req.identity = { uid: decoded.uid, email: decoded.email.toLowerCase() };
    next();
  } catch {
    res.status(401).json({ code: 'SESSION_EXPIRED', error: 'Sua sessão expirou. Entre novamente para continuar.' });
  }
}

function getClientIp(req: Request): string {
  const candidate = req.ip || req.socket.remoteAddress || '';
  const normalized = candidate.startsWith('::ffff:') ? candidate.slice(7) : candidate;
  return isIP(normalized) ? normalized : 'unknown';
}

function getWindowStart(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

function retryDelayUntil(windowStart: number, windowMs: number, now: number): number {
  return Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
}

async function consumeRateLimit({ policy, identity, clientIp, now }: RateLimitAttempt): Promise<RateLimitDecision> {
  if (!adminFirestore) throw new Error('Rate limiting requires Firestore Admin.');
  const minuteStart = getWindowStart(now, 60_000);
  const dayStart = getWindowStart(now, 86_400_000);
  const ipDigest = createHash('sha256').update(clientIp).digest('hex').slice(0, 40);
  const uidRef = adminFirestore.collection('rateLimitCounters').doc(`user_${policy.scope}_${identity.uid}`);
  const ipRef = adminFirestore.collection('rateLimitCounters').doc(`ip_${policy.scope}_${ipDigest}`);
  const expiry = Timestamp.fromMillis(now + 90 * 86_400_000);

  return adminFirestore.runTransaction(async transaction => {
    const [uidSnapshot, ipSnapshot] = await Promise.all([transaction.get(uidRef), transaction.get(ipRef)]);
    const uidData = uidSnapshot.data() || {};
    const ipData = ipSnapshot.data() || {};
    const uidMinuteCount = uidData.minuteWindow === minuteStart ? Number(uidData.minuteCount) || 0 : 0;
    const uidDayCount = uidData.dayWindow === dayStart ? Number(uidData.dayCount) || 0 : 0;
    const ipMinuteCount = ipData.minuteWindow === minuteStart ? Number(ipData.minuteCount) || 0 : 0;
    const delay = Math.max(
      uidMinuteCount >= policy.uidMinuteLimit ? retryDelayUntil(minuteStart, 60_000, now) : 0,
      policy.uidDailyLimit && uidDayCount >= policy.uidDailyLimit ? retryDelayUntil(dayStart, 86_400_000, now) : 0,
      ipMinuteCount >= policy.ipMinuteLimit ? retryDelayUntil(minuteStart, 60_000, now) : 0,
    );
    if (delay > 0) return { allowed: false, retryAfterSeconds: delay };

    transaction.set(uidRef, {
      minuteWindow: minuteStart,
      minuteCount: uidMinuteCount + 1,
      ...(policy.uidDailyLimit ? { dayWindow: dayStart, dayCount: uidDayCount + 1 } : {}),
      expireAt: expiry,
    }, { merge: true });
    transaction.set(ipRef, {
      minuteWindow: minuteStart,
      minuteCount: ipMinuteCount + 1,
      expireAt: expiry,
    }, { merge: true });
    return { allowed: true, retryAfterSeconds: 0 };
  });
}

export function createRateLimitMiddleware(policy: RateLimitPolicy, check: RateLimitCheck = consumeRateLimit) {
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
    if (!identity || !adminFirestore) {
      res.status(503).json({ error: 'O controle de concorrência ainda não está configurado.' });
      return;
    }
    const lockRef = adminFirestore.collection('rateLimitCounters').doc(`concurrency_${identity.uid}`);
    const requestId = randomUUID();
    const now = Date.now();
    const leaseMs = 120_000;
    try {
      const decision = await adminFirestore.runTransaction(async transaction => {
        const snapshot = await transaction.get(lockRef);
        const data = snapshot.data() || {};
        const leases = data.leases && typeof data.leases === 'object' ? data.leases as Record<string, unknown> : {};
        const activeLeases = Object.fromEntries(Object.entries(leases).filter(([, until]) => typeof until === 'number' && until > now));
        if (Object.keys(activeLeases).length >= maxActive) {
          const nextLease = Math.min(...Object.values(activeLeases).map(until => Number(until)));
          return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((nextLease - now) / 1000)) };
        }
        transaction.set(lockRef, {
          leases: { ...activeLeases, [requestId]: now + leaseMs },
          expireAt: Timestamp.fromMillis(now + 86_400_000),
        }, { merge: true });
        return { allowed: true, retryAfterSeconds: 0 };
      });
      if (!decision.allowed) {
        res.setHeader('Retry-After', String(decision.retryAfterSeconds));
        res.status(429).json({ error: 'Você já tem solicitações em andamento. Aguarde a conclusão antes de enviar outra.', retryAfterSeconds: decision.retryAfterSeconds });
        return;
      }

      let released = false;
      const release = async () => {
        if (released) return;
        released = true;
        try {
          await adminFirestore!.runTransaction(async transaction => {
            const snapshot = await transaction.get(lockRef);
            const data = snapshot.data() || {};
            const releaseTime = Date.now();
            const leases = data.leases && typeof data.leases === 'object' ? data.leases as Record<string, unknown> : {};
            const activeLeases = Object.fromEntries(Object.entries(leases).filter(([id, until]) => id !== requestId && typeof until === 'number' && until > releaseTime));
            transaction.set(lockRef, { leases: activeLeases, expireAt: Timestamp.fromMillis(releaseTime + 86_400_000) }, { merge: true });
          });
        } catch {
          // The lease expires automatically, so a failed release never grants extra concurrency.
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
