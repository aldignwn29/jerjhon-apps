import React, { useState } from 'react';
import { FileText, Plus, Search, CheckCircle2, DollarSign, ShieldAlert } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';

export const JournalEntriesView: React.FC = () => {
  const { journals, coaList, addJournalEntry, formatIDR, currentUser, isStaff } = useERP();
  if (!currentUser) return null;
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('All');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    description: 'Pembayaran Biaya Iklan TikTok Ads Campaign',
    debitAccountCode: '6102',
    creditAccountCode: '1102',
    amount: 15000000,
    moduleSource: 'Manual Adjustment' as any
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      alert("Nominal transaksi harus lebih besar dari 0!");
      return;
    }
    const debitAcc = coaList.find(a => a.code === formData.debitAccountCode);
    const creditAcc = coaList.find(a => a.code === formData.creditAccountCode);

    addJournalEntry({
      date: formData.date,
      description: formData.description,
      debitAccountCode: formData.debitAccountCode,
      debitAccountName: debitAcc ? debitAcc.name : 'Debit Account',
      creditAccountCode: formData.creditAccountCode,
      creditAccountName: creditAcc ? creditAcc.name : 'Credit Account',
      amount: formData.amount,
      createdByName: currentUser.name,
      moduleSource: formData.moduleSource
    });

    setShowAddModal(false);
  };

  const filteredJournals = (journals || []).filter(j => {
    const matchesSearch = j.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.debitAccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.creditAccountName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'All' || j.moduleSource === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const sources = ['All', 'Sales Marketplace', 'Purchase', 'Payroll', 'Manual Adjustment', 'Asset Depreciation'];

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Jurnal Umum & Buku Besar" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#b90f0f]" />
            Jurnal Umum & Double-Entry General Ledger
          </h2>
          <p className="text-xs text-slate-500">
            {isStaff ? 'Riwayat jurnal umum transaksi operasional.' : 'Pencatatan Otomatis & Manual transaksi Keuangan (Debit = Kredit Balancing)'}
          </p>
        </div>

        {!isStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Input Jurnal Voucher Manual
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor voucher, deskripsi, akun..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#b90f0f]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {sources.map(src => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                sourceFilter === src ? 'bg-[#b90f0f] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-x-auto">
        <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/60 border-b text-slate-600 dark:text-slate-300 font-bold">
              <th className="p-3">Voucher # & Tanggal</th>
              <th className="p-3">Deskripsi Transaksi</th>
              <th className="p-3">Akun Debit (+)</th>
              <th className="p-3">Akun Kredit (-)</th>
              <th className="p-3 text-right">Nominal (Rp)</th>
              <th className="p-3">Modul Sumber</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredJournals.map((j) => (
              <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="p-3 font-mono">
                  <span className="font-bold text-[#b90f0f] block">{j.voucherNo}</span>
                  <span className="text-[10px] text-slate-400">{j.date}</span>
                </td>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{j.description}</td>
                <td className="p-3">
                  <span className="font-mono text-[#b90f0f] font-bold">[{j.debitAccountCode}]</span> {j.debitAccountName}
                </td>
                <td className="p-3">
                  <span className="font-mono text-emerald-600 font-bold">[{j.creditAccountCode}]</span> {j.creditAccountName}
                </td>
                <td className="p-3 text-right font-black font-mono text-slate-900 dark:text-white">
                  {formatIDR(j.amount)}
                </td>
                <td className="p-3">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 font-bold rounded-lg text-[10px]">
                    {j.moduleSource}
                  </span>
                </td>
              </tr>
            ))}
            {filteredJournals.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                  Tidak ditemukan jurnal umum yang sesuai dengan filter pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Journal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              Input Jurnal Umum Manual (Double Entry)
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Keterangan / Memo Transaksi</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Akun Debit (+)</label>
                <select
                  value={formData.debitAccountCode}
                  onChange={(e) => setFormData({ ...formData, debitAccountCode: e.target.value })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                >
                  {(coaList || []).map(a => <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.category})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Akun Kredit (-)</label>
                <select
                  value={formData.creditAccountCode}
                  onChange={(e) => setFormData({ ...formData, creditAccountCode: e.target.value })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                >
                  {(coaList || []).map(a => <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.category})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nominal (Rp) - Debit & Kredit Seimbang</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold text-[#b90f0f]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Modul Sumber</label>
                <select
                  value={formData.moduleSource}
                  onChange={(e) => setFormData({ ...formData, moduleSource: e.target.value as any })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-semibold"
                >
                  <option value="Manual Adjustment">Manual Adjustment (Jurnal Penyesuaian)</option>
                  <option value="Sales Marketplace">Sales Marketplace</option>
                  <option value="Purchase">Purchase (Pembelian)</option>
                  <option value="Payroll">Payroll (Penggajian)</option>
                  <option value="Asset Depreciation">Asset Depreciation</option>
                </select>
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
                  Post Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
