import React from 'react';
import { AlertTriangle, Plus, Eye, CheckCircle2 } from 'lucide-react';
import { ProductItem } from '../../../../types';

interface LowStockAlertViewProps {
  lowStockProducts: ProductItem[];
  handleOpenAdjustStockModal: (product: ProductItem) => void;
  handleOpenDetailModal: (product: ProductItem) => void;
}

export const LowStockAlertView = React.memo<LowStockAlertViewProps>(({
  lowStockProducts,
  handleOpenAdjustStockModal,
  handleOpenDetailModal,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">Radar Alert Stok Kritis & Re-Order Point</h3>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Daftar seluruh SKU produk dengan kuantitas stok sama dengan atau di bawah angka batas aman (Safety Stock). Segera lakukan pembuatan Purchase Order (PO) ke Supplier.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lowStockProducts.length > 0 ? (
          lowStockProducts.map((p, idx) => (
            <div key={`${p.id}-${p.sku || ''}-${idx}`} className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-5 rounded-3xl shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-bold">
                    {p.sku}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{p.name}</h4>
                  <p className="text-xs text-slate-500">{p.category} • {p.warehouse}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                  p.stockQuantity <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {p.stockQuantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Sisa Stok Saat Ini</span>
                  <span className="font-black text-rose-600 text-sm">{p.stockQuantity} {p.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Batas Safety Stock</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{p.safetyStock} {p.unit}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleOpenAdjustStockModal(p)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Restok +50 Pcs
                </button>
                <button
                  onClick={() => handleOpenDetailModal(p)}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 rounded-xl text-xs"
                  title="Lihat Detail SKU"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Semua Stok Produk Aman!</p>
            <p className="text-xs text-slate-400">Tidak ada produk yang saat ini berada di bawah batas safety stock.</p>
          </div>
        )}
      </div>
    </div>
  );
});
