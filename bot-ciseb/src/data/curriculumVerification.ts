import type { CurriculumSkill } from './curriculumData.ts';
import type { DocumentPage } from './documentKnowledge.ts';

export interface VerifiedCurriculumSkill {
  skill: CurriculumSkill;
  document: Pick<DocumentPage, 'source' | 'title' | 'pageNumber'>;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function verifyCurriculumSkill(
  skill: CurriculumSkill,
  pages: DocumentPage[],
): VerifiedCurriculumSkill | undefined {
  const code = normalizeText(skill.code);
  const statement = normalizeText(skill.verbatimText);
  if (!code || !statement) return undefined;

  const page = pages.find(candidate => {
    const text = ` ${normalizeText(candidate.text)} `;
    return text.includes(` ${code} `) && text.includes(statement);
  });

  if (!page) return undefined;

  return {
    skill,
    document: {
      source: page.source,
      title: page.title,
      pageNumber: page.pageNumber,
    },
  };
}
