import React, { useState } from 'react';
import { 
  Receipt, Download, Printer, Eye, EyeOff, CheckCircle2, Clock, XCircle,
  Building2, CreditCard, TrendingUp, Calendar, User, ShieldCheck, 
  Sparkles, Wallet, FileText, ChevronRight, AlertCircle, RefreshCw, Check
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { printPayslipPDF } from '../../../utils/exportUtils';
import { PayrollRecord } from '../../../types';

interface StaffPayslipViewProps {
  selectedEmployeeId?: string;
  onPeriodChange?: (period: string) => void;
}

export const StaffPayslipView: React.FC<StaffPayslipViewProps> = ({
  selectedEmployeeId,
  onPeriodChange
}) => {
  const { 
    payrolls, 
    employees, 
    formatIDR, 
    companyProfile, 
    currentUser,
    isStaff,
    isAdmin 
  } = useERP();

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
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
    return periods;
  };

  const availablePeriods = generateAvailablePeriods();
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => getCurrentPeriodString());
  const [isSalaryVisible, setIsSalaryVisible] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Resolve default active employee ID
  const defaultEmpId = selectedEmployeeId || 
    employees.find(e => 
      (currentUser && e.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
      (currentUser && e.id === currentUser?.id) || 
      (currentUser && e.name?.toLowerCase() === currentUser?.name?.toLowerCase())
    )?.id || employees[0]?.id;

  const [activeEmpId, setActiveEmpId] = useState<string>(defaultEmpId || '');

  React.useEffect(() => {
    if (selectedEmployeeId) {
      setActiveEmpId(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  // Resolve target employee
  const targetEmployee = employees.find(e => e.id === activeEmpId) || 
    employees.find(e => 
      (currentUser && e.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
      e.id === currentUser?.id || 
      e.name?.toLowerCase() === currentUser?.name?.toLowerCase()
    ) || employees[0];

  // Access control: Non-admins can only view their own payslip
  const canAccessPayslip = isAdmin || (currentUser && targetEmployee && (targetEmployee.id === currentUser.id || targetEmployee.email?.toLowerCase() === currentUser.email?.toLowerCase()));
  
  if (!canAccessPayslip) {
    return (
      <div className="p-6 text-center text-slate-500">
        Anda tidak memiliki akses untuk melihat slip gaji karyawan lain.
      </div>
    );
  }

  const employeeNik = targetEmployee?.nik || targetEmployee?.id || '3171011212900001';

  // Find payroll record for selected employee & period
  const userPayrolls = payrolls.filter(p => 
    p.employeeId === targetEmployee?.id || 
    p.employeeName?.toLowerCase() === targetEmployee?.name?.toLowerCase()
  );

  const activeRecord: PayrollRecord | undefined = userPayrolls.find(p => p.period === selectedPeriod);

  // Fallback data if record not found
  const baseSalary = activeRecord?.baseSalary ?? targetEmployee?.baseSalary ?? 0;
  const fixedAllowance = activeRecord?.fixedAllowance ?? 0;
  const variableAllowance = activeRecord?.variableAllowance ?? 0;
  const overtimePay = activeRecord?.overtimePay ?? 0;
  const bonusIncentive = (activeRecord?.bonusIncentive ?? 0) + (activeRecord?.kpiCommission ?? 0);
  const grossSalary = activeRecord?.grossSalary ?? (baseSalary + fixedAllowance + variableAllowance + overtimePay + bonusIncentive);
  
  const bpjsDeduction = activeRecord?.bpjsDeduction ?? 0;
  const taxPPh21 = activeRecord?.taxPPh21 ?? 0;
  const loanDeduction = activeRecord?.loanDeduction ?? 0;
  const totalDeduction = activeRecord?.totalDeduction ?? (bpjsDeduction + taxPPh21 + loanDeduction);
  
  const takeHomePay = activeRecord?.takeHomePay ?? (grossSalary - totalDeduction);
  
  // Payment status synchronized from Admin/HRD/Manager
  const pStatusRaw = (activeRecord?.paymentStatus || 'pending').toLowerCase();
  const isPaid = activeRecord ? (pStatusRaw === 'done' || pStatusRaw === 'paid') : false;
  const isVerified = activeRecord ? (pStatusRaw === 'verified' || pStatusRaw === 'approved') : false;
  const isCancelled = activeRecord ? (pStatusRaw === 'cancelled' || pStatusRaw === 'canceled') : false;
  const isPending = !isPaid && !isVerified && !isCancelled;
  const paymentStatus = activeRecord?.paymentStatus || 'pending';
  const paidDate = activeRecord?.paidDate || '-';

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    if (onPeriodChange) onPeriodChange(period);
  };

  const handleDownloadPDF = (recordToPrint?: any) => {
    const targetRec = recordToPrint || activeRecord;
    const currentStatus = (targetRec?.paymentStatus || paymentStatus || '').toLowerCase();
    const currentIsPaid = currentStatus === 'done' || currentStatus === 'paid';
    
    if (!currentIsPaid) {
      alert('Slip gaji belum dapat diunduh / dicetak (PDF) karena status pembayaran untuk periode ini belum diubah menjadi "Done" atau "Paid" oleh Tim Admin / HR.');
      return;
    }

    if (targetRec && targetRec.id) {
      printPayslipPDF({ ...targetRec, employeeNik }, companyProfile.name || 'PT Jerjhon Enterprise', formatIDR);
    } else {
      const syntheticRecord: PayrollRecord & { employeeNik: string } = {
        id: `SLIP-${targetEmployee?.id || 'EMP'}-${selectedPeriod.replace(/\s+/g, '')}`,
        employeeId: targetEmployee?.id || 'EMP-001',
        employeeName: targetEmployee?.name || currentUser?.name || 'Karyawan',
        department: targetEmployee?.department || '-',
        position: targetEmployee?.position || '-',
        period: selectedPeriod,
        baseSalary,
        fixedAllowance,
        variableAllowance,
        overtimePay: 0,
        bonusIncentive,
        kpiCommission: 0,
        grossSalary,
        bpjsDeduction,
        taxPPh21,
        loanDeduction,
        totalDeduction,
        takeHomePay,
        paymentStatus,
        paidDate,
        employeeNik
      };
      printPayslipPDF(syntheticRecord, companyProfile.name || 'PT Jerjhon Enterprise', formatIDR);
    }
  };

  const handleCopySlipId = () => {
    const slipId = activeRecord?.id || `SLIP-${targetEmployee?.id || 'EMP'}-${selectedPeriod.replace(/\s+/g, '')}`;
    navigator.clipboard.writeText(slipId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Period Control */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Receipt size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isStaff ? 'Slip Gaji Saya (Staff Portal)' : isAdmin ? 'Portal Slip Gaji Digital (Admin)' : 'Portal Slip Gaji Digital (Manager)'}
              </h2>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                isAdmin
                  ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              }`}>
                {isAdmin ? 'Akses Admin' : isStaff ? 'Resmi Staff' : 'Akses Manager'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin 
                ? 'Portal pratinjau slip gaji resmi seluruh karyawan dan pimpinan. Unduh PDF slip gaji resmi.' 
                : 'Lihat rincian gaji pokok, tunjangan, potongan resmi, & unduh PDF slip gaji resmi.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Employee Selector for Admin Only */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
                <User size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>Pilih Karyawan:</span>
              </div>
              <select
                value={targetEmployee?.id || ''}
                onChange={(e) => setActiveEmpId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[210px] truncate"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id} className="dark:bg-slate-800 text-slate-900 dark:text-white">
                    {emp.name} (NIK: {emp.nik || emp.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Calendar size={15} className="text-blue-600 dark:text-blue-400" />
              <span>Periode:</span>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodSelect(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {availablePeriods.map(period => (
                <option key={period} value={period} className="dark:bg-slate-800 text-slate-900 dark:text-white">
                  {period}
                </option>
              ))}
            </select>
          </div>

          {/* Direct PDF Download Button */}
          <button
            onClick={handleDownloadPDF}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${
              isPaid
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
            }`}
            title={isPaid ? 'Unduh slip gaji PDF' : 'Slip terkunci: Menunggu status Done/Paid dari Admin/HR'}
          >
            <Download size={15} />
            <span>{isPaid ? 'Unduh Slip Gaji (PDF)' : 'PDF (Terkunci Menunggu Paid)'}</span>
          </button>
        </div>
      </div>

      {/* Staff Identity Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700 relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-20 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-extrabold text-white shadow-lg border border-white/20 shrink-0">
              {targetEmployee?.name ? targetEmployee.name.charAt(0) : 'E'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-white">{targetEmployee?.name || currentUser?.name || 'Karyawan'}</h3>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-md border border-blue-400/30">
                  NIK: {employeeNik}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium flex items-center gap-2 flex-wrap">
                <span>{targetEmployee?.position || '-'}</span>
                <span>•</span>
                <span className="text-blue-300 font-semibold">{targetEmployee?.department || '-'}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 pt-1">
                <CreditCard size={13} className="text-amber-400" />
                <span>Rekening: {targetEmployee?.bankName || 'BCA'} - {targetEmployee?.bankAccountNumber || '8839210291'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 border-slate-700/80 pt-3 md:pt-0">
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Status Pembayaran</span>
              {!activeRecord ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border mt-1 bg-slate-500/20 text-slate-300 border-slate-500/30">
                  <AlertCircle size={13} className="text-slate-400" />
                  <span>Belum Diisi (Empty)</span>
                </div>
              ) : (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border mt-1 ${
                  isPaid
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : isVerified
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : isCancelled
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {isPaid ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <span>Done (Dibayar)</span>
                    </>
                  ) : isVerified ? (
                    <>
                      <ShieldCheck size={13} className="text-blue-400" />
                      <span>Verified (Pending)</span>
                    </>
                  ) : isCancelled ? (
                    <>
                      <XCircle size={13} className="text-rose-400" />
                      <span>Canceled (Dibatalkan)</span>
                    </>
                  ) : (
                    <>
                      <Clock size={13} className="text-amber-400" />
                      <span>Pending</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="text-right font-mono text-[11px] text-slate-400">
              <span>TGL TRANSFER: {isPaid ? paidDate : '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Take Home Pay & Breakdown conditional display */}
      {!activeRecord ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Data Gaji Belum Diisi / Tersedia
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Admin, Manager, atau HRD belum mengisi rincian gaji untuk <strong className="text-slate-800 dark:text-slate-200">{targetEmployee?.name}</strong> pada periode <strong className="text-slate-800 dark:text-slate-200">{selectedPeriod}</strong>.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
              *Tampilan slip gaji dan seluruh rincian penerimaan akan otomatis muncul setelah diisi oleh manajemen.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Take Home Pay Hero Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            {/* Real-time Processing Stage Timeline Tracker */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-mono">
                  <RefreshCw size={12} className="animate-spin text-indigo-500" />
                  Alur Real-time Pemrosesan Gaji (Salary Processing Stages)
                </p>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                  Sistem Otomatis
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                {/* Stage 1: Pending */}
                <div className={`flex flex-col p-3 rounded-xl border transition-all ${
                  isPending 
                    ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-300 shadow-xs' 
                    : (isVerified || isPaid)
                    ? 'bg-emerald-500/5 border-emerald-200 dark:border-emerald-950/40 text-slate-700 dark:text-slate-300'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      isPending 
                        ? 'bg-amber-500 text-white' 
                        : (isVerified || isPaid)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      {(isVerified || isPaid) ? '✓' : '1'}
                    </span>
                    <span className="text-xs font-bold">Stage 1: Pending</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-7 leading-tight">
                    {(isVerified || isPaid) ? 'Gaji selesai dikalkulasi & diproses' : 'Menunggu kalkulasi atau persetujuan pimpinan'}
                  </p>
                </div>

                {/* Stage 2: Verified */}
                <div className={`flex flex-col p-3 rounded-xl border transition-all ${
                  isVerified 
                    ? 'bg-blue-500/10 border-blue-300 dark:border-blue-700/80 text-blue-900 dark:text-blue-300 shadow-xs' 
                    : isPaid
                    ? 'bg-emerald-500/5 border-emerald-200 dark:border-emerald-950/40 text-slate-700 dark:text-slate-300'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      isVerified 
                        ? 'bg-blue-50 text-white' 
                        : isPaid
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      {isPaid ? '✓' : '2'}
                    </span>
                    <span className="text-xs font-bold">Stage 2: Verified</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-7 leading-tight">
                    {isPaid ? 'Diverifikasi Keuangan & disetujui' : isVerified ? 'Sedang berada dalam antrean kliring bank' : 'Menunggu verifikasi rincian data'}
                  </p>
                </div>

                {/* Stage 3: Paid */}
                <div className={`flex flex-col p-3 rounded-xl border transition-all ${
                  isPaid 
                    ? 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-300 shadow-xs' 
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      isPaid ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      3
                    </span>
                    <span className="text-xs font-bold">Stage 3: Paid</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-7 leading-tight">
                    {isPaid ? 'Dana berhasil ditransfer & slip gaji dirilis' : 'Menunggu penyelesaian transfer bank'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Wallet size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 block">
                    Gaji Bersih Diterima (Take Home Pay)
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Periode {selectedPeriod}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsSalaryVisible(!isSalaryVisible)}
                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                title={isSalaryVisible ? 'Sembunyikan Nominal Gaji' : 'Tampilkan Nominal Gaji'}
              >
                {isSalaryVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                <span className="hidden sm:inline">{isSalaryVisible ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50">
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-tight">
                  {isSalaryVisible ? formatIDR(takeHomePay) : 'Rp ••••••••••'}
                </div>
                <div className="text-xs text-emerald-800/80 dark:text-emerald-300 font-medium mt-1 flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Sudah termasuk gaji pokok + seluruh tunjangan dikurangi potongan resmi</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <button
                  onClick={handleDownloadPDF}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition ${
                    isPaid
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}
                  title={isPaid ? 'Cetak / Download PDF' : 'Slip terkunci: Menunggu status Done/Paid dari Admin/HR'}
                >
                  <Download size={14} />
                  <span>{isPaid ? 'Cetak / Download PDF' : 'PDF Terkunci'}</span>
                </button>
                <button
                  onClick={handleCopySlipId}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                  title="Salin ID Slip Gaji"
                >
                  {copiedId ? <Check size={14} className="text-emerald-500" /> : <FileText size={14} />}
                  <span>{copiedId ? 'Tersalin' : 'Salin Ref'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-500 dark:text-slate-400 font-medium block">Gaji Pokok:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {isSalaryVisible ? formatIDR(baseSalary) : 'Rp ••••••••'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-500 dark:text-slate-400 font-medium block">Total Tunjangan & Bonus:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  +{isSalaryVisible ? formatIDR(fixedAllowance + variableAllowance + overtimePay + bonusIncentive) : 'Rp ••••••••'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-500 dark:text-slate-400 font-medium block">Total Potongan Resmi:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                  -{isSalaryVisible ? formatIDR(totalDeduction) : 'Rp ••••••••'}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Grid: Earnings vs Deductions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <TrendingUp size={18} />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    A. PENERIMAAN / GAJI KOTOR (EARNINGS)
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  +{isSalaryVisible ? formatIDR(grossSalary) : 'Rp ••••••••'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Base Salary */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Gaji Pokok (Base Salary)</div>
                    <div className="text-[10px] text-slate-400">Gaji standar sesuai perjanjian kerja</div>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {isSalaryVisible ? formatIDR(baseSalary) : 'Rp ••••••••'}
                  </span>
                </div>

                {/* Fixed Allowance */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Tunjangan Jabatan & Tetap</div>
                    <div className="text-[10px] text-slate-400">Tunjangan struktural bulanan</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{isSalaryVisible ? formatIDR(fixedAllowance) : 'Rp ••••••••'}
                  </span>
                </div>

                {/* Variable Allowance - Transport */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Tunjangan Transportasi</div>
                    <div className="text-[10px] text-slate-400">Subsidi operasional perjalanan & kehadiran</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{isSalaryVisible ? formatIDR(variableAllowance) : 'Rp ••••••••'}
                  </span>
                </div>

                {/* Overtime Pay */}
                <div className="flex justify-between items-center p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <span>Uang Lembur</span>
                      <span className="text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Otomatis Pengajuan</span>
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400">Dihitung otomatis dari lembur yang disetujui</div>
                  </div>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    +{isSalaryVisible ? formatIDR(overtimePay) : 'Rp ••••••••'}
                  </span>
                </div>

                {/* Bonus KPI */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Bonus Kinerja / Insentif KPI</div>
                    <div className="text-[10px] text-slate-400">Insentif pencapaian target bulanan</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{isSalaryVisible ? formatIDR(bonusIncentive) : 'Rp ••••••••'}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    <CreditCard size={18} />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    B. POTONGAN RESMI (DEDUCTIONS)
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                  -{isSalaryVisible ? formatIDR(totalDeduction) : 'Rp ••••••••'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* BPJS */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Potongan BPJS (Kesehatan & TK)</div>
                    <div className="text-[10px] text-slate-400">Iuran jaminan kesehatan & hari tua pekerja</div>
                  </div>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    -{isSalaryVisible ? formatIDR(bpjsDeduction) : 'Rp ••••••••'}
                  </span>
                </div>

                {/* PPh 21 */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Pajak Penghasilan (PPh 21)</div>
                    <div className="text-[10px] text-slate-400">Pajak penghasilan pasal 21 resmi</div>
                  </div>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    -{isSalaryVisible ? formatIDR(taxPPh21) : 'Rp ••••••••'}
                  </span>
                </div>

                {/* Loan Deduction */}
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Potongan Kasbon & Absensi</div>
                    <div className="text-[10px] text-slate-400">Angsuran kasbon / potongan keterlambatan</div>
                  </div>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    -{isSalaryVisible ? formatIDR(loanDeduction) : 'Rp ••••••••'}
                  </span>
                </div>

                {/* Formula Note */}
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Verifikasi Otomatis Finance</span>
                    Potongan dikalkulasikan secara otomatis berdasarkan Peraturan Ketenagakerjaan & Kebijakan Internal Perusahaan.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payslip History Cards / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Receipt size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Riwayat Slip Gaji Terbit</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Akses & unduh dokumen slip gaji periode sebelumnya</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3 font-semibold">Periode</th>
                <th className="py-2.5 px-3 font-semibold">Gaji Kotor</th>
                <th className="py-2.5 px-3 font-semibold">Total Potongan</th>
                <th className="py-2.5 px-3 font-semibold">Take Home Pay</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {availablePeriods.filter(period => userPayrolls.some(p => p.period === period)).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500 font-semibold font-mono">
                    Belum ada riwayat slip gaji yang diisi atau diterbitkan.
                  </td>
                </tr>
              ) : (
                availablePeriods.map(period => {
                  const periodRecord = userPayrolls.find(p => p.period === period);
                  if (!periodRecord) return null;

                  const periodTHP = periodRecord.takeHomePay;
                  const periodGross = periodRecord.grossSalary;
                  const periodDed = periodRecord.totalDeduction;
                  const isCurrent = period === selectedPeriod;

                  const pStatusRaw = (periodRecord.paymentStatus || '').toLowerCase();
                  const isPPaid = pStatusRaw === 'done' || pStatusRaw === 'paid';
                  const isPVerified = pStatusRaw === 'verified' || pStatusRaw === 'approved';
                  const isPCancelled = pStatusRaw === 'cancelled' || pStatusRaw === 'canceled';

                  return (
                    <tr 
                      key={period} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                        isCurrent ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{period}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                              Aktif
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {isSalaryVisible ? formatIDR(periodGross) : 'Rp ••••••••'}
                      </td>
                      <td className="py-3 px-3 font-mono text-rose-600 dark:text-rose-400">
                        -{isSalaryVisible ? formatIDR(periodDed) : 'Rp ••••••••'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {isSalaryVisible ? formatIDR(periodTHP) : 'Rp ••••••••'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isPPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Done
                          </span>
                        ) : isPVerified ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            Pending
                          </span>
                        ) : isPCancelled ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            Canceled
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            handlePeriodSelect(period);
                            handleDownloadPDF(periodRecord);
                          }}
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl border transition ${
                            isPPaid
                              ? 'text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
                              : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                          title={isPPaid ? 'Unduh PDF' : 'Terkunci: Menunggu status Done/Paid Admin/HR'}
                        >
                          <Download size={13} />
                          <span>{isPPaid ? 'PDF' : 'Terkunci'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Disclaimer Footer */}
      <div className="text-center text-slate-400 dark:text-slate-500 text-[11px] space-y-1 py-2">
        <p>© {new Date().getFullYear()} {companyProfile.name || 'PT Jerjhon Enterprise'}. All Rights Reserved.</p>
        <p>Dokumen ini bersifat rahasia (CONFIDENTIAL) dan diterbitkan secara resmi melalui Sistem ERP Enterprise.</p>
      </div>
    </div>
  );
};
