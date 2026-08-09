import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Key, Link as LinkIcon, Download, Upload, X, Server } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured, testSupabaseConnection } from '../../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { isSyncingSupabase, syncAllDataToSupabase, pullSupabaseData } = useERP();
  const [urlInput, setUrlInput] = useState(supabaseUrl || '');
  const [keyInput, setKeyInput] = useState(supabaseAnonKey || '');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info' | ''; text: string }>({ type: '', text: '' });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setUrlInput(supabaseUrl || '');
    setKeyInput(supabaseAnonKey || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setStatusMsg({ type: 'info', text: 'Menguji koneksi ke server Supabase...' });
    const res = await testSupabaseConnection(urlInput, keyInput);
    setIsTesting(false);
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handlePullDirect = async () => {
    setIsTesting(true);
    setStatusMsg({ type: 'info', text: 'Mengambil data dari tabel Supabase...' });
    await pullSupabaseData();
    setIsTesting(false);
    setStatusMsg({ type: 'success', text: 'Berhasil menarik data langsung dari Supabase!' });
  };

  const handlePushDirect = async () => {
    const res = await syncAllDataToSupabase();
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Pengaturan Database Supabase
                {isSupabaseConfigured ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Aktif
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Belum Dikonfigurasi
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Hubungkan aplikasi ERP langsung ke database Cloud Supabase Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 text-xs">
          
          {statusMsg.text && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200' :
              statusMsg.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200' :
              'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200'
            }`}>
              {statusMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'info' && <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />}
              <div className="flex-1 font-medium leading-relaxed">{statusMsg.text}</div>
            </div>
          )}

          {/* Credentials Inputs */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                Supabase Project URL
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xyzxyz.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Dapatkan dari Supabase Dashboard: <b>Project Settings → API → Project URL</b>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Supabase Anon API Key (public)
              </label>
              <textarea
                rows={2}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Dapatkan dari Supabase Dashboard: <b>Project Settings → API → Project API Keys (anon public)</b>
              </p>
            </div>

            {/* Test Connection Action */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                Uji Koneksi Supabase (.env)
              </button>
            </div>
          </div>

          {/* Sync & Pull Data Panel */}
          {isSupabaseConfigured && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Operasi Sinkronisasi Data Supabase
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePullDirect}
                  disabled={isTesting || isSyncingSupabase}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 flex items-center gap-1.5 mb-1">
                    <Download className="w-4 h-4 text-emerald-500" />
                    Tarik Data dari Supabase
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Memuat data terbaru langsung dari tabel Supabase ke dalam aplikasi.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handlePushDirect}
                  disabled={isTesting || isSyncingSupabase}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 flex items-center gap-1.5 mb-1">
                    <Upload className="w-4 h-4 text-emerald-500" />
                    Upload Semua Data ke Supabase
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mengupload seluruh data produk, pengguna, pesanan, & karyawan ke Supabase.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Quick Setup Instructions */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-slate-600 dark:text-slate-300">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              💡 Panduan Singkat Penyiapan Schema SQL:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
              <li>Buka dashboard Supabase Anda di <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-600 underline">supabase.com</a></li>
              <li>Pilih proyek Anda, lalu navigasi ke menu <b>SQL Editor</b>.</li>
              <li>Jalankan skema SQL dari file <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">supabase_schema.sql</code>.</li>
            </ol>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
