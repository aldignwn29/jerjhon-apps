import React, { useState } from 'react';
import { 
  Receipt, Calculator, Printer, CheckCircle2, Clock, XCircle, FileText, 
  ShieldCheck, Calendar, BellRing, Plus, Edit3, Trash2, UserCheck, DollarSign, 
  Eye, EyeOff, Lock, Mail, Search, Filter, TrendingUp, CreditCard, Sparkles, 
  AlertCircle, Building2, Download, ArrowRight, Wallet, HelpCircle, Check, Info,
  ChevronRight, RefreshCw, Layers
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { ExportDropdown } from '../../common/ExportDropdown';
import { exportToCSV, exportToPDF, printPayslipPDF } from '../../../utils/exportUtils';
import { PayrollRecord } from '../../../types';
import { StaffPayslipView } from './StaffPayslipView';

export const PayrollEngineView: React.FC = () => {
  const { 
    payrolls, 
    employees, 
    calculatePayrollForEmployee, 
    updatePayrollStatus, 
    addPayrollRecord, 
    updatePayrollRecord, 
    deletePayrollRecord, 
    formatIDR, 
    companyProfile, 
    currentUser, 
    isStaff,
    isAdmin,
    users,
    overtimeRequests,
    sha256
  } = useERP();

  if (!currentUser) return null;

  const getCurrentPeriodString = () => {
    const now = new Date();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  const generateAvailablePeriods = () => {
    const periods: string[] = [];
    const now = new Date();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      periods.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
    return periods;
  };

  const periods = generateAvailablePeriods();
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriodString());
  const [activeTab, setActiveTab] = useState<'staff' | 'admin'>(isStaff ? 'staff' : 'staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending' | 'cancelled'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const getYearMonthFromPeriod = (period: string) => {
    const parts = period.split(' ');
    if (parts.length < 2) return '2026-07';
    const monthName = parts[0].toLowerCase();
    const year = parts[1];
    const monthMap: Record<string, string> = {
      januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
    };
    const mm = monthMap[monthName] || '07';
    return `${year}-${mm}`;
  };

  // Overtime Calculation Helper (Aturan Owner)
  const calculateOvertime = (empId: string, period: string) => {
    const yearMonth = getYearMonthFromPeriod(period);
    const emp = employees.find(e => e.id === empId || e.nik === empId);

    let totalOvt = 0;
    overtimeRequests?.forEach(ovt => {
      const isEmpMatch = ovt.employeeId === empId || 
        (emp && (ovt.employeeId === emp.nik || ovt.employeeId === emp.id || ovt.employeeName.toLowerCase().trim() === emp.name.toLowerCase().trim()));

      if (isEmpMatch && ovt.status === 'Approved' && ovt.date.startsWith(yearMonth)) {
        // Aturan Owner:
        // 1. Lembur < 2 jam: TIDAK masuk ke penggajian (hanya uang makan Rp 25.000 langsung/tunai).
        // 2. Lembur >= 2 jam: Dimasukkan ke penggajian HANYA uang per jamnya saja (Rp 25.000/jam), karena uang makan Rp 25.000 pasti langsung diberikan.
        if (ovt.hours >= 2) {
          totalOvt += (ovt.overtimePay !== undefined && ovt.overtimePay > 0 ? ovt.overtimePay : Math.round(ovt.hours * 25000));
        }
      }
    });
    return totalOvt;
  };

  const [selectedPayRecord, setSelectedPayRecord] = useState<PayrollRecord | null>(null);
  const [showAlertDismissed, setShowAlertDismissed] = useState(false);

  // Gaji Pokok Credential Verification States
  const [isSalaryUnlocked, setIsSalaryUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Modal State for Add / Edit Payroll
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Form states
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formPeriod, setFormPeriod] = useState(getCurrentPeriodString());
  const [formBaseSalary, setFormBaseSalary] = useState<number>(0);
  const [formFixedAllowance, setFormFixedAllowance] = useState<number>(0);
  const [formFixedAllowanceDesc, setFormFixedAllowanceDesc] = useState('Tunjangan Jabatan & Tetap');
  const [formVariableAllowance, setFormVariableAllowance] = useState<number>(0); // Tunjangan Transportasi
  const [formVariableAllowanceDesc, setFormVariableAllowanceDesc] = useState('Tunjangan Transportasi');
  const [formOvertimePay, setFormOvertimePay] = useState<number>(0); // Uang Lembur Otomatis
  const [formBonusIncentive, setFormBonusIncentive] = useState<number>(0);
  const [formBonusDesc, setFormBonusDesc] = useState('Reward Kinerja / KPI');
  const [formBpjsDeduction, setFormBpjsDeduction] = useState<number>(0);
  const [formTaxPPh21, setFormTaxPPh21] = useState<number>(0);
  const [formLoanDeduction, setFormLoanDeduction] = useState<number>(0);
  const [formLoanDesc, setFormLoanDesc] = useState('Potongan Telat & Kasbon');
  const [formStatus, setFormStatus] = useState<'done' | 'pending' | 'cancelled' | 'Paid' | 'Processing'>('pending');

  const getApprovedOvertimeCount = (empId: string, period: string) => {
    const yearMonth = getYearMonthFromPeriod(period);
    const emp = employees.find(e => e.id === empId || e.nik === empId);

    return overtimeRequests?.filter(ovt => {
      const isEmpMatch = ovt.employeeId === empId || 
        (emp && (ovt.employeeId === emp.nik || ovt.employeeId === emp.id || ovt.employeeName.toLowerCase().trim() === emp.name.toLowerCase().trim()));
      return isEmpMatch && ovt.status === 'Approved' && ovt.date.startsWith(yearMonth);
    }).length || 0;
  };

  // Current logged in Employee object
  const currentEmployee = employees.find(e => 
    e.id === currentUser?.id || 
    e.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
    e.name?.toLowerCase().includes(currentUser?.name?.toLowerCase() || '')
  ) || employees[0];

  const handleOpenAddModal = () => {
    setEditingRecordId(null);
    let empId = '';
    if (employees.length > 0) {
      const firstEmp = employees[0];
      setFormEmployeeId(firstEmp.id);
      setFormBaseSalary(firstEmp.baseSalary || 6000000);
      empId = firstEmp.id;
    }
    setFormPeriod(selectedPeriod);
    setFormFixedAllowance(0);
    setFormVariableAllowance(350000); // Default Transport Allowance
    const autoOvt = calculateOvertime(empId, selectedPeriod);
    setFormOvertimePay(autoOvt);
    setFormBonusIncentive(0);
    setFormBpjsDeduction(0);
    setFormTaxPPh21(0);
    setFormLoanDeduction(0);
    setFormStatus('pending');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PayrollRecord) => {
    setEditingRecordId(p.id);
    setFormEmployeeId(p.employeeId);
    setFormPeriod(p.period);
    setFormBaseSalary(p.baseSalary);
    setFormFixedAllowance(p.fixedAllowance || 0);
    setFormVariableAllowance(p.variableAllowance || 0);
    const autoOvt = calculateOvertime(p.employeeId, p.period);
    setFormOvertimePay(p.overtimePay !== undefined && p.overtimePay > 0 ? p.overtimePay : autoOvt);
    setFormBonusIncentive(p.bonusIncentive || 0);
    setFormBpjsDeduction(p.bpjsDeduction || 0);
    setFormTaxPPh21(p.taxPPh21 || 0);
    setFormLoanDeduction(p.loanDeduction || 0);
    setFormStatus(p.paymentStatus as any || 'pending');
    setIsModalOpen(true);
  };

  const handleVerifyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
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
      setUnlockError('Password salah. Silakan masukkan password akun terdaftar Anda.');
    }
  };

  const handleEmployeeChange = (empId: string) => {
    setFormEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setFormBaseSalary(emp.baseSalary || 6000000);
    }
    const autoOvt = calculateOvertime(empId, formPeriod);
    setFormOvertimePay(autoOvt);
  };

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === formEmployeeId);
    if (!emp) {
      alert('Pilih karyawan yang valid.');
      return;
    }

    const grossSalary = Number(formBaseSalary) + Number(formFixedAllowance) + Number(formVariableAllowance) + Number(formOvertimePay) + Number(formBonusIncentive);
    const bpjsDeduction = Number(formBpjsDeduction);
    const taxPPh21 = Number(formTaxPPh21);
    const loanDeduction = Number(formLoanDeduction);
    const totalDeduction = bpjsDeduction + taxPPh21 + loanDeduction;
    const takeHomePay = grossSalary - totalDeduction;

    if (editingRecordId) {
      updatePayrollRecord(editingRecordId, {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        position: emp.position,
        period: formPeriod,
        baseSalary: Number(formBaseSalary),
        fixedAllowance: Number(formFixedAllowance),
        variableAllowance: Number(formVariableAllowance),
        overtimePay: Number(formOvertimePay),
        bonusIncentive: Number(formBonusIncentive),
        bpjsDeduction,
        taxPPh21,
        loanDeduction,
        grossSalary,
        totalDeduction,
        takeHomePay,
        paymentStatus: formStatus
      });
    } else {
      addPayrollRecord({
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        position: emp.position,
        period: formPeriod,
        baseSalary: Number(formBaseSalary),
        fixedAllowance: Number(formFixedAllowance),
        variableAllowance: Number(formVariableAllowance),
        overtimePay: Number(formOvertimePay),
        bonusIncentive: Number(formBonusIncentive),
        kpiCommission: 0,
        grossSalary,
        bpjsDeduction,
        taxPPh21,
        loanDeduction,
        totalDeduction,
        takeHomePay,
        paymentStatus: formStatus,
        paidDate: new Date().toISOString().substring(0, 10)
      });
    }
    setIsModalOpen(false);
  };

  const handleBatchCalculate = () => {
    employees.forEach(emp => {
      calculatePayrollForEmployee(emp.id, selectedPeriod);
    });
    alert(`Perhitungan otomatis Gaji (Payroll) untuk ${employees.length} karyawan periode ${selectedPeriod} selesai.`);
  };

  // Filter & deduplicate payroll records for selected period
  const rawPeriodPayrolls = payrolls.filter(p => p.period === selectedPeriod);
  const periodPayrollsMap = new Map<string, PayrollRecord>();
  rawPeriodPayrolls.forEach(p => {
    const key = (p.employeeName || p.employeeId).toLowerCase().trim();
    if (!periodPayrollsMap.has(key)) {
      periodPayrollsMap.set(key, p);
    } else {
      const existing = periodPayrollsMap.get(key)!;
      const pStatus = (p.paymentStatus || '').toLowerCase();
      const existStatus = (existing.paymentStatus || '').toLowerCase();
      if ((pStatus === 'done' || pStatus === 'paid') && (existStatus !== 'done' && existStatus !== 'paid')) {
        periodPayrollsMap.set(key, p);
      }
    }
  });
  const periodPayrolls = Array.from(periodPayrollsMap.values());
  
  // Staff vs Admin records
  const staffPayrollRecords = periodPayrolls.filter(p => 
    p.employeeName.toLowerCase().includes(currentUser.name.toLowerCase()) || 
    p.employeeId === currentUser.id ||
    p.employeeId === currentEmployee?.id
  );
  const activeStaffRecord = staffPayrollRecords[0] || periodPayrolls.find(p => p.employeeName.toLowerCase().includes(currentUser.name.toLowerCase())) || periodPayrolls[0];

  // Admin filtered payroll list
  const filteredPayrolls = periodPayrolls.filter(p => {
    const matchesSearch = p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const pStatus = (p.paymentStatus || 'pending').toLowerCase();
    const matchesStatus = statusFilter === 'all' ? true :
                          statusFilter === 'done' ? (pStatus === 'done' || pStatus === 'paid') :
                          statusFilter === 'pending' ? (pStatus === 'pending' || pStatus === 'processing') :
                          (pStatus === 'cancelled');

    const matchesDept = departmentFilter === 'All' ? true : p.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const pendingCount = periodPayrolls.filter(p => (p.paymentStatus || 'pending').toLowerCase() === 'pending').length;
  const doneCount = periodPayrolls.filter(p => (p.paymentStatus || 'pending').toLowerCase() === 'done' || (p.paymentStatus || '').toLowerCase() === 'paid').length;
  const totalPayrollSpend = periodPayrolls.reduce((sum, p) => sum + p.takeHomePay, 0);

  const departmentsList = Array.from(new Set(employees.map(e => e.department)));

  const handleExportCSV = () => {
    const exportData = isStaff ? staffPayrollRecords : filteredPayrolls;
    const data = exportData.map(p => ({
      ID: p.id,
      Nama: p.employeeName,
      Jabatan: p.position,
      Divisi: p.department,
      Periode: p.period,
      GajiPokok: p.baseSalary,
      Tunjangan: p.fixedAllowance + p.variableAllowance,
      BonusKPI: p.bonusIncentive + p.kpiCommission,
      Potongan: p.totalDeduction,
      TakeHomePay: p.takeHomePay,
      StatusBayar: p.paymentStatus || 'Pending'
    }));
    exportToCSV(`Payroll_Slip_${selectedPeriod.replace(/\s+/g, '_')}`, data);
  };

  const handleExportPDF = () => {
    const exportData = isStaff ? staffPayrollRecords : filteredPayrolls;
    const headers = ['Nama Karyawan', 'Jabatan', 'Gaji Pokok', 'Tunjangan', 'Potongan', 'Take Home Pay', 'Status'];
    const rows = exportData.map(p => [
      p.employeeName,
      p.position,
      formatIDR(p.baseSalary),
      formatIDR(p.fixedAllowance + p.variableAllowance),
      formatIDR(p.totalDeduction),
      formatIDR(p.takeHomePay),
      p.paymentStatus || 'pending'
    ]);
    exportToPDF(`Laporan Slip Gaji & Penggajian Periode ${selectedPeriod}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Slip Gaji & Penggajian (Payroll)" />

      {/* Top Header & Period Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isStaff ? 'Portal Slip Gaji Saya' : 'Enterprise Payroll & Compensation Engine'}
              </h2>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                isStaff 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                  : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}>
                {isStaff ? 'Mode Staff' : 'Mode Admin / HRD'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isStaff 
                ? 'Rincian gaji resmi, tunjangan jabatan, bonus KPI, serta potongan BPJS & PPh21.' 
                : 'Kelola penggajian masal, verifikasi status pembayaran, & cetak slip gaji karyawan.'}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/60 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-600">
            <Calendar className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Periode:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {periods.map(per => (
                <option key={per} value={per} className="dark:bg-slate-800">{per}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isSalaryUnlocked) {
                setIsSalaryUnlocked(false);
              } else {
                setShowUnlockModal(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition border ${
              isSalaryUnlocked
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200'
            }`}
            title={isSalaryUnlocked ? 'Kunci kembali Gaji Pokok' : 'Buka Kunci Gaji Pokok'}
          >
            {isSalaryUnlocked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isSalaryUnlocked ? 'Sembunyikan Nominal' : 'Buka Kunci Gaji'}</span>
          </button>

          <ExportDropdown onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} label="Export" />

          {!isStaff && (
            <>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Tambah Manual
              </button>
              <button
                onClick={handleBatchCalculate}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-sm transition"
              >
                <Calculator className="w-4 h-4" /> Hitung Masal
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Mode Switcher for Admin / Manager */}
      {!isStaff && (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Portal Slip Gaji Staff</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Konsol Admin Payroll & Processing</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION A: STAFF EXCLUSIVE VIEW (PAYS LIP PORTAL)                         */}
      {/* ========================================================================= */}
      {(isStaff || activeTab === 'staff') && (
        <StaffPayslipView 
          selectedEmployeeId={currentEmployee?.id} 
          onPeriodChange={setSelectedPeriod} 
        />
      )}

      {/* Legacy Staff View fallback removed in favor of modular StaffPayslipView */}
      {false && (
        <div className="space-y-6 animate-fadeIn">
          {/* Staff Personal Identity Badge Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {currentEmployee?.avatar ? (
                  <img
                    src={currentEmployee.avatar}
                    alt={currentEmployee.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white font-black text-2xl flex items-center justify-center border-2 border-rose-400 shadow-md">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center" title="Karyawan Aktif">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{currentUser.name}</h3>
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">
                    NIK: {currentEmployee?.nik || currentEmployee?.id || '3171011212900001'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentEmployee?.position || 'Staff Regular'} • Divisi {currentEmployee?.department || 'Operations'}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Bank: <strong className="text-slate-800 dark:text-slate-200">{currentEmployee?.bankName || 'BCA'} ({currentEmployee?.bankAccountNumber || '8291039102'})</strong></span>
                  <span>• NPWP: <strong className="text-slate-800 dark:text-slate-200">{currentEmployee?.npwp || 'Terdaftar'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {activeStaffRecord && (
                <button
                  onClick={() => setSelectedPayRecord(activeStaffRecord)}
                  className="w-full md:w-auto bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>Lihat & Cetak Slip Gaji Resmi</span>
                </button>
              )}
            </div>
          </div>

          {/* Hero Current Month Take Home Pay Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-rose-600/10 to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> TAKE HOME PAY (THP) PERIODE {selectedPeriod}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    (activeStaffRecord?.paymentStatus || '').toLowerCase() === 'done' || (activeStaffRecord?.paymentStatus || '').toLowerCase() === 'paid'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {(activeStaffRecord?.paymentStatus || '').toLowerCase() === 'done' || (activeStaffRecord?.paymentStatus || '').toLowerCase() === 'paid'
                      ? '✓ Transfer Berhasil'
                      : '⏳ Dalam Proses'}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {isSalaryUnlocked ? (
                      formatIDR(activeStaffRecord?.takeHomePay || 8500000)
                    ) : (
                      <span className="text-slate-400 tracking-widest">Rp •••••••••</span>
                    )}
                  </h2>
                  {!isSalaryUnlocked && (
                    <button
                      type="button"
                      onClick={() => setShowUnlockModal(true)}
                      className="text-xs text-rose-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Buka Kunci
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Ditransfer langsung ke rekening <strong className="text-white">{currentEmployee?.bankName || 'BCA'} {currentEmployee?.bankAccountNumber || '8291039102'}</strong> a/n {currentUser.name}.
                </p>
              </div>

              {/* Quick Summary Pill Bar */}
              <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 space-y-2 w-full md:w-72 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Gaji Pokok:</span>
                  <span className="font-mono font-bold text-white">
                    {isSalaryUnlocked ? formatIDR(activeStaffRecord?.baseSalary || 0) : 'Rp ••••••••'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Tunjangan & Bonus:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{formatIDR((activeStaffRecord?.fixedAllowance || 0) + (activeStaffRecord?.variableAllowance || 0) + (activeStaffRecord?.bonusIncentive || 0) + (activeStaffRecord?.kpiCommission || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700">
                  <span className="text-slate-400">Total Potongan (BPJS/Pajak):</span>
                  <span className="font-mono font-bold text-rose-400">
                    -{formatIDR(activeStaffRecord?.totalDeduction || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Earnings vs Deductions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> A. PENERIMAAN / PENDAPATAN (EARNINGS)
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  +{formatIDR(activeStaffRecord?.grossSalary || 0)}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Gaji Pokok (Base Salary)</div>
                    <div className="text-[10px] text-slate-400">Sesuai kontrak kerja terdaftar</div>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {isSalaryUnlocked ? formatIDR(activeStaffRecord?.baseSalary || 0) : 'Rp ••••••••'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Tunjangan Jabatan & Tetap</div>
                    <div className="text-[10px] text-slate-400">Tunjangan struktural (Input Manual)</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">
                    +{formatIDR(activeStaffRecord?.fixedAllowance || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Tunjangan Transportasi</div>
                    <div className="text-[10px] text-slate-400">Uang transport harian / operasional</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">
                    +{formatIDR(activeStaffRecord?.variableAllowance || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Uang Lembur (Auto-Sync Lembur)</div>
                    <div className="text-[10px] text-slate-400">Otomatis dari pengajuan lembur disetujui</div>
                  </div>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    +{formatIDR(activeStaffRecord?.overtimePay !== undefined && activeStaffRecord?.overtimePay > 0 ? activeStaffRecord.overtimePay : calculateOvertime(activeStaffRecord?.employeeId || '', selectedPeriod))}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Bonus Kinerja / Insentif KPI</div>
                    <div className="text-[10px] text-slate-400">Reward pencapaian target (Input Manual)</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">
                    +{formatIDR((activeStaffRecord?.bonusIncentive || 0) + (activeStaffRecord?.kpiCommission || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> B. POTONGAN RESMI (DEDUCTIONS)
                </h4>
                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                  -{formatIDR(activeStaffRecord?.totalDeduction || 0)}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Potongan BPJS</div>
                    <div className="text-[10px] text-slate-400">Iuran BPJS Kesehatan & Ketenagakerjaan (Input Manual)</div>
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatIDR(activeStaffRecord?.bpjsDeduction || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Pajak Penghasilan (PPh 21)</div>
                    <div className="text-[10px] text-slate-400">Pajak PPh 21 resmi (Input Manual)</div>
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatIDR(activeStaffRecord?.taxPPh21 || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Potongan Keterlambatan / Kasbon</div>
                    <div className="text-[10px] text-slate-400">Cicilan pinjaman / pinalti absen</div>
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatIDR(activeStaffRecord?.loanDeduction || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payslip History Table for Staff */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Riwayat Slip Gaji Saya
                </h3>
                <p className="text-xs text-slate-500">Arsip dokumen slip gaji bulanan yang telah diterbitkan perusahaan</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Periode Gaji</th>
                    <th className="p-3">Gaji Pokok</th>
                    <th className="p-3">Total Tunjangan</th>
                    <th className="p-3">Total Potongan</th>
                    <th className="p-3 text-right">Take Home Pay</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Aksi Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {staffPayrollRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Belum ada riwayat slip gaji untuk akun Anda pada periode {selectedPeriod}.
                      </td>
                    </tr>
                  ) : (
                    staffPayrollRecords.map((p, idx) => (
                      <tr key={`${p.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-rose-600" />
                            <span>{p.period}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono">
                          {isSalaryUnlocked ? formatIDR(p.baseSalary) : 'Rp ••••••••'}
                        </td>
                        <td className="p-3 font-mono text-emerald-600">
                          +{formatIDR(p.fixedAllowance + p.variableAllowance + p.bonusIncentive + p.kpiCommission)}
                        </td>
                        <td className="p-3 font-mono text-rose-600">
                          -{formatIDR(p.totalDeduction)}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white font-mono">
                          {formatIDR(p.takeHomePay)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            (p.paymentStatus || '').toLowerCase() === 'done' || (p.paymentStatus || '').toLowerCase() === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {p.paymentStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedPayRecord(p)}
                            className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-xl font-bold transition text-xs inline-flex items-center gap-1 border border-rose-200 dark:border-rose-900/50"
                          >
                            <FileText className="w-3.5 h-3.5" /> Pratinjau Slip
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: ADMIN / MANAGER / HRD EXCLUSIVE VIEW                           */}
      {/* ========================================================================= */}
      {!isStaff && activeTab === 'admin' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Automated New Month Alert Banner */}
          {!showAlertDismissed && (
            <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-300 dark:border-amber-500/40 p-4 rounded-3xl flex items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-2xl shrink-0 shadow-sm animate-bounce">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <span>Alert Sistem Otomatis: Validasi Penggajian Periode Baru</span>
                    <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-full text-[10px]">Aktif</span>
                  </h4>
                  <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mt-0.5">
                    Terdapat <strong className="underline">{pendingCount} karyawan</strong> dengan status pending pada periode {selectedPeriod}. Lakukan pemrosesan masal sebelum tanggal transfer gaji.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleBatchCalculate}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Hitung Masal Sekarang
                </button>
                <button
                  onClick={() => setShowAlertDismissed(true)}
                  className="p-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/40 rounded-xl transition"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Executive Summary Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran THP</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatIDR(totalPayrollSpend)}
              </h3>
              <p className="text-[11px] text-slate-500">Periode {selectedPeriod}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Pemrosesan</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" /> {doneCount} / {periodPayrolls.length} Done
              </h3>
              <p className="text-[11px] text-amber-600 font-semibold">{pendingCount} Karyawan Pending</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimasi BPJS Perusahaan</span>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {companyProfile.bpjsKesehatanRate}% / {companyProfile.bpjsKetenagakerjaanRate}%
              </h3>
              <p className="text-[11px] text-slate-500">Kesehatan & Ketenagakerjaan</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Karyawan Sdm</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {employees.length} Pegawai
              </h3>
              <p className="text-[11px] text-slate-500">Terdaftar di Database HC</p>
            </div>
          </div>

          {/* Master Payroll Search, Filters & Action Table */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Daftar Master Penggajian & Aksi Status Gaji
                </h3>
                <p className="text-xs text-slate-500">Gunakan tombol 'Done', 'Pending', atau 'Cancel' untuk memvalidasi pembayaran gaji karyawan</p>
              </div>

              {/* Search & Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari karyawan / jabatan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>

                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="All">Semua Divisi</option>
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <div className="inline-flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      statusFilter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setStatusFilter('done')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      statusFilter === 'done' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Done
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </div>

            {/* Master Table */}
            <div className="overflow-x-auto w-full">
              <table className="whitespace-nowrap min-w-full w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-700/60 border-b text-slate-600 dark:text-slate-300 font-bold">
                    <th className="p-3">Nama Karyawan</th>
                    <th className="p-3">Jabatan & Divisi</th>
                    <th className="p-3">Gaji Pokok</th>
                    <th className="p-3">Tunj. Transport</th>
                    <th className="p-3">Uang Lembur (Auto)</th>
                    <th className="p-3">Tunj. Tetap & Bonus</th>
                    <th className="p-3">Potongan</th>
                    <th className="p-3 text-right">Take Home Pay</th>
                    <th className="p-3 text-center">Status Pembayaran (Aksi)</th>
                    <th className="p-3 text-center">Kelola / Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredPayrolls.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-400">
                        Tidak ditemukan data penggajian yang sesuai dengan filter periode {selectedPeriod}.
                      </td>
                    </tr>
                  ) : (
                    filteredPayrolls.map((p, idx) => {
                      const currentStatus = (p.paymentStatus || 'pending').toLowerCase();
                      const ovtPay = p.overtimePay !== undefined && p.overtimePay > 0 
                        ? p.overtimePay 
                        : calculateOvertime(p.employeeId, p.period);
                      return (
                        <tr key={`${p.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div>{p.employeeName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">NIK: {p.employeeId}</div>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">
                            <div>{p.position}</div>
                            <div className="text-[10px] text-slate-400">{p.department}</div>
                          </td>
                          <td className="p-3 font-mono">
                            {isSalaryUnlocked ? (
                              formatIDR(p.baseSalary)
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowUnlockModal(true)}
                                className="text-slate-400 hover:text-slate-600 font-mono flex items-center gap-1"
                                title="Klik untuk membuka kunci Gaji Pokok"
                              >
                                <span>Rp ••••••••</span>
                                <Eye className="w-3 h-3 text-slate-400" />
                              </button>
                            )}
                          </td>
                          <td className="p-3 font-mono text-emerald-600">
                            +{formatIDR(p.variableAllowance || 0)}
                          </td>
                          <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">
                            +{formatIDR(ovtPay)}
                          </td>
                          <td className="p-3 font-mono text-emerald-600">
                            +{formatIDR((p.fixedAllowance || 0) + (p.bonusIncentive || 0) + (p.kpiCommission || 0))}
                          </td>
                          <td className="p-3 font-mono text-rose-600">
                            -{formatIDR(p.totalDeduction)}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 dark:text-white font-mono text-sm">
                            {formatIDR(p.takeHomePay)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                              <button
                                onClick={() => updatePayrollStatus(p.id, 'done')}
                                title="Tandai Sudah Digaji (Done)"
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                                  currentStatus === 'done' || currentStatus === 'paid'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" /> Done
                              </button>
                              <button
                                onClick={() => updatePayrollStatus(p.id, 'pending')}
                                title="Tandai Menunggu (Pending)"
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                                  currentStatus === 'pending' || currentStatus === 'processing'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-700'
                                }`}
                              >
                                <Clock className="w-3 h-3" /> Pending
                              </button>
                              <button
                                onClick={() => updatePayrollStatus(p.id, 'cancelled')}
                                title="Tandai Dibatalkan (Cancelled)"
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                                  currentStatus === 'cancelled'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-700'
                                }`}
                              >
                                <XCircle className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedPayRecord(p)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg font-bold transition text-[10px] inline-flex items-center gap-1"
                                title="Lihat Slip Gaji"
                              >
                                <FileText className="w-3.5 h-3.5" /> Slip
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition"
                                title="Edit Breakdown"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deletePayrollRecord(p.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition"
                                title="Hapus Record"
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: ADD/EDIT PAYROLL, SLIP GAJI PRINTABLE, & CREDENTIAL UNLOCK        */}
      {/* ========================================================================= */}

      {/* Modal Add / Edit Payroll */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <h3 className="font-extrabold text-base text-rose-600 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {editingRecordId ? 'Edit Data Breakdown Penggajian' : 'Tambah Data Gaji Karyawan'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Karyawan:</label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl font-medium"
                    required
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.position} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Periode Gaji:</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => {
                      const newPeriod = e.target.value;
                      setFormPeriod(newPeriod);
                      if (!editingRecordId) {
                        setFormVariableAllowance(calculateOvertime(formEmployeeId, newPeriod));
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl font-medium"
                  >
                    {periods.map(per => (
                      <option key={per} value={per}>{per}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gaji Pokok (Nominal Kontrak):</label>
                <div className="relative">
                  <input
                    type={isSalaryUnlocked ? "number" : "password"}
                    value={formBaseSalary}
                    onChange={(e) => setFormBaseSalary(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl font-mono font-bold pr-10"
                    required
                    disabled={!isSalaryUnlocked}
                  />
                  {!isSalaryUnlocked && (
                    <button
                      type="button"
                      onClick={() => setShowUnlockModal(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                      title="Buka Kunci Gaji Pokok"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-[11px]">Tunjangan & Pendapatan</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tunjangan Jabatan & Tetap (Rp):</label>
                    <input
                      type="number"
                      value={formFixedAllowance}
                      onChange={(e) => setFormFixedAllowance(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border p-2 rounded-lg font-mono text-xs"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tunjangan Transportasi (Rp):</label>
                    <input
                      type="number"
                      value={formVariableAllowance}
                      onChange={(e) => setFormVariableAllowance(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border p-2 rounded-lg font-mono text-xs"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Uang Lembur (Otomatis dari Pengajuan Lembur) (Rp):
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormOvertimePay(calculateOvertime(formEmployeeId, formPeriod))}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                      title="Hitung ulang uang lembur dari pengajuan disetujui"
                    >
                      <RefreshCw size={11} /> Recalculate
                    </button>
                  </div>
                  <input
                    type="number"
                    value={formOvertimePay}
                    onChange={(e) => setFormOvertimePay(Number(e.target.value))}
                    className="w-full bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 p-2 rounded-lg font-mono text-xs font-bold text-amber-900 dark:text-amber-300"
                    placeholder="0"
                  />
                  <div className="mt-1.5 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/50 p-2 rounded-xl border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between">
                    <span>
                      ⚡ Auto-Sync: <strong>{getApprovedOvertimeCount(formEmployeeId, formPeriod)}</strong> pengajuan lembur disetujui
                    </span>
                    <span className="font-mono font-bold">Total: {formatIDR(calculateOvertime(formEmployeeId, formPeriod))}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    * Hanya lembur &ge; 2 jam yang dihitung ke gaji (Rp 25.000/jam). Uang makan Rp 25.000 diberikan langsung terpisah.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Bonus Kinerja / Insentif KPI (Rp):</label>
                  <input
                    type="number"
                    value={formBonusIncentive}
                    onChange={(e) => setFormBonusIncentive(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border p-2 rounded-lg font-mono text-xs"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-3">
                <span className="font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide text-[11px]">Potongan Resmi & Kasbon (Input Manual)</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Potongan BPJS (Rp):</label>
                    <input
                      type="number"
                      value={formBpjsDeduction}
                      onChange={(e) => setFormBpjsDeduction(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border p-2 rounded-lg font-mono text-xs text-rose-600"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Potongan Pajak PPh 21 (Rp):</label>
                    <input
                      type="number"
                      value={formTaxPPh21}
                      onChange={(e) => setFormTaxPPh21(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border p-2 rounded-lg font-mono text-xs text-rose-600"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Potongan Kasbon / Absen / Lainnya (Rp):</label>
                  <input
                    type="number"
                    value={formLoanDeduction}
                    onChange={(e) => setFormLoanDeduction(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border p-2 rounded-lg font-mono text-xs text-rose-600"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Pembayaran:</label>
                <select
                  value={formStatus}
                  onChange={(e: any) => setFormStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl font-bold"
                >
                  <option value="pending">Pending (Menunggu Selesai)</option>
                  <option value="done">Done (Sudah Transfer Gaji)</option>
                  <option value="cancelled">Cancelled (Dibatalkan)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Simpan Data Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Gaji Modal / Printable Digital Payslip */}
      {selectedPayRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-300 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-4">
            
            {/* Header Letterhead */}
            <div className="border-b-2 border-rose-600 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-rose-600 uppercase tracking-tight">
                    {companyProfile.legalName || 'PT JERJHON ENTERPRISE INDONESIA'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">SLIP GAJI RESMI KARYAWAN • PERIODE {selectedPayRecord.period}</p>
                </div>
              </div>

              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border ${
                (selectedPayRecord.paymentStatus || '').toLowerCase() === 'done' || (selectedPayRecord.paymentStatus || '').toLowerCase() === 'paid'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {selectedPayRecord.paymentStatus || 'Pending'}
              </span>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div><span className="text-slate-400 block text-[10px]">Nama Karyawan:</span> <span className="font-bold text-slate-900">{selectedPayRecord.employeeName}</span></div>
              <div><span className="text-slate-400 block text-[10px]">Jabatan:</span> <span className="font-bold text-slate-900">{selectedPayRecord.position}</span></div>
              <div><span className="text-slate-400 block text-[10px]">Divisi / Departemen:</span> <span className="font-semibold text-slate-700">{selectedPayRecord.department}</span></div>
              <div><span className="text-slate-400 block text-[10px]">ID Transaksi Slip:</span> <span className="font-mono font-semibold text-slate-700">{selectedPayRecord.id}</span></div>
            </div>

            {/* Income & Deductions Breakdown */}
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold border-b pb-1 text-slate-800 flex items-center justify-between uppercase text-[11px]">
                  <span>A. PENERIMAAN / GAJI KOTOR</span>
                  <span className="text-emerald-600 font-mono">+{formatIDR(selectedPayRecord.grossSalary)}</span>
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Gaji Pokok:</span>
                    {isSalaryUnlocked ? (
                      <span className="font-mono font-bold text-slate-900">{formatIDR(selectedPayRecord.baseSalary)}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowUnlockModal(true)}
                        className="text-slate-400 hover:text-slate-600 font-mono flex items-center gap-1"
                        title="Buka Kunci Gaji Pokok"
                      >
                        <span>Rp ••••••••</span>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between text-slate-600"><span>Tunjangan Tetap & Jabatan:</span><span className="font-mono font-semibold">{formatIDR(selectedPayRecord.fixedAllowance)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Tunjangan Transportasi:</span><span className="font-mono font-semibold">{formatIDR(selectedPayRecord.variableAllowance)}</span></div>
                  <div className="flex justify-between text-amber-700 font-semibold"><span>Uang Lembur (Otomatis):</span><span className="font-mono">{formatIDR(selectedPayRecord.overtimePay || 0)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Bonus Performance & Insentif KPI:</span><span className="font-mono font-semibold">{formatIDR(selectedPayRecord.kpiCommission + selectedPayRecord.bonusIncentive)}</span></div>
                </div>
              </div>

              <div>
                <p className="font-bold border-b pb-1 text-slate-800 flex items-center justify-between uppercase text-[11px]">
                  <span>B. POTONGAN GAJI</span>
                  <span className="text-rose-600 font-mono">-{formatIDR(selectedPayRecord.totalDeduction)}</span>
                </p>
                <div className="space-y-1.5 pt-2 text-rose-600">
                  <div className="flex justify-between"><span>Potongan BPJS Kesehatan & Ketenagakerjaan:</span><span className="font-mono font-semibold">-{formatIDR(selectedPayRecord.bpjsDeduction)}</span></div>
                  <div className="flex justify-between"><span>Pajak Penghasilan (PPh 21):</span><span className="font-mono font-semibold">-{formatIDR(selectedPayRecord.taxPPh21)}</span></div>
                  <div className="flex justify-between"><span>Potongan Kasbon & Keterlambatan:</span><span className="font-mono font-semibold">-{formatIDR(selectedPayRecord.loanDeduction)}</span></div>
                </div>
              </div>

              {/* Take Home Pay Highlighting */}
              <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center bg-rose-50 p-3 rounded-2xl border border-rose-200">
                <div>
                  <span className="font-black text-rose-900 text-xs block">TAKE HOME PAY (THP)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Jumlah Bersih Ditransfer</span>
                </div>
                <span className="text-xl font-black text-rose-700 font-mono">{formatIDR(selectedPayRecord.takeHomePay)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printPayslipPDF(selectedPayRecord, companyProfile.companyName, formatIDR)}
                  className={`px-3.5 py-2 font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition ${
                    (selectedPayRecord.paymentStatus || '').toLowerCase() === 'done' || (selectedPayRecord.paymentStatus || '').toLowerCase() === 'paid'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-200 text-slate-500 border border-slate-300'
                  }`}
                  title={((selectedPayRecord.paymentStatus || '').toLowerCase() === 'done' || (selectedPayRecord.paymentStatus || '').toLowerCase() === 'paid') ? 'Cetak Slip PDF' : 'Terkunci: Menunggu status Done/Paid dari Admin/HR'}
                >
                  <Printer className="w-4 h-4" /> 
                  {((selectedPayRecord.paymentStatus || '').toLowerCase() === 'done' || (selectedPayRecord.paymentStatus || '').toLowerCase() === 'paid') ? 'Cetak Slip PDF' : 'PDF Terkunci'}
                </button>
                <button
                  onClick={async () => {
                    const empEmail = employees.find(e => e.id === selectedPayRecord.employeeId)?.email;
                    if (empEmail) {
                      alert('Mengirim slip gaji ke email karyawan...');
                      try {
                        const response = await fetch('/api/send-payslip', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: empEmail, record: selectedPayRecord, companyName: companyProfile.companyName, logoUrl: companyProfile.logoUrl })
                        });
                        if (response.ok) {
                          alert('Slip gaji berhasil dikirimkan ke e-mail karyawan!');
                        } else {
                          alert('Gagal mengirim email.');
                        }
                      } catch (error) {
                        alert('Terjadi kesalahan koneksi pengiriman email.');
                      }
                    } else {
                      alert('Email karyawan tidak ditemukan.');
                    }
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  <Mail className="w-4 h-4" /> Kirim ke Email
                </button>
              </div>
              <button
                onClick={() => setSelectedPayRecord(null)}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold transition"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Unlock Credentials Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-700">
              <div className="bg-rose-100 dark:bg-rose-950/60 p-2.5 rounded-2xl text-rose-600 dark:text-rose-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Verifikasi Kredensial Pengguna
                </h3>
                <p className="text-[10px] text-slate-400">Keamanan data gaji pokok</p>
              </div>
            </div>

            <form onSubmit={handleVerifyUnlock} className="space-y-4">
              <div>
                <label className="block font-bold text-[11px] text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Masukkan Password Akun Anda
                </label>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => {
                    setUnlockPassword(e.target.value);
                    setUnlockError('');
                  }}
                  placeholder="Password akun Anda..."
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white outline-none"
                  required
                  autoFocus
                />
                {unlockError ? (
                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">{unlockError}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Masukkan password akun Anda yang terdaftar pada sistem.
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
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Buka Kunci
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
