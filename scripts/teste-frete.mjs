const token = process.env.SUPERFRETE_TOKEN;
const base = process.env.SUPERFRETE_AMBIENTE === "producao"
  ? "https://api.superfrete.com"
  : "https://sandbox.superfrete.com";
const origem = process.env.LOJA_CEP_ORIGEM;

const destinos = [
  ["01310100", "São Paulo - SP"],
  ["30130010", "Belo Horizonte - MG"],
  ["69900000", "Rio Branco - AC"],
];

for (const [cep, nome] of destinos) {
  const body = {
    from: { postal_code: origem },
    to: { postal_code: cep },
    services: "1,2,17",
    options: { own_hand: false, receipt: false, insurance_value: 0, use_insurance_value: false },
    package: { height: 13, width: 25, length: 35, weight: 0.9 },
  };
  let r;
  for (let tent=1; tent<=4; tent++) {
   try {
  r = await fetch(`${base}/api/v0/calculator`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "BAILATTO Calcados (gugamorato@gmail.com)",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  break;
   } catch(e) { console.log(`  tentativa ${tent} falhou: ${e.cause?.code || e.message}`); await new Promise(x=>setTimeout(x,2000)); }
  }
  if (!r) { console.log(`  desisti de ${nome}`); continue; }
  const txt = await r.text();
  console.log(`\n=== ${nome} (${cep}) — HTTP ${r.status} ===`);
  try {
    const d = JSON.parse(txt);
    if (Array.isArray(d)) {
      for (const s of d) {
        if (s.error) { console.log(` - ${s.name}: ERRO ${s.error}`); continue; }
        console.log(` - ${s.name}: R$ ${s.price} | ${s.delivery_time} dias (${s.delivery_range?.min}-${s.delivery_range?.max})`);
      }
    } else {
      console.log(JSON.stringify(d).slice(0, 400));
    }
  } catch {
    console.log(txt.slice(0, 300));
  }
}
