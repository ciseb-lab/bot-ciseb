import { supabase } from '../supabase/client.ts';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function readApiJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`A API retornou erro HTTP ${response.status}. Verifique o status do serviço backend.`);
    }
    throw new Error('A API retornou uma resposta em formato inesperado.');
  }

  try {
    return await response.json();
  } catch {
    throw new Error('A API retornou JSON inválido.');
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!supabase) throw new Error('O acesso institucional ainda não está configurado.');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  headers.set('Authorization', `Bearer ${session.access_token}`);
  const response = await fetch(apiUrl(path), { ...init, headers });
  if (response.status === 401) {
    const data: unknown = await response.clone().json().catch(() => null);
    if (data && typeof data === 'object' && 'code' in data
      && data.code === 'SESSION_EXPIRED') {
      await supabase.auth.signOut();
    }
  }
  return response;
}

export async function downloadApiFile(path: string, filename: string): Promise<void> {
  const response = await apiFetch(path);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(typeof data.error === 'string' ? data.error : 'Não foi possível baixar o arquivo.');
  }
  const blob = await response.blob();
  if (!blob.size) throw new Error('O servidor retornou um arquivo vazio.');
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
