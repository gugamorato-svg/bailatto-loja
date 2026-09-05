import Script from "next/script";

/**
 * Meta Pixel + GA4. Só entram em cena quando o ID existe no ambiente — sem
 * variável, nenhum script é carregado (nada quebra em desenvolvimento e nada
 * é enviado antes da hora).
 *
 * Importante: o evento de COMPRA não sai daqui. Como o pagamento é Pix manual,
 * disparar "Purchase" no fim do checkout ensinaria o algoritmo a buscar quem
 * faz pedido e não paga. Ele sai no servidor, quando o pedido é marcado como
 * pago — ver src/lib/rastreamentoServidor.ts.
 */
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA4 = process.env.NEXT_PUBLIC_GA4_ID;

export function Rastreamento() {
  return (
    <>
      {PIXEL && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${PIXEL}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}

      {GA4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());gtag('config','${GA4}');`}
          </Script>
        </>
      )}
    </>
  );
}
