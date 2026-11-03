import { AlertCircle, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.tsx';

type AuthError = Error & { code?: string };

function friendlyAuthError(error: unknown): string {
  const code = (error as AuthError)?.code;
  switch (code) {
    case 'auth/domain-not-authorized':
      return 'Esta conta não pertence a um domínio institucional autorizado. Use @escola.seduc.pa.gov.br ou @seduc.pa.gov.br.';
    case 'auth/google-email-not-verified':
      return 'O Google não confirmou este endereço. Use uma conta institucional verificada.';
    case 'auth/not-configured':
      return 'O acesso institucional ainda não está configurado. Procure o suporte.';
    case 'auth/unauthorized-domain':
      return 'Este endereço do aplicativo ainda não está autorizado no Firebase Authentication.';
    case 'auth/operation-not-allowed':
      return 'O login Google não está habilitado para este projeto Firebase.';
    case 'auth/account-exists-with-different-credential':
      return 'Esta conta já está cadastrada por outro método. Procure o suporte institucional para vinculá-la com segurança.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente novamente.';
    case 'auth/popup-closed-by-user':
      return 'A janela de login foi fechada antes da conclusão.';
    case 'auth/cancelled-popup-request':
      return 'Já existe uma solicitação de login aberta neste navegador.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar. Verifique sua conexão e tente novamente.';
    case 'auth/user-disabled':
      return 'Esta conta está desativada. Procure o suporte institucional.';
    case 'auth/session-cleanup-failed':
      return 'A conta não foi autorizada e não foi possível encerrar a sessão. Recarregue a página antes de tentar novamente.';
    default:
      return 'Não foi possível concluir o login. Tente novamente ou procure o suporte.';
  }
}

export function LoginScreen() {
  const { configured, initializationError, accessError, signInWithGoogle } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setIsBusy(true);
    try {
      await signInWithGoogle();
    } catch (reason) {
      setError(friendlyAuthError(reason));
    } finally {
      setIsBusy(false);
    }
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
            <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100/85">Entre com sua conta Google institucional para continuar suas consultas e acessar seu histórico.</p>
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
              <p className="mt-2">Configure as variáveis públicas `VITE_FIREBASE_*` conforme `docs/FIREBASE_SETUP.md` e gere novamente o frontend. Nunca coloque credenciais privadas no navegador.</p>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#005BAC]">BOT CISEB</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Acesse com sua conta Google</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Permitidos: <span className="font-medium text-slate-700">@escola.seduc.pa.gov.br</span> e <span className="font-medium text-slate-700">@seduc.pa.gov.br</span>.
                </p>
              </div>

              {initializationError && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">{initializationError}</p>}
              {(error || accessError) && (
                <p role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error || accessError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={isBusy}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {isBusy
                  ? <LoaderCircle className="h-5 w-5 animate-spin text-[#005BAC]" aria-hidden="true" />
                  : <span aria-hidden="true" className="text-lg font-bold text-[#4285F4]">G</span>}
                Continuar com Google
              </button>

              <p className="mt-8 border-t border-slate-100 pt-4 text-center text-[11px] leading-5 text-slate-400">
                O Firebase Authentication gerencia sua sessão. O BOT CISEB não recebe nem armazena sua senha Google.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
