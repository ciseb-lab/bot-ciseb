type PdfFont = 'F1' | 'F2' | 'F3';

interface LayoutLine {
  text: string;
  font: PdfFont;
  size: number;
  indent: number;
  gapBefore: number;
  leading: number;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 54;
const CONTENT_TOP = PAGE_HEIGHT - 58;
const CONTENT_BOTTOM = 58;
const CP1252_SPECIALS = new Map<number, number>([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);

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

function removeInlineMarkdown(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]*>/g, '')
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

function makeLayout(title: string, content: string): LayoutLine[] {
  const lines: LayoutLine[] = [];
  const addWrapped = (text: string, font: PdfFont, size: number, indent = 0, gapBefore = 0) => {
    const maxCharacters = Math.max(24, Math.floor((PAGE_WIDTH - PAGE_MARGIN * 2 - indent) / (size * 0.52)));
    wrapText(text, maxCharacters).forEach((wrapped, index) => {
      lines.push({
        text: wrapped,
        font,
        size,
        indent,
        gapBefore: index === 0 ? gapBefore : 0,
        leading: size * 1.45,
      });
    });
  };

  addWrapped(removeInlineMarkdown(title).slice(0, 180), 'F2', 19, 0, 0);
  lines.push({ text: '', font: 'F1', size: 10, indent: 0, gapBefore: 4, leading: 14 });

  let inCodeBlock = false;
  for (const rawLine of content.replace(/\r\n?/g, '\n').split('\n')) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (!trimmed || /^---+$/.test(trimmed)) {
      lines.push({ text: '', font: 'F1', size: 10, indent: 0, gapBefore: 0, leading: 8 });
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const size = level === 1 ? 16 : level === 2 ? 13 : 11;
      addWrapped(removeInlineMarkdown(heading[2]), 'F2', size, 0, 8);
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (/^\|[\s:|-]+\|$/.test(trimmed)) continue;
      const cells = trimmed.split('|').slice(1, -1).map(cell => removeInlineMarkdown(cell.trim()));
      addWrapped(cells.join('  ·  '), 'F1', 9.5, 8, 2);
      continue;
    }

    const bullet = trimmed.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.*)$/);
    if (bullet) {
      addWrapped(`• ${removeInlineMarkdown(bullet[1])}`, 'F1', 10.5, 10, 1);
      continue;
    }

    if (trimmed.startsWith('>')) {
      addWrapped(removeInlineMarkdown(trimmed.replace(/^>\s?/, '')), 'F1', 10.5, 12, 2);
      continue;
    }

    addWrapped(removeInlineMarkdown(trimmed), inCodeBlock ? 'F3' : 'F1', 10.5, inCodeBlock ? 12 : 0, 1);
  }

  return lines;
}

function paginate(lines: LayoutLine[]): LayoutLine[][] {
  const pages: LayoutLine[][] = [[]];
  let usedHeight = 0;

  for (const line of lines) {
    const lineHeight = line.gapBefore + line.leading;
    if (usedHeight + lineHeight > CONTENT_TOP - CONTENT_BOTTOM && pages[pages.length - 1].length > 0) {
      pages.push([]);
      usedHeight = 0;
    }
    pages[pages.length - 1].push(line);
    usedHeight += lineHeight;
  }

  return pages;
}

function makePageStream(lines: LayoutLine[], pageNumber: number, pageCount: number): Buffer {
  const parts: Buffer[] = [];
  let y = CONTENT_TOP;

  for (const line of lines) {
    y -= line.gapBefore;
    y -= line.leading;
    if (!line.text) continue;

    const textY = Math.max(CONTENT_BOTTOM, y + (line.leading - line.size) * 0.35);
    parts.push(Buffer.from(`BT /${line.font} ${line.size} Tf 1 0 0 1 ${PAGE_MARGIN + line.indent} ${textY.toFixed(2)} Tm `));
    parts.push(literalString(line.text));
    parts.push(Buffer.from(' Tj ET\n'));
  }

  parts.push(Buffer.from(`BT /F1 8 Tf 1 0 0 1 ${PAGE_MARGIN} 32 Tm `));
  parts.push(literalString(`BOT CISEB · Página ${pageNumber} de ${pageCount}`));
  parts.push(Buffer.from(' Tj ET\n'));
  return Buffer.concat(parts);
}

export function generatePdf(title: string, content: string): Buffer {
  const pages = paginate(makeLayout(title, content));
  const objects: Buffer[] = [Buffer.alloc(0)];
  const addObject = (body: Buffer | string): number => {
    objects.push(typeof body === 'string' ? Buffer.from(body, 'latin1') : body);
    return objects.length - 1;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');

  const pageObjectIds: number[] = [];
  for (let index = 0; index < pages.length; index += 1) {
    const contentStream = makePageStream(pages[index], index + 1, pages.length);
    const streamObjectId = objects.length;
    const pageObjectId = streamObjectId + 1;
    addObject(Buffer.concat([
      Buffer.from(`<< /Length ${contentStream.length} >>\nstream\n`),
      contentStream,
      Buffer.from('\nendstream'),
    ]));
    addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${streamObjectId} 0 R >>`);
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
