import React from 'react';

interface HeaderProps {
  activeTab: 'chat' | 'browser' | 'wizard' | 'about';
  setActiveTab: (tab: 'chat' | 'browser' | 'wizard' | 'about') => void;
  onResetChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onResetChat }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#013780] bg-[#005BAC] shadow-md">
      {/* Institutional Top Strip: Governo do Pará / SEDUC */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#013780] px-3 py-1.5 text-[11px] text-[#E0F2FE] sm:px-6 md:px-8 md:text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="font-semibold tracking-wide text-white">GOVERNO DO ESTADO DO PARÁ</span>
          <span className="opacity-60">·</span>
          <span className="truncate">Secretaria de Estado de Educação (SEDUC)</span>
          <span className="hidden opacity-60 md:inline">·</span>
          <span className="hidden md:inline">Diretoria de Inovação (DINOV) · CISEB</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-[#00AAFF]">
          <span className="h-2 w-2 rounded-full bg-[#059669]"></span>
          <span className="hidden xs:inline">Rede Estadual de Ensino</span>
        </div>
      </div>

      {/* Main Top Bar: 3-Zone Contract */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:gap-6 sm:px-6 md:px-8 md:py-3">
        {/* Zone 1: Brand Wordmark with CISEB Logo */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img
            src="/assets/ciseb-logo-light.svg"
            alt="CISEB - Centro de Inovação e Sustentabilidade da Educação Básica"
            className="h-8 w-auto max-w-[140px] object-contain xs:max-w-[170px] sm:h-10 sm:max-w-[210px]"
            width={210}
            height={48}
          />
        </div>

        {/* Zone 2: 4 Single-line Navigation Links */}
        <nav className="hidden items-center gap-4 text-sm font-medium text-white/90 lg:flex xl:gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`cursor-pointer whitespace-nowrap border-b-2 pb-1 transition-colors ${
              activeTab === 'chat'
                ? 'border-[#00AAFF] font-semibold text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            Assistente MIRI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('browser')}
            className={`cursor-pointer whitespace-nowrap border-b-2 pb-1 transition-colors ${
              activeTab === 'browser'
                ? 'border-[#00AAFF] font-semibold text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            Base Normativa Oficial
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wizard')}
            className={`cursor-pointer whitespace-nowrap border-b-2 pb-1 transition-colors ${
              activeTab === 'wizard'
                ? 'border-[#00AAFF] font-semibold text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            Gerador Pedagógico
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`cursor-pointer whitespace-nowrap border-b-2 pb-1 transition-colors ${
              activeTab === 'about'
                ? 'border-[#00AAFF] font-semibold text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            Diretrizes CISEB & ODS
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('chat');
              onResetChat();
            }}
            className="flex min-h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#005BAC] shadow-sm transition-colors hover:bg-[#E0F2FE] sm:px-4 sm:py-2"
          >
            <span>Novo Atendimento</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-around gap-1 border-t border-white/10 bg-[#004E96] px-2 py-1.5 text-xs text-white lg:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`min-h-8 rounded px-2.5 py-1 transition ${activeTab === 'chat' ? 'bg-[#005BAC] font-bold text-[#00AAFF]' : 'text-white/80'}`}
        >
          MIRI
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('browser')}
          className={`min-h-8 rounded px-2.5 py-1 transition ${activeTab === 'browser' ? 'bg-[#005BAC] font-bold text-[#00AAFF]' : 'text-white/80'}`}
        >
          Base Normativa
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('wizard')}
          className={`min-h-8 rounded px-2.5 py-1 transition ${activeTab === 'wizard' ? 'bg-[#005BAC] font-bold text-[#00AAFF]' : 'text-white/80'}`}
        >
          Gerador
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`min-h-8 rounded px-2.5 py-1 transition ${activeTab === 'about' ? 'bg-[#005BAC] font-bold text-[#00AAFF]' : 'text-white/80'}`}
        >
          Diretrizes
        </button>
      </div>
    </header>
  );
};
