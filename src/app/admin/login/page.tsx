import type { Metadata } from "next";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Entrar — Painel BAILATTO" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const erro = sp?.erro;

  return (
    <section className="mx-auto flex min-h-[75vh] max-w-sm flex-col justify-center px-4">
      <p className="font-serif text-2xl tracking-[0.25em] text-text">BAILATTO</p>
      <h1 className="mt-1 font-serif text-3xl text-text">Painel da loja</h1>
      <p className="mt-2 text-text-2">Entre para gerenciar seus produtos.</p>

      <form action={loginAction} className="mt-8 space-y-4">
        <input
          type="password"
          name="password"
          placeholder="Senha do painel"
          required
          autoFocus
          className="w-full rounded-[2px] border border-border bg-surface px-4 py-3 text-text outline-none focus:border-wine"
        />
        {erro && <p className="text-sm text-wine">Senha incorreta. Tente de novo.</p>}
        <button
          type="submit"
          className="w-full rounded-[2px] bg-wine px-6 py-3 text-sm font-medium uppercase tracking-wide text-on-wine transition-colors hover:bg-wine-2"
        >
          Entrar
        </button>
      </form>
    </section>
  );
}
