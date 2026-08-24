import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET || "dev-secret-troque-isto";
const COOKIE = "bailatto_admin";
const VALUE = "admin";

function sign(value: string): string {
  const h = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${h}`;
}

function verify(token: string | undefined): boolean {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const value = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b) && value === VALUE;
}

/** Lê o cookie e diz se o admin está logado. Use em Server Components. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verify(store.get(COOKIE)?.value);
}

/** Confere a senha e cria a sessão. Chame de uma Server Action. */
export async function login(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) return false;
  const store = await cookies();
  store.set(COOKIE, sign(VALUE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

/** Encerra a sessão. Chame de uma Server Action. */
export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Redireciona pro login se não estiver autenticado. Use no topo de páginas /admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
