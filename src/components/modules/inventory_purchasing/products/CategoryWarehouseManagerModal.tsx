import React, { useState } from 'react';
import { Settings, X, Tag, Boxes, Trash2 } from 'lucide-react';
import { ProductItem } from '../../../../types';

interface CategoryWarehouseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCategories: string[];
  availableWarehouses: string[];
  products: ProductItem[];
  addCustomCategory: (cat: string) => void;
  deleteCategory: (cat: string) => void;
  addCustomWarehouse: (wh: string) => void;
  deleteWarehouse: (wh: string) => void;
}

export const CategoryWarehouseManagerModal = React.memo<CategoryWarehouseManagerModalProps>(({
  isOpen,
  onClose,
  availableCategories,
  availableWarehouses,
  products,
  addCustomCategory,
  deleteCategory,
  addCustomWarehouse,
  deleteWarehouse,
}) => {
  const [managerTab, setManagerTab] = useState<'category' | 'warehouse'>('category');
  const [newManagerCatInput, setNewManagerCatInput] = useState('');
  const [newManagerWhInput, setNewManagerWhInput] = useState('');
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);
  const [confirmDeleteWh, setConfirmDeleteWh] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Kelola & Hapus Master Kategori / Gudang
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tambah baru atau hapus kategori & gudang. Menghapus kategori/gudang secara otomatis memindahkan produk terkait ke opsi utama tersisa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 border-b pb-2">
          <button
            type="button"
            onClick={() => setManagerTab('category')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              managerTab === 'category'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Kategori Katalog ({availableCategories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setManagerTab('warehouse')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              managerTab === 'warehouse'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Gudang Penyimpanan ({availableWarehouses.length})</span>
          </button>
        </div>

        {/* TAB CONTENT 1: KATEGORI */}
        {managerTab === 'category' && (
          <div className="space-y-4 text-xs">
            {/* Add new category form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ketik nama kategori baru..."
                value={newManagerCatInput}
                onChange={(e) => setNewManagerCatInput(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (newManagerCatInput.trim()) {
                    addCustomCategory(newManagerCatInput.trim());
                    setNewManagerCatInput('');
                  }
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer"
              >
                + Tambah Kategori
              </button>
            </div>

            {/* List of categories */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {availableCategories.map(cat => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                        <Tag className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                          {cat}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Digunakan oleh <strong className="text-indigo-600 dark:text-indigo-400">{count} SKU Produk</strong>
                        </span>
                      </div>
                    </div>

                    {confirmDeleteCat === cat ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            deleteCategory(cat);
                            setConfirmDeleteCat(null);
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Ya, Hapus!
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCat(null)}
                          className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCat(cat)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        title="Hapus Kategori Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                );
              })}

              {availableCategories.length === 0 && (
                <div className="text-center py-8 text-slate-400 font-medium">
                  Tidak ada kategori tersisa. Silakan tambah kategori baru di atas.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: GUDANG */}
        {managerTab === 'warehouse' && (
          <div className="space-y-4 text-xs">
            {/* Add new warehouse form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ketik nama gudang baru..."
                value={newManagerWhInput}
                onChange={(e) => setNewManagerWhInput(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (newManagerWhInput.trim()) {
                    addCustomWarehouse(newManagerWhInput.trim());
                    setNewManagerWhInput('');
                  }
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer"
              >
                + Tambah Gudang
              </button>
            </div>

            {/* List of warehouses */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {availableWarehouses.map(wh => {
                const count = products.filter(p => p.warehouse === wh).length;
                return (
                  <div
                    key={wh}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                        <Boxes className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                          {wh}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Digunakan oleh <strong className="text-indigo-600 dark:text-indigo-400">{count} SKU Produk</strong>
                        </span>
                      </div>
                    </div>

                    {confirmDeleteWh === wh ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            deleteWarehouse(wh);
                            setConfirmDeleteWh(null);
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Ya, Hapus!
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteWh(null)}
                          className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteWh(wh)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        title="Hapus Gudang Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                );
              })}

              {availableWarehouses.length === 0 && (
                <div className="text-center py-8 text-slate-400 font-medium">
                  Tidak ada gudang tersisa. Silakan tambah gudang baru di atas.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
});
