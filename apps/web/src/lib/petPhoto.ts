import { isSupabaseConfigured } from './env.js';
import { supabase } from './supabase.js';

/**
 * Upload da foto do Monstrinho (bucket `pet-photos`, Storage — já existe
 * como coluna `photo_path` em `pets` desde a primeira migration, só não
 * tinha upload de verdade ligado a ela ainda).
 *
 * Sem Supabase configurado ou sem sessão, cai pra uma data URL local (mesma
 * filosofia de fallback do resto de `petsStore.ts`) — a foto funciona no
 * aparelho, só não sincroniza.
 */
const MAX_BYTES = 8 * 1024 * 1024;

export class PhotoUploadError extends Error {}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function randomId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Envia a foto e devolve a URL final (pública, ou data URL no fallback local). */
export async function uploadPetPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new PhotoUploadError('Escolha um arquivo de imagem (JPG ou PNG).');
  }
  if (file.size > MAX_BYTES) {
    throw new PhotoUploadError('A foto precisa ter até 8 MB.');
  }

  if (!isSupabaseConfigured || !supabase) {
    return fileToDataUrl(file);
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    return fileToDataUrl(file);
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${userId}/${randomId()}.${ext}`;
  const { error } = await supabase.storage.from('pet-photos').upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new PhotoUploadError(error.message);

  const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
  return data.publicUrl;
}
