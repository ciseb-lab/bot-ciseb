import { signOut } from 'firebase/auth';
import { auth, firebaseRequestHeaders } from '../firebase/client.ts';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const firebaseHeaders = await firebaseRequestHeaders();
  for (const [name, value] of Object.entries(firebaseHeaders)) headers.set(name, value);
  const response = await fetch(apiUrl(path), { ...init, headers });
  if (response.status === 401 && auth?.currentUser) {
    const data: unknown = await response.clone().json().catch(() => null);
    if (data && typeof data === 'object' && 'code' in data
      && (data.code === 'SESSION_EXPIRED' || data.code === 'AUTH_REQUIRED')) {
      await signOut(auth);
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
