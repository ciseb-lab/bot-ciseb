import React from 'react';

interface HeaderProps {
  activeTab: 'chat' | 'browser' | 'wizard' | 'about';
  setActiveTab: (tab: 'chat' | 'browser' | 'wizard' | 'about') => void;
  onResetChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onResetChat }) => {
  return (
    <header className="bg-[#005BAC] border-b border-[#013780] sticky top-0 z-30 shadow-md">
      {/* Institutional Top Strip: Governo do Pará / SEDUC */}
      <div className="bg-[#013780] px-4 sm:px-8 py-1.5 flex items-center justify-between text-xs text-[#E0F2FE] border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wide text-white">GOVERNO DO ESTADO DO PARÁ</span>
          <span className="opacity-60">·</span>
          <span>Secretaria de Estado de Educação (SEDUC)</span>
          <span className="opacity-60 hidden md:inline">·</span>
          <span className="hidden md:inline">Diretoria de Inovação e Sustentabilidade da Educação Básica (DINOV)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#00AAFF]">
          <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
          <span>Rede Estadual de Ensino</span>
        </div>
      </div>

      {/* Main Top Bar: 3-Zone Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark with CISEB Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/assets/ciseb-logo-light.svg"
            alt="CISEB - Centro de Inovação e Sustentabilidade da Educação Básica"
            className="h-10 w-auto"
            width={210}
            height={48}
          />
        </div>

        {/* Zone 2: 4 Single-line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/90">
          <button
            onClick={() => setActiveTab('chat')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              activeTab === 'chat'
                ? 'border-[#00AAFF] text-white font-semibold'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            Assistente BOT CISEB
          </button>
          <button
            onClick={() => setActiveTab('browser')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              activeTab === 'browser'
                ? 'border-[#00AAFF] text-white font-semibold'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            Base Normativa Oficial
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              activeTab === 'wizard'
                ? 'border-[#00AAFF] text-white font-semibold'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            Gerador Pedagógico
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              activeTab === 'about'
                ? 'border-[#00AAFF] text-white font-semibold'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            Diretrizes CISEB & ODS
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setActiveTab('chat');
              onResetChat();
            }}
            className="px-4 py-2 text-xs font-semibold text-[#005BAC] bg-white hover:bg-[#E0F2FE] rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer flex items-center gap-2"
          >
            <span>Novo Atendimento</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden flex items-center justify-around border-t border-white/10 px-2 py-2 bg-[#004E96] text-xs text-white">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-2.5 py-1 rounded ${activeTab === 'chat' ? 'bg-[#005BAC] text-[#00AAFF] font-bold' : 'text-white/80'}`}
        >
          BOT CISEB
        </button>
        <button
          onClick={() => setActiveTab('browser')}
          className={`px-2.5 py-1 rounded ${activeTab === 'browser' ? 'bg-[#005BAC] text-[#00AAFF] font-bold' : 'text-white/80'}`}
        >
          Base Normativa
        </button>
        <button
          onClick={() => setActiveTab('wizard')}
          className={`px-2.5 py-1 rounded ${activeTab === 'wizard' ? 'bg-[#005BAC] text-[#00AAFF] font-bold' : 'text-white/80'}`}
        >
          Gerador
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-2.5 py-1 rounded ${activeTab === 'about' ? 'bg-[#005BAC] text-[#00AAFF] font-bold' : 'text-white/80'}`}
        >
          Diretrizes
        </button>
      </div>
    </header>
  );
};
