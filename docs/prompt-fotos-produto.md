# Prompt para transformar foto de produto — BAILATTO

Versão **sem perna/modelo**: o calçado aparece sozinho, apoiado numa superfície
premium. Só o ambiente é criado — o sapato tem de permanecer idêntico.

---

## Como usar

Substitua os campos entre colchetes antes de enviar:

- `[COR DO PRODUTO]` — ex.: preto, nude, caramelo, azul
- `[MATERIAL]` — `verniz/couro brilhante` · `couro liso fosco` · `glitter/brilho` · `suede/camurça`
- `[TIPO]` — ex.: scarpin slingback, sandália de salto bloco, mocassim, bota

---

## O prompt

```
Você vai transformar a foto de produto anexada em uma foto profissional de
e-commerce para marketplace de moda, seguindo este processo em 3 etapas, nesta
ordem, sem pular nenhuma e sem pedir confirmação no meio do caminho.

PRODUTO: [TIPO] feminino, cor [COR DO PRODUTO], material [MATERIAL]

REGRA ACIMA DE TUDO: o calçado da foto original não pode ser alterado. Cor,
material, formato, costuras, fivelas, altura e formato do salto, textura e
acabamento permanecem exatamente como estão. Você só cria o ambiente ao redor.
Não invente detalhes que não existem na foto, não "melhore" o design, não
adicione logotipos e NÃO gere pernas, pés, pessoas ou manequins — o calçado
aparece sozinho.

ETAPA 1 — PESQUISA DE COR
Pesquise combinações de cores complementares e harmônicas para a cor
[COR DO PRODUTO], usando teoria da cor (complementar na roda cromática) e
referências de moda atuais. Escolha a paleta de ambientação que melhor combina
com o produto, com nomes de cor e códigos hex.

ETAPA 2 — PESQUISA DE AMBIENTE E MATERIAL
a) Pesquise que estilo de fundo gera mais visualizações e conversão em anúncios
   de calçados femininos em marketplace (fundo branco/neutro puro vs. fundo com
   ambientação) — cite dados reais se encontrar.
b) Defina a iluminação a partir do material [MATERIAL]:
   - Verniz/couro brilhante: reflete como espelho — painel de difusão grande
     (2-3x o tamanho do produto), luz suave e gradual, sem pontos de reflexo
     duros nem formas geométricas visíveis nos reflexos
   - Couro liso fosco: absorve luz — luz direcional quente + rebatedor do lado
     oposto, para não ficar opaco e sem vida
   - Suede/camurça: luz rasante lateral para revelar a textura aveludada, sem
     estourar as áreas claras
   - Glitter/brilho: luz direcional suave que faça o brilho cintilar, sem
     estourar os reflexos
c) Se o produto for claro ou branco: garanta contraste real contra o fundo —
   nunca use fundo da mesma tonalidade, senão o produto some na imagem.
d) Camada de luxo (vale para qualquer cor, não muda com a paleta):
   - Superfície: material premium — mármore, pedra natural, madeira nobre ou
     tecido como linho. Nunca fundo sintético ou papel liso genérico
   - Props: no máximo 1-2 elementos de qualidade equivalente ao produto
     (pedra decorativa, folhagem seca, tecido drapeado). Mais que isso derruba
     a sensação de exclusividade
   - Espaço: espaço negativo generoso ao redor do calçado em vez de preencher
     o quadro — isso sozinho já eleva o valor percebido
   - Composição: arranjo levemente assimétrico e curado, nunca centralizado de
     forma mecânica

ETAPA 3 — MONTAGEM E GERAÇÃO
Com os achados das etapas 1 e 2, gere as 4 imagens como 4 SAÍDAS SEPARADAS E
INDEPENDENTES — nunca como uma única imagem dividida em grade, colagem ou
painel com as 4 poses lado a lado. Cada ângulo é um arquivo final próprio.

Composição base (idêntica nas 4):
- O calçado apoiado sobre uma superfície premium na cor definida na Etapa 1
- Fundo desfocado, na mesma paleta, com espaço negativo generoso
- Props: no máximo 1-2 elementos discretos e desfocados
- Iluminação: a técnica definida na Etapa 2b, com profundidade e dimensão —
  evite luz chapada e uniforme, que lê como amador
- Sombra de contato suave e realista sob o calçado, para ele não parecer colado
- Produto ocupando 80-85% do quadro, sem cortes nas bordas
- Proporção 3:4 (vertical), 1200 x 1600 px
- Estilo: fotografia editorial de e-commerce, nítida e sofisticada
- Sem pernas, pés, pessoas ou manequins em nenhuma das imagens

Gere agora, NESTA ORDEM, 4 gerações separadas — mantendo fundo, luz e props
idênticos entre elas, mudando só o ângulo:

IMAGEM 1 de 4 — Três-quartos: o par visto de frente e levemente de lado, a
peça principal do anúncio (a "hero shot")
IMAGEM 2 de 4 — Perfil lateral: um pé de lado, mostrando a altura e o formato
do salto e a linha do calçado
IMAGEM 3 de 4 — Par composto: um sapato em pé e o outro levemente deitado ao
lado, mostrando também o solado
IMAGEM 4 de 4 — Detalhe: enquadramento próximo na fivela, tira ou acabamento,
revelando a textura do material

Antes de encerrar, confirme: você gerou 4 arquivos de imagem distintos, um por
ângulo? Se o resultado foi uma única imagem com os 4 ângulos lado a lado
(grade/colagem), isso está ERRADO — gere cada ângulo de novo como sua própria
imagem individual.
```

---

## Conferência obrigatória antes de publicar

Compare cada imagem gerada com a foto original e descarte se:

- a **cor** mudou de tom
- o **formato do salto** ou do bico ficou diferente
- apareceu **fivela, costura, tira ou enfeite** que não existe no original
- a **textura** virou outra (verniz virando fosco, camurça virando liso)

Foto que não corresponde ao produto real vira troca, reclamação e perda de
confiança — e a loja não tem margem para isso.
