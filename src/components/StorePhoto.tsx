"use client";

import { useState } from "react";

export function StorePhoto({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[2px] ph-gradient">
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center font-serif text-lg text-wine/70">
          Foto da nossa loja em breve
        </div>
      )}
    </div>
  );
}
