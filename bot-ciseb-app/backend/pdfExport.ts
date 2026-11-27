type PdfFont = 'F1' | 'F2' | 'F3' | 'F4';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface TextRun {
  text: string;
  font: PdfFont;
}

interface LayoutLine {
  kind: 'text' | 'rule' | 'spacer' | 'formula' | 'table-row' | 'quote';
  text?: string;
  runs?: TextRun[];
  cells?: string[];
  isTableHeader?: boolean;
  font: PdfFont;
  size: number;
  indent: number;
  gapBefore: number;
  leading: number;
  color?: RgbColor;
  headingRule?: boolean;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FIRST_PAGE_TOP = PAGE_HEIGHT - 178;
const CONTINUATION_PAGE_TOP = PAGE_HEIGHT - 68;
const CONTENT_BOTTOM = 56;

const COLOR_CISEB_BLUE: RgbColor = { r: 0, g: 91 / 255, b: 172 / 255 };
const COLOR_CISEB_DEEP: RgbColor = { r: 1 / 255, g: 55 / 255, b: 128 / 255 };
const COLOR_CISEB_CYAN: RgbColor = { r: 0, g: 170 / 255, b: 1 };
const COLOR_TEXT_DARK: RgbColor = { r: 15 / 255, g: 23 / 255, b: 42 / 255 };
const COLOR_TEXT_BODY: RgbColor = { r: 30 / 255, g: 41 / 255, b: 59 / 255 };
const COLOR_TEXT_MUTED: RgbColor = { r: 100 / 255, g: 116 / 255, b: 139 / 255 };
const COLOR_SOFT_TINT: RgbColor = { r: 241 / 255, g: 247 / 255, b: 253 / 255 };
const COLOR_TABLE_HEAD: RgbColor = { r: 224 / 255, g: 242 / 255, b: 254 / 255 };
const COLOR_BORDER: RgbColor = { r: 203 / 255, g: 213 / 255, b: 225 / 255 };

const CP1252_SPECIALS = new Map<number, number>([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);

function rgbFill(color: RgbColor): string {
  return `${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)} rg`;
}

function rgbStroke(color: RgbColor): string {
  return `${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)} RG`;
}

function toPdfBytes(value: string): Buffer {
  const bytes = Array.from(value, character => {
    const codePoint = character.codePointAt(0) || 0x3f;
    if (codePoint <= 0xff) return codePoint;
    return CP1252_SPECIALS.get(codePoint) ?? 0x3f;
  });
  return Buffer.from(bytes);
}

function literalString(value: string): Buffer {
  const escaped: number[] = [0x28];
  for (const byte of toPdfBytes(value)) {
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) escaped.push(0x5c);
    if (byte === 0x0a || byte === 0x0d) {
      escaped.push(0x20);
    } else {
      escaped.push(byte);
    }
  }
  escaped.push(0x29);
  return Buffer.from(escaped);
}

function readBracedGroup(source: string, openBraceIndex: number): { content: string; endIndex: number } | null {
  if (source[openBraceIndex] !== '{') return null;
  let depth = 0;
  for (let index = openBraceIndex; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return { content: source.slice(openBraceIndex + 1, index), endIndex: index + 1 };
      }
    }
  }
  return null;
}

function replaceLatexFractions(input: string): string {
  let result = input;
  const commandPattern = /\\(?:d|t|c)?frac\s*\{/;
  let guard = 0;

  while (guard < 20) {
    guard += 1;
    const match = commandPattern.exec(result);
    if (!match) break;

    const firstOpen = match.index + match[0].length - 1;
    const numeratorGroup = readBracedGroup(result, firstOpen);
    if (!numeratorGroup) break;

    let secondOpen = numeratorGroup.endIndex;
    while (secondOpen < result.length && /\s/.test(result[secondOpen])) secondOpen += 1;
    const denominatorGroup = readBracedGroup(result, secondOpen);
    if (!denominatorGroup) break;

    const num = formatLatexForPdf(numeratorGroup.content).trim();
    const den = formatLatexForPdf(denominatorGroup.content).trim();
    const numNeedsParens = /[+\-\s]/.test(num) && !(num.startsWith('(') && num.endsWith(')'));
    const denNeedsParens = /[+\-\s]/.test(den) && !(den.startsWith('(') && den.endsWith(')'));
    const formatted = `${numNeedsParens ? `(${num})` : num} / ${denNeedsParens ? `(${den})` : den}`;

    result = `${result.slice(0, match.index)}${formatted}${result.slice(denominatorGroup.endIndex)}`;
  }

  return result;
}

function replaceSingleArgLatexCommand(input: string, commandName: string, transform: (inner: string) => string): string {
  let result = input;
  const pattern = new RegExp(`\\\\${commandName}\\s*\\{`);
  let guard = 0;

  while (guard < 25) {
    guard += 1;
    const match = pattern.exec(result);
    if (!match) break;

    const openIndex = match.index + match[0].length - 1;
    const group = readBracedGroup(result, openIndex);
    if (!group) break;

    const inner = transform(group.content);
    result = `${result.slice(0, match.index)}${inner}${result.slice(group.endIndex)}`;
  }

  return result;
}

export function formatLatexForPdf(expression: string): string {
  let formatted = expression.trim();
  formatted = replaceLatexFractions(formatted);
  formatted = replaceSingleArgLatexCommand(formatted, 'ce', inner =>
    inner
      .replace(/->\[([^\]]+)\]|<=>|->/g, (match, label?: string) => (
        label ? ` -(${label})-> ` : ` ${match} `
      ))
      .replace(/\s+/g, ' ')
      .trim(),
  );
  formatted = replaceSingleArgLatexCommand(formatted, 'pu', inner => inner.trim());
  formatted = replaceSingleArgLatexCommand(formatted, 'sqrt', inner => `raiz(${formatLatexForPdf(inner)})`);
  formatted = replaceSingleArgLatexCommand(formatted, 'text', inner => inner);
  formatted = replaceSingleArgLatexCommand(formatted, 'mathrm', inner => inner);
  formatted = replaceSingleArgLatexCommand(formatted, 'mathbf', inner => inner);
  formatted = replaceSingleArgLatexCommand(formatted, 'textbf', inner => inner);

  return formatted
    .replace(/\\(?:displaystyle|textstyle|left|right)\b/g, '')
    .replace(/\\(?:cdot|bullet)\b/g, '·')
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\pm\b/g, '±')
    .replace(/\\(?:dots|cdots|ldots)\b/g, '…')
    .replace(/\\(?:rightarrow|to)\b/g, '->')
    .replace(/\\(?:Rightarrow|implies)\b/g, '=>')
    .replace(/\\(?:leftrightarrow|Leftrightarrow|iff)\b/g, '<=>')
    .replace(/\\(?:leq|le)\b/g, '<=')
    .replace(/\\(?:geq|ge)\b/g, '>=')
    .replace(/\\neq\b/g, '!=')
    .replace(/\\approx\b/g, '~=')
    .replace(/\\(?:circ|degree)\b/g, '°')
    .replace(/\\pi\b/g, 'pi')
    .replace(/\\Delta\b/g, 'Delta')
    .replace(/\\alpha\b/g, 'alfa')
    .replace(/\\beta\b/g, 'beta')
    .replace(/\\gamma\b/g, 'gama')
    .replace(/\\theta\b/g, 'teta')
    .replace(/\\Omega\b/g, 'Ohm')
    .replace(/\\mu\b/g, 'µ')
    .replace(/\\sum\b/g, 'Soma')
    .replace(/\\infty\b/g, 'infinito')
    .replace(/\^\{\s*2\s*\}|\^2\b/g, '²')
    .replace(/\^\{\s*3\s*\}|\^3\b/g, '³')
    .replace(/\^\{\s*1\s*\}|\^1\b/g, '¹')
    .replace(/\^\{\s*\\circ\s*\}|\^\\circ/g, '°')
    .replace(/_\{([^}]+)\}/g, '$1')
    .replace(/_([A-Za-z0-9]+)/g, '$1')
    .replace(/\^\{([^}]+)\}/g, '^($1)')
    .replace(/\\([%$&#_{}])/g, '$1')
    .replace(/\\[,;:!]/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function replaceInlineMathForPdf(value: string): string {
  return value
    .replace(/\$\$([^$]+)\$\$/g, (_match, expr: string) => formatLatexForPdf(expr))
    .replace(/\\\[([^\]]+)\\\]/g, (_match, expr: string) => formatLatexForPdf(expr))
    .replace(/\\\(([^)]+)\\\)/g, (_match, expr: string) => formatLatexForPdf(expr))
    .replace(/(^|[^\p{L}\\$])\$([^$\n]+?)\$/gu, (_match, prefix: string, expr: string) => `${prefix}${formatLatexForPdf(expr)}`);
}

function removeInlineMarkdown(value: string): string {
  return replaceInlineMathForPdf(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(^|\s)[*_]([^*_]+)[*_](?=\s|$|[.,;:!?])/g, '$1$2')
    .replace(/[*~]/g, '')
    .replace(/\s*<\/?br\s*\/?>\s*/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(value: string, maxCharacters: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (word.length > maxCharacters) {
      if (current) lines.push(current);
      current = '';
      for (let start = 0; start < word.length; start += maxCharacters) {
        lines.push(word.slice(start, start + maxCharacters));
      }
      continue;
    }

    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= maxCharacters) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function estimateCharWidth(size: number, font: PdfFont): number {
  if (font === 'F3') return size * 0.6;
  if (font === 'F2') return size * 0.54;
  return size * 0.5;
}

function formatDatePtBr(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function makeLayout(content: string): LayoutLine[] {
  const lines: LayoutLine[] = [];
  const addWrapped = (
    text: string,
    font: PdfFont,
    size: number,
    indent = 0,
    gapBefore = 0,
    options: {
      kind?: LayoutLine['kind'];
      color?: RgbColor;
      headingRule?: boolean;
      boldPrefix?: string;
    } = {},
  ) => {
    const kind = options.kind || 'text';
    const availableWidth = CONTENT_WIDTH - indent - (kind === 'formula' ? 28 : 0);
    const maxCharacters = Math.max(24, Math.floor(availableWidth / estimateCharWidth(size, font)));
    const fullText = options.boldPrefix ? `${options.boldPrefix}${text}` : text;
    const wrappedLines = wrapText(fullText, maxCharacters);

    wrappedLines.forEach((wrapped, index) => {
      let runs: TextRun[] | undefined;
      if (index === 0 && options.boldPrefix && wrapped.startsWith(options.boldPrefix)) {
        const rest = wrapped.slice(options.boldPrefix.length);
        runs = rest
          ? [{ text: options.boldPrefix, font: 'F2' }, { text: rest, font }]
          : [{ text: options.boldPrefix, font: 'F2' }];
      }

      lines.push({
        kind,
        text: wrapped,
        runs,
        font,
        size,
        indent,
        gapBefore: index === 0 ? gapBefore : 0,
        leading: size * 1.48,
        color: options.color,
        headingRule: options.headingRule && index === wrappedLines.length - 1,
      });
    });
  };

  let inCodeBlock = false;
  let inMathBlock = false;
  let mathBuffer: string[] = [];
  let tableRowIndex = 0;

  const flushMathBlock = () => {
    const expression = formatLatexForPdf(mathBuffer.join(' '));
    mathBuffer = [];
    if (expression) {
      addWrapped(expression, 'F2', 11, 14, 6, { kind: 'formula', color: COLOR_CISEB_DEEP });
      lines.push({ kind: 'spacer', font: 'F1', size: 10, indent: 0, gapBefore: 0, leading: 6 });
    }
  };

  for (const sourceLine of content.replace(/\r\n?/g, '\n').split('\n')) {
    const sourceTrimmed = sourceLine.trim();

    if (sourceTrimmed.startsWith('```')) {
      tableRowIndex = 0;
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (!inCodeBlock) {
      if (inMathBlock) {
        if (sourceTrimmed === '$$' || sourceTrimmed === '\\]') {
          inMathBlock = false;
          flushMathBlock();
        } else {
          mathBuffer.push(sourceTrimmed);
        }
        continue;
      }

      if (sourceTrimmed === '$$' || sourceTrimmed === '\\[') {
        tableRowIndex = 0;
        inMathBlock = true;
        mathBuffer = [];
        continue;
      }

      const singleLineFormula = sourceTrimmed.match(/^\$\$(.+)\$\$$/) || sourceTrimmed.match(/^\\\[(.+)\\\]$/);
      if (singleLineFormula) {
        tableRowIndex = 0;
        mathBuffer = [singleLineFormula[1]];
        flushMathBlock();
        continue;
      }
    }

    const isTableRow = !inCodeBlock && sourceTrimmed.startsWith('|') && sourceTrimmed.endsWith('|');
    if (!isTableRow) tableRowIndex = 0;

    const logicalLines = inCodeBlock || isTableRow
      ? [sourceLine]
      : sourceLine.split(/<\/?br\s*\/?>/gi);

    for (const rawLine of logicalLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        lines.push({ kind: 'spacer', font: 'F1', size: 10, indent: 0, gapBefore: 0, leading: 6 });
        continue;
      }

      if (!inCodeBlock && /^---+$/.test(trimmed)) {
        lines.push({ kind: 'rule', font: 'F1', size: 10, indent: 0, gapBefore: 6, leading: 10 });
        continue;
      }

      const heading = !inCodeBlock ? trimmed.match(/^(#{1,3})\s+(.+)$/) : null;
      if (heading) {
        const level = heading[1].length;
        const size = level === 1 ? 14.5 : level === 2 ? 12.5 : 11;
        addWrapped(removeInlineMarkdown(heading[2]), 'F2', size, 0, level === 1 ? 12 : 9, {
          color: level <= 2 ? COLOR_CISEB_BLUE : COLOR_CISEB_DEEP,
          headingRule: level <= 2,
        });
        continue;
      }

      if (isTableRow) {
        if (/^\|[\s:|-]+\|$/.test(trimmed)) continue;
        const cells = trimmed.split('|').slice(1, -1).map(cell => removeInlineMarkdown(cell.trim()));
        const isHeader = tableRowIndex === 0;
        tableRowIndex += 1;
        const rowText = cells.join('  |  ');
        const maxChars = Math.max(30, Math.floor((CONTENT_WIDTH - 16) / estimateCharWidth(9.2, isHeader ? 'F2' : 'F1')));
        wrapText(rowText, maxChars).forEach((wrapped, idx) => {
          lines.push({
            kind: 'table-row',
            text: wrapped,
            cells,
            isTableHeader: isHeader,
            font: isHeader ? 'F2' : 'F1',
            size: 9.2,
            indent: 8,
            gapBefore: idx === 0 && isHeader ? 6 : 0,
            leading: 15,
            color: isHeader ? COLOR_CISEB_DEEP : COLOR_TEXT_BODY,
          });
        });
        continue;
      }

      const bullet = !inCodeBlock ? trimmed.match(/^(?:[-*+]\s+|\d+[.)]\s+|•\s+)(.*)$/) : null;
      if (bullet) {
        const itemBody = bullet[1].trim();
        const boldLead = itemBody.match(/^\*\*([^*]+)\*\*\s*(.*)$/);
        if (boldLead) {
          const cleanPrefix = `• ${removeInlineMarkdown(boldLead[1])}${boldLead[2] ? ' ' : ''}`;
          const cleanRest = removeInlineMarkdown(boldLead[2]);
          addWrapped(cleanRest, 'F1', 10.2, 12, 3, {
            color: COLOR_TEXT_BODY,
            boldPrefix: cleanPrefix,
          });
        } else {
          addWrapped(`• ${removeInlineMarkdown(itemBody)}`, 'F1', 10.2, 12, 3, {
            color: COLOR_TEXT_BODY,
          });
        }
        continue;
      }

      if (!inCodeBlock && trimmed.startsWith('>')) {
        addWrapped(removeInlineMarkdown(trimmed.replace(/^>\s?/, '')), 'F4', 10, 16, 4, {
          kind: 'quote',
          color: COLOR_TEXT_MUTED,
        });
        continue;
      }

      const isItalicLine = !inCodeBlock && /^\*[^*].*[^*]\*$/.test(trimmed) && !trimmed.startsWith('**');
      const boldLeadParagraph = !inCodeBlock ? trimmed.match(/^\*\*([^*]+)\*\*\s*(.+)$/) : null;
      if (boldLeadParagraph) {
        addWrapped(removeInlineMarkdown(boldLeadParagraph[2]), 'F1', 10.2, 0, 2, {
          color: COLOR_TEXT_BODY,
          boldPrefix: `${removeInlineMarkdown(boldLeadParagraph[1])} `,
        });
        continue;
      }

      addWrapped(
        inCodeBlock ? rawLine : removeInlineMarkdown(trimmed),
        inCodeBlock ? 'F3' : (isItalicLine ? 'F4' : 'F1'),
        inCodeBlock ? 9.5 : 10.2,
        inCodeBlock ? 12 : 0,
        2,
        { color: isItalicLine ? COLOR_TEXT_MUTED : COLOR_TEXT_BODY },
      );
    }
  }

  if (inMathBlock && mathBuffer.length > 0) {
    flushMathBlock();
  }

  return lines;
}

function paginate(lines: LayoutLine[]): LayoutLine[][] {
  const pages: LayoutLine[][] = [[]];
  let usedHeight = 0;

  for (const line of lines) {
    const pageIndex = pages.length - 1;
    const maxHeight = (pageIndex === 0 ? FIRST_PAGE_TOP : CONTINUATION_PAGE_TOP) - CONTENT_BOTTOM;
    const lineHeight = line.gapBefore + line.leading + (line.headingRule ? 4 : 0) + (line.kind === 'formula' ? 8 : 0);

    if (usedHeight + lineHeight > maxHeight && pages[pageIndex].length > 0) {
      pages.push([]);
      usedHeight = 0;
    }
    pages[pages.length - 1].push(line);
    usedHeight += lineHeight;
  }

  return pages;
}

function appendText(parts: Buffer[], font: PdfFont, size: number, x: number, y: number, text: string, color: RgbColor): void {
  parts.push(Buffer.from(`${rgbFill(color)} BT /${font} ${size.toFixed(1)} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm `));
  parts.push(literalString(text));
  parts.push(Buffer.from(' Tj ET\n'));
}

function makePageStream(
  lines: LayoutLine[],
  pageNumber: number,
  pageCount: number,
  cleanTitle: string,
  emissionDate: string,
): Buffer {
  const parts: Buffer[] = [];

  if (pageNumber === 1) {
    // Faixa institucional superior (azul CISEB + ciano DINOV)
    parts.push(Buffer.from(`${rgbFill(COLOR_CISEB_BLUE)} 0 ${(PAGE_HEIGHT - 8).toFixed(2)} ${PAGE_WIDTH.toFixed(2)} 8 re f\n`));
    parts.push(Buffer.from(`${rgbFill(COLOR_CISEB_CYAN)} ${(PAGE_WIDTH * 0.68).toFixed(2)} ${(PAGE_HEIGHT - 8).toFixed(2)} ${(PAGE_WIDTH * 0.32).toFixed(2)} 8 re f\n`));

    // Cabeçalho institucional
    appendText(parts, 'F2', 10.2, PAGE_MARGIN, PAGE_HEIGHT - 30, 'GOVERNO DO ESTADO DO PARÁ', COLOR_CISEB_DEEP);
    appendText(parts, 'F1', 8.2, PAGE_MARGIN, PAGE_HEIGHT - 41, 'Secretaria de Estado de Educação — SEDUC · Diretoria de Inovação — DINOV', COLOR_TEXT_MUTED);
    appendText(parts, 'F1', 8.2, PAGE_MARGIN, PAGE_HEIGHT - 52, 'Centro de Inovação e Sustentabilidade da Educação Básica — CISEB', COLOR_TEXT_MUTED);
    appendText(parts, 'F2', 8.5, PAGE_WIDTH - PAGE_MARGIN - 128, PAGE_HEIGHT - 30, 'MIRI · Material Pedagógico', COLOR_CISEB_BLUE);
    appendText(parts, 'F1', 8.2, PAGE_WIDTH - PAGE_MARGIN - 128, PAGE_HEIGHT - 41, `Emitido em ${emissionDate}`, COLOR_TEXT_MUTED);

    // Linha divisória do cabeçalho
    parts.push(Buffer.from(`${rgbStroke(COLOR_CISEB_BLUE)} 1.2 w ${PAGE_MARGIN} ${(PAGE_HEIGHT - 64).toFixed(2)} m ${(PAGE_WIDTH - PAGE_MARGIN).toFixed(2)} ${(PAGE_HEIGHT - 64).toFixed(2)} l S\n`));

    // Cartão de título do documento
    const cardBottom = PAGE_HEIGHT - 152;
    const cardHeight = 76;
    parts.push(Buffer.from(`${rgbFill(COLOR_SOFT_TINT)} ${PAGE_MARGIN} ${cardBottom.toFixed(2)} ${CONTENT_WIDTH.toFixed(2)} ${cardHeight} re f\n`));
    parts.push(Buffer.from(`${rgbFill(COLOR_CISEB_BLUE)} ${PAGE_MARGIN} ${cardBottom.toFixed(2)} 4 ${cardHeight} re f\n`));
    parts.push(Buffer.from(`${rgbStroke(COLOR_BORDER)} 0.6 w ${PAGE_MARGIN} ${cardBottom.toFixed(2)} ${CONTENT_WIDTH.toFixed(2)} ${cardHeight} re S\n`));

    appendText(parts, 'F2', 7.5, PAGE_MARGIN + 14, cardBottom + cardHeight - 16, 'MATERIAL DE APOIO À FORMAÇÃO DOCENTE · REDE ESTADUAL DO PARÁ', COLOR_CISEB_BLUE);
    const titleLines = wrapText(cleanTitle || 'Material de apoio', 56).slice(0, 2);
    titleLines.forEach((titleLine, idx) => {
      appendText(parts, 'F2', 14.5, PAGE_MARGIN + 14, cardBottom + cardHeight - 36 - idx * 18, titleLine, COLOR_TEXT_DARK);
    });
  } else {
    // Cabeçalho discreto nas páginas seguintes
    parts.push(Buffer.from(`${rgbFill(COLOR_CISEB_BLUE)} 0 ${(PAGE_HEIGHT - 4).toFixed(2)} ${PAGE_WIDTH.toFixed(2)} 4 re f\n`));
    const shortTitle = cleanTitle.length > 68 ? `${cleanTitle.slice(0, 67)}…` : cleanTitle;
    appendText(parts, 'F2', 8, PAGE_MARGIN, PAGE_HEIGHT - 30, 'CISEB · SEDUC-PA', COLOR_CISEB_BLUE);
    appendText(parts, 'F1', 8, PAGE_MARGIN + 84, PAGE_HEIGHT - 30, shortTitle, COLOR_TEXT_MUTED);
    parts.push(Buffer.from(`${rgbStroke(COLOR_BORDER)} 0.6 w ${PAGE_MARGIN} ${(PAGE_HEIGHT - 38).toFixed(2)} m ${(PAGE_WIDTH - PAGE_MARGIN).toFixed(2)} ${(PAGE_HEIGHT - 38).toFixed(2)} l S\n`));
  }

  let y = pageNumber === 1 ? FIRST_PAGE_TOP : CONTINUATION_PAGE_TOP;

  for (const line of lines) {
    y -= line.gapBefore;

    if (line.kind === 'spacer') {
      y -= line.leading;
      continue;
    }

    if (line.kind === 'rule') {
      y -= line.leading * 0.5;
      parts.push(Buffer.from(`${rgbStroke(COLOR_BORDER)} 0.7 w ${PAGE_MARGIN} ${y.toFixed(2)} m ${(PAGE_WIDTH - PAGE_MARGIN).toFixed(2)} ${y.toFixed(2)} l S\n`));
      y -= line.leading * 0.5;
      continue;
    }

    if (line.kind === 'formula') {
      const boxHeight = line.leading + 8;
      const boxBottom = y - boxHeight;
      parts.push(Buffer.from(`${rgbFill(COLOR_SOFT_TINT)} ${(PAGE_MARGIN + 8).toFixed(2)} ${boxBottom.toFixed(2)} ${(CONTENT_WIDTH - 16).toFixed(2)} ${boxHeight.toFixed(2)} re f\n`));
      parts.push(Buffer.from(`${rgbStroke(COLOR_BORDER)} 0.6 w ${(PAGE_MARGIN + 8).toFixed(2)} ${boxBottom.toFixed(2)} ${(CONTENT_WIDTH - 16).toFixed(2)} ${boxHeight.toFixed(2)} re S\n`));
      const text = line.text || '';
      const estimatedWidth = text.length * estimateCharWidth(line.size, line.font);
      const centeredX = Math.max(PAGE_MARGIN + 18, PAGE_MARGIN + (CONTENT_WIDTH - estimatedWidth) / 2);
      appendText(parts, line.font, line.size, centeredX, boxBottom + (boxHeight - line.size) * 0.45, text, line.color || COLOR_CISEB_DEEP);
      y = boxBottom;
      continue;
    }

    if (line.kind === 'table-row') {
      const rowHeight = line.leading;
      const rowBottom = y - rowHeight;
      if (line.isTableHeader) {
        parts.push(Buffer.from(`${rgbFill(COLOR_TABLE_HEAD)} ${PAGE_MARGIN} ${rowBottom.toFixed(2)} ${CONTENT_WIDTH.toFixed(2)} ${rowHeight.toFixed(2)} re f\n`));
      }
      parts.push(Buffer.from(`${rgbStroke(COLOR_BORDER)} 0.5 w ${PAGE_MARGIN} ${rowBottom.toFixed(2)} m ${(PAGE_WIDTH - PAGE_MARGIN).toFixed(2)} ${rowBottom.toFixed(2)} l S\n`));
      appendText(parts, line.font, line.size, PAGE_MARGIN + line.indent, rowBottom + 4.5, line.text || '', line.color || COLOR_TEXT_BODY);
      y = rowBottom;
      continue;
    }

    if (line.kind === 'quote') {
      const rowBottom = y - line.leading;
      parts.push(Buffer.from(`${rgbFill(COLOR_CISEB_BLUE)} ${(PAGE_MARGIN + 4).toFixed(2)} ${(rowBottom + 1).toFixed(2)} 2.5 ${(line.leading - 1).toFixed(2)} re f\n`));
      appendText(parts, line.font, line.size, PAGE_MARGIN + line.indent, rowBottom + (line.leading - line.size) * 0.35, line.text || '', line.color || COLOR_TEXT_MUTED);
      y = rowBottom;
      continue;
    }

    y -= line.leading;
    const textY = Math.max(CONTENT_BOTTOM, y + (line.leading - line.size) * 0.35);
    const color = line.color || COLOR_TEXT_BODY;

    if (line.runs && line.runs.length > 0) {
      let cursorX = PAGE_MARGIN + line.indent;
      for (const run of line.runs) {
        appendText(parts, run.font, line.size, cursorX, textY, run.text, run.font === 'F2' ? COLOR_TEXT_DARK : color);
        cursorX += run.text.length * estimateCharWidth(line.size, run.font);
      }
    } else if (line.text) {
      appendText(parts, line.font, line.size, PAGE_MARGIN + line.indent, textY, line.text, color);
    }

    if (line.headingRule) {
      y -= 4;
      parts.push(Buffer.from(`${rgbStroke(COLOR_BORDER)} 0.6 w ${PAGE_MARGIN} ${y.toFixed(2)} m ${(PAGE_WIDTH - PAGE_MARGIN).toFixed(2)} ${y.toFixed(2)} l S\n`));
    }
  }

  // Rodapé institucional em todas as páginas
  parts.push(Buffer.from(`${rgbStroke(COLOR_BORDER)} 0.6 w ${PAGE_MARGIN} 42 m ${(PAGE_WIDTH - PAGE_MARGIN).toFixed(2)} 42 l S\n`));
  appendText(parts, 'F1', 8, PAGE_MARGIN, 29, 'CISEB · DINOV · SEDUC-PA — Material gerado com apoio do MIRI', COLOR_TEXT_MUTED);
  appendText(parts, 'F2', 8, PAGE_WIDTH - PAGE_MARGIN - 64, 29, `Página ${pageNumber} de ${pageCount}`, COLOR_CISEB_BLUE);

  return Buffer.concat(parts);
}

export function generatePdf(title: string, content: string): Buffer {
  const cleanTitle = removeInlineMarkdown(title).slice(0, 180) || 'Material de apoio';
  const emissionDate = formatDatePtBr();
  const pages = paginate(makeLayout(content));
  const objects: Buffer[] = [Buffer.alloc(0)];
  const addObject = (body: Buffer | string): number => {
    objects.push(typeof body === 'string' ? Buffer.from(body, 'latin1') : body);
    return objects.length - 1;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');

  const pageObjectIds: number[] = [];
  for (let index = 0; index < pages.length; index += 1) {
    const contentStream = makePageStream(pages[index], index + 1, pages.length, cleanTitle, emissionDate);
    const streamObjectId = objects.length;
    const pageObjectId = streamObjectId + 1;
    addObject(Buffer.concat([
      Buffer.from(`<< /Length ${contentStream.length} >>\nstream\n`),
      contentStream,
      Buffer.from('\nendstream'),
    ]));
    addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${streamObjectId} 0 R >>`);
    pageObjectIds.push(pageObjectId);
  }

  objects[2] = Buffer.from(`<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`, 'latin1');

  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  const offsets = [0];
  let offset = chunks[0].length;

  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = offset;
    const objectBytes = Buffer.concat([
      Buffer.from(`${id} 0 obj\n`, 'latin1'),
      objects[id],
      Buffer.from('\nendobj\n', 'latin1'),
    ]);
    chunks.push(objectBytes);
    offset += objectBytes.length;
  }

  const xrefOffset = offset;
  const xref = [`xref\n0 ${objects.length}\n`, '0000000000 65535 f \n'];
  for (let id = 1; id < objects.length; id += 1) {
    xref.push(`${offsets[id].toString().padStart(10, '0')} 00000 n \n`);
  }
  xref.push(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  chunks.push(Buffer.from(xref.join(''), 'latin1'));

  return Buffer.concat(chunks);
}
