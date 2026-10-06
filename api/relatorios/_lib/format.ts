// Regras de formatação de texto vindas da spec (Apêndice A.2 — Notas de tradução):
// AGNORIGINALNOME -> agente (title case), MOVHISTORICO -> historico (sentence case).

export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/(^|\s)([a-zà-úãõâêîôûáéíóúç])/gi, (m) => m.toUpperCase());
}

export function sentenceCase(text: string): string {
  const lower = text.toLowerCase().trim();
  if (!lower) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
