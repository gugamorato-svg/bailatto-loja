"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import { pesoMiudo, ehVolumoso, TAMANHO_UNICO } from "@/lib/products";
import { iniciarCheckout } from "@/lib/eventos";
import { limiarDaUf } from "@/lib/freteGratis";
import { rotuloTamanho } from "@/lib/products";
import { submitOrder } from "./actions";

/**
 * O checkout roda no navegador e não enxerga variável de servidor. A chave
 * pública do Mercado Pago é feita para ser exposta, e só existe quando a
 * integração está configurada — serve de sinal para o texto da tela.
 */
const MP_ATIVO = !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

const inputCls =
  "w-full rounded-[2px] border border-border bg-surface px-4 py-2.5 text-text outline-none focus:border-wine";

type Metodo = "retirada" | "entrega_local" | "correios";

const FRETE: Record<Metodo, number | null> = {
  retirada: 0,
  entrega_local: 10,
  correios: null,
};

const OPCOES: [Metodo, string, string][] = [
  ["retirada", "Retirada na loja — grátis", "Rua Geminiano Costa, 416 — Centro"],
  ["entrega_local", "Entrega em São Carlos — R$ 10,00", "Combinamos o melhor horário"],
  ["correios", "Enviar para o meu endereço", "Calculamos o frete pelo seu CEP"],
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      {children}
    </label>
  );
}

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = use(searchParams);
  const { items, count } = useCart();
  const [metodo, setMetodo] = useState<Metodo>("retirada");
  const [cep, setCep] = useState<{
    street?: string;
    district?: string;
    city?: string;
    uf?: string;
  }>({});
  const [buscando, setBuscando] = useState(false);
  const [opcoes, setOpcoes] = useState<
    { id: string; nome: string; preco: number; prazoDias: number }[]
  >([]);
  const [servico, setServico] = useState("");
  const [cotando, setCotando] = useState(false);
  const [erroFrete, setErroFrete] = useState("");

  // Chegar no checkout é o passo mais próximo da compra que dá para medir no
  // navegador; o Purchase sai do servidor quando o Pix é confirmado.
  const disparado = useRef(false);
  useEffect(() => {
    if (disparado.current || items.length === 0) return;
    disparado.current = true;
    iniciarCheckout(items);
  }, [items]);

  const allPriced = items.every((i) => i.price != null);
  const subtotal = items.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0);
  const opcaoEscolhida = opcoes.find((o) => o.id === servico);

  // Frete grátis por região: o limiar depende da UF do CEP, porque enviar para
  // o Norte custa o dobro do Sudeste. A loja ABSORVE o frete — a transportadora
  // continua sendo paga, então o valor cotado segue aparecendo, riscado.
  const gratis =
    metodo === "correios" &&
    allPriced &&
    limiarDaUf(cep.uf) != null &&
    subtotal >= (limiarDaUf(cep.uf) as number);

  const freteCotado =
    metodo === "correios" ? opcaoEscolhida?.preco ?? null : FRETE[metodo];
  const frete = gratis && freteCotado != null ? 0 : freteCotado;
  const total = allPriced && frete != null ? subtotal + frete : null;

  async function cotarFrete(cepLimpo: string) {
    setCotando(true);
    setErroFrete("");
    setOpcoes([]);
    setServico("");
    try {
      // Calçado vai por par; o resto (size 0 = tamanho único) vai por peso,
      // senão um brinco de R$ 15 é cotado como uma caixa de sapato.
      const pares = items
        .filter((i) => i.size !== TAMANHO_UNICO)
        .reduce((s, i) => s + i.qty, 0);
      const miudos = items.filter((i) => i.size === TAMANHO_UNICO);
      const pesoMiudos = miudos.reduce((s, i) => s + pesoMiudo(i.name) * i.qty, 0);
      const volumoso = miudos.some((i) => ehVolumoso(i.name));
      const r = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cepLimpo, pares, pesoMiudos, volumoso }),
      });
      const d = await r.json();
      if (d.erro || !d.opcoes?.length) {
        setErroFrete(d.erro || "Nenhuma opção de envio para esse CEP.");
      } else {
        setOpcoes(d.opcoes);
        setServico(d.opcoes[0].id);
      }
    } catch {
      setErroFrete("Não consegui calcular o frete agora.");
    }
    setCotando(false);
  }

  async function buscarCep(valor: string) {
    const only = valor.replace(/\D/g, "");
    if (only.length !== 8) return;
    setBuscando(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${only}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setCep({
          street: d.logradouro,
          district: d.bairro,
          city: d.localidade,
          uf: d.uf,
        });
      }
    } catch {
      // silencioso — dá para preencher à mão
    }
    setBuscando(false);
    if (metodo === "correios") cotarFrete(only);
  }

  if (count === 0) {
    return (
      <section className="mx-auto max-w-[1180px] px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-text">Sua sacola está vazia</h1>
        <p className="mt-3 text-text-2">
          Escolha seus pares favoritos para finalizar a compra.
        </p>
        <Link
          href="/produtos"
          className="mt-8 inline-block rounded-[2px] bg-wine px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
        >
          Ver coleção
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-12">
      <Link href="/carrinho" className="text-sm text-text-2 hover:text-wine">
        ← Voltar para a sacola
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-text">Finalizar compra</h1>

      {erro && (
        <p className="mt-4 rounded-[2px] border border-wine/40 bg-surface p-3 text-sm text-wine">
          {erro}
        </p>
      )}

      <form action={submitOrder} className="mt-8 grid gap-10 lg:grid-cols-3">
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(
            items.map((i) => ({ slug: i.slug, size: i.size, qty: i.qty })),
          )}
        />

        <div className="space-y-8 lg:col-span-2">
          <div>
            <h2 className="mb-4 font-serif text-xl text-text">Seus dados</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nome completo *">
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    autoCapitalize="words"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="WhatsApp *">
                <input
                  name="phone"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(16) 99999-9999"
                  className={inputCls}
                />
              </Field>
              <Field label="E-mail">
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  className={inputCls}
                />
              </Field>
              <Field label="CPF na nota fiscal (opcional)">
                <input
                  name="cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  className={inputCls}
                />
                <span className="mt-1 block text-xs text-text-2">
                  Só usamos para emitir a nota. Pode deixar em branco.
                </span>
              </Field>
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-serif text-xl text-text">Entrega</h2>
            <div className="space-y-2">
              {OPCOES.map(([valor, titulo, sub]) => (
                <label
                  key={valor}
                  className={
                    "flex cursor-pointer gap-3 rounded-[2px] border p-4 transition-colors " +
                    (metodo === valor ? "border-wine bg-surface" : "border-border")
                  }
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={valor}
                    checked={metodo === valor}
                    onChange={() => setMetodo(valor)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-text">{titulo}</span>
                    <span className="block text-sm text-text-2">{sub}</span>
                  </span>
                </label>
              ))}
            </div>

            {metodo === "retirada" && (
              <a
                href="https://www.google.com/maps/search/?api=1&query=BAILATTO+Cal%C3%A7ados+Rua+Geminiano+Costa+416+S%C3%A3o+Carlos"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex gap-4 rounded-[2px] border border-border bg-surface p-3 transition-colors hover:border-wine"
              >
                {/* Ver a loja bem na hora de entregar os dados é o antídoto do
                    "será que isso existe mesmo?". */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/loja.jpg"
                  alt="Fachada da loja BAILATTO"
                  className="h-20 w-28 shrink-0 rounded-[2px] object-cover"
                />
                <span className="text-sm">
                  <span className="block text-text">Retire na nossa loja</span>
                  <span className="block text-text-2">
                    Rua Geminiano Costa, 416 — Centro, São Carlos-SP
                  </span>
                  <span className="mt-1 block text-wine">Ver no mapa →</span>
                </span>
              </a>
            )}

            {metodo !== "retirada" && (
              <div className="mt-5 grid gap-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <Field label="CEP">
                    <input
                      name="cep"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={9}
                      placeholder="00000-000"
                      className={inputCls}
                      // Dispara assim que os 8 dígitos entram: no celular ela
                      // digita o CEP e toca direto no próximo campo, e o blur
                      // nem sempre acontece antes do envio.
                      onChange={(e) => {
                        if (e.target.value.replace(/\D/g, "").length === 8) {
                          buscarCep(e.target.value);
                        }
                      }}
                      onBlur={(e) => buscarCep(e.target.value)}
                    />
                  </Field>
                  {buscando && <p className="mt-1 text-xs text-text-2">buscando…</p>}
                </div>
                <div className="sm:col-span-4">
                  <Field label="Rua *">
                    <input
                      name="street"
                      required
                      autoComplete="address-line1"
                      key={"st" + (cep.street ?? "")}
                      defaultValue={cep.street}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Número *">
                    <input
                      name="number"
                      required
                      inputMode="numeric"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-4">
                  <Field label="Complemento">
                    <input name="complement" className={inputCls} />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Bairro">
                    <input
                      name="district"
                      key={"di" + (cep.district ?? "")}
                      defaultValue={cep.district}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Cidade *">
                    <input
                      name="city"
                      required
                      autoComplete="address-level2"
                      key={"ci" + (cep.city ?? "")}
                      defaultValue={cep.city}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-1">
                  <Field label="UF">
                    <input
                      name="uf"
                      maxLength={2}
                      autoComplete="address-level1"
                      autoCapitalize="characters"
                      key={"uf" + (cep.uf ?? "")}
                      defaultValue={cep.uf}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            )}

            {metodo === "correios" && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium text-text">
                  Opções de envio
                </h3>
                {cotando && (
                  <p className="text-sm text-text-2">Calculando o frete…</p>
                )}
                {!cotando && erroFrete && (
                  <p className="text-sm text-wine">{erroFrete}</p>
                )}
                {!cotando && !erroFrete && opcoes.length === 0 && (
                  <p className="text-sm text-text-2">
                    Digite o CEP acima para ver as opções de envio.
                  </p>
                )}
                <div className="space-y-2">
                  {opcoes.map((o) => (
                    <label
                      key={o.id}
                      className={
                        "flex cursor-pointer items-center justify-between gap-3 rounded-[2px] border p-3 transition-colors " +
                        (servico === o.id ? "border-wine bg-surface" : "border-border")
                      }
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="servicoFrete"
                          value={o.id}
                          checked={servico === o.id}
                          onChange={() => setServico(o.id)}
                        />
                        <span>
                          <span className="block text-text">{o.nome}</span>
                          <span className="block text-sm text-text-2">
                            {o.prazoDias > 0
                              ? `chega em até ${o.prazoDias} dia(s) úteis`
                              : "prazo a confirmar"}
                          </span>
                        </span>
                      </span>
                      <span className="text-wine">{formatPrice(o.preco)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-[2px] border border-border bg-surface p-6">
          <h2 className="font-serif text-xl text-text">Seu pedido</h2>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={`${i.slug}-${i.size}`} className="flex gap-3">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[2px] bg-surface-2">
                  <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="text-text">{i.name}</p>
                  <p className="text-text-2">
                    {rotuloTamanho(i.size)} · {i.qty}x
                  </p>
                </div>
                <p className="text-sm text-wine">{formatPrice(i.price)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-text-2">
              <span>Subtotal</span>
              <span>{allPriced ? formatPrice(subtotal) : "a combinar"}</span>
            </div>
            <div className="flex justify-between text-text-2">
              <span>Frete</span>
              {gratis && freteCotado != null ? (
                <span>
                  <span className="mr-2 text-text-2/60 line-through">
                    {formatPrice(freteCotado)}
                  </span>
                  <span className="text-wine">grátis</span>
                </span>
              ) : (
                <span>{frete == null ? "a combinar" : formatPrice(frete)}</span>
              )}
            </div>
            <div className="flex justify-between pt-2 text-base text-text">
              <span>Total</span>
              <span>{total == null ? "a combinar" : formatPrice(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-[2px] bg-wine px-6 py-3.5 text-sm font-medium uppercase tracking-wide text-on-wine hover:bg-wine-2"
          >
            {MP_ATIVO ? "Ir para o pagamento" : "Confirmar pedido"}
          </button>
          <p className="mt-3 text-center text-xs text-text-2">
            {MP_ATIVO
              ? "Você paga no ambiente seguro do Mercado Pago — Pix, cartão em parcelas ou boleto — e volta para cá com o pedido confirmado."
              : "Na próxima tela você recebe o QR Code do Pix com o valor já calculado. Pagou, é só mandar o comprovante no WhatsApp."}
          </p>
        </aside>
      </form>
    </section>
  );
}
