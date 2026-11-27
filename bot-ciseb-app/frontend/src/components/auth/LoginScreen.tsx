import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.tsx';

type AuthError = Error & { code?: string };

const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

const MASCOT_SLIDES = [
  {
    tag: 'Objetivo do MIRI',
    text: 'Olá! Eu sou o MIRI. Estou aqui para apoiar educadores da rede pública no planejamento pedagógico com base na BNCC, BNCC Computação e diretrizes oficiais.',
  },
  {
    tag: '1. Entre com sua conta',
    text: 'Faça login com sua conta Google institucional para acessar seu histórico e manter suas conversas salvas com segurança.',
  },
  {
    tag: '2. Tire dúvidas e planeje',
    text: 'Converse comigo sobre práticas pedagógicas, explore habilidades do currículo ou crie planos de aula rápidos em poucos instantes.',
  },
  {
    tag: '3. Exporte em PDF',
    text: 'Quando seu planejamento estiver pronto, exporte o material em PDF para compartilhar ou levar direto para a sala de aula.',
  },
] as const;

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
  const [slideIndex, setSlideIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  useEffect(() => {
    if (isCarouselPaused) return;
    const timer = window.setInterval(() => {
      setSlideIndex(prev => (prev + 1) % MASCOT_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isCarouselPaused]);

  const currentSlide = MASCOT_SLIDES[slideIndex];

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
    <main className="flex min-h-dvh w-full flex-col overflow-x-hidden bg-white text-slate-900 lg:flex-row">
      {/* Coluna esquerda: acesso institucional Firebase */}
      <section className="flex flex-1 items-center justify-center px-4 py-8 xs:px-6 sm:px-10 sm:py-12 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: ENTRANCE_EASE }}
          className="w-full max-w-[560px]"
        >
          {!configured ? (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 sm:p-6 sm:text-base sm:leading-7">
              <h2 className="font-semibold">Autenticação ainda não configurada</h2>
              <p className="mt-2">
                Configure as variáveis públicas `VITE_FIREBASE_*` conforme `docs/FIREBASE_SETUP.md` e gere novamente o frontend. Nunca coloque credenciais privadas no navegador.
              </p>
            </div>
          ) : (
            <div>
              <header className="mb-8 sm:mb-12">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#005BAC] xs:text-sm sm:text-base">
                  Acesso institucional
                </p>
                <h1 className="mt-2.5 text-[clamp(2.1rem,6vw,3.5rem)] font-semibold leading-tight tracking-tight text-slate-900 sm:mt-3">
                  Boas-vindas!
                </h1>
                <p className="mt-3 text-base leading-relaxed text-slate-500 sm:mt-4 sm:text-lg lg:text-xl">
                  Entre no MIRI com sua conta Google institucional.
                </p>
              </header>

              {initializationError && (
                <p role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 sm:text-base">
                  {initializationError}
                </p>
              )}

              {(error || accessError) && (
                <p role="alert" className="mb-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800 sm:text-base">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{error || accessError}</span>
                </p>
              )}

              <motion.button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={isBusy}
                whileHover={isBusy ? undefined : { y: -1 }}
                whileTap={isBusy ? undefined : { scale: 0.99 }}
                transition={{ duration: 0.15 }}
                className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base font-semibold text-slate-800 shadow-xs transition hover:border-[#005BAC]/50 hover:bg-[#f2f6fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:min-h-16 sm:gap-4 sm:px-6 sm:py-4 sm:text-lg"
              >
                {isBusy ? (
                  <LoaderCircle className="h-6 w-6 animate-spin text-[#005BAC] sm:h-7 sm:w-7" aria-hidden="true" />
                ) : (
                  <img src="/assets/google-icon.svg" alt="" className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden="true" />
                )}
                Continuar com Google
              </motion.button>

              <p className="mt-8 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-400 sm:mt-12 sm:pt-6 sm:text-sm sm:leading-6">
                O Firebase Authentication gerencia sua sessão. O MIRI não recebe nem armazena sua senha Google.
              </p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Coluna direita: painel institucional CISEB (layout split-screen Figma) */}
      <motion.aside
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: ENTRANCE_EASE }}
        className="relative flex min-h-[320px] flex-col overflow-hidden bg-gradient-to-br from-[#013780] via-[#004E96] to-[#005BAC] px-4 py-7 text-white xs:px-6 sm:px-10 sm:py-10 lg:w-1/2 lg:min-h-dvh lg:rounded-tl-[45px] lg:rounded-bl-[45px] lg:px-14 lg:py-12"
      >
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-3 xs:gap-5 sm:gap-6">
            <img
              src="/assets/dinov-logo-light.svg"
              alt="DINOV — Diretoria de Inovação"
              className="h-12 w-auto max-w-[130px] object-contain xs:h-14 xs:max-w-full sm:h-20 lg:h-24"
            />
            <span className="hidden h-10 w-px bg-white/25 xs:block sm:h-14 lg:h-16" aria-hidden="true" />
            <img
              src="/assets/ciseb-logo-light.svg"
              alt="CISEB — Centro de Inovação e Sustentabilidade da Educação Básica"
              className="h-12 w-auto max-w-[130px] object-contain xs:h-14 xs:max-w-full sm:h-20 lg:h-24"
            />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9bdcff] sm:mt-5 sm:text-[11px] sm:tracking-[0.2em]">
            Educação • Inovação • Sustentabilidade
          </p>
          <h2 className="mt-2 max-w-md text-xl font-semibold leading-tight tracking-tight xs:text-2xl sm:text-3xl lg:text-[32px]">
            Ideias que fortalecem a educação pública.
          </h2>
          <p className="mt-2 max-w-md text-xs leading-5 text-blue-100/85 sm:text-sm sm:leading-6">
            Explore diretrizes, documentos e práticas pedagógicas em um só lugar.
          </p>

          <div
            className="mt-5 flex flex-col gap-4 border-t border-white/15 pt-4 sm:mt-6 sm:flex-row sm:items-end sm:justify-between sm:pt-5"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#9bdcff]">
                  MIRI explica
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setSlideIndex(prev => (prev - 1 + MASCOT_SLIDES.length) % MASCOT_SLIDES.length)
                    }
                    aria-label="Explicação anterior"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/20 text-blue-100 transition hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideIndex(prev => (prev + 1) % MASCOT_SLIDES.length)}
                    aria-label="Próxima explicação"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/20 text-blue-100 transition hover:bg-white/10"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 min-h-[112px] sm:min-h-[128px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide.tag}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: ENTRANCE_EASE }}
                  >
                    <p className="text-sm font-semibold text-[#9bdcff]">{currentSlide.tag}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/95 xs:text-base sm:text-lg">
                      {currentSlide.text}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-3 flex items-center gap-2" role="tablist" aria-label="Etapas da explicação">
                {MASCOT_SLIDES.map((slide, index) => (
                  <button
                    key={slide.tag}
                    type="button"
                    role="tab"
                    aria-selected={index === slideIndex}
                    aria-label={slide.tag}
                    onClick={() => setSlideIndex(index)}
                    className={`h-2 cursor-pointer rounded-full transition-all ${
                      index === slideIndex ? 'w-7 bg-[#00AAFF]' : 'w-2.5 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            <img
              src="/assets/mascote/mascote-login.png"
              alt="Mascote do MIRI dando boas-vindas"
              className="h-32 w-auto shrink-0 self-center object-contain object-bottom xs:h-36 sm:h-48 sm:self-end lg:h-56"
            />
          </div>
        </div>

        <div className="relative z-10 mt-auto flex items-center gap-2 pt-4 text-xs text-blue-100/90">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
          Acesso protegido pela DINOV
        </div>
      </motion.aside>
    </main>
  );
}
