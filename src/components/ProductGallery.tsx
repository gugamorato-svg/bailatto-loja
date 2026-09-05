"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  name: string;
  image: string;
  images?: string[];
};

const ANGULOS = ["foto principal", "perfil", "outro ângulo"];

export function ProductGallery({ name, image, images = [] }: ProductGalleryProps) {
  const gallery = [...new Set([image, ...images].filter(Boolean))].slice(0, 3);
  const [selected, setSelected] = useState(0);
  const current = gallery[selected] ?? gallery[0];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-white">
        <Image
          key={current}
          src={current}
          alt={`${name} — ${ANGULOS[selected] ?? `foto ${selected + 1}`}`}
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          className="object-contain"
          preload={selected === 0}
        />

        {gallery.length > 1 && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center gap-2 md:hidden">
            {gallery.map((_, index) => (
              <span
                key={index}
                aria-hidden
                className={`h-1.5 rounded-full transition-all ${
                  selected === index ? "w-6 bg-wine" : "w-1.5 bg-text/35"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-3 gap-3" aria-label={`Fotos de ${name}`}>
          {gallery.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Ver ${ANGULOS[index] ?? `foto ${index + 1}`} de ${name}`}
              aria-pressed={selected === index}
              className={`relative aspect-[4/5] overflow-hidden rounded-[2px] bg-white transition ${
                selected === index
                  ? "ring-1 ring-wine ring-offset-2 ring-offset-bg"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 768px) 30vw, 170px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
