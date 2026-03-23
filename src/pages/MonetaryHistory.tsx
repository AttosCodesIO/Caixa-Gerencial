import React from 'react';
import { SavedTables } from '../components/SavedTables';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MonetaryHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelectTable = (tableId: string) => {
    alert(`Tabela ${tableId} selecionada. Retornando ao painel de cálculos...`);
    // Pass table id sequentially, or just simple navigate
    navigate('/monetary-correction');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Histórico de Cálculos</h1>
        <p className="text-neutral-500 mt-1">Gerencie suas tabelas salvas de correção monetária.</p>
      </div>
      
      {user ? (
        <SavedTables userId={user.id} onSelectTable={handleSelectTable} />
      ) : (
        <div className="text-neutral-500">Usuário não autenticado.</div>
      )}
    </div>
  );
}
