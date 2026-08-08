import React from 'react';
import {
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Search,
  ChevronDown,
  Download,
  Trash2
} from 'lucide-react';
import { StockMovement } from '../../../../types';

interface StockMovementsTableProps {
  movementStats: {
    totalCount: number;
    inboundQty: number;
    inboundCount: number;
    outboundQty: number;
    outboundCount: number;
  };
  movementSearch: string;
  setMovementSearch: (val: string) => void;
  movementTypeFilter: string;
  setMovementTypeFilter: (val: string) => void;
  movementOperatorFilter: string;
  setMovementOperatorFilter: (val: string) => void;
  movementDateFilter: string;
  setMovementDateFilter: (val: string) => void;
  uniqueOperators: string[];
  handleExportMovements: () => void;
  setDeleteAllMovementsConfirmModal: (val: boolean) => void;
  filteredStockMovements: StockMovement[];
  stockMovements: StockMovement[];
  setDeleteMovementConfirmModal: (m: StockMovement) => void;
}

export const StockMovementsTable = React.memo<StockMovementsTableProps>(({
  movementStats,
  movementSearch,
  setMovementSearch,
  movementTypeFilter,
  setMovementTypeFilter,
  movementOperatorFilter,
  setMovementOperatorFilter,
  movementDateFilter,
  setMovementDateFilter,
  uniqueOperators,
  handleExportMovements,
  setDeleteAllMovementsConfirmModal,
  filteredStockMovements,
  stockMovements,
  setDeleteMovementConfirmModal,
}) => {
  return (
    <div className="space-y-6">
      {/* STATS DECK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Transaksi</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{movementStats.totalCount}</h4>
            <p className="text-[10px] text-slate-400 mt-1">Sesuai filter aktif</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <RefreshCw className="w-5 h-5 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Volume Masuk (Inbound)</p>
            <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{movementStats.inboundQty} <span className="text-xs font-medium text-slate-400">Pcs</span></h4>
            <p className="text-[10px] text-slate-400 mt-1">Dari {movementStats.inboundCount} pergerakan masuk</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/45 rounded-2xl">
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Volume Keluar (Outbound)</p>
            <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400">-{movementStats.outboundQty} <span className="text-xs font-medium text-slate-400">Pcs</span></h4>
            <p className="text-[10px] text-slate-400 mt-1">Dari {movementStats.outboundCount} pergerakan keluar</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/45 rounded-2xl">
            <ArrowDownRight className="w-5 h-5 text-rose-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Net Balance Stok</p>
            <h4 className={`text-2xl font-black ${(movementStats.inboundQty - movementStats.outboundQty) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {(movementStats.inboundQty - movementStats.outboundQty) >= 0 ? '+' : ''}{movementStats.inboundQty - movementStats.outboundQty} <span className="text-xs font-medium text-slate-400">Pcs</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Total selisih masuk & keluar</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/45 rounded-2xl">
            <Boxes className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* ADVANCED FILTER TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-3xl shadow-xs space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SKU, nama produk, atau nomor referensi..."
              value={movementSearch}
              onChange={(e) => setMovementSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-700"
            />
            {movementSearch && (
              <button
                onClick={() => setMovementSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* MOVEMENT TYPE FILTER */}
          <div className="relative">
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="appearance-none w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-700"
            >
              <option value="all">Semua Tipe Gerakan</option>
              <option value="Inbound Purchase">Inbound Purchase (Masuk)</option>
              <option value="Outbound Sales">Outbound Sales (Keluar)</option>
              <option value="Warehouse Transfer">Warehouse Transfer (Transfer)</option>
              <option value="Stock Opname Adjustment">Stock Opname Adjustment (Koreksi)</option>
              <option value="Production Consumption">Production Consumption (Konsumsi)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* OPERATOR FILTER */}
          <div className="relative">
            <select
              value={movementOperatorFilter}
              onChange={(e) => setMovementOperatorFilter(e.target.value)}
              className="appearance-none w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-700"
            >
              <option value="all">Semua Operator</option>
              {uniqueOperators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* DATE FILTER */}
          <div className="relative">
            <select
              value={movementDateFilter}
              onChange={(e) => setMovementDateFilter(e.target.value)}
              className="appearance-none w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-700"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="this_week">7 Hari Terakhir</option>
              <option value="this_month">Bulan Ini</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMovements}
            className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Log</span>
          </button>

          <button
            onClick={() => setDeleteAllMovementsConfirmModal(true)}
            className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua Log</span>
          </button>

          <button
            onClick={() => {
              setMovementSearch('');
              setMovementTypeFilter('all');
              setMovementOperatorFilter('all');
              setMovementDateFilter('all');
            }}
            className="flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-2xl text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN DATA TABLE CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin-slow" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">Audit Log Riwayat Pergerakan</span>
          </div>
          <span className="text-[11px] font-black text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-800">
            Menampilkan {filteredStockMovements.length} dari {stockMovements.length} Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 pl-5">Tanggal</th>
                <th className="p-4">SKU & Nama Produk</th>
                <th className="p-4">Jenis Transaksi</th>
                <th className="p-4 text-center">Jumlah Qty</th>
                <th className="p-4">Asal ➔ Tujuan</th>
                <th className="p-4">Operator</th>
                <th className="p-4">Referensi</th>
                <th className="p-4 pr-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStockMovements.length > 0 ? (
                filteredStockMovements.map((m) => {
                  const isInbound = m.type.includes('Inbound') || m.type.includes('Purchase') || m.type.includes('Transfer');
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 pl-5 font-mono font-bold text-slate-500 whitespace-nowrap">{m.date}</td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-white block hover:text-indigo-600 transition-colors max-w-xs truncate">{m.productName}</span>
                        <span className="font-mono text-[10px] text-slate-400">SKU: {m.productSku}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[9px] uppercase tracking-wide border ${
                          m.type === 'Inbound Purchase'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/30'
                            : m.type === 'Outbound Sales'
                            ? 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/30'
                            : m.type === 'Warehouse Transfer'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/30'
                            : m.type === 'Stock Opname Adjustment'
                            ? 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/30'
                            : 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            m.type === 'Inbound Purchase' ? 'bg-emerald-500' :
                            m.type === 'Outbound Sales' ? 'bg-rose-500' :
                            m.type === 'Warehouse Transfer' ? 'bg-indigo-500' :
                            m.type === 'Stock Opname Adjustment' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          {m.type}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`font-mono font-black text-sm ${
                          isInbound ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isInbound ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold ml-1">Pcs</span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1 text-[11px] font-medium">
                          <span className="bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800 truncate max-w-[120px]">{m.sourceLocation}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800 truncate max-w-[120px]">{m.destinationLocation}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{m.operator || 'System'}</td>
                      <td className="p-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        <span className="bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                          {m.referenceNumber || '-'}
                        </span>
                      </td>
                      <td className="p-4 pr-5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDeleteMovementConfirmModal(m)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800">
                        <Search className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Tidak ada pergerakan stok ditemukan</p>
                      <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau sesuaikan filter untuk melihat riwayat audit log.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
