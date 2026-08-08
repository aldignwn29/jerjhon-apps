import React from 'react';
import { Boxes, RefreshCw } from 'lucide-react';

interface SeedCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  importing: boolean;
  importStatus: string | null;
}

export const SeedCSVModal = React.memo<SeedCSVModalProps>(({
  isOpen,
  onClose,
  onConfirm,
  importing,
  importStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Sinkronkan dengan Data CSV Jerjhon?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Tindakan ini akan <strong>menghapus seluruh produk yang ada saat ini</strong> dan menggantinya dengan <strong>15 produk baru beserta variannya</strong> dari data CSV Jerjhon resmi.
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 space-y-1 mt-3">
            <span className="font-bold block text-xs">Akan disinkronkan otomatis:</span>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Kode SKU Induk & SKU Varian Unik</li>
              <li><strong>HPP berbeda untuk tiap varian</strong> (berdasarkan data CSV)</li>
              <li><strong>Harga jual berbeda untuk tiap varian</strong> (berdasarkan data CSV)</li>
              <li>Kategori (Pants, Caps, Hijab, Shorts, Skirts, dll.)</li>
              <li>Stok awal varian yang akurat</li>
            </ul>
          </div>
        </div>
        {importStatus && (
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium py-1">
            {importStatus}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            disabled={importing}
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={importing}
            onClick={onConfirm}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Boxes className="w-3.5 h-3.5" />}
            {importing ? 'Proses Sinkronisasi...' : 'Ya, Sinkronkan Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
});
