import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  ShieldCheck, 
  HardDrive, 
  X, 
  Info,
  Layers,
  RotateCw,
  GitMerge,
  SlidersHorizontal
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { DeletionQueueItem } from '../../../types';

export const AuditSyncLogView: React.FC = () => {
  const { 
    deletionQueue, 
    refreshDeletionQueue, 
    processDeletionQueue, 
    clearSyncedQueueItems, 
    removeDeletionQueueItem, 
    clearAllDeletionQueue,
    addAuditLog,
    syncConflicts,
    openConflictWizard,
    simulateSyncConflict
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DeletionQueueItem | null>(null);
  const [syncResultMsg, setSyncResultMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  useEffect(() => {
    refreshDeletionQueue();
  }, [refreshDeletionQueue]);

  // Unique collections in queue
  const collectionsList = Array.from(new Set((deletionQueue || []).map(item => item.collectionName)));

  // Filtered Queue
  const filteredQueue = (deletionQueue || []).filter(item => {
    const matchesSearch = 
      item.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.recordName && item.recordName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.collectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.deletedBy && item.deletedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCollection = selectedCollection === 'all' || item.collectionName === selectedCollection;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesCollection && matchesStatus;
  });

  // Statistics
  const totalItems = deletionQueue?.length || 0;
  const pendingCount = deletionQueue?.filter(i => i.status === 'pending').length || 0;
  const syncingCount = deletionQueue?.filter(i => i.status === 'syncing').length || 0;
  const syncedCount = deletionQueue?.filter(i => i.status === 'synced').length || 0;
  const failedCount = deletionQueue?.filter(i => i.status === 'failed').length || 0;

  const handleProcessSync = async () => {
    setIsProcessing(true);
    setSyncResultMsg(null);
    try {
      const res = await processDeletionQueue();
      addAuditLog('SYNC_DELETION_QUEUE', 'Admin System', `Processed deletion queue sync. Success: ${res.success}, Failed: ${res.failed}`);
      setSyncResultMsg({
        type: res.failed === 0 ? 'success' : 'info',
        text: `Proses sinkronisasi selesai: ${res.success} data berhasil disinkronkan ke Firestore, ${res.failed} gagal.`
      });
    } catch (err: any) {
      setSyncResultMsg({
        type: 'error',
        text: `Gagal menjalankan sinkronisasi: ${err?.message || 'Terjadi kesalahan sistem'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSynced = async () => {
    if (window.confirm('Bersihkan semua riwayat queue yang telah sukses ter-sinkronisasi?')) {
      await clearSyncedQueueItems();
      addAuditLog('CLEAR_SYNCED_QUEUE', 'Admin System', 'Cleared synced deletion queue logs');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH antrean IndexedDB deletion log? Tindakan ini tidak dapat dibatalkan.')) {
      await clearAllDeletionQueue();
      addAuditLog('CLEAR_ALL_DELETION_QUEUE', 'Admin System', 'Wiped out all deletion queue logs in IndexedDB');
    }
  };

  const getStatusBadge = (status: DeletionQueueItem['status']) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Synced (Firestore)
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" /> Pending Sync
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Failed Sync
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#00a96e]/10 text-[#00a96e] rounded-xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Audit Sync Log & Antrean Hapus (IndexedDB Queue)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring real-time antrean penghapusan permanen dari browser (IndexedDB) ke database Firestore cloud
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => refreshDeletionQueue()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Refresh Data Queue"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>

          <button
            onClick={handleProcessSync}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-[#00a96e] hover:bg-[#00925f] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[#00a96e]/20"
          >
            <RotateCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Memproses Sync...' : 'Jalankan Manual Sync'}
          </button>

          {syncedCount > 0 && (
            <button
              onClick={handleClearSynced}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" /> Bersihkan Synced ({syncedCount})
            </button>
          )}

          {totalItems > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-800 cursor-pointer"
            >
              Hapus Semua Queue
            </button>
          )}
        </div>
      </div>

      {/* Result Alert message */}
      {syncResultMsg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
          syncResultMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800' :
          syncResultMsg.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800' :
          'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{syncResultMsg.text}</span>
          </div>
          <button onClick={() => setSyncResultMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Conflict Resolution Wizard Banner / Controller Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 rounded-2xl border border-slate-700/80 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-3 bg-[#00a96e]/20 text-[#00a96e] rounded-xl border border-[#00a96e]/30 shrink-0 mt-0.5 md:mt-0">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Conflict Resolution Wizard
              </h3>
              {(syncConflicts || []).filter(c => c.status === 'pending').length > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                  {(syncConflicts || []).filter(c => c.status === 'pending').length} Konflik Aktif
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Semua Data Sinkron
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Selesaikan perbedaan nilai data antara cache lokal dan Firestore Cloud dengan evaluasi 'Keep Local' / 'Keep Remote' per field.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={simulateSyncConflict}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-600 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#00a96e]" /> Simulasi Deteksi Konflik
          </button>

          <button
            onClick={openConflictWizard}
            className="flex items-center gap-2 px-4 py-2 bg-[#00a96e] hover:bg-[#00925f] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#00a96e]/20 cursor-pointer"
          >
            <GitMerge className="w-4 h-4" /> Buka Resolution Wizard
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Antrean</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalItems}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Status tersimpan di IndexedDB</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
            <span>Pending Sync</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {pendingCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Menunggu pengiriman Firestore</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-bold">
            <span>Syncing</span>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {syncingCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Sedang dikirim ke server</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span>Ter-sinkronisasi</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {syncedCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Sukses terhapus di cloud</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-bold">
            <span>Gagal Sync</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {failedCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Memerlukan retry manual</p>
        </div>
      </div>

      {/* Filters and Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan ID, nama record, atau user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#00a96e] w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
          >
            <option value="all">Semua Koleksi ({totalItems})</option>
            {collectionsList.map(col => (
              <option key={col} value={col}>
                {col} ({deletionQueue.filter(i => i.collectionName === col).length})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending ({pendingCount})</option>
            <option value="syncing">Syncing ({syncingCount})</option>
            <option value="synced">Synced ({syncedCount})</option>
            <option value="failed">Failed ({failedCount})</option>
          </select>
        </div>
      </div>

      {/* Queue Data Table */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
              <th className="p-3">Waktu Hapus</th>
              <th className="p-3">Modul / Koleksi</th>
              <th className="p-3">ID / Nama Data</th>
              <th className="p-3">Dihapus Oleh</th>
              <th className="p-3">Status Sync</th>
              <th className="p-3">Attempts / Info</th>
              <th className="p-3 text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredQueue.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                  <div>{formatDate(item.deletedAt)}</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">{item.id}</div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-[11px] border border-slate-200 dark:border-slate-600">
                    {item.collectionName}
                  </span>
                </td>
                <td className="p-3 max-w-[220px]">
                  <div className="font-bold text-slate-900 dark:text-white truncate" title={item.recordName || item.recordId}>
                    {item.recordName || item.recordId}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 truncate">
                    ID: {item.recordId}
                  </div>
                </td>
                <td className="p-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {item.deletedBy || 'System / Admin'}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {getStatusBadge(item.status)}
                </td>
                <td className="p-3 max-w-[200px]">
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Coba: <span className="font-bold">{item.attempts || 0}x</span>
                  </div>
                  {item.lastSyncError && (
                    <div className="text-rose-500 text-[10px] truncate mt-0.5" title={item.lastSyncError}>
                      {item.lastSyncError}
                    </div>
                  )}
                  {item.syncedAt && (
                    <div className="text-emerald-600 dark:text-emerald-400 text-[10px] mt-0.5">
                      Synced: {formatDate(item.syncedAt)}
                    </div>
                  )}
                </td>
                <td className="p-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Lihat Detail Queue Payload"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={async () => {
                        await removeDeletionQueueItem(item.id);
                        addAuditLog('REMOVE_QUEUE_ITEM', 'Admin System', `Removed item ${item.id} from deletion queue`);
                      }}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Dari Queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredQueue.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Database className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold">Tidak ada antrean penghapusan ditemukan.</p>
                    <p className="text-[11px]">Semua data penghapusan telah bersih atau belum ada aksi hapus yang dilakukan.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <HardDrive className="w-4 h-4 text-[#00a96e]" />
                Detail Queue ID: {selectedItem.id}
              </h3>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Target Collection</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedItem.collectionName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Record Target ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedItem.recordId}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-bold block mb-1">Deskripsi / Nama Record</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedItem.recordName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Dihapus Oleh</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedItem.deletedBy || 'System'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Waktu Dihapus</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{formatDate(selectedItem.deletedAt)}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Status Sinkronisasi Cloud</span>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedItem.status)}
                  <span className="text-slate-400">Total percobaan: {selectedItem.attempts || 0}x</span>
                </div>
              </div>

              {selectedItem.lastSyncError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                  <span className="font-bold text-rose-700 dark:text-rose-400 block mb-1">Pesan Error Terakhir:</span>
                  <p className="font-mono text-[11px] text-rose-800 dark:text-rose-300 break-words">{selectedItem.lastSyncError}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
