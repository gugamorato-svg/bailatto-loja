/**
 * Conjunto de ícones da BAILATTO.
 *
 * Antes o site usava emoji e glifos do teclado no lugar de ícone: 🏪 ↩️ 💬 na
 * página do produto, ☰ no menu, ＋ no guia de numeração, ★ ✓ ✦ → ←. Emoji é
 * desenhado pelo sistema — muda de estilo em cada celular, não acompanha a cor
 * do texto e tem cara de anúncio de marketplace, não de loja de calçado.
 *
 * Todos aqui são traçados na mesma família: 24×24, traço de 1,5, pontas
 * arredondadas, sempre em currentColor.
 */
type IconeProps = {
  /** Tamanho em pixels; o padrão acompanha o texto ao lado. */
  tamanho?: number;
  className?: string;
};

function Svg({
  tamanho = 20,
  className,
  children,
}: IconeProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconeSeta(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  );
}

export function IconeSetaVolta(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M20 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Svg>
  );
}

export function IconeMenu(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 7h17" />
      <path d="M3.5 12h17" />
      <path d="M3.5 17h17" />
    </Svg>
  );
}

export function IconeFechar(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Svg>
  );
}

export function IconeConfirmado(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Svg>
  );
}

export function IconeLoja(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 9.5 5 4h14l1.5 5.5" />
      <path d="M3.5 9.5a3 3 0 0 0 5.7 1.3 3 3 0 0 0 5.6 0 3 3 0 0 0 5.7-1.3" />
      <path d="M5 11.8V20h14v-8.2" />
      <path d="M10 20v-4.5h4V20" />
    </Svg>
  );
}

export function IconeTroca(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M4 9h11a4.5 4.5 0 0 1 0 9H8" />
      <path d="m8 5-4 4 4 4" />
    </Svg>
  );
}

export function IconeConversa(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M20 12.5c0 3.6-3.6 6.5-8 6.5a9.6 9.6 0 0 1-2.6-.35L4.5 20l1.2-3.3A6.1 6.1 0 0 1 4 12.5C4 8.9 7.6 6 12 6s8 2.9 8 6.5Z" />
    </Svg>
  );
}

export function IconeEstrela(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="m12 4 2.4 5.1 5.6.75-4.1 3.9 1.05 5.5L12 16.6l-4.95 2.65L8.1 13.75 4 9.85l5.6-.75L12 4Z" />
    </Svg>
  );
}

export function IconePacote(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M20 8.4v7.2a1 1 0 0 1-.52.88l-7 3.9a1 1 0 0 1-.96 0l-7-3.9a1 1 0 0 1-.52-.88V8.4a1 1 0 0 1 .52-.88l7-3.9a1 1 0 0 1 .96 0l7 3.9a1 1 0 0 1 .52.88Z" />
      <path d="m4.3 8 7.7 4.2L19.7 8" />
      <path d="M12 12.2V20" />
    </Svg>
  );
}

export function IconeMais(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </Svg>
  );
}
