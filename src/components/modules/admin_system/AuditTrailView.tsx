import React, { useState } from 'react';
import { ShieldAlert, Search, Plus, Edit, Trash2, X, HardDrive, FileText } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { AuditLog } from '../../../types';
import { AuditSyncLogView } from './AuditSyncLogView';

export const AuditTrailView: React.FC = () => {
  const { auditLogs, addAuditLog, updateAuditLog, deleteAuditLog, clearAllAuditLogs, deletionQueue } = useERP();
  
  const [activeSubTab, setActiveSubTab] = useState<'activity' | 'sync_queue'>('activity');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState<AuditLog | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AuditLog | null>(null);

  // Form state
  const [action, setAction] = useState('');
  const [module, setModule] = useState('');
  const [details, setDetails] = useState('');

  const filteredLogs = (auditLogs || []).filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingLog(null);
    setAction('');
    setModule('');
    setDetails('');
    setShowModal(true);
  };

  const handleOpenEdit = (log: AuditLog) => {
    setEditingLog(log);
    setAction(log.action);
    setModule(log.module);
    setDetails(log.details);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog) {
      updateAuditLog(editingLog.id, { action, module, details });
    } else {
      addAuditLog(action, module, details);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      deleteAuditLog(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const pendingCount = (deletionQueue || []).filter(i => i.status === 'pending' || i.status === 'failed').length;

  return (
    <div className="space-y-6">
      
      {/* Sub Tab Navigation Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveSubTab('activity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'activity'
              ? 'bg-[#00a96e] text-white shadow-md shadow-[#00a96e]/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Activity Audit Trail
        </button>

        <button
          onClick={() => setActiveSubTab('sync_queue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer relative ${
            activeSubTab === 'sync_queue'
              ? 'bg-[#00a96e] text-white shadow-md shadow-[#00a96e]/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Audit Sync Log (IndexedDB Queue)
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-extrabold animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'sync_queue' ? (
        <AuditSyncLogView />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#b90f0f]" />
            Enterprise Audit Trail Log System (ISO & Fraud Security Audit)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Jejak Rekam Lengkap Aktivitas Pengguna: Tambah Karyawan, Edit Order, Jurnal Post, IP Address & Waktu Transaksi
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari log..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a96e] w-full sm:w-64"
            />
          </div>
          <button 
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin menghapus SEMUA log Audit Trail? Tindakan ini tidak dapat dibatalkan.')) {
                clearAllAuditLogs();
              }
            }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-xs cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Hapus Semua Log
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-[#00a96e] hover:bg-[#00925f] text-white px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Tambah Log
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-x-auto">
        <table className="whitespace-nowrap w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/60 border-b text-slate-600 dark:text-slate-300 font-bold">
              <th className="p-3">Waktu (Timestamp)</th>
              <th className="p-3">Pengguna (User)</th>
              <th className="p-3">Aksi (Action)</th>
              <th className="p-3">Modul Target</th>
              <th className="p-3">Detail Perubahan</th>
              <th className="p-3">IP Address</th>
              <th className="p-3 text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group">
                <td className="p-3 font-semibold text-slate-500">{log.timestamp}</td>
                <td className="p-3 font-bold text-slate-900 dark:text-white">{log.userName}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-[#b90f0f]/10 text-[#b90f0f] font-bold text-[10px]">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-bold">{log.module}</td>
                <td className="p-3 text-slate-600 dark:text-slate-300 whitespace-normal min-w-[250px]">{log.details}</td>
                <td className="p-3 text-slate-400">{log.ipAddress}</td>
                <td className="p-3 text-center">
                  <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEdit(log)}
                      className="p-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
                      title="Edit Log"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(log)}
                      className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors"
                      title="Hapus Log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  Tidak ada data log yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#00a96e]" />
                {editingLog ? 'Edit Audit Log' : 'Tambah Audit Log'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Aksi (Action)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: CUSTOM_ACTION"
                  value={action}
                  onChange={e => setAction(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a96e] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Modul Target</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Inventory"
                  value={module}
                  onChange={e => setModule(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Detail Perubahan</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Deskripsikan perubahan secara detail..."
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00a96e] resize-none"
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#00a96e] hover:bg-[#00925f] text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#00a96e]/20"
                >
                  Simpan Log
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hapus Audit Log</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Apakah Anda yakin ingin menghapus log aksi <strong>{confirmDelete.action}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
};
