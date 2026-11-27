import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import 'katex/contrib/mhchem';
import { normalizeMarkdownForRendering, remarkHtmlBreaks, remarkReadableMath } from './markdownUtils.ts';

type MarkdownProps = Parameters<typeof ReactMarkdown>[0];

const remarkPlugins: MarkdownProps['remarkPlugins'] = [
  remarkGfm,
  remarkMath,
  remarkReadableMath,
  remarkHtmlBreaks,
];
const rehypePlugins: MarkdownProps['rehypePlugins'] = [
  [rehypeKatex, { throwOnError: false, strict: false }],
];

const components: Components = {
  p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="mt-5 mb-2 text-xl font-bold text-current">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-2 text-lg font-bold text-current">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-base font-semibold text-current">{children}</h3>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-current">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-[#005BAC] pl-3 text-slate-600 dark:border-[#00AAFF] dark:text-slate-300">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a className="text-[#005BAC] underline underline-offset-2 dark:text-[#38bdf8]" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800 dark:bg-slate-800 dark:text-sky-200">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-md bg-slate-900 p-3 text-sm text-slate-100">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#E0F2FE]/70 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-r border-slate-200 px-3 py-2 font-semibold last:border-r-0 dark:border-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-r border-slate-200 px-3 py-2 align-top last:border-r-0 dark:border-slate-700">
      {children}
    </td>
  ),
};

interface MarkdownTextProps {
  children: string;
  className?: string;
}

export function MarkdownText({ children, className = '' }: MarkdownTextProps) {
  const normalizedContent = normalizeMarkdownForRendering(children);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
