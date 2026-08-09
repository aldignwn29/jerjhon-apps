import React, { useState } from 'react';
import {
  Bell, Search, Moon, Sun, UserCheck, ShieldCheck,
  PlusCircle, Server, Building2, ChevronDown, Menu, X, LogOut,
  Database, AlertTriangle, Loader2, Download, RefreshCw, GitMerge
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AppInstallModal } from './AppInstallModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenNotifications: () => void;
  onOpenRoleSwitcher: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenNotifications,
  onOpenRoleSwitcher,
  onToggleMobileMenu
}) => {
  const {
    currentUser,
    darkMode,
    setDarkMode,
    notifications,
    companyProfile,
    setActiveTab,
    setActiveDomain,
    logout,
    globalReset,
    selectiveReset,
    isStaff,
    kpiTasks,
    employees,
    isOffline,
    syncConflicts,
    openConflictWizard,
    isAdmin,
    isSupabaseConfigured,
    isSyncingSupabase,
    syncAllDataToSupabase
  } = useERP();

  if (!currentUser) return null;

  const pendingConflictsCount = (syncConflicts || []).filter(c => c.status === 'pending').length;

  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const loggedInEmployee = employees?.find(
    e => e.id === currentUser?.id || e.email === currentUser?.email
  );

  const staffUnreadCount = loggedInEmployee
    ? kpiTasks.filter(t => t.employeeId === loggedInEmployee.id && (t.status === 'Pending' || t.status === 'Declined')).length
    : 0;

  const unreadCount = isStaff
    ? staffUnreadCount
    : notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 glass-header backdrop-blur-md px-4 sm:px-6 py-3 transition-all duration-200">
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left Side: Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleMobileMenu || onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-1 focus:ring-slate-200"
            title="Toggle Menu Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo Only (No logo text as requested) */}
          <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white shadow-xs flex items-center justify-center font-black text-rose-600 text-lg shrink-0 overflow-hidden">
            {companyProfile.logoUrl ? (
              <img src={companyProfile.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              'J'
            )}
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NIK, SKU, Order #, Jurnal, Karyawan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white border border-slate-200 focus:border-rose-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-xs"
          />
        </div>

        {/* Search Toggle Mobile */}
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl md:hidden"
          title="Toggle Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Right Side Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto">

          {/* PHP Native & MySQL Engine Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
            <Server className="w-3.5 h-3.5 text-emerald-500" />
            <span>PHP 8.3 + MySQL 8.0</span>
          </div>

          {isOffline && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-700 dark:text-amber-300 font-bold animate-pulse" title="Koneksi Firestore terputus - Beroperasi dalam Mode Offline">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Mode Offline</span>
            </div>
          )}

          {/* Install App Button (Desktop & Tablet) */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="hidden sm:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 active:scale-95 shadow-xs"
            title="Instal Aplikasi ke Desktop & HP"
          >
            <Download className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="hidden xl:inline">Instal App</span>
          </button>

          {/* Conflict Resolution Wizard Header Button */}
          {isAdmin && (
            <button
              onClick={openConflictWizard}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 shadow-xs ${
                pendingConflictsCount > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-600 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="Conflict Resolution Wizard (Modal Resolusi Sync)"
            >
              <GitMerge className="w-4 h-4 text-[#00a96e] shrink-0" />
              <span className="hidden xl:inline">Conflict Wizard</span>
              {pendingConflictsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[10px] flex items-center justify-center font-black">
                  {pendingConflictsCount}
                </span>
              )}
            </button>
          )}

          {/* Refresh App Button */}
          <button
            onClick={() => window.location.reload()}
            className="hidden lg:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 active:scale-95 shadow-xs"
            title="Muat Ulang / Refresh Aplikasi"
          >
            <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin-hover" />
            <span className="hidden xl:inline">Refresh</span>
          </button>

          {/* Quick Action Button */}
          <div className="relative">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 sm:gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs border border-rose-500/10 transition-all duration-200 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Aksi Cepat</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80 hidden sm:inline shrink-0" />
            </button>

            {showQuickAdd && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Menu Operasional Cepat
                </div>
                <button
                  onClick={() => { setActiveDomain('human_capital'); setActiveTab('emp_list'); setShowQuickAdd(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between transition-colors"
                >
                  <span>Tambah Karyawan Baru</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">HC</span>
                </button>
                <button
                  onClick={() => { setActiveDomain('sales_marketplace'); setActiveTab('pos_retail'); setShowQuickAdd(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between transition-colors"
                >
                  <span>Transaksi POS Kasir</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">POS</span>
                </button>
                <button
                  onClick={() => { setActiveDomain('inventory_purchasing'); setActiveTab('stock_opname'); setShowQuickAdd(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between transition-colors"
                >
                  <span>Input Stok Opname</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">STK</span>
                </button>
                <button
                  onClick={() => { setActiveDomain('finance_accounting'); setActiveTab('journal_entries'); setShowQuickAdd(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between transition-colors"
                >
                  <span>Input Jurnal Umum</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">ACC</span>
                </button>
              </div>
            )}
          </div>

          {/* Supabase Sync Button */}
          <button
            id="supabase-sync-btn"
            disabled={isSyncingSupabase}
            onClick={async () => {
              const res = await syncAllDataToSupabase();
              alert(res.message);
            }}
            className={`flex items-center justify-center w-9 h-9 lg:w-auto lg:px-3.5 lg:py-2 lg:gap-1.5 rounded-xl border transition-all duration-200 active:scale-95 ${
              isSupabaseConfigured 
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
            }`}
            title={isSupabaseConfigured ? "Supabase Terhubung - Klik untuk Sync Semua Data ke Supabase" : "Supabase Belum Dikonfigurasi"}
          >
            {isSyncingSupabase ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0" />
            )}
            <span className="hidden lg:inline text-xs font-bold">
              {isSupabaseConfigured ? 'Sync Supabase' : 'Supabase Off'}
            </span>
          </button>

          {/* Global Reset Button - Hidden for Staff & Manager roles */}
          {!['staff', 'manager'].includes(currentUser?.role?.toLowerCase() || '') && (
            <button
              id="global-reset-btn"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-center w-9 h-9 lg:w-auto lg:px-3.5 lg:py-2 lg:gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-100 transition-all duration-200 active:scale-95"
              title="Reset Seluruh Database ke Pengaturan Awal (Admin Only)"
            >
              <Database className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline text-xs font-bold">Global Reset</span>
            </button>
          )}


          {/* Notifications Trigger */}
          <button
            onClick={() => {
              if (isStaff) {
                setActiveDomain('human_capital');
                setActiveTab('task_messages');
              } else {
                onOpenNotifications();
              }
            }}
            className="relative w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 active:scale-95"
            title={isStaff ? "Kotak Pesan Tugas & KPI" : "Notification Center"}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </button>

          {/* Role Switcher & User Profile Circular Avatar */}
          <div className="relative shrink-0">
            <button
              onClick={onOpenRoleSwitcher}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-slate-200 hover:border-rose-500 transition-all active:scale-95 shadow-xs group focus:outline-none focus:ring-2 focus:ring-rose-500/30 overflow-hidden"
              title={`Profil: ${currentUser?.name || 'Guest'} (${currentUser?.role || 'Guest'}) - Klik untuk Ganti Role Simulasi`}
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'Guest'}
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
              />
            </button>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs pointer-events-none z-10"></span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-100 transition-all duration-200 active:scale-95"
            title="Keluar dari Sistem (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {showMobileSearch && (
        <div className="mt-2.5 pb-1 md:hidden">
          <div className="relative animate-in fade-in slide-in-from-top-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 text-slate-900"
              autoFocus
            />
            <button
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div id="reset-confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                  Opsi Pembersihan Database
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Pilih opsi pembersihan data yang sesuai dengan kebutuhan Anda. Tindakan pembersihan data bersifat permanen pada database Firestore.
                </p>
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                  * Kosongkan Data Operasional: Menghapus data transaksi, jurnal, penjualan, kpi, dll. Akun pengguna sistem (User Management) dan data karyawan (HC) tetap tersimpan aman.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-6">
              <button
                id="reset-selective-btn"
                disabled={isResetting}
                onClick={async () => {
                  try {
                    setIsResetting(true);
                    await selectiveReset();
                    setShowResetConfirm(false);
                  } catch (err) {
                    console.error("Gagal melakukan reset selektif:", err);
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Kosongkan Data Operasional (Simpan Karyawan & Users)'
                )}
              </button>
              
              <button
                id="reset-confirm-btn"
                disabled={isResetting}
                onClick={async () => {
                  try {
                    setIsResetting(true);
                    await globalReset();
                    setShowResetConfirm(false);
                  } catch (err) {
                    console.error("Gagal melakukan reset global:", err);
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 py-2 rounded-xl text-[11px] font-bold transition-all"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin animate-infinite" />
                    Mereset...
                  </>
                ) : (
                  'Reset Total Semua Data (Global Reset)'
                )}
              </button>

              <button
                id="reset-cancel-btn"
                disabled={isResetting}
                onClick={() => setShowResetConfirm(false)}
                className="w-full text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all mt-1"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Install Guide Modal */}
      <AppInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </header>
  );
};
