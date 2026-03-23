import React, { useEffect, useState } from 'react';
import { SavedTable } from '../types';
import { getSavedTables } from '../services/supabaseService';
import { Clock, FolderOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedTablesProps {
  userId: string;
  onSelectTable: (tableId: string) => void;
}

export function SavedTables({ userId, onSelectTable }: SavedTablesProps) {
  const [tables, setTables] = useState<SavedTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSavedTables(userId);
        setTables(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return <div className="text-neutral-500 text-sm">Carregando tabelas salvas...</div>;
  }

  if (tables.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center flex flex-col items-center">
        <FolderOpen className="w-10 h-10 text-neutral-300 mb-3" />
        <h3 className="text-neutral-900 font-medium">Nenhum histórico</h3>
        <p className="text-neutral-500 text-sm mt-1">Você ainda não salvou nenhuma tabela de correção.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <ul className="divide-y divide-neutral-200">
        {tables.map(table => (
          <li key={table.id} className="p-4 hover:bg-neutral-50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-900">{table.name}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Salva em {format(parseISO(table.created_at), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectTable(table.id)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Abrir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
