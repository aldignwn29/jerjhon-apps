import React from 'react';
import { Package, X, Barcode, Copy, Check, Printer } from 'lucide-react';
import { ProductItem } from '../../../../types';

interface ProductDetailModalProps {
  isOpen: boolean;
  selectedProduct: ProductItem | null;
  onClose: () => void;
  formatIDR: (amount: number) => string;
  getProductCombos: (productId: string) => Array<{
    key: string;
    label: string;
    vSku: string;
    price: number;
    stock: number;
  }>;
  copiedSku: boolean;
  onCopySku: (sku: string) => void;
}

export const ProductDetailModal = React.memo<ProductDetailModalProps>(({
  isOpen,
  selectedProduct,
  onClose,
  formatIDR,
  getProductCombos,
  copiedSku,
  onCopySku,
}) => {
  if (!isOpen || !selectedProduct) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#b90f0f] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{selectedProduct.name}</h3>
              <p className="text-xs text-slate-400 font-mono">SKU: {selectedProduct.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financials & Stock Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Harga HPP</span>
            <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{formatIDR(selectedProduct.unitCostPrice)}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Harga Jual</span>
            <span className="font-mono font-black text-emerald-600 text-sm">{formatIDR(selectedProduct.sellingPrice)}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Stok Total</span>
            <span className="font-mono font-black text-blue-600 text-sm">{selectedProduct.stockQuantity} {selectedProduct.unit}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Nilai Aset Stok</span>
            <span className="font-mono font-black text-purple-600 text-xs">{formatIDR(selectedProduct.stockQuantity * selectedProduct.unitCostPrice)}</span>
          </div>
        </div>

        {/* Barcode & QR Simulation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-indigo-500" /> Auto Barcode & Code-128
            </span>
            <div className="bg-white p-3 rounded-xl border border-slate-300 inline-block">
              <div className="font-mono tracking-[4px] text-lg font-extrabold text-black select-all">
                ||| | |||| || | ||||| | ||
              </div>
              <div className="font-mono text-[10px] text-center font-bold text-slate-700 mt-0.5">
                *{selectedProduct.sku}*
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onCopySku(selectedProduct.sku)}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {copiedSku ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSku ? 'Tersalin!' : 'Salin SKU'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Label Barcode</span>
            </button>
          </div>
        </div>

        {/* Variant List Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Rincian Kombinasi Varian Produk</h4>
          <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                <tr>
                  <th className="p-2.5">Varian</th>
                  <th className="p-2.5">Kode Variasi / Barcode</th>
                  <th className="p-2.5">Harga</th>
                  <th className="p-2.5 text-right">Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {getProductCombos(selectedProduct.id).map(c => (
                  <tr key={c.key}>
                    <td className="p-2.5 font-sans font-bold text-slate-800 dark:text-slate-200">{c.label}</td>
                    <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-bold">{c.vSku || selectedProduct.sku}</td>
                    <td className="p-2.5 text-emerald-600 font-bold">{formatIDR(c.price)}</td>
                    <td className="p-2.5 text-right font-black">{c.stock} Pcs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end border-t pt-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold"
          >
            Tutup Modal
          </button>
        </div>
      </div>
    </div>
  );
});
