export interface MarkdownAstNode {
  type: string;
  value?: unknown;
  children?: MarkdownAstNode[];
  data?: {
    hName?: string;
    hProperties?: {
      className?: string[];
      [key: string]: unknown;
    };
    hChildren?: Array<{
      type: string;
      value?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
}

const HTML_BREAK_ONLY_PATTERN = /^(?:\s*<\/?br\s*\/?>\s*)+$/i;
const HTML_BREAK_GLOBAL_PATTERN = /<\/?br\s*\/?>/gi;
const STANDALONE_HTML_BREAK_LINE_PATTERN = /^[ \t]*(?:<\/?br\s*\/?>[ \t]*)+$/gim;
const CODE_FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
const CURRENCY_DOLLAR_PATTERN = /(^|[^\p{L}\\$])(R|US)\$(?=\s*\d)/gu;
const TALL_MATH_PATTERN = /\\(?:frac|dfrac|cfrac|tfrac|sum|int|iint|iiint|oint|prod|lim|binom|sqrt)\b/;
const EQUATION_OR_REACTION_PATTERN = /=|\\(?:approx|neq|le|ge|leq|geq|to|rightarrow|Rightarrow|Leftrightarrow|iff)\b|->|<=>/;
const COMPACT_MATH_CONTAINERS = new Set(['tableCell', 'heading']);

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
        .replace(/^([ \t]*)\$\$([^\n]+?)\$\$[ \t]*$/gm, (_match, indent: string, expr: string) => (
          `\n${indent}$$\n${indent}${expr.trim()}\n${indent}$$\n`
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

function enhanceMathNodes(node: MarkdownAstNode, inCompactContainer = false): void {
  const nextCompact = inCompactContainer || COMPACT_MATH_CONTAINERS.has(node.type);

  if (node.type === 'inlineMath' && typeof node.value === 'string') {
    const trimmed = node.value.trim();
    if (TALL_MATH_PATTERN.test(trimmed)) {
      const shouldPromoteToDisplay = !inCompactContainer && EQUATION_OR_REACTION_PATTERN.test(trimmed);
      if (shouldPromoteToDisplay) {
        if (!node.data) node.data = {};
        node.data.hProperties = {
          ...(node.data.hProperties || {}),
          className: ['language-math', 'math-display'],
        };
      } else if (!/^\\displaystyle\b/.test(trimmed)) {
        const displaySizedValue = `\\displaystyle ${trimmed}`;
        node.value = displaySizedValue;
        const firstChild = node.data?.hChildren?.[0];
        if (firstChild && firstChild.type === 'text') {
          firstChild.value = displaySizedValue;
        }
      }
    }
    return;
  }

  if (!Array.isArray(node.children)) return;
  for (const child of node.children) {
    enhanceMathNodes(child, nextCompact);
  }
}

export function remarkReadableMath() {
  return (tree: MarkdownAstNode) => {
    enhanceMathNodes(tree);
  };
}
