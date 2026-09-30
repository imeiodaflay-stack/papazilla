import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

/**
 * Diz com quais provedores (google, apple, email) um e-mail já tem conta.
 * Usado pela tela de login antes de enviar o código por e-mail, pra avisar
 * quem já criou a conta com Google ou Apple. Em qualquer falha devolve lista
 * vazia: o app segue o fluxo normal do código.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return res.status(400).json({ providers: [] });
  try {
    const { data, error } = await supabaseAdmin().rpc('auth_providers_for_email', { p_email: email });
    if (error) throw error;
    const providers = Array.isArray(data) ? data.filter((p): p is string => typeof p === 'string') : [];
    return res.status(200).json({ providers });
  } catch (err) {
    console.error('auth-providers', err);
    return res.status(200).json({ providers: [] });
  }
}
