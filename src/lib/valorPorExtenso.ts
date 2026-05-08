// Converte um valor numérico para sua representação por extenso em português brasileiro
// Ex: 1523.45 → "um mil, quinhentos e vinte e três reais e quarenta e cinco centavos"

const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const especiais = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];
const dezenas = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
];
const centenas = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function grupoParaExtenso(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const c = Math.floor(n / 100);
  const resto = n % 100;
  const d = Math.floor(resto / 10);
  const u = resto % 10;

  const partes: string[] = [];

  if (c > 0) partes.push(centenas[c]);

  if (resto >= 10 && resto <= 19) {
    partes.push(especiais[resto - 10]);
  } else {
    if (d > 0) partes.push(dezenas[d]);
    if (u > 0) partes.push(unidades[u]);
  }

  return partes.join(' e ');
}

export function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';

  const abs = Math.abs(valor);
  const inteiro = Math.floor(abs);
  const centavos = Math.round((abs - inteiro) * 100);

  const grupos: { valor: number; singular: string; plural: string }[] = [
    { valor: 0, singular: '', plural: '' }, // unidades
    { valor: 0, singular: 'mil', plural: 'mil' }, // milhares
    { valor: 0, singular: 'milhão', plural: 'milhões' }, // milhões
    { valor: 0, singular: 'bilhão', plural: 'bilhões' }, // bilhões
  ];

  let temp = inteiro;
  for (let i = 0; i < grupos.length && temp > 0; i++) {
    grupos[i].valor = temp % 1000;
    temp = Math.floor(temp / 1000);
  }

  const partesInteiro: string[] = [];
  for (let i = grupos.length - 1; i >= 0; i--) {
    const g = grupos[i];
    if (g.valor === 0) continue;

    let texto = grupoParaExtenso(g.valor);
    if (i > 0) {
      texto += ' ' + (g.valor === 1 ? g.singular : g.plural);
    }
    partesInteiro.push(texto);
  }

  let resultado = '';

  if (partesInteiro.length > 0) {
    if (partesInteiro.length === 1) {
      resultado = partesInteiro[0];
    } else {
      const ultimo = partesInteiro.pop()!;
      resultado = partesInteiro.join(', ') + ' e ' + ultimo;
    }
    resultado += inteiro === 1 ? ' real' : ' reais';
  }

  if (centavos > 0) {
    const textoC = grupoParaExtenso(centavos);
    if (resultado) resultado += ' e ';
    resultado += textoC + (centavos === 1 ? ' centavo' : ' centavos');
  }

  return resultado;
}
