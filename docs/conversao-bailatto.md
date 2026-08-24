# Auditoria de conversão — BAILATTO Calçados

Auditoria feita em 2026-08-22 navegando o fluxo real (https://bailatto.com.br → `/produtos` → `/produtos/scarpin-slingback-preto` → `/carrinho` → `/checkout` → `/pedido/[id]`) e lendo o código em `C:\Users\Gustavo\bailatto-loja\src`.

**Contexto:** 125 produtos, ticket R$ 79,90–249,90, tráfego quase todo de Instagram mobile, pagamento ainda combinado no WhatsApp, sem verba de anúncio.

---

## Diagnóstico em uma frase

O site está bonito e o back-end está mais maduro do que a vitrine (frete real, estoque por numeração, pedidos com número). **O que trava a conversão não é o design — é a falta de informação de segurança na página de produto e o buraco entre "Pedido confirmado" e "dinheiro na conta".** Hoje a cliente termina o pedido e fica esperando um humano responder no WhatsApp para saber como pagar. Esse é o ponto onde mais gente some.

---

## Ranking por retorno sobre esforço

| # | Ação | Onde | Impacto | Esforço | ROI |
|---|---|---|---|---|---|
| 1 | Pix copia-e-cola + QR estático na tela de pedido confirmado | `/pedido/[id]` | **Alto** | P | ★★★★★ |
| 2 | Bloco de confiança na página de produto (troca, prazo, retirada, loja física) | PDP | **Alto** | P | ★★★★★ |
| 3 | Barra fixa de compra no mobile (preço + numeração + botão) | PDP | **Alto** | P | ★★★★★ |
| 4 | Guia de numeração + "veste no tamanho" | PDP | **Alto** | P | ★★★★★ |
| 5 | Filtro por numeração no catálogo | `/produtos` | **Alto** | M | ★★★★☆ |
| 6 | Escassez real por numeração ("última no 37") | PDP + card | Médio | P | ★★★★☆ |
| 7 | Página `/trocas` + `/sobre` + CNPJ no rodapé | site todo | **Alto** | P | ★★★★☆ |
| 8 | Trocar depoimentos-placeholder por reviews reais do Google | home | Médio | P | ★★★★☆ |
| 9 | Reordenar CTAs da sacola (Finalizar > WhatsApp) | `/carrinho` | Médio | P | ★★★★☆ |
| 10 | Recuperação manual de pedido parado no `/admin/pedidos` | admin | **Alto** | M | ★★★★☆ |
| 11 | Frete estimado já na página de produto | PDP | Médio | M | ★★★☆☆ |
| 12 | Teclado certo + autocomplete nos campos do checkout | `/checkout` | Médio | P | ★★★☆☆ |
| 13 | Mais fotos por produto (3–4 ângulos) | PDP | **Alto** | G | ★★★☆☆ |
| 14 | Cross-sell "você também vai gostar" | PDP | Médio | M | ★★★☆☆ |
| 15 | Captura de WhatsApp antes do checkout ("avise-me") | PDP/carrinho | Médio | M | ★★★☆☆ |
| 16 | Busca no catálogo | `/produtos` | Médio | M | ★★☆☆☆ |
| 17 | Banner "você deixou pares na sacola" | home | Baixo | P | ★★☆☆☆ |
| 18 | Feed do Instagram na home | home | Baixo | M | ★★☆☆☆ |

---

## 1. Fricções no caminho até a compra

### 1.1 A sacola oferece duas saídas e a errada é atraente — **impacto médio, esforço P**

`src/app/carrinho/page.tsx` linhas 109–122: "Finalizar compra" (vinho, sólido) e logo abaixo **"Prefiro pelo WhatsApp"** (contornado, mesmo peso visual). Quem clica no segundo sai do sistema: não gera pedido numerado, não informa endereço, não escolhe frete, e o atendimento vira digitação manual. É um vazamento de funil criado pela própria loja.

**Mudar para:** manter só o botão "Finalizar compra" em destaque e trocar o segundo por um link discreto de texto, sem borda, com outra função:

> `Dúvida antes de fechar? Chamar no WhatsApp`

Assim o WhatsApp vira suporte, não caminho alternativo de compra.

**Por quê:** duas CTAs concorrentes no mesmo passo diluem o clique; e a rota do WhatsApp perde os dados que fazem o pedido acontecer sozinho.

### 1.2 O CPF assusta no meio do formulário — **impacto médio, esforço P**

`src/app/checkout/page.tsx` linha 171: campo `CPF (para a nota)`. É opcional, mas na tela parece mais um dado sensível a entregar para uma loja desconhecida.

**Mudar para:** rótulo `CPF na nota fiscal (opcional)` e um micro-texto embaixo: `Só usamos para emitir a nota. Pode deixar em branco.` Ou tirar do checkout e pedir no WhatsApp junto com o pagamento.

### 1.3 O frete só aparece depois de digitar CEP dentro do checkout — **impacto médio, esforço M**

A cliente só descobre quanto custa entregar depois de preencher nome, WhatsApp, e-mail e escolher "Enviar para o meu endereço" (`cotarFrete` só dispara no `onBlur` do CEP, linha 109). Frete surpresa no fim é a causa nº 1 de abandono em e-commerce brasileiro.

**Mudar:** reaproveitar `POST /api/frete` em um mini-componente na página de produto: campo de CEP com o texto `Calcular frete e prazo`, e resultado no formato `Jadlog — R$ 12,88 — até 4 dias úteis`. E, acima dele, sempre visível:

> **Retirada grátis na loja** (Centro, São Carlos) · **Entrega em São Carlos R$ 15**

Como boa parte do público é da cidade, ver "grátis" antes de qualquer coisa remove o medo de frete caro.

### 1.4 Catálogo com 125 produtos e zero filtros úteis — **impacto alto, esforço M**

Hoje `/produtos` só filtra por categoria. Só de scarpins são 54. E o estoque é por numeração — ou seja, uma cliente 39 pode navegar 54 fotos e descobrir só no fim que quase nenhuma serve nela.

**Mudar:** adicionar acima da grade uma linha de chips `Sua numeração: 34 35 36 37 38 39 40`, que filtra `product.sizes`. Guardar a escolha em `localStorage` e reaplicar nas próximas visitas, com o aviso `Mostrando só o que temos no 38 · limpar`.

**Impacto:** transforma o catálogo de "vitrine" em "o que serve em mim", e mata a frustração de add-to-cart impossível. É a melhora de médio esforço com maior efeito no site.

Complementos baratos na mesma tela: ordenar por preço, e badge `Últimas peças` no card quando o total de pares em estoque for ≤ 2.

### 1.5 O card do catálogo não dá motivo para clicar — **impacto médio, esforço P**

Hoje mostra foto, categoria, nome e preço. Falta o que decide na rolagem: numeração disponível.

**Mudar:** linha discreta abaixo do preço com `34 · 35 · 37 · 39` (ou `Tamanhos 34–40`), e a badge `Últimas peças` quando aplicável.

---

## 2. Página de produto

Hoje `/produtos/scarpin-slingback-preto` tem: 1 foto, categoria, nome, preço, um parágrafo de descrição, botões de numeração, "Adicionar à sacola" e um link de WhatsApp. **É o mínimo absoluto.** Falta tudo que dá segurança para gastar R$ 139,90 numa loja que a pessoa conheceu há 40 segundos no Instagram.

### 2.1 Bloco de garantias logo abaixo do botão — **impacto alto, esforço P**

Adicionar em `src/app/produtos/[slug]/page.tsx`, entre o `<AddToCart>` e o link de WhatsApp, quatro linhas com ícone:

- **Trocou de ideia? Troca em 7 dias.** Primeira troca de numeração é por nossa conta.
- **Retirada grátis** na nossa loja física — Rua Germiniano Costa, 416, Centro.
- **Entrega em São Carlos por R$ 15** — normalmente no mesmo dia ou no dia seguinte.
- **Loja física de verdade**, 5,0 no Google. Você fala com a gente antes e depois da compra.

**Por quê:** cada uma responde um medo específico (errar o número, o site ser golpe, demora, sumiço no pós-venda). Custa uma hora de trabalho e é a maior alavanca isolada da PDP.

### 2.2 Guia de numeração — **impacto alto, esforço P**

Calçado tem a maior taxa de abandono por dúvida de tamanho. O link atual ("Dúvidas sobre numeração? Fale conosco") joga o problema para o WhatsApp, e a maioria não pergunta: só fecha a aba.

**Mudar:** um `<details>` colapsável chamado **"Qual é a minha numeração?"** com:

1. Instrução: *Pise numa folha, marque o calcanhar e a ponta do dedão, meça em cm e compare.*
2. Tabela cm ↔ numeração (34=22,0 · 35=22,7 · 36=23,3 · 37=24,0 · 38=24,7 · 39=25,3 · 40=26,0).
3. Uma frase por produto (campo novo `fit` no `Product`): `Este modelo veste no tamanho.` / `Bico fino — se estiver entre dois números, pegue o maior.`
4. Fecho: *Na dúvida, manda uma mensagem — a gente conhece cada modelo.*

### 2.3 Ficha técnica em vez de só um parágrafo — **impacto médio, esforço M**

A descrição atual é prosa de vendas. Falta o que a cliente procura para comparar: **altura do salto (cm), material do cabedal, forro, tipo de solado, bico**. Sugestão: manter o parágrafo e adicionar abaixo uma lista `Detalhes` com 4–6 itens. Comece pelos scarpins (54 produtos, o grosso do catálogo) — os dados de material já estão nos nomes do Phibo (napa, verniz, glitter, suede, croco).

### 2.4 Escassez honesta por numeração — **impacto médio, esforço P**

O `Product` já tem `stock` por numeração (importador Phibo). Hoje isso só serve para esconder o botão quando zera. Aproveite:

- Sob o seletor, quando a numeração escolhida tiver 1 par: `Última no 37 ✦`
- Quando o modelo inteiro tiver ≤ 3 pares: `Restam 3 pares deste modelo`

É escassez verdadeira, o que evita o efeito "loja que mente" — e em loja pequena a escassez é real mesmo.

### 2.5 Prova social dentro da PDP — **impacto alto, esforço M**

Zero prova social na página de produto. Duas opções baratas, em ordem de esforço:

- **Curta:** carrossel de 3 reviews reais do Google (as 3 que existem) com nome e nota, colado no fim da PDP, com link `Ver no Google →`.
- **Melhor:** campo `fotoCliente` no produto e a seção **"Nos pés das clientes"** — foto que a cliente mandou no WhatsApp/Instagram usando o par, com autorização. Isso vale mais que qualquer texto: mostra o sapato no pé real, resolve dúvida de caimento e prova que outra pessoa comprou.

### 2.6 Só uma foto por produto — **impacto alto, esforço G**

Uma foto de perfil não vende sapato de R$ 139,90. O mínimo é 3: perfil, três-quartos de frente e detalhe (salto/solado). Ideal: 4ª foto no pé.

Como é esforço grande (depende de refotografar), sugestão prática: **começar pelos 10 produtos mais vistos**, e pedir à loja fotos no pé no mesmo esquema que já funcionou (a mãe manda por WhatsApp com o nome do modelo na legenda). O pipeline de tratamento já existe em `scripts/refazer-todas-fotos.mjs`.

### 2.7 Cross-sell — **impacto médio, esforço M**

Nenhuma sugestão de outro produto em toda a PDP. Adicionar no fim: **"Você também vai gostar"** com 4 produtos da mesma categoria e faixa de preço próxima. Aumenta páginas por sessão e ticket médio, e é a única defesa contra o beco sem saída de "não gostei desse".

---

## 3. Confiança

Loja pequena e desconhecida perde venda por medo de golpe, não por preço. Aqui a BAILATTO tem uma vantagem enorme e **subutilizada: ela é real**. Endereço, vitrine, CNPJ, Instagram ativo, nota 5,0. Isso precisa aparecer em cada tela, não só na home.

### 3.1 Páginas institucionais que não existem — **impacto alto, esforço P**

Hoje o menu tem só Início, Produtos, Instagram e Sacola. Faltam páginas que qualquer compradora atenta procura antes de digitar dados:

- **`/trocas`** — Trocas e devoluções. Obrigatória: o Código de Defesa do Consumidor (art. 49) dá 7 dias de arrependimento em compra online, e não dizer isso não te isenta, só te deixa parecendo amador. Texto: prazo de 7 dias corridos a partir do recebimento, produto sem uso com a caixa, troca de numeração gratuita na loja física, como acionar (WhatsApp com o número do pedido).
- **`/sobre`** — quem é a loja, desde quando, com **as fotos da loja física que já estão no projeto** (`public/loja.jpg`, `public/loja/interior.jpg`, `public/loja/detalhe.jpg`) e, se ela topar, uma foto e o primeiro nome da dona. "Compra de uma pessoa" converte muito melhor que "compra de uma marca".
- **`/privacidade`** — curta, mas necessária por LGPD já que o checkout coleta CPF e telefone.
- **FAQ** — pode ser um `<details>` dentro de `/trocas`: como pago, quanto demora, e se não servir, vocês têm loja física, atendem em qual horário.

Linkar as três no rodapé.

### 3.2 Rodapé sem identificação legal — **impacto alto, esforço P**

Adicionar no rodapé: **razão social + CNPJ + endereço completo com CEP 13560-641 + telefone**. É o sinal de legitimidade mais barato que existe, e é justamente o que uma cliente desconfiada procura (muita gente copia o CNPJ e consulta). A irmã tem CNPJ — use.

> ⚠️ **Verificar a grafia da rua.** Os Correios registram **"Rua Geminiano Costa"**, o site escreve **"Germiniano"**. Aparece no rodapé, home, checkout e página de pedido. Endereço que não bate com o CEP levanta suspeita e pode travar entrega. Confirmar com a loja e padronizar.

### 3.3 Depoimentos de exemplo na home são um risco — **impacto médio, esforço P**

A home mostra 3 depoimentos que, pelo histórico do projeto, ainda são placeholders inventados (ex.: "Qualidade ótima e preço justo"). Depoimento falso é propaganda enganosa e, pior, é detectável — texto genérico sem sobrenome cheira a fake e derruba a confiança justamente na seção que deveria construí-la.

**Mudar:** substituir pelas **3 avaliações reais do Google**, com o nome como está lá, a nota em estrelas e um link `Ver as avaliações no Google →` apontando para o perfil. Três reais valem mais que dez inventados. Em paralelo, pedir avaliação no Google a toda cliente que retirar na loja (uma mensagem no WhatsApp no dia seguinte à entrega, com o link direto).

### 3.4 A loja física precisa aparecer no checkout — **impacto médio, esforço P**

No `/checkout` e no `/pedido/[id]`, ao lado da opção de retirada, colocar uma **miniatura da fachada** (`public/loja.jpg`) com a legenda `Rua Germiniano Costa, 416 — Centro, São Carlos-SP` e link para o Google Maps. Ver a loja no momento de entregar os dados é o antídoto direto do "será que isso existe?".

### 3.5 Atendimento com rosto — **impacto médio, esforço P**

Trocar `Fale conosco no WhatsApp` por algo com pessoa e horário:

> Fala com a [nome] no WhatsApp — respondemos de seg a sáb, 9h às 18h.

Prometer horário e cumprir reduz a ansiedade de quem vai depender do WhatsApp para pagar.

---

## 4. Mobile

Quase todo o tráfego vem do Instagram no celular, muitas vezes dentro do navegador embutido do app.

### 4.1 Barra fixa de compra na PDP — **impacto alto, esforço P**

No mobile, a foto (3:2) + nome + preço + descrição empurram o "Adicionar à sacola" para baixo da dobra. Quem rola para ler a descrição perde o botão de vista.

**Mudar:** barra fixa no rodapé que aparece quando o botão original sai da tela, com: preço à esquerda, `Adicionar à sacola` à direita. Se a numeração ainda não estiver escolhida, o toque abre um seletor de numeração em bottom-sheet.

**Por quê:** é a melhoria mobile de maior efeito comprovado em e-commerce de moda, e são poucas linhas de código.

### 4.2 Alvos de toque pequenos demais — **impacto médio, esforço P**

Em `src/components/AddToCart.tsx` os botões de numeração são `h-10 w-10` (40px). O mínimo confortável é 44px, e numeração escolhida errada por dedo grosso vira troca ou devolução. Subir para `h-12 w-12` no mobile e aumentar o `gap`.

Mesma coisa nos `+`/`−` da sacola (`px-3 py-1` é pequeno demais para o polegar).

### 4.3 Categorias escondidas no menu hambúrguer — **impacto médio, esforço P**

Quem chega do Instagram cai na home ou direto num produto e não sabe que existem 9 categorias. Colocar, logo abaixo do cabeçalho em telas pequenas, uma **fita horizontal rolável de chips** (Scarpins · Sandálias · Botas · Rasteirinhas · …) — o mesmo padrão que ela já vê no Instagram e na Shein.

### 4.4 Formulário do checkout não está otimizado para celular — **impacto médio, esforço P**

Nenhum campo em `src/app/checkout/page.tsx` declara `inputMode`, `autoComplete` ou `type` adequado. No celular isso significa teclado alfabético para digitar CEP e telefone, e zero autopreenchimento.

Ajustes por campo:

- `name` → `autoComplete="name"`
- `phone` → `type="tel"` `inputMode="tel"` `autoComplete="tel"` + máscara `(16) 99999-9999`
- `email` → `autoComplete="email"` `inputMode="email"`
- `cpf` → `inputMode="numeric"` + máscara
- `cep` → `inputMode="numeric"` `autoComplete="postal-code"` **e disparar a busca também no `onChange` ao completar 8 dígitos** — hoje só no `onBlur` (linha 212), e no celular é comum a pessoa digitar o CEP e tocar direto em outro lugar sem gerar blur previsível
- `street`/`number`/`city` → `autoComplete="address-line1" / "address-line2" / "address-level2"`

### 4.5 O carrinho vive só no `localStorage` — **impacto médio, esforço M**

O navegador embutido do Instagram tem armazenamento isolado: a cliente monta a sacola dentro do app, depois abre o Chrome e a sacola sumiu. Mitigação barata: no `/carrinho`, botão **"Enviar minha sacola no WhatsApp"** que manda a lista para ela mesma; mitigação boa (fase 2): salvar a sacola no Supabase com um id em cookie.

### 4.6 Peso das imagens

O catálogo entrega 125 fotos 1200×800. Confirmar que os `sizes` do `next/image` na grade estão declarando a largura real do card no mobile (e não `100vw`), para não baixar imagem grande demais no 4G. Cada segundo de espera na primeira tela vinda do Instagram custa conversão.

---

## 5. O gargalo do pagamento

Hoje: `/pedido/[id]` mostra "Pedido confirmado!" e um botão **"Combinar pagamento no WhatsApp"** com mensagem pré-preenchida. Está bem feito — mas a compra **para de depender da cliente e passa a depender de um humano responder**. Se a resposta demorar 40 minutos (ou for às 22h de um domingo), o entusiasmo evapora. Esse é o maior vazamento do funil.

### 5.1 Pix copia-e-cola direto na tela de confirmação — **impacto alto, esforço P** ⭐

**Não é preciso esperar gateway nenhum.** Um Pix estático (BR Code EMV) é uma string gerada com a chave Pix, o nome do recebedor, a cidade e o valor. Dá para gerar no servidor, sem API, sem certificado, sem taxa — e a cliente paga em 20 segundos, sozinha, sem falar com ninguém.

**Fazer em `/pedido/[id]`:**

1. Bloco no topo: **"Pague agora por Pix"** com o **QR Code** e o botão **"Copiar código Pix"** (o `copia e cola` já com o valor total do pedido).
2. Abaixo: `Assim que pagar, toque no botão abaixo para enviar o comprovante.` → botão WhatsApp com mensagem já escrita: `Paguei o pedido #1042, segue o comprovante.`
3. O botão WhatsApp atual vira o caminho secundário: `Prefiro combinar de outro jeito (cartão, na loja)`.
4. Enviar o mesmo QR e o mesmo código por e-mail, se ela preencheu.

**Impacto:** tira o humano do caminho crítico. É a diferença entre "pedido pago em 2 minutos" e "pedido pago se e quando alguém responder". Faça isto antes de qualquer outra coisa da lista.

*Cuidado:* Pix estático com valor fixo não confirma pagamento automaticamente — a baixa segue manual, pelo comprovante. Ainda assim resolve 90% do problema de conversão, que é a espera. Quando a API do Itaú entrar, troca-se o estático pelo dinâmico com webhook e a tela nem muda de lugar.

### 5.2 Desconto no Pix — **impacto médio, esforço P**

`5% de desconto no Pix` exibido na PDP, no resumo da sacola e no checkout. Como não há cartão hoje, o "desconto" não custa margem contra concorrente nenhum e transforma a limitação (só Pix) em vantagem percebida. Mostrar o valor já calculado: `R$ 139,90 — ou R$ 132,90 no Pix`.

### 5.3 Reserva com prazo — **impacto médio, esforço P**

Adicionar na confirmação: **"Seu par fica reservado por 24 horas."** Cria urgência legítima (o estoque é por numeração e é pequeno de verdade) e dá à loja uma justificativa natural para cobrar no dia seguinte.

### 5.4 Prometer o tempo de resposta antes de pedir o clique — **impacto médio, esforço P**

O texto atual no checkout (linhas 364–367) é honesto mas passivo: *"Você combina o pagamento com a gente no WhatsApp."* Trocar por expectativa concreta:

> Você recebe o Pix na tela seguinte e paga na hora. Qualquer dúvida, respondemos no WhatsApp de seg a sáb, 9h às 18h.

### 5.5 Não pedir cartão que não existe

Enquanto não houver cartão, **não** escrever "parcelamos" em lugar nenhum. Em compensação, deixe explícito no FAQ: *"Ainda não temos cartão no site. Se você preferir cartão, dá para pagar na loja na retirada, ou a gente manda um link."* Silêncio sobre forma de pagamento gera mais abandono que uma limitação assumida.

---

## 6. Recuperação de quem não finalizou

Existem dois abandonos diferentes e cada um precisa de resposta própria.

### 6.1 Abandono **depois** do checkout — o mais fácil e mais valioso — **impacto alto, esforço M**

Esse já está resolvido pela metade: o pedido está salvo em `data/orders.json` **com nome, WhatsApp e itens**. É lead quente com contato — o melhor ativo do site e hoje ele só fica parado no admin.

**Fazer no `/admin/pedidos`:**

- Filtro **"Aguardando pagamento há mais de 2 horas"**.
- Em cada pedido dessa lista, um botão **"Cobrar no WhatsApp"** que abre `wa.me` com o texto pronto:

  > Oi [nome]! Aqui é da BAILATTO 💛 Separei seu pedido **#1042** — [modelo], nº 37. Ele fica reservado até amanhã. Quer que eu mande o Pix? (Se preferir, dá para retirar na loja e pagar aqui.)

- Segunda mensagem, se em 24h não pagou:

  > Oi [nome]! Vou precisar liberar o nº 37 para outra cliente hoje à tarde. Ainda quer que eu segure para você?

Uma rotina manual de 10 minutos por dia recupera uma fatia grande dos pedidos parados — em loja pequena isso costuma ser o melhor retorno por hora trabalhada do negócio inteiro.

### 6.2 Abandono **antes** do checkout — **impacto médio, esforço M**

Quem adiciona à sacola e some não deixa contato nenhum. Formas baratas de capturar, em ordem de esforço:

- **Banner de volta:** na home e no catálogo, se o `localStorage` tiver itens, uma faixa fina: `Você deixou 2 pares na sacola · Retomar →`. Esforço mínimo, recupera quem volta pelo Instagram dias depois.
- **"Avise-me quando chegar":** o `AddToCart` já trata numeração esgotada só com um link de WhatsApp. Trocar por um campo de WhatsApp e um botão `Me avise quando tiver no 38`, salvando no Supabase. Isso captura justamente a cliente com **intenção máxima e produto indisponível** — a mais fácil de reconquistar, e ainda vira dado de compra para a loja.
- **Sacola por WhatsApp:** o botão do item 4.5 ("enviar minha sacola") faz a própria cliente iniciar a conversa, o que abre a janela de atendimento sem parecer cobrança.

### 6.3 Pós-venda que gera a próxima venda — **impacto médio, esforço P**

Como a loja já vai falar com cada cliente no WhatsApp de qualquer forma, formalize duas mensagens:

- **D+2 após a entrega:** `Serviu direitinho? Se precisar trocar a numeração, a primeira troca é por nossa conta.` — reduz devolução e avaliação ruim.
- **D+5:** `Se você gostou, uma avaliação no Google ajuda demais a gente 💛 [link]` — as 3 avaliações atuais são o principal ativo de confiança da loja; chegar a 20 muda o patamar do site inteiro.

E uma alavanca de aquisição sem verba: `Poste com a gente marcando @bailatto.calcados.saocarlos e ganhe 10% no próximo par.` Vira prova social (item 2.5) e alcance no Instagram ao mesmo tempo.

---

## Plano sugerido em 3 ondas

**Onda 1 — esta semana (tudo esforço P, impacto máximo):**
Pix copia-e-cola na confirmação · bloco de garantias na PDP · barra fixa mobile · guia de numeração · reordenar CTAs da sacola · páginas `/trocas` e `/sobre` + CNPJ no rodapé · reviews reais do Google · campos do checkout com teclado certo.

**Onda 2 — próximas 2 semanas:**
Filtro por numeração no catálogo · escassez por numeração · frete estimado na PDP · rotina de cobrança no `/admin/pedidos` · desconto no Pix · banner de sacola abandonada.

**Onda 3 — quando houver fôlego:**
3–4 fotos por produto (começando pelos mais vistos) · fotos de clientes na PDP · cross-sell · "avise-me quando chegar" · busca · Pix dinâmico com webhook quando a API do Itaú sair.

---

## Como saber se funcionou

Sem verba de anúncio, o que importa é a taxa, não o volume. Vale instalar um analytics leve (Plausible ou Umami — sem banner de cookie e sem peso) e acompanhar quatro números:

| Métrica | Onde medir | Alvo inicial |
|---|---|---|
| Visita → adicionou à sacola | evento no `AddToCart` | 6–10% |
| Sacola → pedido confirmado | pedidos ÷ sacolas | 35%+ |
| **Pedido confirmado → pago** | admin | **acima de 70%** ← o número que a Onda 1 ataca |
| Retirada na loja vs envio | `delivery.method` | dá o mapa de onde está a cliente |

O terceiro é o termômetro do gargalo de pagamento. Se hoje ele estiver abaixo de 50%, o Pix na tela de confirmação sozinho já paga a auditoria.
