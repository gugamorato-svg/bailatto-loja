"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  name: string;
  image: string;
  images?: string[];
};

const descricaoFoto = (index: number) =>
  index === 0 ? "foto principal" : `foto ${index + 1}`;

export function ProductGallery({ name, image, images = [] }: ProductGalleryProps) {
  const gallery = [...new Set([image, ...images].filter(Boolean))];
  const [selected, setSelected] = useState(0);
  const current = gallery[selected] ?? gallery[0];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xs bg-white">
        {/* `priority`: esta é a maior imagem da página e define o LCP. Antes
            estava escrito `preload`, que não existe no next/image — o atributo
            ia parar no <img> sem fazer nada. */}
        <Image
          key={current}
          src={current}
          alt={`${name} — ${descricaoFoto(selected)}`}
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          className="object-contain"
          priority={selected === 0}
        />

        {gallery.length > 1 && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center gap-2 md:hidden">
            {gallery.map((_, index) => (
              <span
                key={index}
                aria-hidden
                className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-saida)] ${
                  selected === index ? "w-6 bg-wine" : "w-1.5 bg-text/35"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5" aria-label={`Fotos de ${name}`}>
          {gallery.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Ver ${descricaoFoto(index)} de ${name}`}
              aria-pressed={selected === index}
              className={`relative aspect-[4/5] overflow-hidden rounded-xs bg-white transition-[opacity,box-shadow,transform] duration-200 ease-[var(--ease-saida)] active:scale-[0.97] ${
                selected === index
                  ? "ring-1 ring-wine ring-offset-2 ring-offset-bg"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 640px) 22vw, (max-width: 768px) 18vw, 100px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
