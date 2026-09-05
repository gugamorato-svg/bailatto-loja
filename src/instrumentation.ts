import * as Sentry from "@sentry/nextjs";

/**
 * Monitoramento de erro em produção.
 *
 * Sem isto, um checkout quebrado às 21h simplesmente não aparece para ninguém:
 * a cliente vai embora e o pedido nunca existe. Com Pix manual e volume baixo,
 * uma noite assim é dinheiro que some sem deixar rastro.
 *
 * Sem SENTRY_DSN no ambiente nada é inicializado — não quebra em
 * desenvolvimento e não envia nada antes da hora.
 */
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    // Volume é baixo; amostrar rastreamento não traria economia e esconderia
    // justamente o caso raro que interessa.
    tracesSampleRate: 1,
    // Pedido carrega nome, telefone, e-mail e CPF: nada disso pode vazar para
    // um terceiro só porque houve uma exceção (LGPD).
    sendDefaultPii: false,
    environment: process.env.VERCEL_ENV ?? "development",
  });
}

export const onRequestError = DSN ? Sentry.captureRequestError : undefined;
