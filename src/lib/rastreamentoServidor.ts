import "server-only";
import { createHash } from "node:crypto";

/**
 * Conversions API da Meta (evento pelo servidor).
 *
 * Existe por dois motivos concretos desta loja:
 *
 * 1. O pagamento é Pix MANUAL. Se o "Purchase" saísse no fim do checkout, o
 *    algoritmo aprenderia a procurar gente que faz pedido e não paga. Aqui ele
 *    só sai quando o pedido é marcado como PAGO.
 * 2. Quase todo o tráfego vem do navegador embutido do Instagram, onde o pixel
 *    do navegador perde eventos (ITP, bloqueadores). O servidor não perde.
 *
 * Sem PIXEL_ID e META_CAPI_TOKEN no ambiente, a função não faz nada.
 */
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_TOKEN;

/** A Meta exige e-mail e telefone com hash SHA-256; nada em texto puro sai daqui. */
function hash(v?: string | null): string | undefined {
  if (!v) return undefined;
  const limpo = v.trim().toLowerCase();
  if (!limpo) return undefined;
  return createHash("sha256").update(limpo).digest("hex");
}

/** Telefone precisa ir só com dígitos e DDI antes do hash. */
function hashTelefone(v?: string | null): string | undefined {
  if (!v) return undefined;
  const so = v.replace(/\D/g, "");
  if (!so) return undefined;
  return hash(so.startsWith("55") ? so : "55" + so);
}

export type CompraConfirmada = {
  id: string;
  total: number;
  email?: string | null;
  telefone?: string | null;
  itens: { slug: string; qty: number }[];
};

export async function registrarCompra(pedido: CompraConfirmada): Promise<void> {
  if (!PIXEL || !TOKEN) return;

  const user_data: Record<string, string[]> = {};
  const em = hash(pedido.email);
  const ph = hashTelefone(pedido.telefone);
  if (em) user_data.em = [em];
  if (ph) user_data.ph = [ph];
  // Sem nenhum identificador a Meta descarta o evento; não vale a chamada.
  if (!em && !ph) return;

  const corpo = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        // O mesmo id em toda tentativa: se o pedido for marcado pago duas
        // vezes, a Meta deduplica em vez de contar duas conversões.
        event_id: `pedido-${pedido.id}`,
        action_source: "website",
        user_data,
        custom_data: {
          currency: "BRL",
          value: pedido.total,
          content_type: "product",
          content_ids: pedido.itens.map((i) => i.slug),
          num_items: pedido.itens.reduce((s, i) => s + i.qty, 0),
        },
      },
    ],
  };

  try {
    const r = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      },
    );
    if (!r.ok) {
      console.error("CAPI recusou o evento:", (await r.text()).slice(0, 200));
    }
  } catch (e) {
    // Falha de rastreamento nunca pode derrubar a confirmação de um pedido.
    console.error("CAPI indisponível:", e);
  }
}
