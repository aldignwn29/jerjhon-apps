import React, { useState, useRef } from 'react';
import { 
  Users, UserPlus, UserCheck, Search, Edit3, Trash2, Shield, Phone, Mail, 
  FileText, CheckCircle2, Upload, X, Camera, LayoutGrid, List, 
  Building2, CreditCard, Award, AlertTriangle, Printer, Sparkles, Filter,
  Eye, EyeOff, Lock, Key, Fingerprint, ScanFace, Smartphone
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { Employee, EmployeeStatus, Gender } from '../../../types';
import { UserBiometricSetupModal } from './UserBiometricSetupModal';
import { isUserBiometricRegistered, getStoredBiometricCreds } from '../../../lib/webauthn';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'
];

export const EmployeeDatabaseView: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, formatIDR, isStaff, isAdmin, currentUser, users, updateUser, addUser, sha256, activateAllInactiveEmployeesAndUsers } = useERP();
  if (!currentUser) return null;
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [isActivating, setIsActivating] = useState(false);
  const [activationResult, setActivationResult] = useState<{ activated: number; show: boolean } | null>(null);

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
      console.error("Manual mass activation in database failed:", err);
    } finally {
      setIsActivating(false);
    }
  };

  // Helper to find linked user for an employee
  const findLinkedUser = (emp: Employee | null | undefined) => {
    if (!emp || !users) return undefined;
    const empEmail = emp.email?.toLowerCase().trim();
    const empName = emp.name?.toLowerCase().trim();
    return users.find(u => 
      (empEmail && u.email && u.email.toLowerCase().trim() === empEmail) ||
      u.id === emp.id ||
      u.id === emp.nik ||
      (empName && u.name && u.name.toLowerCase().trim() === empName) ||
      ((emp.position?.toLowerCase().includes('admin') || emp.position?.toLowerCase().includes('sysadmin')) && u.role === 'Admin')
    );
  };

  // Gaji Pokok Credential Verification States
  const [isSalaryUnlocked, setIsSalaryUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  const handleVerifyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Check if the entered password matches the current user's password, OR any registered user/employee's password
    const matchedUser = users?.find(u => u.id === currentUser?.id || u.username === currentUser?.username || u.email === currentUser?.email);
    const hashedUnlockPassword = sha256 ? sha256(unlockPassword) : unlockPassword;
    const isSuccess = (matchedUser && (unlockPassword === matchedUser.password || hashedUnlockPassword === matchedUser.password)) || 
                      (currentUser && (unlockPassword === currentUser.password || hashedUnlockPassword === currentUser.password)) ||
                      (users && users.some(u => u.password === unlockPassword || u.password === hashedUnlockPassword));
    if (isSuccess) {
      setIsSalaryUnlocked(true);
      setShowUnlockModal(false);
      setUnlockPassword('');
      setUnlockError('');
    } else {
      setUnlockError('Password salah. Silakan masukkan password akun karyawan Anda yang terdaftar.');
    }
  };

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [deletingEmp, setDeletingEmp] = useState<Employee | null>(null);

  // Credentials Edit States
  const [editingCredentialsEmp, setEditingCredentialsEmp] = useState<Employee | null>(null);
  const [credentialFormData, setCredentialFormData] = useState({ username: '', password: '' });
  const [credentialError, setCredentialError] = useState('');
  const [selectedBiometricUser, setSelectedBiometricUser] = useState<any>(null);
  const [biometricRefreshTrigger, setBiometricRefreshTrigger] = useState(0);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCredentialsEmp) return;
    const linkedUser = findLinkedUser(editingCredentialsEmp);
    if (linkedUser) {
      if (updateUser) {
        updateUser(linkedUser.id, {
          username: credentialFormData.username,
          ...(credentialFormData.password ? { password: credentialFormData.password } : {})
        });
      }
      setEditingCredentialsEmp(null);
    } else if (addUser) {
      // Auto-create user record if not present
      addUser({
        username: credentialFormData.username || editingCredentialsEmp.name.toLowerCase().replace(/\s+/g, '.'),
        password: credentialFormData.password || 'jerjhon123',
        name: editingCredentialsEmp.name,
        email: editingCredentialsEmp.email || `${credentialFormData.username || 'user'}@jerjhon.co.id`,
        role: editingCredentialsEmp.position?.toLowerCase().includes('admin') ? 'Admin' : editingCredentialsEmp.position?.toLowerCase().includes('manager') ? 'Manager' : 'Staff',
        department: editingCredentialsEmp.department,
        status: editingCredentialsEmp.status === 'Active' ? 'active' : 'inactive',
        avatar: editingCredentialsEmp.avatar
      });
      setEditingCredentialsEmp(null);
    }
  };

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Default Form State for New Employee
  const defaultFormState: Omit<Employee, 'id'> = {
    nik: '',
    name: '',
    email: '',
    phone: '',
    gender: 'L',
    avatar: PRESET_AVATARS[0],
    department: 'Marketing',
    position: 'Staff',
    supervisor: 'Manager Division',
    joinDate: new Date().toISOString().substring(0, 10),
    status: 'Tetap',
    npwp: '01.234.567.8-012.000',
    bpjsKesehatan: '0001234567890',
    bpjsKetenagakerjaan: '18012345678',
    bankName: 'BCA',
    bankAccountNumber: '',
    baseSalary: 7500000,
    fixedAllowance: 1000000,
    transportAllowance: 500000,
    mealAllowance: 500000,
    address: 'Jakarta, Indonesia',
    education: 'S1 Terapan'
  };

  const [addFormData, setAddFormData] = useState<Omit<Employee, 'id'>>(defaultFormState);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('jerjhon123');
  const [editFormData, setEditFormData] = useState<Employee | null>(null);

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Ukuran file foto maksimal 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEdit && editFormData) {
          setEditFormData({ ...editFormData, avatar: result });
        } else {
          setAddFormData(prev => ({ ...prev, avatar: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter Employees based on Role Access
  const baseEmployees = !isAdmin
    ? employees.filter(e => 
        e.id === currentUser.id ||
        e.email.toLowerCase() === currentUser.email.toLowerCase() ||
        e.name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(e.name.toLowerCase())
      )
    : employees;

  const staffDisplayList = (!isAdmin && baseEmployees.length === 0)
    ? [employees.find(e => e.email.toLowerCase() === currentUser.email.toLowerCase()) || employees[0]]
    : baseEmployees;

  const filteredEmployees = staffDisplayList.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.nik.toLowerCase().includes(search.toLowerCase()) ||
                        e.position.toLowerCase().includes(search.toLowerCase()) ||
                        e.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === 'All' || e.department === selectedDept;
    const matchStatus = selectedStatus === 'All' || e.status === selectedStatus;
    return matchSearch && matchDept && matchStatus;
  });

  // Total Payroll Summary
  const totalEmployeesCount = baseEmployees.length;
  const tetapCount = baseEmployees.filter(e => e.status === 'Tetap').length;
  const kontrakCount = baseEmployees.filter(e => e.status === 'Kontrak').length;
  const totalPayrollBudget = baseEmployees.reduce((sum, e) => sum + e.baseSalary, 0);

  // Submit Create
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name || !addFormData.nik) {
      alert('Mohon isi NIK dan Nama Lengkap Karyawan');
      return;
    }

    const cleanNameInput = addFormData.name.trim().toLowerCase();
    const cleanNikInput = addFormData.nik.trim().toLowerCase();
    const cleanEmailInput = addFormData.email ? addFormData.email.trim().toLowerCase() : '';

    // Validasi Duplikasi Nama Karyawan
    const existingName = employees.find(emp => emp.name && emp.name.trim().toLowerCase() === cleanNameInput);
    if (existingName) {
      alert(`Gagal Menambah Karyawan!\n\nNama "${addFormData.name}" sudah terdaftar dalam sistem (NIK: ${existingName.nik || existingName.id}). Mohon gunakan nama yang unik atau tambahkan nama tengah/gelar.`);
      return;
    }

    const existingNik = employees.find(emp => 
      (emp.nik && emp.nik.trim().toLowerCase() === cleanNikInput) || 
      (emp.id && emp.id.trim().toLowerCase() === cleanNikInput)
    );
    if (existingNik) {
      alert(`NIK "${addFormData.nik}" sudah digunakan oleh karyawan "${existingNik.name}". Mohon gunakan NIK yang unik.`);
      return;
    }

    if (cleanEmailInput) {
      const existingEmail = employees.find(emp => emp.email && emp.email.trim().toLowerCase() === cleanEmailInput);
      if (existingEmail) {
        alert(`Email "${addFormData.email}" sudah terdaftar untuk karyawan "${existingEmail.name}". Mohon gunakan email yang unik.`);
        return;
      }
    }

    addEmployee(addFormData, { username: newUsername, password: newPassword });
    setShowAddModal(false);
    setAddFormData(defaultFormState);
    setNewUsername('');
    setNewPassword('jerjhon123');
  };

  // Submit Update
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    if (!editFormData.name || !editFormData.nik) {
      alert('Mohon isi NIK dan Nama Lengkap Karyawan');
      return;
    }

    const cleanEditName = editFormData.name.trim().toLowerCase();
    const existingEditName = employees.find(emp => 
      emp.id !== editFormData.id && 
      emp.nik !== editFormData.id && 
      emp.name && emp.name.trim().toLowerCase() === cleanEditName
    );
    if (existingEditName) {
      alert(`Gagal Perbarui Data Karyawan!\n\nNama "${editFormData.name}" sudah terdaftar untuk karyawan lain (NIK: ${existingEditName.nik || existingEditName.id}). Mohon gunakan nama yang unik.`);
      return;
    }

    updateEmployee(editFormData.id, editFormData);
    if (selectedEmp?.id === editFormData.id) {
      setSelectedEmp(editFormData);
    }
    setEditingEmp(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (deletingEmp) {
      deleteEmployee(deletingEmp.id);
      if (selectedEmp?.id === deletingEmp.id) {
        setSelectedEmp(null);
      }
      setDeletingEmp(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Role Banner */}
      <RoleAccessBanner moduleName="Database Karyawan & Kontak Intern" />

      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#b90f0f]" />
            {isStaff ? 'Direktori & Kontak Rekan Kerja' : 'Employee Management Database (Master HCM)'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isStaff 
              ? 'Direktori kontak internal dan informasi tim untuk komunikasi kerja antar divisi.'
              : 'Sistem Informasi SDM Terintegrasi: Foto Profil, NIK, NPWP, BPJS, Rekening Bank, Payroll & Rekam Karir'}
          </p>
        </div>

        {!isStaff && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              id="btn_activate_all_emp"
              onClick={handleActivateAll}
              disabled={isActivating}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm border transition-colors ${
                isActivating 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600 cursor-not-allowed'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <UserCheck className={`w-4 h-4 ${isActivating ? 'animate-spin text-slate-400' : 'text-emerald-600'}`} />
              <span>{isActivating ? 'Mengaktifkan...' : 'Aktifkan Semua Nonaktif'}</span>
            </button>

            <button
              onClick={() => {
                setAddFormData({
                  ...defaultFormState,
                  nik: `317102${Math.floor(1000000000 + Math.random() * 8999999999)}`
                });
                setShowAddModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all min-h-[42px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Karyawan Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Activation Result Banner */}
      {activationResult?.show && (
        <div id="banner_activation_result_emp" className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-center gap-3 text-xs animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold">Aktivasi Massal Berhasil!</p>
            <p className="opacity-90 mt-0.5">
              {activationResult.activated > 0 
                ? `Berhasil mengaktifkan kembali ${activationResult.activated} karyawan & akun user sistem yang sebelumnya nonaktif.`
                : 'Semua karyawan dan akun user sistem sudah berstatus aktif.'}
            </p>
          </div>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Rekan Kerja</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalEmployeesCount} Orang</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Aktif Terdaftar HCM</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Kepegawaian</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {tetapCount} <span className="text-xs font-normal text-slate-500">Tetap</span> / {kontrakCount} <span className="text-xs font-normal text-slate-500">Kontrak</span>
          </p>
          <span className="text-[11px] text-slate-500">Komposisi SDM Enterprise</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {isStaff ? 'Divisi Saya' : 'Estimasi Total Payroll / Bln'}
          </p>
          <p className="text-xl font-black text-[#b90f0f] dark:text-rose-400 mt-1">
            {isStaff ? (staffDisplayList[0]?.department || 'Belum Terdaftar') : formatIDR(totalPayrollBudget)}
          </p>
          <span className="text-[11px] text-slate-500">
            {isStaff ? `Status Akses: Staff Active` : 'Berdasarkan Total Gaji Pokok'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:min-w-[200px] sm:flex-1">
          <div className="relative w-full sm:min-w-[200px] sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama, NIK, Jabatan, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#b90f0f]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Divisi:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
            >
              <option value="All">Semua Divisi</option>
              <option value="Creative">Creative</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
            >
              <option value="All">Semua Status</option>
              <option value="Tetap">Karyawan Tetap</option>
              <option value="Kontrak">Kontrak (PKWT)</option>
              <option value="Probation">Probation</option>
            </select>
          </div>
        </div>

        {/* Toggle Gaji Pokok Button */}
        <button
          type="button"
          onClick={() => {
            if (isSalaryUnlocked) {
              setIsSalaryUnlocked(false);
            } else {
              setShowUnlockModal(true);
            }
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border ${
            isSalaryUnlocked
              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600'
          }`}
          title={isSalaryUnlocked ? 'Kunci kembali Gaji Pokok' : 'Buka Kunci Gaji Pokok (Butuh Kredensial)'}
        >
          {isSalaryUnlocked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {isSalaryUnlocked ? 'Sembunyikan Gaji' : 'Buka Gaji Pokok'}
        </button>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-[#b90f0f] shadow-xs' : 'text-slate-400'}`}
            title="Tampilan Cards Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-[#b90f0f] shadow-xs' : 'text-slate-400'}`}
            title="Tampilan Tabel Detail"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Cards Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#b90f0f]/30 group-hover:scale-105 transition-transform"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                        emp.status === 'Tetap' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} title={emp.status} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                        {emp.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#b90f0f]">{emp.position}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{emp.department}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    emp.status === 'Tetap'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}>
                    {emp.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 my-3 bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">NIK:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{emp.nik}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Gaji Pokok:</span>
                    {isSalaryUnlocked ? (
                      <span className="font-bold text-slate-900 dark:text-white">{formatIDR(emp.baseSalary)}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowUnlockModal(true)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-mono flex items-center gap-1 select-none focus:outline-hidden font-bold"
                        title="Klik untuk membuka kunci Gaji Pokok"
                      >
                        <span>Rp ••••••••</span>
                        <Eye className="w-3 h-3 text-slate-300 dark:text-slate-500" />
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bank & Rekening:</span>
                    <span className="font-medium truncate max-w-[150px]">{emp.bankName} • {emp.bankAccountNumber}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedEmp(emp)}
                  className="text-[#b90f0f] font-bold hover:underline flex items-center gap-1"
                >
                  Profile Lengkap →
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditFormData(emp);
                      setEditingEmp(emp);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    title="Edit Data Karyawan"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const linkedUser = findLinkedUser(emp);
                      setEditingCredentialsEmp(emp);
                      setCredentialFormData({
                        username: linkedUser?.username || emp.email?.split('@')[0] || emp.name.toLowerCase().replace(/\s+/g, '.'),
                        password: linkedUser?.password || ''
                      });
                      setCredentialError('');
                    }}
                    className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                    title="Ubah Kredensial Login"
                  >
                    <Key className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const linkedUser = findLinkedUser(emp);
                      if (!linkedUser) {
                        alert('Akun pengguna tidak ditemukan untuk karyawan ini. Karyawan harus terdaftar sebagai User Sistem terlebih dahulu.');
                        return;
                      }
                      setSelectedBiometricUser(linkedUser);
                    }}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                    title="Kelola Biometrik (Fingerprint / Face ID)"
                  >
                    <Fingerprint className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingEmp(emp)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Hapus / Resign Karyawan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Karyawan & Foto</th>
                  <th className="p-3">NIK & Kontak</th>
                  <th className="p-3">Divisi & Jabatan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Gaji Pokok</th>
                  <th className="p-3">Bank Rekening</th>
                  <th className="p-3">Skor KPI</th>
                  <th className="p-3 rounded-r-xl text-center">Aksi CRUD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-semibold">
                      <div className="flex items-center gap-3">
                        <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200" />
                        <div>
                          <div className="text-slate-900 dark:text-white font-bold">{emp.name}</div>
                          <div className="text-[10px] text-slate-400">{emp.education} • {emp.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="text-slate-900 dark:text-white font-bold">{emp.nik}</div>
                      <div className="text-[10px] text-slate-400">{emp.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{emp.position}</div>
                      <div className="text-[10px] text-slate-500">{emp.department}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        emp.status === 'Tetap'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {isSalaryUnlocked ? (
                        formatIDR(emp.baseSalary)
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowUnlockModal(true)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-mono flex items-center gap-1 select-none focus:outline-hidden font-bold"
                          title="Klik untuk membuka kunci Gaji Pokok"
                        >
                          <span>Rp ••••••••</span>
                          <Eye className="w-3 h-3 text-slate-300 dark:text-slate-500" />
                        </button>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{emp.bankName} - {emp.bankAccountNumber}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      {typeof emp.kpiScore === 'number' && emp.kpiScore > 0 ? `${emp.kpiScore}%` : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedEmp(emp)}
                          className="p-1.5 text-slate-500 hover:text-[#b90f0f] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Lihat Detail"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditFormData(emp);
                            setEditingEmp(emp);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const linkedUser = findLinkedUser(emp);
                            setEditingCredentialsEmp(emp);
                            setCredentialFormData({
                              username: linkedUser?.username || emp.email?.split('@')[0] || emp.name.toLowerCase().replace(/\s+/g, '.'),
                              password: linkedUser?.password || ''
                            });
                            setCredentialError('');
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          title="Ubah Kredensial Login"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const linkedUser = findLinkedUser(emp);
                            if (!linkedUser) {
                              alert('Akun pengguna tidak ditemukan untuk karyawan ini. Karyawan harus terdaftar sebagai User Sistem terlebih dahulu.');
                              return;
                            }
                            setSelectedBiometricUser(linkedUser);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          title="Kelola Biometrik (Fingerprint / Face ID)"
                        >
                          <Fingerprint className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingEmp(emp)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE: Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#b90f0f]" />
                  Formulir Tambah Karyawan Baru (Master Data HCM)
                </h3>
                <p className="text-xs text-slate-500">Unggah foto profil dan lengkapi data administratif karyawan</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-5 text-xs">
              
              {/* Photo Upload Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#b90f0f]" />
                  Foto Profil Karyawan (Upload File / Pilih Preset)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group">
                    <img
                      src={addFormData.avatar}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-[#b90f0f]/20 shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handlePhotoUpload(e, false)}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-3.5 py-2 rounded-xl font-bold shadow-xs transition-colors min-h-[38px]"
                      >
                        <Upload className="w-4 h-4" /> Pilih Foto dari Komputer
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Format: PNG, JPG atau WEBP (Maks 3MB). Foto ini akan digunakan di ID Card Resmi Enterprise.
                    </p>

                    {/* Presets */}
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1">Atau pilih sampel avatar:</span>
                      <div className="flex items-center gap-2">
                        {PRESET_AVATARS.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            onClick={() => setAddFormData({ ...addFormData, avatar: url })}
                            className={`w-7 h-7 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform ${
                              addFormData.avatar === url ? 'ring-2 ring-[#b90f0f]' : 'opacity-60'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Diri & Identitas */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white border-b pb-1">1. Informasi Diri & Kontak</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block font-semibold mb-1">NIK (Nomor Induk Kependudukan / ERP ID)</label>
                    <input
                      type="text"
                      required
                      value={addFormData.nik}
                      onChange={(e) => setAddFormData({ ...addFormData, nik: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Nama Lengkap Karyawan</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Ahmad Dani Prasetyo, S.E."
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Email Corporate</label>
                    <input
                      type="email"
                      required
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">No WhatsApp / Telefon</label>
                    <input
                      type="text"
                      required
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Jenis Kelamin</label>
                    <select
                      value={addFormData.gender}
                      onChange={(e) => setAddFormData({ ...addFormData, gender: e.target.value as Gender })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl">
                  <div>
                    <label className="block font-bold text-xs text-[#b90f0f] dark:text-rose-400 mb-1">
                      Username Login Sistem
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: ahmad.dani"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">Digunakan karyawan untuk masuk ke portal ERP.</p>
                  </div>
                  <div>
                    <label className="block font-bold text-xs text-[#b90f0f] dark:text-rose-400 mb-1">
                      Password Login Awal
                    </label>
                    <input
                      type="text"
                      placeholder="jerjhon123"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">Default: jerjhon123 (dapat diubah nanti).</p>
                  </div>
                </div>
              </div>

              {/* Organisasi & Jabatan */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white border-b pb-1">2. Divisi, Jabatan & Kontrak</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Divisi / Departemen</label>
                    <select
                      value={addFormData.department}
                      onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="Creative">Creative</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Jabatan (Level)</label>
                    <select
                      value={addFormData.position}
                      onChange={(e) => setAddFormData({ ...addFormData, position: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Status Kepegawaian</label>
                    <select
                      value={addFormData.status}
                      onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value as EmployeeStatus })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="Tetap">Karyawan Tetap (PKWTT)</option>
                      <option value="Kontrak">Kontrak (PKWT)</option>
                      <option value="Probation">Probation (Masa Percobaan)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Kompensasi & Rekening */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white border-b pb-1">3. Gaji & Rekening Bank</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Gaji Pokok (Rp)</label>
                    <input
                      type="number"
                      required
                      value={addFormData.baseSalary}
                      onChange={(e) => setAddFormData({ ...addFormData, baseSalary: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Bank Payroll</label>
                    <select
                      value={addFormData.bankName}
                      onChange={(e) => setAddFormData({ ...addFormData, bankName: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="BCA">Bank BCA</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BNI">Bank BNI</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="CIMB Niaga">Bank CIMB Niaga</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Nomor Rekening Bank</label>
                    <input
                      type="text"
                      required
                      placeholder="8812039485"
                      value={addFormData.bankAccountNumber}
                      onChange={(e) => setAddFormData({ ...addFormData, bankAccountNumber: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Legalitas & BPJS */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white border-b pb-1">4. Legalitas & Nomor BPJS</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">NPWP Wajib Pajak</label>
                    <input
                      type="text"
                      value={addFormData.npwp}
                      onChange={(e) => setAddFormData({ ...addFormData, npwp: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">BPJS Kesehatan</label>
                    <input
                      type="text"
                      value={addFormData.bpjsKesehatan}
                      onChange={(e) => setAddFormData({ ...addFormData, bpjsKesehatan: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">BPJS Ketenagakerjaan</label>
                    <input
                      type="text"
                      value={addFormData.bpjsKetenagakerjaan}
                      onChange={(e) => setAddFormData({ ...addFormData, bpjsKetenagakerjaan: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white rounded-xl font-bold min-h-[40px] shadow-sm transition-colors"
                >
                  Simpan Karyawan Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE: Edit Employee Modal */}
      {editingEmp && editFormData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  Edit Profil & Data Karyawan ({editingEmp.name})
                </h3>
                <p className="text-xs text-slate-500">Perbarui foto profil, divisi, kompensasi gaji, kontak, atau nomor legalitas</p>
              </div>
              <button
                onClick={() => setEditingEmp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5 text-xs">
              
              {/* Photo Upload Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Foto Profil Karyawan (Upload File / Pilih Preset)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group">
                    <img
                      src={editFormData.avatar}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/20 shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={editFileInputRef}
                        onChange={(e) => handlePhotoUpload(e, true)}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-bold shadow-xs transition-colors min-h-[38px]"
                      >
                        <Upload className="w-4 h-4" /> Pilih Foto dari Komputer
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Format: PNG, JPG atau WEBP (Maks 3MB). Foto ini akan digunakan di ID Card Resmi Enterprise.
                    </p>

                    {/* Presets */}
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1">Atau pilih sampel avatar:</span>
                      <div className="flex items-center gap-2">
                        {PRESET_AVATARS.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            onClick={() => setEditFormData({ ...editFormData, avatar: url })}
                            className={`w-7 h-7 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform ${
                              editFormData.avatar === url ? 'ring-2 ring-blue-600' : 'opacity-60'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Diri & Identitas */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white border-b pb-1">1. Informasi Diri & Kontak</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block font-semibold mb-1">NIK (Nomor Induk Kependudukan / ERP ID)</label>
                    <input
                      type="text"
                      required
                      value={editFormData.nik}
                      onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Nama Lengkap Karyawan</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Ahmad Dani Prasetyo, S.E."
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Email Corporate</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">No WhatsApp / Telefon</label>
                    <input
                      type="text"
                      required
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Jenis Kelamin</label>
                    <select
                      value={editFormData.gender || 'L'}
                      onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as Gender })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Organisasi & Jabatan */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white border-b pb-1">2. Divisi, Jabatan & Kontrak</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Divisi / Departemen</label>
                    <select
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="Creative">Creative</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Jabatan (Level)</label>
                    <select
                      value={editFormData.position}
                      onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Status Kepegawaian</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as EmployeeStatus })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="Tetap">Karyawan Tetap (PKWTT)</option>
                      <option value="Kontrak">Kontrak (PKWT)</option>
                      <option value="Probation">Probation (Masa Percobaan)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Kompensasi & Rekening */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white border-b pb-1">3. Gaji & Rekening Bank</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Gaji Pokok (Rp)</label>
                    <div className="relative">
                      <input
                        type={isSalaryUnlocked ? "number" : "password"}
                        required
                        value={editFormData.baseSalary}
                        onChange={(e) => setEditFormData({ ...editFormData, baseSalary: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold pr-10"
                        disabled={!isSalaryUnlocked}
                      />
                      {!isSalaryUnlocked && (
                        <button
                          type="button"
                          onClick={() => setShowUnlockModal(true)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all focus:outline-hidden"
                          title="Buka Kunci Gaji Pokok untuk Mengedit/Melihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Bank Payroll</label>
                    <select
                      value={editFormData.bankName || 'BCA'}
                      onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-medium"
                    >
                      <option value="BCA">Bank BCA</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BNI">Bank BNI</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="CIMB Niaga">Bank CIMB Niaga</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Nomor Rekening Bank</label>
                    <input
                      type="text"
                      required
                      placeholder="8812039485"
                      value={editFormData.bankAccountNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, bankAccountNumber: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Legalitas & BPJS */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white border-b pb-1">4. Legalitas & Nomor BPJS</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">NPWP Wajib Pajak</label>
                    <input
                      type="text"
                      value={editFormData.npwp || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, npwp: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">BPJS Kesehatan</label>
                    <input
                      type="text"
                      value={editFormData.bpjsKesehatan || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, bpjsKesehatan: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">BPJS Ketenagakerjaan</label>
                    <input
                      type="text"
                      value={editFormData.bpjsKetenagakerjaan || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, bpjsKetenagakerjaan: e.target.value })}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold min-h-[40px] shadow-sm transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READ: Full Employee Profile Detail Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedEmp.avatar}
                  alt={selectedEmp.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-[#b90f0f]/30 shadow-lg"
                />
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block">{selectedEmp.nik}</span>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{selectedEmp.name}</h3>
                  <p className="text-xs font-bold text-[#b90f0f]">{selectedEmp.position} • {selectedEmp.department}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{selectedEmp.email} • {selectedEmp.phone}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Detail Cards */}
            <div className="space-y-4 text-xs">
              
              {/* Financial & Compensation */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                  <CreditCard className="w-4 h-4 text-[#b90f0f]" /> Detail Kompensasi & Rekening Payroll
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gaji Pokok:</span>
                    {isSalaryUnlocked ? (
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatIDR(selectedEmp.baseSalary)}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowUnlockModal(true)}
                        className="text-slate-400 hover:text-slate-600 font-mono flex items-center gap-1 select-none focus:outline-hidden font-bold"
                        title="Buka kunci Gaji Pokok"
                      >
                        <span>Rp ••••••••</span>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Take Home Pay:</span>
                    {isSalaryUnlocked ? (
                      <span className="font-mono font-bold text-emerald-600">
                        {formatIDR(selectedEmp.baseSalary + selectedEmp.fixedAllowance + selectedEmp.transportAllowance + selectedEmp.mealAllowance)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowUnlockModal(true)}
                        className="text-slate-400 hover:text-slate-600 font-mono flex items-center gap-1 select-none focus:outline-hidden font-bold"
                        title="Buka kunci Gaji Pokok"
                      >
                        <span>Rp ••••••••</span>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bank Payroll:</span>
                    <span className="font-bold">{selectedEmp.bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nomor Rekening:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedEmp.bankAccountNumber}</span>
                  </div>
                </div>
              </div>

              {/* Legalities & BPJS */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                  <Shield className="w-4 h-4 text-[#b90f0f]" /> Nomor Legalitas & BPJS
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">NPWP Pajak:</span>
                    <span className="font-bold">{selectedEmp.npwp}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">BPJS Kesehatan:</span>
                    <span className="font-bold">{selectedEmp.bpjsKesehatan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">BPJS Ketenagakerjaan:</span>
                    <span className="font-bold">{selectedEmp.bpjsKetenagakerjaan}</span>
                  </div>
                </div>
              </div>

              {/* Career & Performance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border">
                  <span className="text-slate-400 block text-[10px]">Status Kontrak:</span>
                  <span className="font-bold text-emerald-600">{selectedEmp.status}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border">
                  <span className="text-slate-400 block text-[10px]">Skor Evaluasi KPI:</span>
                  <span className="font-bold text-emerald-600">
                    {typeof selectedEmp.kpiScore === 'number' && selectedEmp.kpiScore > 0 ? `${selectedEmp.kpiScore}% (Sangat Baik)` : '-'}
                  </span>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                onClick={() => {
                  setEditFormData(selectedEmp);
                  setEditingEmp(selectedEmp);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile Ini
              </button>

              <button
                onClick={() => setSelectedEmp(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs min-h-[38px]"
              >
                Tutup Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE: Confirmation Modal */}
      {deletingEmp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Konfirmasi Resign / Hapus Karyawan</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin merekam status Resign / menghapus karyawan <strong>{deletingEmp.name}</strong> (NIK: {deletingEmp.nik}) dari database utama HCM?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingEmp(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Credentials Modal */}
      {editingCredentialsEmp && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 dark:bg-amber-950/40 p-2 rounded-xl text-amber-600">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Ubah Kredensial Login
                  </h3>
                  <p className="text-[10px] text-slate-400">Ganti username atau password karyawan</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingCredentialsEmp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block font-bold text-[11px] text-slate-500 mb-1 uppercase tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  value={credentialFormData.username}
                  onChange={(e) => {
                    setCredentialFormData({ ...credentialFormData, username: e.target.value });
                    setCredentialError('');
                  }}
                  placeholder="Username login"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block font-bold text-[11px] text-slate-500 mb-1 uppercase tracking-wide">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={credentialFormData.password}
                  onChange={(e) => {
                    setCredentialFormData({ ...credentialFormData, password: e.target.value });
                    setCredentialError('');
                  }}
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              {credentialError && (
                <p className="text-[10px] text-rose-500 mt-1 font-semibold">{credentialError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCredentialsEmp(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  Simpan Kredensial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unlock Credentials Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-700">
              <div className="bg-rose-100 dark:bg-rose-950/40 p-2 rounded-xl text-[#b90f0f]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Verifikasi Kredensial Karyawan
                </h3>
                <p className="text-[10px] text-slate-400">Gaji Pokok bersifat sangat rahasia</p>
              </div>
            </div>

            <form onSubmit={handleVerifyUnlock} className="space-y-4">
              <div>
                <label className="block font-bold text-[11px] text-slate-500 mb-1 uppercase tracking-wide">
                  Masukkan Password Akun Anda
                </label>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => {
                    setUnlockPassword(e.target.value);
                    setUnlockError('');
                  }}
                  placeholder="Masukkan password akun Anda"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#b90f0f] text-slate-900 dark:text-white"
                  required
                  autoFocus
                />
                {unlockError ? (
                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">{unlockError}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Masukkan password akun dari masing-masing karyawan yang sudah terdaftar pada sistem (contoh: <span className="font-semibold select-all">admin123</span> atau password akun Anda).
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setUnlockPassword('');
                    setUnlockError('');
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b90f0f] hover:bg-[#a00d0d] text-white rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  Buka Kunci
                </button>
              </div>
            </form>
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

