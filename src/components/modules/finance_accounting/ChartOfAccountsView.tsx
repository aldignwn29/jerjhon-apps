import React, { useState } from 'react';
import { Landmark, Plus, Search, Filter, ShieldCheck, DollarSign } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { ChartOfAccount, AccountCategory } from '../../../types';

export const ChartOfAccountsView: React.FC = () => {
  const { coaList, addAccount, formatIDR, isStaff } = useERP();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const [formData, setFormData] = useState<ChartOfAccount>({
    code: '6105',
    name: 'Beban Pemasaran & Digital Ads',
    category: 'Expense',
    subCategory: 'Beban Operasional',
    balance: 0,
    isHeader: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAccount(formData);
    setShowAddModal(false);
  };

  const filteredAccounts = (coaList || []).filter(acc => {
    const matchesSearch = acc.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          acc.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || acc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Asset', 'Liability', 'Equity', 'Revenue', 'COGS', 'Expense'];

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Chart of Accounts (COA)" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#b90f0f]" />
            Chart of Accounts (COA Kode Akun Standar PSAK)
          </h2>
          <p className="text-xs text-slate-500">
            Struktur Kode Akun Akuntansi Enterprise: Aset, Kewajiban, Ekuitas, Pendapatan, HPP, & Beban
          </p>
        </div>

        {!isStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Buat Akun Baru
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode akun atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#b90f0f]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoryFilter === cat ? 'bg-[#b90f0f] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* COA Table */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-x-auto">
        <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/60 border-b text-slate-600 dark:text-slate-300 font-bold">
              <th className="p-3">Kode Akun</th>
              <th className="p-3">Nama Akun & Sub-Kategori</th>
              <th className="p-3">Kategori</th>
              <th className="p-3 text-right">Saldo Terkini (Balance)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredAccounts.map((acc) => (
              <tr key={acc.code} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                acc.isHeader ? 'bg-slate-100/80 dark:bg-slate-700/80 font-black text-slate-900 dark:text-white' : ''
              }`}>
                <td className="p-3 font-mono font-bold text-[#b90f0f]">{acc.code}</td>
                <td className="p-3">
                  <span className={`block ${acc.isHeader ? 'text-sm font-black' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>
                    {acc.name}
                  </span>
                  {!acc.isHeader && <span className="text-[10px] text-slate-400 font-medium">{acc.subCategory}</span>}
                </td>
                <td className="p-3 font-semibold text-slate-500">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-[11px]">
                    {acc.category}
                  </span>
                </td>
                <td className="p-3 text-right font-extrabold font-mono text-slate-900 dark:text-white">
                  {acc.isHeader ? '--' : formatIDR(acc.balance)}
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                  Tidak ditemukan akun yang sesuai dengan filter pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              Formulir Kode Akun (COA Baru)
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Kode Akun (4 Digit)</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Nama Akun</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Kategori Akun</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AccountCategory })}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="Asset">Asset (Aset)</option>
                    <option value="Liability">Liability (Kewajiban)</option>
                    <option value="Equity">Equity (Modal)</option>
                    <option value="Revenue">Revenue (Pendapatan)</option>
                    <option value="COGS">COGS (HPP)</option>
                    <option value="Expense">Expense (Beban)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Sub Kategori</label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b90f0f] text-white font-bold rounded-xl"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
