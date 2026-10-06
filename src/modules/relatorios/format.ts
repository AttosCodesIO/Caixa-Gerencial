// Formatação de valores (spec Seção 5.4).

export function brl(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function axisCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (abs >= 1_000) {
    return `${(n / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
  }
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}
