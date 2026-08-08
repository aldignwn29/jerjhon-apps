import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { ProductItem } from '../../../../types';

interface AdjustStockModalProps {
  isOpen: boolean;
  selectedProduct: ProductItem | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  stockAdjustment: {
    type: 'Inbound' | 'Outbound' | 'Set';
    quantity: number;
    notes: string;
  };
  setStockAdjustment: React.Dispatch<React.SetStateAction<{
    type: 'Inbound' | 'Outbound' | 'Set';
    quantity: number;
    notes: string;
  }>>;
}

export const AdjustStockModal = React.memo<AdjustStockModalProps>(({
  isOpen,
  selectedProduct,
  onClose,
  onSubmit,
  stockAdjustment,
  setStockAdjustment,
}) => {
  if (!isOpen || !selectedProduct) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-600" />
            Form Koreksi / Restok Stok Produk
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs space-y-1">
          <span className="font-bold text-slate-900 dark:text-white block">{selectedProduct.name}</span>
          <div className="flex items-center justify-between text-slate-500 font-mono">
            <span>SKU: {selectedProduct.sku}</span>
            <span>Stok Sekarang: <strong className="text-slate-900 dark:text-white">{selectedProduct.stockQuantity} {selectedProduct.unit}</strong></span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Aksi Perubahan</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'Inbound' })}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  stockAdjustment.type === 'Inbound'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                + Masuk (In)
              </button>
              <button
                type="button"
                onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'Outbound' })}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  stockAdjustment.type === 'Outbound'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                - Keluar (Out)
              </button>
              <button
                type="button"
                onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'Set' })}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  stockAdjustment.type === 'Set'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Setel Ulang
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Kuantitas Qty (Pcs)</label>
            <input
              type="number"
              required
              min="1"
              value={stockAdjustment.quantity}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-base font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Catatan / Alasan Koreksi</label>
            <textarea
              rows={2}
              value={stockAdjustment.notes}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
              placeholder="Misal: Penerimaan PO Supplier, Retur Pelanggan, Barang Rusak..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
            >
              Simpan Koreksi Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
