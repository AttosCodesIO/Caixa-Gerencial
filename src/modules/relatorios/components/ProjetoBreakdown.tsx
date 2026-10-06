import { CategoriaAgregada } from '../types';
import { PALETA_CATEGORIAS, larguraBarra } from '../derive';
import { brl } from '../format';

interface Props {
  categorias: CategoriaAgregada[];
}

// Breakdown por Projeto (spec 3.5) — cor posicional (P5), barra proporcional
// com piso de 3% de largura, ordenado por valor desc.
export default function ProjetoBreakdown({ categorias }: Props) {
  const maior = categorias[0]?.valorTotal ?? 1;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 rel-chart-card rel-projeto-print-card">
      <h3 className="font-bold text-neutral-900 mb-4">Projeto</h3>
      {categorias.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhuma categoria no período.</p>
      ) : (
        <div className="rel-categoria-lista space-y-3">
          {categorias.map((c) => (
            <div key={c.categoria} className="rel-categoria-linha flex items-center gap-3">
              <span
                className="rel-categoria-dot w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: PALETA_CATEGORIAS[c.corIndice] }}
              />
              <span
                className="rel-categoria-nome text-sm text-neutral-700 w-40 md:w-56 truncate"
                title={c.categoria}
              >
                {c.categoria}
              </span>
              <div className="rel-categoria-barra flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${larguraBarra(c.valorTotal, maior)}%`,
                    backgroundColor: PALETA_CATEGORIAS[c.corIndice],
                  }}
                />
              </div>
              <span className="rel-categoria-valor text-sm font-medium text-neutral-900 whitespace-nowrap w-28 text-right">
                {brl(c.valorTotal)}
              </span>
              <span className="rel-categoria-pct text-xs text-neutral-500 w-12 text-right">
                {c.percentualDoTotal.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
