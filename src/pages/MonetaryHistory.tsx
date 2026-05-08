import React from 'react';
import { SavedTables } from '../components/SavedTables';
import { useAuth } from '../lib/AuthContext';

export default function MonetaryHistory() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Histórico de Cálculos</h1>
        <p className="text-neutral-500 mt-1">
          Gerencie suas tabelas salvas de correção monetária. O detalhamento preserva todas as
          regras de indexação calculadas originalmente.
        </p>
      </div>

      {user ? (
        <SavedTables userId={user.id} />
      ) : (
        <div className="text-neutral-500">Usuário não autenticado. Faça login para acessar.</div>
      )}
    </div>
  );
}
