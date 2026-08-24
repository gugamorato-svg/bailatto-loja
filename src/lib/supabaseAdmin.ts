import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente SOMENTE de servidor (usa a service_role/secret key). Criado sob demanda
// para não quebrar o app quando as variáveis ainda não estão configuradas.
// NUNCA importe/execute isto em componentes client.
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

// Bucket PÚBLICO: catálogo de produtos e fotos. Tudo aqui é servido via CDN
// e pode ser lido por qualquer um — não coloque dado de cliente aqui.
export const BUCKET = "bailatto";
export const DATA_PATH = "data/products.json";

// Bucket PRIVADO: pedidos (nome, telefone, e-mail, CPF, endereço). Só a
// service key acessa. Não deve ser tornado público em hipótese nenhuma.
export const BUCKET_PRIVADO = "bailatto-privado";
