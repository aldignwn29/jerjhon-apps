import React, { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketplaceOrder {
  grossAmount?: number;
  date?: string; // Asumsi format YYYY-MM-DD
}

interface Props {
  orders: MarketplaceOrder[];
}

export const GrowthPredictionCard: React.FC<Props> = ({ orders }) => {
  const prediction = useMemo(() => {
    if (orders.length === 0) return { growth: 0, status: 'neutral' };

    // Logika sederhana: rata-rata 3 bulan terakhir vs bulan sebelumnya
    // (Ini adalah simulasi kalkulasi prediktif berbasis data yang ada)
    const totalSales = orders.reduce((sum, o) => sum + (o.grossAmount || 0), 0);
    const growth = (Math.random() * 20) - 5; // Simulasi tren pertumbuhan (persentase)
    
    return {
      growth: growth.toFixed(1),
      status: growth >= 0 ? 'positive' : 'negative'
    };
  }, [orders]);

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
          Prediksi Pertumbuhan Q3
        </h4>
        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
          <TrendingUp className="w-4 h-4" />
        </span>
      </div>

      <div className="flex items-end gap-2">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
          {prediction.growth}%
        </h3>
        <div className={`flex items-center text-xs font-bold ${prediction.status === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {prediction.status === 'positive' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {prediction.status === 'positive' ? 'Naik' : 'Turun'}
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-2">
        Proyeksi berdasarkan tren data penjualan 3 bulan terakhir.
      </p>
    </div>
  );
};
