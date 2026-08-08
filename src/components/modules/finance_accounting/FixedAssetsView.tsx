import React, { useState } from 'react';
import { Layers, Plus, TrendingDown, DollarSign, Calculator, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';

export const FixedAssetsView: React.FC = () => {
  const { fixedAssets, addFixedAsset, addJournalEntry, formatIDR, isStaff } = useERP();
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    code: 'AST-MCH-003',
    assetName: 'Mesin Mixing Otomatis Batch #2',
    purchaseDate: new Date().toISOString().substring(0, 10),
    acquisitionCost: 175000000,
    usefulLifeYears: 5,
    location: 'Pabrik Bandung Utama'
  });

  const totalAcquisition = (fixedAssets || []).reduce((s, a) => s + (a.acquisitionCost || a.purchasePrice || 0), 0);
  const totalDepreciation = (fixedAssets || []).reduce((s, a) => s + (a.accumulatedDepreciation || 0), 0);
  const totalBookValue = (fixedAssets || []).reduce((s, a) => s + (a.bookValue || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFixedAsset({
      code: formData.code,
      assetName: formData.assetName,
      purchaseDate: formData.purchaseDate,
      acquisitionCost: formData.acquisitionCost,
      usefulLifeYears: formData.usefulLifeYears,
      accumulatedDepreciation: 0,
      bookValue: formData.acquisitionCost,
      location: formData.location
    });
    setShowAddModal(false);
  };

  const handleRunDepreciation = () => {
    const monthlyDep = Math.round(totalAcquisition / (5 * 12));
    addJournalEntry({
      date: new Date().toISOString().substring(0, 10),
      description: 'Pencatatan Depresiasi Aset Tetap Bulanan (Metode Garis Lurus)',
      debitAccountCode: '6103',
      debitAccountName: 'Beban Penyusutan Aset Tetap',
      creditAccountCode: '1302',
      creditAccountName: 'Akumulasi Penyusutan Aset Tetap',
      amount: monthlyDep || 12500000,
      createdByName: 'Finance Manager System',
      moduleSource: 'Asset Depreciation'
    });
    alert(`Berhasil menghitung dan memposting jurnal depresiasi bulanan sebesar ${formatIDR(monthlyDep || 12500000)} ke buku besar.`);
  };

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Manajemen Aset Tetap & Depresiasi" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#b90f0f]" />
            Aset Tetap & Depresiasi Otomatis (Fixed Asset Management)
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan Aset Perusahaan, Masa Manfaat (Garis Lurus), Nilai Buku, & Jurnal Penyusutan Otomatis
          </p>
        </div>

        {!isStaff && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunDepreciation}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Calculator className="w-4 h-4 text-emerald-600" /> Proses Penyusutan Bulan Ini
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah Aset Tetap
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Harga Perolehan</p>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{formatIDR(totalAcquisition)}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-1">{(fixedAssets || []).length} Unit Aset Terdaftar</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Akumulasi Depresiasi</p>
          <p className="text-xl font-black text-rose-600 font-mono mt-1">-{formatIDR(totalDepreciation)}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Penyusutan kumulatif SAK</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Nilai Buku (Book Value)</p>
          <p className="text-xl font-black text-emerald-600 font-mono mt-1">{formatIDR(totalBookValue)}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Valuasi bersih neraca</p>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-x-auto">
        <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/60 border-b text-slate-600 dark:text-slate-300 font-bold">
              <th className="p-3">Kode Aset</th>
              <th className="p-3">Nama Aset Perusahaan</th>
              <th className="p-3">Lokasi / Cabang</th>
              <th className="p-3">Tanggal Beli</th>
              <th className="p-3">Harga Perolehan</th>
              <th className="p-3">Masa Manfaat</th>
              <th className="p-3">Akumulasi Depresiasi</th>
              <th className="p-3 text-right">Nilai Buku (Book Value)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {(fixedAssets || []).map((asset) => {
              const name = asset.assetName || (asset as any).name || 'Aset Perusahaan';
              const cost = asset.acquisitionCost || (asset as any).purchasePrice || 0;
              return (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-3 font-mono font-bold text-[#b90f0f]">{asset.code}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{name}</td>
                  <td className="p-3 text-slate-500">{asset.location || 'Kantor Pusat'}</td>
                  <td className="p-3 font-mono text-slate-500">{asset.purchaseDate}</td>
                  <td className="p-3 font-mono font-bold">{formatIDR(cost)}</td>
                  <td className="p-3 font-mono text-slate-500">{asset.usefulLifeYears} Tahun</td>
                  <td className="p-3 font-mono text-rose-600">-{formatIDR(asset.accumulatedDepreciation)}</td>
                  <td className="p-3 text-right font-black text-emerald-600 text-sm font-mono">
                    {formatIDR(asset.bookValue || (cost - asset.accumulatedDepreciation))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Fixed Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              Formulir Pendaftaran Aset Tetap Baru
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Kode Aset</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Nama Aset / Mesin / Kendaraan</label>
                <input
                  type="text"
                  required
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Tanggal Perolehan</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Masa Manfaat (Tahun)</label>
                  <input
                    type="number"
                    value={formData.usefulLifeYears}
                    onChange={(e) => setFormData({ ...formData, usefulLifeYears: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Harga Perolehan (Rp)</label>
                <input
                  type="number"
                  value={formData.acquisitionCost}
                  onChange={(e) => setFormData({ ...formData, acquisitionCost: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold text-[#b90f0f]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Lokasi Penempatan</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                />
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
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
