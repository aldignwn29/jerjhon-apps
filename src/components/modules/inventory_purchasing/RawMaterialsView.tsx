import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Trash2, 
  ClipboardList, 
  DollarSign, 
  Grid, 
  X, 
  Save, 
  Check, 
  FileText
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RawMaterialItem, ProductRawMaterialGroup } from '../../../types';
import { InventoryToast, ToastMessage } from './products/InventoryToast';

export const RawMaterialsView: React.FC = () => {
  const { 
    rawMaterialGroups, 
    addRawMaterialGroup, 
    updateRawMaterialGroup, 
    deleteRawMaterialGroup, 
    deleteRawMaterialItem,
    products,
    formatIDR 
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'group' | 'item', groupId: string, itemId?: string, name: string } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    'RMG-101': true,
    'RMG-102': true,
    'RMG-103': false,
    'RMG-104': false
  });

  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Modal State for Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  
  const [productName, setProductName] = useState('');
  const [productVariant, setProductVariant] = useState('');
  const [materialsForm, setMaterialsForm] = useState<Omit<RawMaterialItem, 'id'>[]>([
    { name: '', penggunaan: 1.0, satuan: 'Meter', biayaSatuan: 25000 }
  ]);

  const toggleAccordion = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const calculateMaterialCost = (m: { penggunaan: number; biayaSatuan: number; satuan: string }) => {
    const unitLower = (m.satuan || '').toLowerCase().trim();
    const isNoMultiply = ['kilogram', 'kg', 'meter', 'liter', 'litter', 'yard', 'roll', 'set', 'gram', 'pcs'].includes(unitLower);
    return isNoMultiply ? (m.biayaSatuan || 0) : ((m.penggunaan || 0) * (m.biayaSatuan || 0));
  };

  const calculateGroupTotal = (materials: RawMaterialItem[]) => {
    return materials.reduce((acc, curr) => acc + calculateMaterialCost(curr), 0);
  };

  const totalAllMaterialsCount = rawMaterialGroups.reduce((acc, g) => acc + g.materials.length, 0);
  const totalAllComponentCost = rawMaterialGroups.reduce((acc, g) => acc + calculateGroupTotal(g.materials), 0);
  const avgCost = totalAllMaterialsCount > 0 ? totalAllComponentCost / totalAllMaterialsCount : 0;

  const handleOpenAddModal = () => {
    setEditingGroupId(null);
    setProductName('');
    setProductVariant('');
    setMaterialsForm([
      { name: '', penggunaan: 0.018, satuan: 'Meter', biayaSatuan: 25000 }
    ]);
    setShowModal(true);
  };

  const handleOpenEditModal = (group: ProductRawMaterialGroup) => {
    setEditingGroupId(group.id);
    
    let baseName = group.productName;
    let variant = '';
    
    const isVelora = group.productName.toLowerCase().includes('velora') || group.productName.toLowerCase().includes('flexa');
    if (isVelora) {
       const parts = group.productName.split(' - ');
       if (parts.length > 1) {
         baseName = parts[0];
         variant = parts[1];
       } else {
         const matchingProduct = (products || []).find(p => group.productName.toUpperCase().startsWith(p.name.toUpperCase()));
         if (matchingProduct && group.productName.toUpperCase() !== matchingProduct.name.toUpperCase()) {
            baseName = matchingProduct.name.toUpperCase();
            variant = group.productName.substring(matchingProduct.name.length).replace(/^ - /, '').trim();
         }
       }
    }
    
    setProductName(baseName);
    setProductVariant(variant);
    
    setMaterialsForm(
      group.materials.map(m => ({
        name: m.name,
        penggunaan: m.penggunaan,
        satuan: m.satuan,
        biayaSatuan: m.biayaSatuan
      }))
    );
    setShowModal(true);
  };

  const handleAddMaterialRow = () => {
    setMaterialsForm(prev => [
      ...prev,
      { name: '', penggunaan: 1.0, satuan: 'Kilogram', biayaSatuan: 10000 }
    ]);
  };

  const handleRemoveMaterialRow = (index: number) => {
    if (materialsForm.length <= 1) {
      setToast({
        type: 'warning',
        title: 'Batas Minimal Bahan Baku',
        message: 'Setidaknya harus ada 1 item bahan baku dalam resep BOM.'
      });
      return;
    }
    setMaterialsForm(prev => prev.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    setMaterialsForm(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setToast({
        type: 'error',
        title: 'Nama Produk Kosong',
        message: 'Silakan isi nama produk resep BOM.'
      });
      return;
    }

    const validMaterials = materialsForm.filter(m => m.name.trim() !== '');
    if (validMaterials.length === 0) {
      setToast({
        type: 'error',
        title: 'Bahan Baku Belum Diisi',
        message: 'Silakan isi setidaknya 1 nama bahan baku dalam resep.'
      });
      return;
    }

    const formattedMaterials: RawMaterialItem[] = validMaterials.map((m, idx) => ({
      id: `MAT-${Date.now().toString().slice(-4)}-${idx + 1}`,
      name: m.name.toUpperCase(),
      penggunaan: Number(m.penggunaan) || 0,
      satuan: m.satuan,
      biayaSatuan: Number(m.biayaSatuan) || 0
    }));

    let finalProductName = productName;
    if (productName.toLowerCase().includes('velora') || productName.toLowerCase().includes('flexa')) {
       if (productVariant) {
          finalProductName = `${productName} - ${productVariant}`;
       }
    }

    if (editingGroupId) {
      updateRawMaterialGroup(editingGroupId, {
        productName: finalProductName.toUpperCase(),
        materials: formattedMaterials
      });
    } else {
      addRawMaterialGroup({
        productName: finalProductName.toUpperCase(),
        materials: formattedMaterials
      });
    }

    setShowModal(false);
  };

  const filteredGroups = rawMaterialGroups.filter(g => 
    g.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.materials.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectAllInGroup = (group: ProductRawMaterialGroup, checked: boolean) => {
    const updated = { ...selectedItems };
    group.materials.forEach(m => {
      updated[`${group.id}-${m.id}`] = checked;
    });
    setSelectedItems(updated);
  };

  const handleSelectItem = (groupId: string, itemId: string, checked: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [`${groupId}-${itemId}`]: checked
    }));
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xl shrink-0 mt-0.5">
            📦
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Manajemen Bahan Baku
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola data bahan baku untuk setiap produk
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-[#00a96e] hover:bg-[#00925f] active:bg-[#007a4f] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Tambah Bahan Baku
        </button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Produk */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-blue-500 flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{rawMaterialGroups.length}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Produk</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
            📦
          </div>
        </div>

        {/* Card 2: Total Bahan Baku */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-cyan-500 flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalAllMaterialsCount}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Bahan Baku</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-lg">
            📋
          </div>
        </div>

        {/* Card 3: Rata-rata Biaya */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-blue-600 flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatIDR(Math.round(avgCost))}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Rata-rata Biaya</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg">
            💰
          </div>
        </div>

        {/* Card 4: Total Biaya Komponen */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-orange-500 flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatIDR(totalAllComponentCost)}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Biaya Komponen</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center text-lg">
            🍱
          </div>
        </div>

      </div>

      {/* Section Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📋</span> Data Bahan Baku per Produk
        </h2>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-[#00a96e] shadow-2xs"
          />
        </div>
      </div>

      {/* Product Groups List */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
            Tidak ada data bahan baku ditemukan.
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroups[group.id] ?? false;
            const groupTotalCost = calculateGroupTotal(group.materials);
            const allSelected = group.materials.length > 0 && group.materials.every(m => selectedItems[`${group.id}-${m.id}`]);

            return (
              <div 
                key={group.id} 
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 bg-slate-50/50 dark:bg-slate-800/80 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => toggleAccordion(group.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <button className="text-slate-500 dark:text-slate-400 p-0.5 rounded-sm">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      )}
                    </button>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        {group.productName}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {group.materials.length} jenis bahan
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-6 sm:ml-0" onClick={(e) => e.stopPropagation()}>
                    <span className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60 rounded-full text-xs font-bold">
                      Total Biaya Bahan: {formatIDR(Math.round(groupTotalCost))}
                    </span>

                    <button
                      onClick={() => handleOpenEditModal(group)}
                      className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ type: 'group', groupId: group.id, name: group.productName });
                      }}
                      className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="p-4 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-3 bg-white dark:bg-slate-800">
                    
                    {/* Select All Action Bar */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 py-1">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAllInGroup(group, e.target.checked)}
                        className="w-4 h-4 text-[#00a96e] rounded border-slate-300 focus:ring-[#00a96e]"
                      />
                      <span>Pilih Semua</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-2.5 w-8"></th>
                            <th className="p-2.5 w-12 text-center">NO</th>
                            <th className="p-2.5">BAHAN</th>
                            <th className="p-2.5 text-right">PENGGUNAAN</th>
                            <th className="p-2.5 text-center">SATUAN</th>
                            <th className="p-2.5 text-right">BIAYA SATUAN</th>
                            <th className="p-2.5 text-right">TOTAL BIAYA</th>
                            <th className="p-2.5 text-center w-20">AKSI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {group.materials.map((mat, idx) => {
                            const isSelected = selectedItems[`${group.id}-${mat.id}`] ?? false;
                            const itemTotal = calculateMaterialCost(mat);

                            return (
                              <tr key={mat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="p-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleSelectItem(group.id, mat.id, e.target.checked)}
                                    className="w-4 h-4 text-[#00a96e] rounded border-slate-300 focus:ring-[#00a96e]"
                                  />
                                </td>
                                <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                                <td className="p-2.5 font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                  {mat.name}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                                  {mat.penggunaan.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                                </td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium inline-block">
                                    {mat.satuan}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                                  {formatIDR(mat.biayaSatuan)}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {formatIDR(itemTotal)}
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditModal(group)}
                                      title="Edit Bahan"
                                      className="p-1 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setConfirmDelete({ type: 'item', groupId: group.id, itemId: mat.id, name: mat.name });
                                      }}
                                      title="Hapus Bahan"
                                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Tambah / Edit Bahan Baku (Multi) */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00a96e]" />
                {editingGroupId ? 'Edit Bahan Baku (Multi)' : 'Tambah Bahan Baku (Multi)'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-5 text-xs">
              
              {/* Product Name Input */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Pilih Produk dari Katalog <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
                >
                  <option value="">-- Pilih Produk --</option>
                  {Array.from(new Set((products || []).map(p => p.name))).sort().map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pilih produk dari Katalog Produk & Stok. Semua bahan di bawah akan dikelompokkan ke produk ini.
                </p>
              </div>

              {/* Product Variant (Conditional) */}
              {(productName.toLowerCase().includes('velora') || productName.toLowerCase().includes('flexa')) && (
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Pilih Varian (Khusus Rok Velora / Flexa) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={productVariant}
                    onChange={(e) => setProductVariant(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
                  >
                    <option value="">-- Pilih Varian --</option>
                    <option value="2in1 Rok Pendek">2in1 Rok Pendek</option>
                    <option value="2in1 Rok Panjang">2in1 Rok Panjang</option>
                    <option value="3in1 Legging Pendek">3in1 Legging Pendek</option>
                    <option value="3in1 Legging Panjang">3in1 Legging Panjang</option>
                  </select>
                </div>
              )}

              {/* Materials Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    📋 Daftar Bahan Baku
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddMaterialRow}
                    className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>

                {/* Rows Container */}
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {materialsForm.map((mat, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-slate-50/80 dark:bg-slate-700/30 border border-slate-200/80 dark:border-slate-600/60 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 font-bold rounded-md text-[11px]">
                          Bahan #{idx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveMaterialRow(idx)}
                          className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 hover:bg-rose-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Nama Bahan <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Kain Cotton Combed 24s"
                            value={mat.name}
                            onChange={(e) => handleMaterialChange(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Penggunaan <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="0.018"
                            value={mat.penggunaan}
                            onChange={(e) => handleMaterialChange(idx, 'penggunaan', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#00a96e] font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Satuan <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={mat.satuan}
                            onChange={(e) => handleMaterialChange(idx, 'satuan', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
                          >
                            <option value="Meter">Meter</option>
                            <option value="Kilogram">Kilogram</option>
                            <option value="Set">Set</option>
                            <option value="pcs">pcs</option>
                            <option value="Yard">Yard</option>
                            <option value="Roll">Roll</option>
                            <option value="Gram">Gram</option>
                            <option value="Liter">Liter</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Biaya Satuan (Rp)
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="25000"
                            value={mat.biayaSatuan}
                            onChange={(e) => handleMaterialChange(idx, 'biayaSatuan', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#00a96e] font-mono"
                          />
                        </div>
                      </div>

                      {/* Subtotal Row Preview */}
                      {(() => {
                        const unitLower = (mat.satuan || '').toLowerCase().trim();
                        const isNoMultiply = ['kilogram', 'kg', 'meter', 'liter', 'litter', 'yard', 'roll', 'set', 'gram', 'pcs'].includes(unitLower);
                        const itemSub = calculateMaterialCost(mat);
                        return (
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-600/50 text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400">
                              {isNoMultiply ? `${mat.satuan || 'Satuan'} (Biaya Tetap Produksi):` : `Subtotal (${mat.penggunaan || 0} ${mat.satuan || 'Pcs'} × {formatIDR(mat.biayaSatuan || 0)}):`}
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatIDR(itemSub)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>

                {/* Grand Total Preview in Modal */}
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-cyan-900 dark:text-cyan-200">Total Keseluruhan Biaya Bahan:</span>
                  <span className="font-mono font-black text-cyan-700 dark:text-cyan-300 text-sm">
                    {formatIDR(materialsForm.reduce((acc, m) => acc + calculateMaterialCost(m), 0))}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#00a96e] hover:bg-[#00925f] active:bg-[#007a4f] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" /> Simpan Semua
                </button>
              </div>

            </form>

          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Konfirmasi Hapus</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Apakah Anda yakin ingin menghapus <strong>{confirmDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete.type === 'group') {
                      deleteRawMaterialGroup(confirmDelete.groupId);
                    } else if (confirmDelete.type === 'item' && confirmDelete.itemId) {
                      deleteRawMaterialItem(confirmDelete.groupId, confirmDelete.itemId);
                    }
                    setConfirmDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      <InventoryToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
