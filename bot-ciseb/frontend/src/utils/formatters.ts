/**
 * Utilitários para formatação e renderização de tabelas e textos oficiais
 */

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

/**
 * Extrai tabelas markdown do texto da resposta
 */
export function extractMarkdownTables(text: string): {
  cleanText: string;
  tables: ParsedTable[];
} {
  const lines = text.split('\n');
  const tables: ParsedTable[] = [];
  const nonTableLines: string[] = [];
  let currentTableLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      currentTableLines.push(line);
    } else {
      if (inTable) {
        // Parse accumulated table
        const parsed = parseSingleTable(currentTableLines);
        if (parsed) tables.push(parsed);
        currentTableLines = [];
        inTable = false;
      }
      nonTableLines.push(lines[i]);
    }
  }

  if (inTable && currentTableLines.length > 0) {
    const parsed = parseSingleTable(currentTableLines);
    if (parsed) tables.push(parsed);
  }

  return {
    cleanText: nonTableLines.join('\n').trim(),
    tables,
  };
}

function parseSingleTable(lines: string[]): ParsedTable | null {
  if (lines.length < 2) return null;

  const cleanRow = (rowStr: string) =>
    rowStr
      .split('|')
      .slice(1, -1)
      .map(cell => cell.trim());

  const headers = cleanRow(lines[0]);
  // Line 1 is the separator (| --- | --- |)
  const rows: string[][] = [];

  for (let i = 2; i < lines.length; i++) {
    const cells = cleanRow(lines[i]);
    if (cells.length > 0 && !cells.every(c => c === '' || /^[-:]+$/.test(c))) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}
