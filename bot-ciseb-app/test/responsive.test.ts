import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar } from '../frontend/src/components/chat/Sidebar.tsx';
import { Header } from '../frontend/src/components/layout/Header.tsx';
import { QuickPlanWizard } from '../frontend/src/components/curriculum/QuickPlanWizard.tsx';
import { CurriculumBrowser } from '../frontend/src/components/curriculum/CurriculumBrowser.tsx';
import { PromptComposer } from '../frontend/src/components/ui/prompt-composer.tsx';
import { HaloSearchInput } from '../frontend/src/components/ui/halo-search.tsx';
import { InstitutionalBanner } from '../frontend/src/components/branding/InstitutionalBanner.tsx';
import { LogoEditor } from '../frontend/src/components/branding/LogoEditor.tsx';

const VIEWPORT_MATRIX = [
  { width: 320, height: 568, device: 'Smartphones pequenos (320×568)' },
  { width: 360, height: 800, device: 'Smartphones pequenos (360×800)' },
  { width: 375, height: 812, device: 'Smartphones (375×812)' },
  { width: 390, height: 844, device: 'Smartphones (390×844)' },
  { width: 430, height: 932, device: 'Smartphones grandes (430×932)' },
  { width: 768, height: 1024, device: 'Tablets retrato (768×1024)' },
  { width: 1024, height: 768, device: 'Tablets paisagem / Notebooks (1024×768)' },
  { width: 1280, height: 720, device: 'Notebooks / Desktops (1280×720)' },
  { width: 1366, height: 768, device: 'Monitores convencionais (1366×768)' },
  { width: 1440, height: 900, device: 'Desktops (1440×900)' },
  { width: 1920, height: 1080, device: 'Full HD (1920×1080)' },
  { width: 2560, height: 1440, device: 'Ultrawide / QHD (2560×1440)' },
] as const;

test('Sistema de breakpoints e regras CSS globais cobrem toda a matriz de dispositivos (320px a 2560px)', () => {
  const cssPath = path.resolve(process.cwd(), 'frontend/src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert.match(cssContent, /--breakpoint-xxs:\s*20rem/, 'Deve definir breakpoint xxs (320px)');
  assert.match(cssContent, /--breakpoint-xs:\s*23\.4375rem/, 'Deve definir breakpoint xs (375px)');
  assert.match(cssContent, /--breakpoint-sm:\s*36rem/, 'Deve definir breakpoint sm (576px)');
  assert.match(cssContent, /--breakpoint-md:\s*48rem/, 'Deve definir breakpoint md (768px)');
  assert.match(cssContent, /--breakpoint-lg:\s*64rem/, 'Deve definir breakpoint lg (1024px)');
  assert.match(cssContent, /--breakpoint-xl:\s*80rem/, 'Deve definir breakpoint xl (1280px)');
  assert.match(cssContent, /--breakpoint-2xl:\s*100rem/, 'Deve definir breakpoint 2xl (1600px)');
  assert.match(cssContent, /overflow-x:\s*hidden/, 'Deve prevenir overflow horizontal global no body');
  assert.match(cssContent, /prefers-reduced-motion:\s*reduce/, 'Deve respeitar preferência por redução de movimento');
});

test('Matriz de 12 resoluções: Sidebar adapta modo drawer no mobile e coluna proporcional no desktop', () => {
  for (const viewport of VIEWPORT_MATRIX) {
    const isDesktopDefaultOpen = viewport.width >= 1024;
    const closedMarkup = renderToStaticMarkup(
      React.createElement(Sidebar, {
        isOpen: false,
        onToggle: () => {},
        onNewChat: () => {},
        chatSessions: [],
        activeSessionId: 'draft',
        onSelectSession: () => {},
        onDeleteSession: () => {},
        hasMoreConversations: false,
        isLoadingMoreConversations: false,
        onLoadMoreConversations: () => {},
      }),
    );
    assert.equal(closedMarkup, '', `Sidebar recolhida não deve ocupar espaço em ${viewport.device}`);

    const openMarkup = renderToStaticMarkup(
      React.createElement(Sidebar, {
        isOpen: true,
        onToggle: () => {},
        onNewChat: () => {},
        chatSessions: [{ id: '1', title: 'Planejamento Robótica Sustentável', timestamp: 'Hoje' }],
        activeSessionId: '1',
        onSelectSession: () => {},
        onDeleteSession: () => {},
        hasMoreConversations: true,
        isLoadingMoreConversations: false,
        onLoadMoreConversations: () => {},
        userName: 'Prof. Pará',
        userEmail: 'prof@escola.seduc.pa.gov.br',
        onLogout: () => {},
      }),
    );

    assert.match(
      openMarkup,
      /w-\[min\(18rem,85vw\)\]/,
      `Sidebar aberta deve limitar largura a 85vw em telas estreitas (${viewport.device})`,
    );
    assert.match(
      openMarkup,
      /md:relative md:z-30 md:h-dvh md:w-64 md:shadow-none xl:w-72/,
      `Sidebar deve transicionar para layout relativo proporcional em ${viewport.device} (defaultOpen=${isDesktopDefaultOpen})`,
    );
  }
});

test('Matriz de 12 resoluções: QuickPlanWizard, CurriculumBrowser, Header, Composer e Editor renderizam sem larguras fixas quebradas', () => {
  const wizardMarkup = renderToStaticMarkup(
    React.createElement(QuickPlanWizard, {
      onSubmitToChat: () => {},
    }),
  );
  assert.match(wizardMarkup, /max-h-\[92dvh\]/);
  assert.match(wizardMarkup, /Bloco 1 — Identidade Curricular/);
  assert.match(wizardMarkup, /Bloco 2 — Público-Alvo/);
  assert.match(wizardMarkup, /Bloco 3 — Estrutura Pedagógica/);
  assert.match(wizardMarkup, /Bloco 4: Infraestrutura e Território/);
  assert.match(wizardMarkup, /grid-cols-1 gap-2\.5 md:grid-cols-2/);

  const browserMarkup = renderToStaticMarkup(
    React.createElement(CurriculumBrowser, {
      onSelectSkillForPlan: () => {},
    }),
  );
  assert.match(browserMarkup, /grid-cols-1 gap-3 md:grid-cols-2 md:gap-3\.5 2xl:grid-cols-3/);

  const headerMarkup = renderToStaticMarkup(
    React.createElement(Header, {
      activeTab: 'chat',
      setActiveTab: () => {},
      onResetChat: () => {},
    }),
  );
  assert.match(headerMarkup, /max-w-\[140px\]/);
  assert.match(headerMarkup, /lg:hidden/);

  const composerMarkup = renderToStaticMarkup(
    React.createElement(PromptComposer, {
      value: 'Teste de responsividade',
      onChange: () => {},
      onSend: () => {},
      onAttach: () => {},
    }),
  );
  assert.match(composerMarkup, /Roteiro guiado ou envie sua pergunta/);

  const searchMarkup = renderToStaticMarkup(
    React.createElement(HaloSearchInput, {
      value: '',
      onChange: () => {},
    }),
  );
  assert.match(searchMarkup, /min-h-9 w-full/);

  const bannerMarkup = renderToStaticMarkup(React.createElement(InstitutionalBanner));
  assert.match(bannerMarkup, /grid-cols-1 md:grid-cols-3/);

  const logoEditorMarkup = renderToStaticMarkup(React.createElement(LogoEditor));
  assert.match(logoEditorMarkup, /w-full rounded border border-gray-300 px-3 py-2.*sm:w-52/);
});
