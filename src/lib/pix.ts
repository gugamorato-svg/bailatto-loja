/**
 * Gera o "Pix copia e cola" (BR Code, padrão EMV do Banco Central).
 *
 * É um Pix **estático**: não depende de gateway, certificado nem API de banco.
 * O dinheiro cai direto na conta dona da chave. Em troca, o site não fica
 * sabendo que foi pago — a confirmação continua sendo manual, olhando o extrato.
 */

const CHAVE = "62086144000160"; // CNPJ da loja, só dígitos
const NOME = "BAILATTO CALCADOS"; // máx. 25 caracteres
const CIDADE = "SAO CARLOS"; // máx. 15 caracteres

/** Campo no formato EMV: id + tamanho (2 dígitos) + valor. */
function campo(id: string, valor: string): string {
  return id + String(valor.length).padStart(2, "0") + valor;
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF) — exigido pelo padrão. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e caracteres que o padrão não aceita. */
function limpar(texto: string, max: number): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max)
    .trim();
}

export function gerarPixCopiaECola(valor: number, identificador: string): string {
  const txid = limpar(identificador, 25).replace(/ /g, "") || "***";

  const contaPix =
    campo("00", "br.gov.bcb.pix") + campo("01", CHAVE);

  const payload =
    campo("00", "01") + // versão do formato
    campo("26", contaPix) + // dados da conta Pix
    campo("52", "0000") + // categoria do estabelecimento
    campo("53", "986") + // moeda: real
    campo("54", valor.toFixed(2)) + // valor
    campo("58", "BR") + // país
    campo("59", limpar(NOME, 25)) +
    campo("60", limpar(CIDADE, 15)) +
    campo("62", campo("05", txid)); // identificador do pedido

  const semCrc = payload + "6304";
  return semCrc + crc16(semCrc);
}
