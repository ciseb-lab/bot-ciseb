export type PlanningDocumentFormat =
  | 'Plano de Aula'
  | 'Sequência Didática'
  | 'Projeto Integrador / Maker'
  | 'Explorar Ideia';

export interface StructuredPlanningInput {
  area_conhecimento: string[];
  componentes_curriculares: string[];
  trilhas_formativas: string[];
  subtema: string;
  etapa_ensino: string[];
  anos_series: string[];
  modalidades: string[];
  detalhes_modalidade?: string;
  formato_documento: PlanningDocumentFormat;
  recursos_escola: string[];
  contexto_escolar: string;
}

const VALID_FORMATS = new Set<PlanningDocumentFormat>([
  'Plano de Aula',
  'Sequência Didática',
  'Projeto Integrador / Maker',
  'Explorar Ideia',
]);

function isBoundedStringArray(value: unknown, maxItems: number, maxItemLength: number): value is string[] {
  return Array.isArray(value)
    && value.length <= maxItems
    && value.every(item => typeof item === 'string' && item.trim().length > 0 && item.length <= maxItemLength);
}

export function isValidStructuredPlanningInput(value: unknown): value is StructuredPlanningInput {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;

  if (!isBoundedStringArray(candidate.area_conhecimento, 10, 80)) return false;
  if (!isBoundedStringArray(candidate.componentes_curriculares, 20, 80)) return false;
  if (!isBoundedStringArray(candidate.trilhas_formativas, 10, 120)) return false;
  if (typeof candidate.subtema !== 'string' || candidate.subtema.length > 400) return false;
  if (!isBoundedStringArray(candidate.etapa_ensino, 10, 80)) return false;
  if (!isBoundedStringArray(candidate.anos_series, 20, 80)) return false;
  if (!isBoundedStringArray(candidate.modalidades, 10, 80)) return false;
  if (
    candidate.detalhes_modalidade !== undefined
    && (typeof candidate.detalhes_modalidade !== 'string' || candidate.detalhes_modalidade.length > 400)
  ) {
    return false;
  }
  if (
    typeof candidate.formato_documento !== 'string'
    || !VALID_FORMATS.has(candidate.formato_documento as PlanningDocumentFormat)
  ) {
    return false;
  }
  if (!isBoundedStringArray(candidate.recursos_escola, 30, 120)) return false;
  if (typeof candidate.contexto_escolar !== 'string' || candidate.contexto_escolar.length > 1000) return false;

  return true;
}
