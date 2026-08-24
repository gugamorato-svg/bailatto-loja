import sharp from "sharp";
const slugs = ["scarpin-salto-alto-napa-azul-escuro","mule-azul-serenity","sandalia-slingback-azul-serenity","sandalia-caramelo-salto-bloco"];
for (const s of slugs) {
  const url = `https://bailatto.com.br/produtos/${s}.jpg`;
  let r;
  for (let t=1;t<=3;t++){
    try { r = await fetch(url,{signal:AbortSignal.timeout(20000)}); break; }
    catch { await new Promise(x=>setTimeout(x,1500)); }
  }
  if (!r) { console.log(s, "=> sem resposta"); continue; }
  if (!r.ok) { console.log(s, "=> HTTP", r.status); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  const m = await sharp(buf).metadata();
  console.log(`${s}: ${m.width}x${m.height} (proporcao ${(m.width/m.height).toFixed(2)}) ${Math.round(buf.length/1024)}KB`);
}
