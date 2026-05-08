import { useState, useEffect, FormEvent } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { getPayees, createPayee, updatePayee, deletePayee } from '../lib/api';
import { Payee } from '../types';

const applyDocumentMask = (value: string, type: string) => {
  const digits = value.replace(/\D/g, '');
  if (type === 'PF') {
    return digits
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return digits
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

export default function Payees() {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'PF',
    document: '',
    cargo: '',
    endereco: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setPayees(await getPayees());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updatePayee(editingId, formData);
    } else {
      await createPayee(formData);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', type: 'PF', document: '', cargo: '', endereco: '' });
    fetchData();
  };

  const handleEdit = (payee: Payee) => {
    setFormData({
      name: payee.name,
      type: payee.type,
      document: applyDocumentMask(payee.document || '', payee.type),
      cargo: payee.cargo || '',
      endereco: payee.endereco || '',
    });
    setEditingId(payee.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este favorecido?')) {
      try {
        await deletePayee(id);
        fetchData();
      } catch {
        alert('Não é possível excluir um favorecido que possui lançamentos vinculados.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Favorecidos</h1>
          <p className="text-neutral-500">
            Gerencie as pessoas e empresas que interagem com o caixa
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', type: 'PF', document: '', cargo: '', endereco: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Favorecido</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-sm">
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium">Tipo</th>
                <th className="p-4 font-medium">CPF/CNPJ</th>
                <th className="p-4 font-medium">Cargo</th>
                <th className="p-4 font-medium w-24 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">
                    Nenhum favorecido cadastrado.
                  </td>
                </tr>
              ) : (
                payees.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="p-4 text-neutral-900 font-medium">{p.name}</td>
                    <td className="p-4 text-neutral-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                        {p.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-600 font-mono text-sm">{applyDocumentMask(p.document || '', p.type || 'PF') || '-'}</td>
                    <td className="p-4 text-neutral-600">{p.cargo || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingId ? 'Editar Favorecido' : 'Novo Favorecido'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                  placeholder="Nome completo ou Razão Social"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'PF' | 'PJ';
                      setFormData({
                        ...formData,
                        type: newType,
                        document: applyDocumentMask(formData.document, newType)
                      });
                    }}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: applyDocumentMask(e.target.value, formData.type) })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                    placeholder={formData.type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                  placeholder="Ex: Auxiliar Administrativo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                  placeholder="Rua, nº, Bairro, Cidade - UF"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
