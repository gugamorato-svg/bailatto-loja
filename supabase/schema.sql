-- Tabela de produtos da BAILATTO
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  description text default '',
  price numeric,                 -- null = "a confirmar"/"Sob consulta"
  promo_price numeric,           -- preço promocional (opcional)
  sizes int[] default '{34,35,36,37,38,39}',
  image text,                    -- caminho (/produtos/x.jpg) ou URL do Storage
  featured boolean default false,
  active boolean default true,
  sort int default 0,
  created_at timestamptz default now()
);

create index if not exists products_category_idx on products (category);
create index if not exists products_active_idx on products (active);

-- Storage: criar um bucket público "produtos" para as fotos enviadas pelo painel
-- (feito via app/dashboard). Leitura pública; escrita só via service_role no servidor.
