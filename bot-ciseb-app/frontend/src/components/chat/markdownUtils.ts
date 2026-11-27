export interface MarkdownAstNode {
  type: string;
  value?: unknown;
  children?: MarkdownAstNode[];
}

const HTML_BREAK_ONLY_PATTERN = /^(?:\s*<\/?br\s*\/?>\s*)+$/i;
const HTML_BREAK_GLOBAL_PATTERN = /<\/?br\s*\/?>/gi;
const STANDALONE_HTML_BREAK_LINE_PATTERN = /^[ \t]*(?:<\/?br\s*\/?>[ \t]*)+$/gim;
const CODE_FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
const CURRENCY_DOLLAR_PATTERN = /(^|[^\p{L}\\$])(R|US)\$(?=\s*\d)/gu;

function splitByCodeFences(markdown: string): Array<{ text: string; isCode: boolean }> {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const segments: Array<{ text: string; isCode: boolean }> = [];
  let buffer: string[] = [];
  let activeFence: { char: string; length: number } | null = null;

  const flush = (isCode: boolean) => {
    if (buffer.length > 0) {
      segments.push({ text: buffer.join('\n'), isCode });
      buffer = [];
    }
  };

  for (const line of lines) {
    const fenceMatch = line.match(CODE_FENCE_PATTERN);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      if (!activeFence) {
        flush(false);
        activeFence = { char: fence[0], length: fence.length };
        buffer.push(line);
        continue;
      }
      if (
        fence[0] === activeFence.char
        && fence.length >= activeFence.length
        && /^\s*(`{3,}|~{3,})\s*$/.test(line)
      ) {
        buffer.push(line);
        flush(true);
        activeFence = null;
        continue;
      }
    }

    buffer.push(line);
  }

  flush(Boolean(activeFence));
  return segments;
}

function normalizeNonCodeMarkdown(text: string): string {
  return text
    .split(/(`+[^`\n]*`+)/g)
    .map((segment, index) => {
      if (index % 2 === 1) return segment;

      return segment
        .replace(STANDALONE_HTML_BREAK_LINE_PATTERN, '')
        .replace(CURRENCY_DOLLAR_PATTERN, (_match, prefix: string, currency: string) => `${prefix}${currency}\\$`)
        .replace(/^([ \t]*\|.*)$/gm, tableLine => (
          tableLine
            .replace(/\\\[([^\n]+?)\\\]/g, (_match, expr: string) => `$${expr.trim()}$`)
            .replace(/\\\(([^\n]+?)\\\)/g, (_match, expr: string) => `$${expr.trim()}$`)
        ))
        .replace(/\\\[([\s\S]*?)\\\]/g, (_match, expr: string) => `\n$$\n${expr.trim()}\n$$\n`)
        .replace(/\\\(([^\n]+?)\\\)/g, (_match, expr: string) => `$${expr.trim()}$`);
    })
    .join('');
}

export function normalizeMarkdownForRendering(markdown: string): string {
  return splitByCodeFences(markdown)
    .map(segment => (segment.isCode ? segment.text : normalizeNonCodeMarkdown(segment.text)))
    .join('\n');
}

function replaceHtmlBreakNodes(node: MarkdownAstNode): void {
  if (!Array.isArray(node.children)) return;

  const nextChildren: MarkdownAstNode[] = [];
  for (const child of node.children) {
    if (
      child.type === 'html'
      && typeof child.value === 'string'
      && HTML_BREAK_ONLY_PATTERN.test(child.value)
    ) {
      const matches = child.value.match(HTML_BREAK_GLOBAL_PATTERN) || [];
      for (let index = 0; index < matches.length; index += 1) {
        nextChildren.push({ type: 'break' });
      }
      continue;
    }

    replaceHtmlBreakNodes(child);
    nextChildren.push(child);
  }

  node.children = nextChildren;
}

export function remarkHtmlBreaks() {
  return (tree: MarkdownAstNode) => {
    replaceHtmlBreakNodes(tree);
  };
}
