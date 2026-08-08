import React, { useState } from 'react';
import { 
  Shield, UserPlus, Key, Lock, CheckCircle2, Search, Filter, Edit2, 
  Trash2, X, RefreshCw, UserCheck, ShieldAlert, Eye, EyeOff, Check, AlertTriangle, Info,
  Fingerprint, ScanFace, Smartphone
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { RoleType, UserStatus, User } from '../../../types';
import { UserBiometricSetupModal } from '../human_capital/UserBiometricSetupModal';
import { isUserBiometricRegistered, getStoredBiometricCreds } from '../../../lib/webauthn';

const ALL_MODULES = [
  {
    category: 'Executive & Analytics',
    items: [
      { id: 'dashboard_exec', name: 'Executive Dashboard' },
      { id: 'reports_analytics', name: 'Executive Reports & BI' },
    ]
  },
  {
    category: 'Human Capital (HCM)',
    items: [
      { id: 'emp_list', name: 'Employee Database' },
      { id: 'attendance_shifts', name: 'Absensi & Shift Kerja' },
      { id: 'leave_management', name: 'Cuti, Izin & Lembur' },
      { id: 'payroll_engine', name: 'Payroll & Slip Gaji' },
      { id: 'kpi_okr', name: 'KPI & OKR Management' },
      { id: 'task_messages', name: 'Kotak Pesan Tugas & KPI' },
      { id: 'recruitment_training', name: 'Recruitment & Training' },
    ]
  },
  {
    category: 'Sales & Marketplace',
    items: [
      { id: 'marketplace_hub', name: 'Marketplace Channel Hub' },
      { id: 'pos_retail', name: 'POS Kasir Retail' },
      { id: 'crm_customers', name: 'CRM & Data Pelanggan' },
    ]
  },
  {
    category: 'Inventory & Supply Chain',
    items: [
      { id: 'inventory_products', name: 'Katalog Produk & Stok' },
      { id: 'raw_materials', name: 'Manajemen Bahan Baku' },
      { id: 'stock_opname', name: 'Stock Opname & Mutasi' },
      { id: 'purchasing_po', name: 'Purchase Orders & Supplier' },
    ]
  },
  {
    category: 'Finance & Accounting',
    items: [
      { id: 'chart_accounts', name: 'Chart of Accounts (COA)' },
      { id: 'journal_entries', name: 'Jurnal Umum & Buku Besar' },
      { id: 'financial_reports', name: 'Laba Rugi & Neraca' },
      { id: 'fixed_assets', name: 'Aset Tetap & Depresiasi' },
    ]
  },
  {
    category: 'R&D & Production',
    items: [
      { id: 'rnd_development', name: 'Product R&D Development' },
      { id: 'production_bom', name: 'Perencanaan Produksi & BOM' },
    ]
  },
  {
    category: 'Event Management',
    items: [
      { id: 'event_management', name: 'Manage Events' },
    ]
  },
  {
    category: 'Marketing & Growth',
    items: [
      { id: 'kol_campaigns', name: 'KOL & Influencer Campaign' },
      { id: 'affiliate_events', name: 'Affiliate & Event Program' },
    ]
  },
  {
    category: 'Project Management',
    items: [
      { id: 'task_kanban', name: 'Task Kanban & Workload' },
      { id: 'gantt_timeline', name: 'Gantt Chart & Timeline' },
    ]
  },
  {
    category: 'Governance & Core System',
    items: [
      { id: 'rbac_users', name: 'User Management & Kredensial' },
      { id: 'approval_center', name: 'Persetujuan (Approval)' },
      { id: 'audit_trail', name: 'Audit Trail Activity Log' },
      { id: 'company_profile', name: 'Profil Perusahaan & Tax' },
      { id: 'gmail_inbox', name: 'Google Gmail Integration' },
      { id: 'google_meet', name: 'Google Meet Integration' },
    ]
  },
  {
    category: 'Developer Tools',
    items: [
      { id: 'mysql_schema', name: 'MySQL DDL Schema' },
      { id: 'php_mvc_code', name: 'PHP Native MVC Generator' },
    ]
  }
];

export const UserManagementView: React.FC = () => {
  const { 
    users, 
    employees,
    systemRoles, 
    addUser, 
    updateUser, 
    deleteUser, 
    sha256, 
    currentUser, 
    addAuditLog,
    syncUsersWithEmployees,
    activateAllInactiveEmployeesAndUsers
  } = useERP();

  if (!currentUser) return null;

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ updated: number; show: boolean } | null>(null);

  const [isActivating, setIsActivating] = useState(false);
  const [activationResult, setActivationResult] = useState<{ activated: number; show: boolean } | null>(null);

  const handleSyncWithEmployees = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const count = await syncUsersWithEmployees();
      setSyncResult({ updated: count, show: true });
      setTimeout(() => {
        setSyncResult(prev => prev ? { ...prev, show: false } : null);
      }, 5000);
    } catch (err) {
      console.error("Manual user sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleActivateAll = async () => {
    setIsActivating(true);
    setActivationResult(null);
    try {
      const count = await activateAllInactiveEmployeesAndUsers();
      setActivationResult({ activated: count, show: true });
      setTimeout(() => {
        setActivationResult(prev => prev ? { ...prev, show: false } : null);
      }, 5000);
    } catch (err) {
      console.error("Manual mass activation failed:", err);
    } finally {
      setIsActivating(false);
    }
  };

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBiometricUser, setSelectedBiometricUser] = useState<User | null>(null);
  const [biometricRefreshTrigger, setBiometricRefreshTrigger] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'Staff' as RoleType,
    department: 'HR',
    status: 'active' as UserStatus,
    hashPassword: true,
    permissions: ['attendance_shifts', 'leave_management', 'task_kanban'] as string[],
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'Staff' as RoleType,
    department: 'HR',
    status: 'active' as UserStatus,
    hashPassword: true,
    updatePassword: false, // Flag to indicate if we want to change/hash password on edit
    permissions: [] as string[],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Departments list for dropdown (strictly limited to requested departments/divisions)
  const DEPARTMENTS = [
    'Creative',
    'Marketing',
    'HR',
    'Finance'
  ];

  // System roles mapping (strictly Admin, Manager, Staff)
  const ROLE_CATEGORIES = [
    { label: 'Admin (Otoritas Penuh)', val: 'Admin' as RoleType },
    { label: 'Manager (Otoritas Divisi)', val: 'Manager' as RoleType },
    { label: 'Staff (Otoritas Operasional)', val: 'Staff' as RoleType }
  ];

  // Handle new user creation
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.name.trim() || !formData.email.trim()) {
      return;
    }

    const finalPassword = formData.hashPassword 
      ? sha256(formData.password || 'jerjhon123') 
      : (formData.password || 'jerjhon123');

    addUser({
      username: formData.username.trim().toLowerCase(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: finalPassword,
      role: formData.role,
      department: formData.department,
      status: formData.status,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=150&auto=format&fit=crop&q=80`,
      lastLogin: 'Belum Pernah',
      permissions: formData.role === 'Admin' ? ['all'] : formData.permissions
    });

    // Reset Form
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'Staff',
      department: 'HR',
      status: 'active',
      hashPassword: true,
      permissions: ['attendance_shifts', 'leave_management', 'task_kanban'],
    });
    setShowAddModal(false);
  };

  // Setup Edit Form with selected user data
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      id: user.id,
      username: user.username || '',
      name: user.name,
      email: user.email,
      password: '', // Kept empty unless changed
      role: user.role,
      department: user.department,
      status: user.status,
      hashPassword: true,
      updatePassword: false,
      permissions: user.permissions || []
    });
    setShowEditModal(true);
  };

  // Handle user update
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updatedData: Partial<User> = {
      username: editFormData.username.trim().toLowerCase(),
      name: editFormData.name.trim(),
      email: editFormData.email.trim(),
      role: editFormData.role,
      department: editFormData.department,
      status: editFormData.status,
      permissions: editFormData.role === 'Admin' ? ['all'] : editFormData.permissions
    };

    // If updating password
    if (editFormData.updatePassword && editFormData.password) {
      updatedData.password = editFormData.hashPassword 
        ? sha256(editFormData.password) 
        : editFormData.password;
    }

    updateUser(selectedUser.id, updatedData);
    setShowEditModal(false);
    setSelectedUser(null);
  };

  // Toggle user status quickly from the list
  const toggleUserStatus = (user: User) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    updateUser(user.id, { status: nextStatus });
    addAuditLog(
      'TOGGLE_USER_STATUS', 
      'User Management', 
      `Mengubah status user @${user.username} menjadi ${nextStatus.toUpperCase()}`
    );
  };

  // Quick Hash Password for existing plaintext passwords
  const handleQuickHashPassword = (user: User) => {
    if (!user.password || user.password.length === 64) return; // Already hashed or empty
    const hashed = sha256(user.password);
    updateUser(user.id, { password: hashed });
    addAuditLog(
      'QUICK_HASH_PASSWORD', 
      'User Management', 
      `Mengamankan kredensial user @${user.username} dengan enkripsi hash SHA-256`
    );
  };

  // Handle user deletion
  const handleDeleteSubmit = () => {
    if (!selectedUser) return;
    deleteUser(selectedUser.id);
    setShowDeleteConfirm(false);
    setSelectedUser(null);
  };

  // Filter users based on query and drop-downs
  const filteredUsers = (users || []).filter(u => {
    const searchLower = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchLower) ||
      (u.username && u.username.toLowerCase().includes(searchLower)) ||
      (u.email || '').toLowerCase().includes(searchLower);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <RoleAccessBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#b90f0f]" />
            User Access & Credential Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi kredensial login, enkripsi hash sandi, penugasan level akses (Admin, Manager, Staff), & kontrol status akun.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            id="btn_activate_all_inactive"
            onClick={handleActivateAll}
            disabled={isActivating}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm border transition-colors ${
              isActivating 
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600 cursor-not-allowed'
                : 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${isActivating ? 'animate-spin text-slate-400' : 'text-emerald-600'}`} />
            {isActivating ? 'Mengaktifkan...' : 'Aktifkan Semua Karyawan Nonaktif'}
          </button>

          <button
            onClick={handleSyncWithEmployees}
            disabled={isSyncing}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm border transition-colors ${
              isSyncing 
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600 cursor-not-allowed'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-slate-400' : 'text-[#b90f0f]'}`} />
            {isSyncing ? 'Memproses...' : 'Gabung & Bersihkan Duplikat'}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Tambah User Sistem Baru
          </button>
        </div>
      </div>

      {/* Activation Result Banner */}
      {activationResult?.show && (
        <div id="banner_activation_result" className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-center gap-3 text-xs animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold">Aktivasi Massal Berhasil!</p>
            <p className="opacity-90 mt-0.5">
              {activationResult.activated > 0 
                ? `Berhasil mengaktifkan kembali ${activationResult.activated} karyawan / user sistem yang sebelumnya nonaktif.`
                : 'Semua karyawan dan akun user sistem sudah berstatus aktif.'}
            </p>
          </div>
        </div>
      )}

      {/* Sync Result Banner */}
      {syncResult?.show && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-center gap-3 text-xs animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold">Sinkronisasi Database Berhasil!</p>
            <p className="opacity-90 mt-0.5">
              {syncResult.updated > 0 
                ? `Berhasil memperbarui / mendaftarkan ${syncResult.updated} user sistem berdasarkan basis data kepegawaian terbaru.`
                : 'Semua akun user sistem sudah sinkron dan sesuai dengan data kepegawaian.'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total User</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{users.length}</p>
          </div>
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <Shield className="w-5 h-5 text-[#b90f0f]" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Aktif</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {(users || []).filter(u => u.status === 'active').length}
            </p>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hashed (SHA-256)</p>
            <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {(users || []).filter(u => u.password && u.password.length === 64).length}
            </p>
          </div>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
            <Lock className="w-5 h-5 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plaintext (Demo)</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-500 mt-1">
              {(users || []).filter(u => !u.password || u.password.length !== 64).length}
            </p>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Table (CRUD Area) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="relative sm:col-span-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, username, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:col-span-6">
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
              >
                <option value="all">Semua Role</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>
          </div>

          {/* Table Container - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">User & Username</th>
                  <th className="p-3">Email & Divisi</th>
                  <th className="p-3">Otoritas Akses</th>
                  <th className="p-3 text-center">Keamanan</th>
                  <th className="p-3 text-center">Biometrik</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Tidak ada data pengguna yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrentUser = currentUser.id === u.id;
                    const isHashed = u.password && u.password.length === 64;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={u.avatar} 
                              alt={u.name} 
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                {u.name}
                                {isCurrentUser && (
                                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                    Saya
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400">@{u.username || 'n/a'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-slate-600 dark:text-slate-300 font-mono text-[10px]">{u.email}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{u.department}</p>
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2.5 py-1 bg-red-500/10 dark:bg-red-500/20 text-[#b90f0f] dark:text-rose-400 font-extrabold rounded-lg text-[10px] border border-red-500/10">
                            {u.role}
                          </span>
                          {(() => {
                            const matched = (employees || []).find(e => 
                              e.id === u.id || 
                              e.nik === u.id || 
                              (e.email && u.email && e.email.toLowerCase().trim() === u.email.toLowerCase().trim()) || 
                              (e.name && u.name && e.name.toLowerCase().trim() === u.name.toLowerCase().trim()) ||
                              (u.role?.toLowerCase() === 'admin' && (
                                (e.position && e.position.toLowerCase().includes('admin')) ||
                                (e.email && e.email.toLowerCase().includes('aldy')) ||
                                (e.name && e.name.toLowerCase().includes('ald'))
                              ))
                            );
                            if (matched) {
                              return (
                                <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-0.5" title={`Terdaftar sebagai Karyawan: ${matched.name} (${matched.position})`}>
                                  <Check className="w-3 h-3 text-emerald-500" /> Terdaftar DB Karyawan
                                </p>
                              );
                            }
                            return (
                              <button 
                                onClick={handleSyncWithEmployees}
                                className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1 hover:underline block"
                                title="Klik untuk mendaftarkan user ini ke Database Karyawan"
                              >
                                ⚠ Belum Terdaftar (Klik Sync)
                              </button>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-center">
                          {isHashed ? (
                            <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-500/10">
                              <Lock className="w-3 h-3" /> Encrypted
                            </div>
                          ) : (
                            <button
                              onClick={() => handleQuickHashPassword(u)}
                              title="Klik untuk mengamankan password menjadi hash SHA-256"
                              className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-500" /> Plaintext
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {(() => {
                            const creds = getStoredBiometricCreds().find(c => c.userId === u.id);
                            if (creds) {
                              const isFace = creds.authenticatorType === 'face';
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60">
                                  {isFace ? <ScanFace className="w-3.5 h-3.5 text-indigo-500" /> : <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />}
                                  {isFace ? 'Face ID' : 'Fingerprint'}
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                                <Smartphone className="w-3.5 h-3.5" /> Nonaktif
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleUserStatus(u)}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? "Anda tidak dapat menonaktifkan akun sendiri" : "Klik untuk mengubah status aktif"}
                            className="focus:outline-none disabled:opacity-50"
                          >
                            {u.status === 'active' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                              </span>
                            )}
                            {u.status === 'inactive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border border-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Nonaktif
                              </span>
                            )}
                            {u.status === 'suspended' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Ditangguhkan
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedBiometricUser(u)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-indigo-500 hover:text-indigo-600 transition-colors"
                              title="Kelola Biometrik HP"
                            >
                              <Fingerprint className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-[#b90f0f] transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowDeleteConfirm(true);
                              }}
                              disabled={isCurrentUser}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30"
                              title={isCurrentUser ? "Tidak dapat menghapus akun Anda sendiri" : "Hapus User"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Responsive Card List for Mobile */}
          <div className="block md:hidden space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Tidak ada data pengguna yang cocok dengan kriteria filter.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isCurrentUser = currentUser.id === u.id;
                const isHashed = u.password && u.password.length === 64;

                return (
                  <div key={u.id} className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <img 
                        src={u.avatar} 
                        alt={u.name} 
                        className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                          {u.name}
                          {isCurrentUser && (
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded text-[9px] font-bold">
                              Saya
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">@{u.username || 'n/a'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-slate-400 font-semibold">Email:</span>
                        <p className="text-slate-600 dark:text-slate-300 font-mono truncate">{u.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Divisi:</span>
                        <p className="text-slate-600 dark:text-slate-300 truncate">{u.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] mb-1">Otoritas & Status:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-block px-2 py-0.5 bg-red-500/10 dark:bg-red-500/20 text-[#b90f0f] dark:text-rose-400 font-extrabold rounded-md text-[9px] border border-red-500/10">
                            {u.role}
                          </span>
                          <button
                            onClick={() => toggleUserStatus(u)}
                            disabled={isCurrentUser}
                            className="focus:outline-none disabled:opacity-50"
                          >
                            {u.status === 'active' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                              </span>
                            )}
                            {u.status === 'inactive' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border border-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Nonaktif
                              </span>
                            )}
                            {u.status === 'suspended' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Suspend
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 font-semibold block text-[10px] mb-1">Keamanan & Bio:</span>
                        <div className="flex flex-col items-end gap-1">
                          {isHashed ? (
                            <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-500/10">
                              <Lock className="w-2.5 h-2.5" /> Hash
                            </div>
                          ) : (
                            <button
                              onClick={() => handleQuickHashPassword(u)}
                              className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded text-[9px] font-bold border border-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-500" /> Hash Now
                            </button>
                          )}
                          {(() => {
                            const creds = getStoredBiometricCreds().find(c => c.userId === u.id);
                            if (creds) {
                              const isFace = creds.authenticatorType === 'face';
                              return (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60">
                                  {isFace ? <ScanFace className="w-2.5 h-2.5 text-indigo-500" /> : <Fingerprint className="w-2.5 h-2.5 text-indigo-500" />}
                                  {isFace ? 'Face ID' : 'Fingerprint'}
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                                <Smartphone className="w-2.5 h-2.5" /> Bio Off
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Mobile */}
                    <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-850">
                      <button
                        onClick={() => setSelectedBiometricUser(u)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs transition-colors"
                      >
                        <Fingerprint className="w-3.5 h-3.5" />
                        <span>Biometrik</span>
                      </button>
                      <button
                        onClick={() => openEditModal(u)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setShowDeleteConfirm(true);
                        }}
                        disabled={isCurrentUser}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Roles & Matrix Guide Panel */}
        <div className="space-y-6">
          
          {/* RBAC Rules Matrix */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#b90f0f]" /> Matriks Hak Akses RBAC Roles
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem ERP PT Jerjhon Enterprise menggunakan RBAC (Role-Based Access Control) yang dipetakan langsung ke struktur otoritas berikut:
            </p>

            <div className="space-y-3 pt-2">
              {(systemRoles || []).map((r) => (
                <div key={r.name} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 dark:text-white">{r.name}</h4>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                      {(r.permissions || []).length} Modul
                    </span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11px]">{r.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hashing Security Notice */}
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-[#b90f0f]">
              <Key className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">Security Encryption Notice</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Demi menjaga integritas sistem dari kebocoran data, kata sandi login user yang baru dapat di-hash menggunakan algoritma <strong>SHA-256 (Secure Hash Algorithm)</strong> satu arah.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Setelah password dikonversi menjadi hash 64 karakter hex, admin maupun pihak luar tidak dapat membaca password asli. Sistem mencocokkan password saat login dengan membandingkan hash inputan user dengan database.
            </p>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* ADD USER MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full p-6 my-auto shadow-2xl relative space-y-4 animate-in fade-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#b90f0f]" /> Tambah User Akses Baru
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Andi Wijaya, S.E."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Username Login</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: andiwijaya"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Perusahaan</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: andi.wijaya@jerjhon.co.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Role Otoritas</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleType })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                  >
                    {ROLE_CATEGORIES.map((cat) => (
                      <option key={cat.val} value={cat.val}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Departemen / Divisi</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password Area with Hash Preview */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">Kata Sandi Akses</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="hashToggle"
                      checked={formData.hashPassword}
                      onChange={(e) => setFormData({ ...formData, hashPassword: e.target.checked })}
                      className="rounded text-[#b90f0f] focus:ring-[#b90f0f]"
                    />
                    <label htmlFor="hashToggle" className="text-[10px] font-bold text-slate-500 cursor-pointer flex items-center gap-1">
                      Enkripsi SHA-256 <Lock className="w-2.5 h-2.5 text-indigo-500" />
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan sandi atau biarkan default (jerjhon123)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {formData.hashPassword && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 tracking-wide uppercase">Hasil Hash SHA-256 (Pratinjau):</p>
                    <p className="text-[9px] font-mono text-slate-400 break-all bg-slate-100 dark:bg-slate-900/80 p-2 rounded-lg select-all border border-slate-200/50 dark:border-slate-800">
                      {sha256(formData.password || 'jerjhon123')}
                    </p>
                  </div>
                )}
              </div>

              {/* Granular Page Permissions Checkbox Area */}
              {formData.role === 'Admin' ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300">Akses Administrator Aktif</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Role Admin secara otomatis memiliki akses penuh ke seluruh halaman & modul sistem ERP tanpa terkecuali.</p>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4 border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 dark:text-slate-200">Konfigurasi Akses Halaman Karyawan</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = ALL_MODULES.flatMap(m => m.items.map(item => item.id));
                          setFormData({ ...formData, permissions: allIds });
                        }}
                        className="text-[10px] text-[#b90f0f] dark:text-rose-400 font-bold hover:underline"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, permissions: [] });
                        }}
                        className="text-[10px] text-slate-500 font-bold hover:underline"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 space-y-4">
                    {ALL_MODULES.map((cat) => (
                      <div key={cat.category} className="space-y-1.5">
                        <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">{cat.category}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(cat.items || []).map((item) => {
                            const currentPerms = formData.permissions || [];
                            const isChecked = currentPerms.includes(item.id);
                            return (
                              <label key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const nextPermissions = e.target.checked
                                      ? [...currentPerms, item.id]
                                      : currentPerms.filter(p => p !== item.id);
                                    setFormData({ ...formData, permissions: nextPermissions });
                                  }}
                                  className="rounded text-[#b90f0f] focus:ring-[#b90f0f] mt-0.5"
                                />
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-tight">{item.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4 border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status Akun Awal</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold"
                  >
                    <option value="active">Active (Aktif)</option>
                    <option value="inactive">Inactive (Nonaktif)</option>
                    <option value="suspended">Suspended (Ditangguhkan)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold rounded-xl shadow-md"
                  >
                    Daftarkan User
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full p-6 my-auto shadow-2xl relative space-y-4 animate-in fade-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#b90f0f]" /> Edit Kredensial User
              </h3>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Username Login</label>
                  <input
                    type="text"
                    required
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Perusahaan</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Akses Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as RoleType })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                  >
                    {ROLE_CATEGORIES.map((cat) => (
                      <option key={cat.val} value={cat.val}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Departemen</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="updatePasswordCheckbox"
                      checked={editFormData.updatePassword}
                      onChange={(e) => setEditFormData({ ...editFormData, updatePassword: e.target.checked })}
                      className="rounded text-[#b90f0f] focus:ring-[#b90f0f]"
                    />
                    <label htmlFor="updatePasswordCheckbox" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      Ganti Password Akun
                    </label>
                  </div>

                  {editFormData.updatePassword && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="editHashToggle"
                        checked={editFormData.hashPassword}
                        onChange={(e) => setEditFormData({ ...editFormData, hashPassword: e.target.checked })}
                        className="rounded text-[#b90f0f] focus:ring-[#b90f0f]"
                      />
                      <label htmlFor="editHashToggle" className="text-[10px] font-bold text-slate-500 cursor-pointer flex items-center gap-1">
                        SHA-256 <Lock className="w-2.5 h-2.5 text-indigo-500" />
                      </label>
                    </div>
                  )}
                </div>

                {editFormData.updatePassword ? (
                  <>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        required={editFormData.updatePassword}
                        placeholder="Masukkan sandi baru"
                        value={editFormData.password}
                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#b90f0f]/30 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {editFormData.hashPassword && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 tracking-wide uppercase">Pratinjau Hash SHA-256 Baru:</p>
                        <p className="text-[9px] font-mono text-slate-400 break-all bg-slate-100 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
                          {sha256(editFormData.password || '')}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[10.5px] text-slate-500 leading-relaxed flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" /> Password lama aman dienkripsi dan tidak ditampilkan demi keamanan. Ceklis kotak di atas jika ingin menyetel ulang password.
                  </p>
                )}
              </div>

              {/* Granular Page Permissions Checkbox Area for Editing */}
              {editFormData.role === 'Admin' ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300">Akses Administrator Aktif</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Role Admin secara otomatis memiliki akses penuh ke seluruh halaman & modul sistem ERP tanpa terkecuali.</p>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4 border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 dark:text-slate-200">Konfigurasi Akses Halaman Karyawan</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = ALL_MODULES.flatMap(m => m.items.map(item => item.id));
                          setEditFormData({ ...editFormData, permissions: allIds });
                        }}
                        className="text-[10px] text-[#b90f0f] dark:text-rose-400 font-bold hover:underline"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditFormData({ ...editFormData, permissions: [] });
                        }}
                        className="text-[10px] text-slate-500 font-bold hover:underline"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 space-y-4">
                    {ALL_MODULES.map((cat) => (
                      <div key={cat.category} className="space-y-1.5">
                        <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">{cat.category}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(cat.items || []).map((item) => {
                            const currentPerms = editFormData.permissions || [];
                            const isChecked = currentPerms.includes(item.id);
                            return (
                              <label key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const nextPermissions = e.target.checked
                                      ? [...currentPerms, item.id]
                                      : currentPerms.filter(p => p !== item.id);
                                    setEditFormData({ ...editFormData, permissions: nextPermissions });
                                  }}
                                  className="rounded text-[#b90f0f] focus:ring-[#b90f0f] mt-0.5"
                                />
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-tight">{item.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4 border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status Akun</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as UserStatus })}
                    className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold"
                  >
                    <option value="active">Active (Aktif)</option>
                    <option value="inactive">Inactive (Nonaktif)</option>
                    <option value="suspended">Suspended (Ditangguhkan)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold rounded-xl shadow-md"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRM MODAL */}
      {/* ========================================================================= */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 animate-in scale-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white">Hapus Akses Pengguna?</h3>
                <p className="text-[10px] text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus kredensial login sistem untuk <strong>{selectedUser.name}</strong> (@{selectedUser.username})? User ini tidak akan dapat login kembali ke aplikasi ERP Jerjhon.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Hapus Akses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BIOMETRIC SETUP MODAL */}
      <UserBiometricSetupModal
        isOpen={selectedBiometricUser !== null}
        onClose={() => setSelectedBiometricUser(null)}
        user={selectedBiometricUser}
        onSuccess={() => setBiometricRefreshTrigger(prev => prev + 1)}
      />

    </div>
  );
};
