import { useState } from 'react';
import type { CSSProperties } from 'react';

type FontStyle = 'font-montserrat' | 'font-space' | 'font-syncopate';
type TextColor = 'text-white' | 'text-gradient-cyan' | 'text-gradient-orange';
type LogoTheme = 'classic' | 'glass' | 'outline' | '3d';
type LogoIcon = 'all' | 'tech' | 'book' | 'star' | 'none';

const iconPaths: Record<Exclude<LogoIcon, 'all' | 'none'>, string> = {
  tech: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  book: 'M12 6.25c-2-1.25-5-1.5-9-0.25v13c4-1.25 7-1 9 0.25m0-13c2-1.25 5-1.5 9-0.25v13c-4-1.25-7-1-9 0.25m0-13v13',
  star: 'M12 2.8l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.4l6.2-.9L12 2.8z',
};

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] || character);
}

export function LogoEditor() {
  const [mainText, setMainText] = useState('DINOV');
  const [subtitle, setSubtitle] = useState('Diretoria de Inovação');
  const [background, setBackground] = useState('#0a3977');
  const [font, setFont] = useState<FontStyle>('font-montserrat');
  const [textColor, setTextColor] = useState<TextColor>('text-white');
  const [icon, setIcon] = useState<LogoIcon>('all');
  const [theme, setTheme] = useState<LogoTheme>('classic');

  const setTextColorWithTheme = (nextColor: TextColor) => {
    setTextColor(nextColor);
    if (theme === 'outline') setTheme('classic');
  };

  const setThemeWithTextColor = (nextTheme: LogoTheme) => {
    setTheme(nextTheme);
    if (nextTheme === 'outline' && textColor !== 'text-white') setTextColor('text-white');
  };

  const downloadSvg = () => {
    const colorByClass: Record<TextColor, string> = {
      'text-white': '#ffffff',
      'text-gradient-cyan': 'url(#cyan)',
      'text-gradient-orange': 'url(#orange)',
    };
    const fontByClass: Record<FontStyle, string> = {
      'font-montserrat': 'Montserrat, sans-serif',
      'font-space': 'Space Grotesk, sans-serif',
      'font-syncopate': 'Syncopate, sans-serif',
    };
    const fontSize = Math.min(290, 1320 / Math.max(mainText.length, 1));
    const textFill = theme === 'outline' ? 'transparent' : colorByClass[textColor];
    const outline = theme === 'outline' ? 'stroke="#ffffff" stroke-width="3"' : '';
    const shadow = theme === '3d'
      ? 'filter="url(#shadow)"'
      : '';
    const backgroundFill = theme === 'glass' ? 'url(#background)' : background;
    const subtitleWords = subtitle.trim().split(/\s+/);
    const emphasizedWord = subtitleWords.pop() || '';
    const regularSubtitle = subtitleWords.join(' ');
    const selectedIcons = icon === 'all'
      ? Object.keys(iconPaths) as Array<keyof typeof iconPaths>
      : icon === 'none' ? [] : [icon];
    const iconMarkup = selectedIcons.map((name, index) => {
      const positions = selectedIcons.length === 1 ? [800] : [735, 800, 865];
      return `<path d="${iconPaths[name]}" transform="translate(${positions[index] - 12} 483) scale(1.15)" fill="${name === 'star' ? '#fff' : 'none'}" stroke="#fff" stroke-width="${name === 'tech' ? 2.5 : 1.7}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('');
    const lineMarkup = icon === 'none'
      ? ''
      : '<path d="M170 500H670M930 500h500" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
    const gradientMarkup = `<linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="#4f46e5"/></linearGradient><linearGradient id="cyan"><stop stop-color="#00f2fe"/><stop offset="1" stop-color="#4facfe"/></linearGradient><linearGradient id="orange"><stop stop-color="#ff0844"/><stop offset="1" stop-color="#ffb199"/></linearGradient><filter id="shadow"><feDropShadow dx="7" dy="7" stdDeviation="0" flood-color="#000" flood-opacity=".75"/><feDropShadow dx="13" dy="13" stdDeviation="1" flood-color="#000" flood-opacity=".3"/></filter>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs>${gradientMarkup}</defs><rect width="1600" height="900" rx="40" fill="${backgroundFill}"/><text x="800" y="405" text-anchor="middle" fill="${textFill}" ${outline} ${shadow} font-family="${fontByClass[font]}" font-weight="900" font-size="${fontSize}" letter-spacing="-8">${escapeXml(mainText || ' ')}</text>${lineMarkup}${iconMarkup}<text x="800" y="590" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="54" font-weight="300">${escapeXml(regularSubtitle)} <tspan font-weight="700">${escapeXml(emphasizedWord)}</tspan></text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(mainText || 'logo').trim().replace(/[^\p{L}\p{N}-]+/gu, '-').toLowerCase() || 'logo'}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const titleColorClass = theme === 'outline'
    ? 'text-transparent [ -webkit-text-stroke:2px_white ]'
    : textColor === 'text-gradient-cyan'
      ? 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent'
      : textColor === 'text-gradient-orange'
        ? 'bg-gradient-to-r from-[#ff0844] to-[#ffb199] bg-clip-text text-transparent'
        : 'text-white';

  return (
    <main className="min-h-dvh bg-gray-100 font-sans text-slate-800">
      <header className="relative z-10 w-full border-b border-gray-200 bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 lg:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-bold text-white">D</div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">DINOV Editor</h1>
              <a href="/" className="text-xs text-blue-700 underline-offset-2 hover:underline">Voltar ao BOT CISEB</a>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-center gap-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-gray-500">Texto principal</span>
              <input value={mainText} onChange={event => setMainText(event.target.value)} className="w-36 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-gray-500">Subtexto</span>
              <input value={subtitle} onChange={event => setSubtitle(event.target.value)} className="w-52 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-gray-500">Fundo</span>
              <span className="flex h-[38px] items-center gap-2 rounded border border-gray-300 bg-white px-2">
                <input aria-label="Cor de fundo" type="color" value={background} onChange={event => setBackground(event.target.value)} className="h-6 w-7 cursor-pointer border-0 p-0" />
                <span className="font-mono text-xs text-gray-600">{background}</span>
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-purple-700">Tipografia</span>
              <select value={font} onChange={event => setFont(event.target.value as FontStyle)} className="h-[38px] rounded border border-purple-300 bg-purple-50 px-3">
                <option value="font-montserrat">Montserrat</option>
                <option value="font-space">Space Grotesk</option>
                <option value="font-syncopate">Syncopate</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-orange-700">Cor do texto</span>
              <select value={textColor} onChange={event => setTextColorWithTheme(event.target.value as TextColor)} className="h-[38px] rounded border border-orange-300 bg-orange-50 px-3">
                <option value="text-white">Branco sólido</option>
                <option value="text-gradient-cyan">Gradiente ciano</option>
                <option value="text-gradient-orange">Gradiente laranja</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-gray-500">Símbolo central</span>
              <select value={icon} onChange={event => setIcon(event.target.value as LogoIcon)} className="h-[38px] rounded border border-gray-300 bg-white px-3">
                <option value="all">Os 3 juntos</option>
                <option value="tech">Tecnologia</option>
                <option value="book">Conhecimento</option>
                <option value="star">Estrela</option>
                <option value="none">Nenhum</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-blue-700">Estilo visual</span>
              <select value={theme} onChange={event => setThemeWithTextColor(event.target.value as LogoTheme)} className="h-[38px] rounded border border-blue-300 bg-blue-50 px-3">
                <option value="classic">Clássico</option>
                <option value="glass">Glassmorphism</option>
                <option value="outline">Neon / Contorno</option>
                <option value="3d">Sombra 3D</option>
              </select>
            </label>
            <button type="button" onClick={downloadSvg} className="h-[38px] rounded bg-blue-700 px-4 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Baixar SVG
            </button>
          </div>
        </div>
      </header>

      <section aria-label="Pré-visualização do logo" className="flex min-h-[calc(100dvh-92px)] items-center justify-center bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:40px_40px] p-4 sm:p-8 lg:p-12">
        <div
          className={`flex aspect-[16/9] w-full max-w-4xl items-center justify-center overflow-hidden rounded-xl shadow-2xl transition-all duration-500 ${theme === 'glass' ? 'bg-gradient-to-br from-[var(--logo-bg)] to-indigo-600' : ''}`}
          style={{ backgroundColor: theme === 'glass' ? undefined : background, '--logo-bg': background } as CSSProperties}
        >
          <div className={`flex w-full max-w-3xl flex-col items-center px-4 transition-all duration-500 ${theme === 'glass' ? 'rounded-3xl border border-white/20 bg-white/5 px-8 py-8 shadow-2xl backdrop-blur-md sm:px-16' : ''}`}>
            <div
              className={`mb-1 max-w-full break-all text-center text-[clamp(3rem,12vw,10rem)] font-black leading-none tracking-tighter transition-all duration-300 ${font} ${titleColorClass} ${font === 'font-syncopate' ? 'uppercase tracking-[-0.08em]' : ''} ${theme === '3d' ? 'logo-editor-3d-shadow' : ''} ${theme === 'outline' ? 'logo-editor-outline-text' : ''}`}
            >
              {mainText || ' '}
            </div>
            {icon !== 'none' && (
              <div className={`mb-5 flex w-full items-center gap-4 px-2 opacity-90 sm:mb-6 sm:gap-5 sm:px-8 ${theme === 'outline' ? '[filter:drop-shadow(0_0_10px_rgba(255,255,255,.7))]' : ''}`}>
                <div className="h-[2px] flex-grow rounded-full bg-white" />
                <div className="flex items-center justify-center gap-3 text-white sm:gap-5">
                  {(icon === 'all' ? ['book', 'star', 'tech'] : [icon]).map(name => (
                    <svg key={name} aria-hidden="true" className={name === 'star' ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-7 w-7'} viewBox={name === 'star' ? '0 0 24 24' : '0 0 24 24'} fill={name === 'star' ? 'currentColor' : 'none'} stroke="currentColor">
                      <path d={iconPaths[name as Exclude<LogoIcon, 'all' | 'none'>]} strokeWidth={name === 'tech' ? 2.5 : 1.7} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ))}
                </div>
                <div className="h-[2px] flex-grow rounded-full bg-white" />
              </div>
            )}
            <div className="px-4 text-center text-lg font-light tracking-wide text-white sm:text-xl md:text-3xl">
              {subtitle.split(/\s+/).slice(0, -1).join(' ')}{' '}
              <strong className="font-bold">{subtitle.split(/\s+/).at(-1)}</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
