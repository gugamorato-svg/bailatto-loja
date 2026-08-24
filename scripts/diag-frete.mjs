const token = process.env.SUPERFRETE_TOKEN;
const base = "https://api.superfrete.com";
for (const [cep, nome, pares] of [["69900000","Rio Branco",2],["01310100","Sao Paulo",2]]) {
  const body = {
    from: { postal_code: process.env.LOJA_CEP_ORIGEM },
    to: { postal_code: cep },
    services: "1,2,17,3,31",
    options: { own_hand:false, receipt:false, insurance_value:0, use_insurance_value:false },
    package: { height: 13*pares, width: 25, length: 35, weight: 0.9*pares },
  };
  let r;
  for (let t=1;t<=3;t++){
    try { r = await fetch(`${base}/api/v0/calculator`, { method:"POST", headers:{
      Authorization:`Bearer ${token}`, "User-Agent":"BAILATTO Calcados (contato@bailatto.com.br)",
      "Content-Type":"application/json", Accept:"application/json" }, body:JSON.stringify(body),
      signal: AbortSignal.timeout(20000) }); break; }
    catch(e){ await new Promise(x=>setTimeout(x,1500)); }
  }
  if(!r){ console.log(nome,"=> sem resposta"); continue; }
  const txt = await r.text();
  console.log(`\n### ${nome} — HTTP ${r.status}`);
  console.log(txt.slice(0,400));
}
