import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.tsx';

type AuthError = Error & { code?: string };

function friendlyAuthError(error: unknown): string {
  const code = (error as AuthError)?.code;
  switch (code) {
    case 'auth/domain-not-authorized':
      return 'Use um endereço @escola.seduc.pa.gov.br autorizado.';
    case 'auth/not-configured':
      return 'O acesso institucional ainda não está configurado. Procure o suporte.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha não conferem.';
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com este e-mail. Tente entrar.';
    case 'auth/weak-password':
      return 'Escolha uma senha mais forte (mínimo de 6 caracteres).';
    case 'auth/too-many-requests':
      return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar. Verifique sua conexão e tente novamente.';
    case 'auth/invalid-email':
      return 'Confira o formato do e-mail informado.';
    case 'auth/operation-not-allowed':
      return 'O acesso por e-mail e senha ainda não está habilitado no Firebase.';
    case 'auth/user-disabled':
      return 'Esta conta está desativada. Procure o suporte institucional.';
    case 'auth/expired-action-code':
      return 'Este link expirou. Solicite um novo e-mail.';
    default:
      return 'Não foi possível concluir a solicitação. Tente novamente.';
  }
}

export function LoginScreen() {
  const { configured, registrationEnabled, initializationError, user, signIn, register, sendVerification, refreshVerification, resetPassword, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    if (!resendAvailableAt || currentTime >= resendAvailableAt) return;
    const timer = window.setTimeout(() => setCurrentTime(Date.now()), Math.min(1000, resendAvailableAt - currentTime));
    return () => window.clearTimeout(timer);
  }, [currentTime, resendAvailableAt]);

  const runAction = async (action: () => Promise<void>, successMessage = '') => {
    setError('');
    setNotice('');
    setIsBusy(true);
    try {
      await action();
      setNotice(successMessage);
    } catch (reason) {
      setError(friendlyAuthError(reason));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'login') {
      void runAction(() => signIn(email, password));
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    void runAction(() => register(email, password), 'Conta criada. Enviamos um link para verificar seu e-mail institucional.');
  };

  const handleResendVerification = async () => {
    if (currentTime < resendAvailableAt) return;
    const nextAllowed = Date.now() + 60_000;
    setResendAvailableAt(nextAllowed);
    await runAction(sendVerification, 'E-mail de verificação enviado. Confira sua caixa de entrada e a pasta de spam.');
  };

  const handleRefreshVerification = async () => {
    await runAction(refreshVerification, 'Ainda não foi possível confirmar o e-mail. Abra o link recebido e tente novamente.');
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f2f6fa] px-4 py-8 text-slate-800 sm:px-8">
      <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[36px] border-[#005BAC]/[0.04]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -left-28 h-96 w-96 rounded-full border-[48px] border-[#00AAFF]/[0.05]" aria-hidden="true" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_80px_-42px_rgba(0,43,94,0.45)] md:min-h-[610px] md:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative flex min-h-48 flex-col justify-between overflow-hidden bg-[#004E96] px-7 py-7 text-white sm:px-10 sm:py-9 md:min-h-full">
          <div className="absolute -right-16 top-1/3 h-60 w-60 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -right-3 top-[38%] h-36 w-36 rounded-full border border-white/10" aria-hidden="true" />
          <div className="relative">
            <img src="/assets/ciseb-logo-light.svg" alt="CISEB — Centro de Inovação e Sustentabilidade da Educação Básica" className="h-12 w-auto max-w-full object-contain object-left" />
            <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200">Acesso institucional</p>
            <h1 className="mt-3 max-w-sm text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Um espaço de apoio à formação e às práticas pedagógicas.</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100/85">Entre com seu e-mail institucional para continuar suas consultas e acessar seu histórico.</p>
          </div>
          <div className="relative mt-7 flex items-end justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-blue-100/75"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Conta protegida pela SEDUC-PA</div>
            <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/35 bg-white/[0.06] text-center text-[9px] leading-3 text-blue-100/70" aria-label="Área reservada para o futuro mascote do CISEB">Área reservada<br />ao mascote</div>
          </div>
        </aside>

        <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
          {!configured ? (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <h2 className="font-semibold">Autenticação ainda não configurada</h2>
              <p className="mt-2">Preencha as variáveis `VITE_FIREBASE_*` conforme `docs/FIREBASE_SETUP.md` e reinicie o app. Nenhuma credencial privada deve ser colocada no frontend.</p>
            </div>
          ) : user && !user.emailVerified ? (
            <div className="mx-auto w-full max-w-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#005BAC]"><Mail className="h-5 w-5" aria-hidden="true" /></span>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#005BAC]">Confirme seu endereço</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Verifique seu e-mail institucional</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Enviamos um link para <span className="font-semibold text-slate-800">{user.email}</span>. Abra a mensagem e depois confirme aqui para liberar o acesso.</p>
              <div className="mt-6 space-y-3">
                <button type="button" onClick={() => void handleRefreshVerification()} disabled={isBusy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#005BAC] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2 disabled:opacity-60">
                  {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />} Já verifiquei meu e-mail
                </button>
                <button type="button" onClick={() => void handleResendVerification()} disabled={isBusy || currentTime < resendAvailableAt} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] disabled:opacity-50">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" /> {currentTime < resendAvailableAt ? 'Aguarde para reenviar o e-mail' : 'Reenviar e-mail de verificação'}
                </button>
                <button type="button" onClick={() => void logout()} className="w-full py-2 text-xs font-medium text-slate-500 underline-offset-4 hover:text-[#005BAC] hover:underline">Sair desta conta</button>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#005BAC]">BOT CISEB</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Use o endereço institucional <span className="font-medium text-slate-700">@escola.seduc.pa.gov.br</span>.</p>
              </div>

              {initializationError && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">{initializationError}</p>}

              {notice && <p role="status" className="mb-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{notice}</p>}
              {error && <p role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</p>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="institutional-email" className="mb-1.5 block text-xs font-semibold text-slate-700">E-mail institucional</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input id="institutional-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="nome@escola.seduc.pa.gov.br" className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#005BAC] focus:ring-4 focus:ring-[#005BAC]/10" />
                  </div>
                </div>
                <div>
                  <label htmlFor="institutional-password" className="mb-1.5 block text-xs font-semibold text-slate-700">Senha</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input id="institutional-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={event => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-12 text-sm outline-none transition focus:border-[#005BAC] focus:ring-4 focus:ring-[#005BAC]/10" />
                    <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]">
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isBusy} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#005BAC] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(0,91,172,0.65)] transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
                  {isBusy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{mode === 'login' ? 'Entrar' : 'Cadastrar e verificar e-mail'}
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                {mode === 'login' && <button type="button" disabled={isBusy} onClick={() => void runAction(() => resetPassword(email), 'Se houver uma conta para este endereço, enviaremos instruções para redefinir a senha.')} className="font-medium text-[#005BAC] underline-offset-4 hover:underline disabled:opacity-50">Esqueci minha senha</button>}
                {registrationEnabled && <button type="button" onClick={() => { setError(''); setNotice(''); setMode(value => value === 'login' ? 'register' : 'login'); }} className="ml-auto font-medium text-slate-600 underline-offset-4 hover:text-[#005BAC] hover:underline">{mode === 'login' ? 'Criar conta institucional' : 'Já tenho uma conta'}</button>}
              </div>
              <p className="mt-8 border-t border-slate-100 pt-4 text-center text-[11px] leading-5 text-slate-400">A senha é gerenciada pelo Firebase Authentication e não é armazenada pelo BOT CISEB.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
