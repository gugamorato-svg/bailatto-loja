const token = process.env.SUPERFRETE_TOKEN;
const body = {
  from: { postal_code: process.env.LOJA_CEP_ORIGEM },
  to: { postal_code: "01310100" },
  services: "1,2,17",
  options: { own_hand: false, receipt: false, insurance_value: 0, use_insurance_value: false },
  package: { height: 13, width: 25, length: 35, weight: 0.9 },
};

for (const base of ["https://api.superfrete.com", "https://sandbox.superfrete.com"]) {
  let r, erro;
  for (let t = 1; t <= 4; t++) {
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
    } catch (e) { erro = e.cause?.code || e.message; await new Promise(x => setTimeout(x, 2000)); }
  }
  if (!r) { console.log(`${base} => sem resposta (${erro})`); continue; }
  const txt = await r.text();
  console.log(`\n### ${base} — HTTP ${r.status}`);
  try {
    const d = JSON.parse(txt);
    if (Array.isArray(d)) {
      for (const s of d) {
        console.log(s.error ? ` - ${s.name}: ERRO ${s.error}` : ` - ${s.name}: R$ ${s.price} | ${s.delivery_time} dias`);
      }
    } else console.log(" ", JSON.stringify(d).slice(0, 200));
  } catch { console.log(" ", txt.slice(0, 200)); }
}
