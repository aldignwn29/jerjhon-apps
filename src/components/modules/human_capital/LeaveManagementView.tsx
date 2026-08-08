import React, { useState } from 'react';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, XCircle, Plus, 
  Search, Download, Edit3, Trash2, Shield, Laptop, DollarSign, 
  FileText, ArrowRight, User, Check, X, Filter, Info, Sparkles,
  PieChart, Award, Calculator, Coffee, AlertTriangle
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { LeaveRequest, OvertimeRequest, Employee } from '../../../types';

export const LeaveManagementView: React.FC = () => {
  const { 
    attendance, leaveRequests, 
    overtimeRequests, 
    employees, 
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    updateLeaveStatus,
    addOvertimeRequest,
    updateOvertimeStatus,
    deleteOvertimeRequest,
    currentUser,
    isStaff
  } = useERP();

  if (!currentUser) return null;

  // Role Control Mode: Staff View vs Management View
  const [viewRoleMode, setViewRoleMode] = useState<'staff' | 'management'>(
    isStaff ? 'staff' : 'management'
  );

  // Sync if role changes
  React.useEffect(() => {
    if (isStaff) {
      setViewRoleMode('staff');
    }
  }, [isStaff]);

  // Active Main Tab: 'leave_permission' or 'overtime'
  const [activeTab, setActiveTab] = useState<'leave_permission' | 'overtime'>('leave_permission');

  // Selected Employee for Staff Terminal Mode
  const loggedInEmployee = employees.find(
    e => e.id === currentUser.id || 
         e.email.toLowerCase() === currentUser.email.toLowerCase() ||
         e.name.toLowerCase().includes(currentUser.name.toLowerCase())
  );

  const [activeStaffId, setActiveStaffId] = useState<string>(
    loggedInEmployee?.id || employees[0]?.id || ''
  );

  // Sync activeStaffId with logged in user
  React.useEffect(() => {
    if (loggedInEmployee?.id) {
      setActiveStaffId(loggedInEmployee.id);
    }
  }, [currentUser.id, currentUser.email]);
  const activeStaff = employees.find(e => e.id === activeStaffId) || employees[0];

  // Sync leaveForm and overtimeForm employeeId with loggedInEmployee for non-admin staff
  React.useEffect(() => {
    if (isStaff && loggedInEmployee?.id) {
      setLeaveForm(prev => ({ ...prev, employeeId: loggedInEmployee.id }));
      setOvertimeForm(prev => ({ ...prev, employeeId: loggedInEmployee.id }));
    }
  }, [isStaff, loggedInEmployee?.id]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Modals state
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showApplyOvertimeModal, setShowApplyOvertimeModal] = useState(false);
  const [showRuleInfoModal, setShowRuleInfoModal] = useState(false);
  
  // Multi-Stage Leave Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [approvalStage, setApprovalStage] = useState<number>(1);
  const [approvalDecision, setApprovalDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [approvalComment, setApprovalComment] = useState('');

  // Form State: Leave / Permission
  const [leaveForm, setLeaveForm] = useState({
    employeeId: activeStaff?.id || employees[0]?.id || '',
    type: 'Cuti Tahunan' as LeaveRequest['type'],
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    totalDays: 1,
    reason: 'Acara keluarga & keperluan pribadi'
  });

  // Form State: Overtime
  const [overtimeForm, setOvertimeForm] = useState({
    employeeId: activeStaff?.id || employees[0]?.id || '',
    date: new Date().toISOString().substring(0, 10),
    startTime: '17:00',
    endTime: '19:30',
    reason: 'Pengerjaan audit stok gudang bulanan'
  });

  // Calculate Overtime Duration and Payout Estimate
  const calculateOvertimeHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diffHours = (eH + eM / 60) - (sH + sM / 60);
    if (diffHours < 0) diffHours += 24;
    return Math.round(diffHours * 10) / 10;
  };

  const calculatedOvtHours = calculateOvertimeHours(overtimeForm.startTime, overtimeForm.endTime);
  const isLessThan2Hours = calculatedOvtHours < 2;
  const estimatedMealAllowance = 25000;
  const estimatedOvertimePay = isLessThan2Hours ? 0 : Math.round(calculatedOvtHours * 25000);
  const estimatedTotalPayout = estimatedMealAllowance + estimatedOvertimePay;

  // Helper to calculate Employee Leave Balance & Quotas (Owner Rules)
  // Owner Rule: 12 days annual leave initial
  // Rule 1: 1 Day Full Day Izin = 1 Leave Day deducted
  // Rule 2: 3x Setengah Hari Izin = 1 Leave Day deducted
  const calculateEmployeeLeaveBalance = (empId: string) => {
    const ANNUAL_LEAVE_QUOTA = 12;
    const currentYear = new Date().getFullYear().toString();

    const empLeaves = leaveRequests.filter(
      l => l.employeeId === empId && 
           l.status === 'Approved' &&
           ((l.startDate && l.startDate.startsWith(currentYear)) || (l.appliedDate && l.appliedDate.startsWith(currentYear)))
    );

    // 1. Used Annual Leave (Cuti Tahunan)
    const usedCutiTahunan = empLeaves
      .filter(l => l.type === 'Cuti Tahunan')
      .reduce((sum, l) => sum + l.totalDays, 0);

    // 2. Used Full Day Izin
    const usedIzinFullday = empLeaves
      .filter(l => l.type === 'Izin Full Day')
      .reduce((sum, l) => sum + l.totalDays, 0);

    // 2.5 Used Cuti Pengganti
    const usedCutiPengganti = empLeaves
      .filter(l => l.type === 'Cuti Pengganti Libur')
      .reduce((sum, l) => sum + l.totalDays, 0);

    // 3. Count Half-Day Izin (Izin Setengah Hari)
    const countIzinSetengahHari = empLeaves
      .filter(l => l.type === 'Izin Setengah Hari')
      .length;

    // 3x Setengah Hari = 1 Leave Day deducted
    const deductionFromSetengahHari = Math.floor(countIzinSetengahHari / 3);
    const remainderSetengahHari = countIzinSetengahHari % 3;

    // 4. Calculate Replacement Leave Days (Hari Libur Pengganti)
    // Employees get 1 replacement day off if they attend on Saturday or Sunday.
    const replacementLeaveDays = (attendance || []).filter(
      a => a.employeeId === empId && 
           a.status === 'Hadir' &&
           a.date.startsWith(currentYear) &&
           (new Date(a.date).getDay() === 0 || new Date(a.date).getDay() === 6)
    ).length;

    const totalQuota = ANNUAL_LEAVE_QUOTA + replacementLeaveDays;

    // Total Leave Days Deducted
    const totalDeductedDays = usedCutiTahunan + usedIzinFullday + usedCutiPengganti + deductionFromSetengahHari;
    const remainingQuota = Math.max(0, totalQuota - totalDeductedDays);

    return {
      annualQuota: totalQuota,
      baseQuota: ANNUAL_LEAVE_QUOTA,
      replacementLeaveDays,
      usedCutiTahunan,
      usedIzinFullday,
      usedCutiPengganti,
      countIzinSetengahHari,
      deductionFromSetengahHari,
      remainderSetengahHari,
      totalDeductedDays,
      remainingQuota
    };
  };

  const staffBalance = calculateEmployeeLeaveBalance(activeStaff?.id || '');

  // Handle Leave Submit
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === leaveForm.employeeId);
    if (!emp) return;

    if (selectedLeave) {
      updateLeaveRequest(selectedLeave.id, {
        ...leaveForm,
        employeeName: emp.name,
        totalDays: Number(leaveForm.totalDays)
      });
      alert(`Pengajuan ${leaveForm.type} untuk ${emp.name} berhasil diperbarui!`);
    } else {
      addLeaveRequest({
        employeeId: emp.id,
        employeeName: emp.name,
        type: leaveForm.type as LeaveRequest['type'],
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        totalDays: Number(leaveForm.totalDays),
        reason: leaveForm.reason
      });
      alert(`Pengajuan ${leaveForm.type} untuk ${emp.name} berhasil terkirim! HR akan memverifikasi.`);
    }

    setShowApplyLeaveModal(false);
    setSelectedLeave(null);
  };

  // Handle Overtime Submit
  const handleOvertimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === overtimeForm.employeeId);
    if (!emp) return;

    if (calculatedOvtHours <= 0) {
      alert('Jam selesai lembur harus setelah jam mulai!');
      return;
    }

    addOvertimeRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      date: overtimeForm.date,
      startTime: overtimeForm.startTime,
      endTime: overtimeForm.endTime,
      hours: calculatedOvtHours,
      reason: overtimeForm.reason
    });

    setShowApplyOvertimeModal(false);
    alert(`Pengajuan Lembur ${calculatedOvtHours} Jam (${emp.name}) berhasil dikirim.`);
  };

  const handleOpenApprovalModal = (req: LeaveRequest) => {
    setSelectedLeave(req);
    // Auto-detect correct stage: if stage 1 is already approved, set stage 2. Else set stage 1.
    setApprovalStage(req.stage1Approved ? 2 : 1);
    setApprovalDecision('Approved');
    setApprovalComment('');
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;
    
    updateLeaveStatus(selectedLeave.id, approvalDecision, currentUser.name, approvalStage, approvalComment);
    setShowApprovalModal(false);
    setSelectedLeave(null);
  };

  // Filtered Lists
  const filteredLeaves = leaveRequests.filter(l => {
    const matchSearch = l.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' || l.status === filterStatus;
    const matchType = filterType === 'All' || l.type === filterType;
    const matchStaff = viewRoleMode === 'staff' ? l.employeeId === activeStaff?.id : true;
    return matchSearch && matchStatus && matchType && matchStaff;
  });

  const filteredOvertimes = overtimeRequests.filter(o => {
    const matchSearch = o.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        o.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    const matchStaff = viewRoleMode === 'staff' ? o.employeeId === activeStaff?.id : true;
    return matchSearch && matchStatus && matchStaff;
  });

  return (
    <div className="space-y-6">
      
      <RoleAccessBanner moduleName="Pengajuan Cuti, Izin & Lembur" />

      {/* Top Header Banner with Mode Switcher & Tab Switcher */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-[#b90f0f]/10 text-[#b90f0f] p-2.5 rounded-xl font-bold">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Sistem Cuti, Izin & Lembur Karyawan
              </h2>
              <p className="text-xs text-slate-500">
                Manajemen Kuota Cuti Owner (12 Hari/Thn), Regula Izin Setengah Hari, & Kalkulator Kompensasi Lembur
              </p>
            </div>
          </div>

          {/* Mode Switcher (Staff vs Management) */}
          {!isStaff && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-600 w-full md:w-auto justify-between">
              <button
                onClick={() => setViewRoleMode('staff')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewRoleMode === 'staff'
                    ? 'bg-white dark:bg-slate-800 text-[#b90f0f] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Terminal Staff (Pengajuan Saya)</span>
              </button>

              <button
                onClick={() => setViewRoleMode('management')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewRoleMode === 'management'
                    ? 'bg-[#b90f0f] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Control Panel HR & Owner</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Switcher: Leave/Permission vs Overtime */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
          <button
            onClick={() => setActiveTab('leave_permission')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'leave_permission'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#b90f0f]" />
            <span>Manajemen Cuti & Izin</span>
          </button>

          <button
            onClick={() => setActiveTab('overtime')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overtime'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Pengajuan & Kompensasi Lembur</span>
          </button>

          <button
            onClick={() => setShowRuleInfoModal(true)}
            className="ml-auto text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
          >
            <Info className="w-4 h-4" />
            <span>Aturan Owner & Kebijakan Cuti/Lembur</span>
          </button>
        </div>

      </div>

      {/* Staff Account Selector in Staff Mode */}
      {viewRoleMode === 'staff' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{isStaff ? 'Profil Karyawan Aktif:' : 'Pilih profil karyawan untuk simulasi tampilan Terminal Cuti & Lembur:'}</span>
          </div>
          {isStaff ? (
            <div className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-1.5 font-bold text-slate-800 dark:text-white">
              {activeStaff?.name} — {activeStaff?.position} ({activeStaff?.department})
            </div>
          ) : (
            <select
              value={activeStaffId}
              onChange={(e) => setActiveStaffId(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-1.5 font-bold text-slate-800 dark:text-white outline-none"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.position} ({e.department})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: CUTI & IZIN MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'leave_permission' && (
        <div className="space-y-6">
          
          {/* Owner Rule & Quota Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Card 1: Annual Leave Quota */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kuota Cuti Owner</span>
                <span className="p-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-xs font-bold">12 Hari / Thn</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {viewRoleMode === 'staff' ? staffBalance.remainingQuota : 12} Hari
              </p>
              <div className="text-[11px] text-slate-500 mt-1 font-medium space-y-0.5">
                {viewRoleMode === 'staff' ? (
                  <>
                    <p>Total Kuota: {staffBalance.annualQuota} Hari (12 Dasar + {staffBalance.replacementLeaveDays} Pengganti)</p>
                    <p>Terpakai: {staffBalance.totalDeductedDays} Hari</p>
                  </>
                ) : (
                  <p>Sisa rata-rata seluruh karyawan</p>
                )}
              </div>
            </div>

            {/* Card 2: Full Day Permission Rule (Izin 1 Hari = Cut 1 Cuti) */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Izin Full Day</span>
                <span className="p-1.5 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-lg text-xs font-bold">-1 Cuti / Hari</span>
              </div>
              <p className="text-2xl font-black text-[#b90f0f] dark:text-rose-400 mt-2">
                {viewRoleMode === 'staff' ? `${staffBalance.usedIzinFullday} Hari` : '1 Hari Full'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Izin 1 hari penuh otomatis memotong 1 cuti tahunan
              </p>
            </div>

            {/* Card 3: Half-Day Permission Counter (3x Setengah Hari = Cut 1 Cuti) */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Izin Setengah Hari</span>
                <span className="p-1.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-lg text-xs font-bold">3x = -1 Cuti</span>
              </div>
              
              {viewRoleMode === 'staff' ? (
                <div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {staffBalance.countIzinSetengahHari}x
                    </p>
                    <span className="text-xs text-slate-500 font-bold">
                      ({staffBalance.deductionFromSetengahHari} Cuti Terpotong)
                    </span>
                  </div>
                  {/* Progress bar to 3x */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full transition-all"
                      style={{ width: `${(staffBalance.remainderSetengahHari / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Progres: {staffBalance.remainderSetengahHari}/3 izin (butuh {3 - staffBalance.remainderSetengahHari}x lagi untuk potong 1 cuti)
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">Aturan 3:1</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Akumulasi 3 kali izin setengah hari memotong 1 cuti tahunan
                  </p>
                </div>
              )}
            </div>

            {/* Card 4: Sick Leave & Medical Note */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuti Sakit / Khusus</span>
                <span className="p-1.5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg text-xs font-bold">Tanpa Potong Cuti</span>
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">Surat Dokter</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Cuti sakit terverifikasi tidak memotong kuota cuti tahunan
              </p>
            </div>

          </div>

          {/* Action Toolbar & Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:min-w-[200px] sm:flex-1">
              <div className="relative w-full sm:min-w-[200px] sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nama / Alasan Cuti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value="All">Semua Jenis Cuti/Izin</option>
                <option value="Cuti Tahunan">Cuti Tahunan</option>
                <option value="Cuti Pengganti Libur">Cuti Pengganti Libur</option>
                <option value="Izin Full Day">Izin Full Day (-1 Cuti)</option>
                <option value="Izin Setengah Hari">Izin Setengah Hari (3x = -1 Cuti)</option>
                <option value="Cuti Sakit">Cuti Sakit</option>
                <option value="Cuti Melahirkan">Cuti Melahirkan</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value="All">Semua Status</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved (Disetujui)</option>
                <option value="Rejected">Rejected (Ditolak)</option>
              </select>
            </div>

            {/* Apply Button */}
            <button
              onClick={() => setShowApplyLeaveModal(true)}
              className="flex items-center gap-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengajuan Cuti / Izin</span>
            </button>

          </div>

          {/* Leave & Permission Submissions Table */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Daftar Pengajuan Cuti & Izin {viewRoleMode === 'staff' ? `(${activeStaff?.name})` : 'Seluruh Karyawan'}
                </h3>
                <p className="text-xs text-slate-500">Log pengajuan cuti tahunan, izin fullday, & izin setengah hari</p>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-xl">
                {filteredLeaves.length} Pengajuan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Karyawan</th>
                    <th className="p-3">Tipe / Kategori</th>
                    <th className="p-3">Periode Tanggal</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3">Dampak Kuota Cuti</th>
                    <th className="p-3">Alasan Pengajuan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-xl text-right">Aksi HR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {(!filteredLeaves || filteredLeaves.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Belum ada data pengajuan cuti atau izin.
                      </td>
                    </tr>
                  ) : (
                    (filteredLeaves || []).map((req) => {
                      const emp = employees.find(e => e.id === req.employeeId || e.name.toLowerCase() === req.employeeName?.toLowerCase());
                      const empName = emp?.name || req.employeeName;
                      const empDept = emp?.department || '-';
                      return (
                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 font-semibold">
                            <div className="text-slate-900 dark:text-white font-bold">{empName}</div>
                            <div className="text-[10px] text-slate-400">{req.id} • Tgl: {req.appliedDate} • {empDept}</div>
                          </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            req.type === 'Cuti Tahunan'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : req.type === 'Cuti Pengganti Libur'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : req.type === 'Izin Full Day'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : req.type === 'Izin Setengah Hari'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {req.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {req.startDate} {req.startDate !== req.endDate ? `s/d ${req.endDate}` : ''}
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{req.totalDays} Hari</td>
                        <td className="p-3 font-semibold">
                          {(req.type === 'Cuti Tahunan' || req.type === 'Cuti Pengganti Libur') && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">-{req.totalDays} Cuti</span>
                          )}
                          {req.type === 'Izin Full Day' && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">-1 Cuti (Fullday)</span>
                          )}
                          {req.type === 'Izin Setengah Hari' && (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">-0.33 Cuti (1/3 Rate)</span>
                          )}
                          {['Cuti Sakit', 'Cuti Melahirkan', 'Izin Khusus'].includes(req.type) && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">0 (Tidak Potong Cuti)</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 italic max-w-xs">{req.reason}</td>
                        <td className="p-3">
                          <div className="space-y-1.5">
                            <div>
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                req.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : req.status === 'Rejected'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                            
                            {/* Multi-stage Steps indicators */}
                            <div className="space-y-1 pt-1.5 text-[10px] border-t border-slate-100 dark:border-slate-700/50">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-400">T1 (Manajer):</span>
                                {req.stage1Approved === true ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✅ Setuju</span>
                                ) : req.stage1Approved === false ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-bold">❌ Tolak</span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">⏳ Pending</span>
                                )}
                              </div>
                              {req.stage1Comment && (
                                <p className="text-[9px] text-slate-500 italic max-w-[150px] truncate" title={req.stage1Comment}>
                                  &ldquo;{req.stage1Comment}&rdquo;
                                </p>
                              )}

                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-400">T2 (HR Dept):</span>
                                {req.stage2Approved === true ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✅ Setuju</span>
                                ) : req.stage2Approved === false ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-bold">❌ Tolak</span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">⏳ Pending</span>
                                )}
                              </div>
                              {req.stage2Comment && (
                                <p className="text-[9px] text-slate-500 italic max-w-[150px] truncate" title={req.stage2Comment}>
                                  &ldquo;{req.stage2Comment}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-2">
                          {req.status === 'Pending' && (
                            <button
                              onClick={() => {
                                setLeaveForm({
                                  employeeId: req.employeeId,
                                  type: req.type,
                                  startDate: req.startDate,
                                  endDate: req.endDate,
                                  totalDays: req.totalDays,
                                  reason: req.reason
                                });
                                setSelectedLeave(req);
                                setShowApplyLeaveModal(true);
                              }}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          <div className="flex items-center gap-1">
                            {itemToDelete === req.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteLeaveRequest(req.id);
                                    setItemToDelete(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors"
                                >
                                  Hapus
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItemToDelete(null);
                                  }}
                                  className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setItemToDelete(req.id);
                                }}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                title="Hapus Pengajuan"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </div>
                          {req.status === 'Pending' && viewRoleMode === 'management' && (
                            <button
                              onClick={() => handleOpenApprovalModal(req)}
                              className="px-3 py-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              Tinjau
                            </button>
                          )}
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: LEMBUR (OVERTIME) MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'overtime' && (
        <div className="space-y-6">
          
          {/* Overtime Policy Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-md border border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl">
                  <Clock className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">Kebijakan Kompensasi Lembur Karyawan</h3>
                  <p className="text-xs text-slate-300">Aturan resmi perhitungan uang makan & uang lembur per jam</p>
                </div>
              </div>

              <button
                onClick={() => setShowApplyOvertimeModal(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Ajukan Lembur Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              
              {/* Overtime Rule < 2 Hours */}
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 flex items-start gap-3">
                <Coffee className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-300">Lembur Di Bawah 2 Jam (&lt; 2 Jam)</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Hanya mendapatkan <span className="font-bold text-white">Uang Makan Lembur (Rp 25.000)</span>. Upah per jam = Rp 0 dan <span className="text-amber-200">tidak dimasukkan ke penggajian bulanan</span> (langsung diberikan).
                  </p>
                </div>
              </div>

              {/* Overtime Rule >= 2 Hours */}
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">Lembur 2 Jam Atau Lebih (&ge; 2 Jam)</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Mendapatkan <span className="font-bold text-white">Uang Per Jam (Rp 25.000/jam) + Uang Makan (Rp 25.000)</span>. Pada penggajian, <span className="text-emerald-200">hanya uang per jam saja</span> yang dimasukkan.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Overtime Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Jam Lembur</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {filteredOvertimes.reduce((sum, o) => sum + (o.status === 'Approved' ? o.hours : 0), 0)} Jam
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Disetujui HR</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Uang Makan</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                Rp {filteredOvertimes.reduce((sum, o) => sum + (o.status === 'Approved' ? o.mealAllowance : 0), 0).toLocaleString('id-ID')}
              </p>
              <span className="text-[11px] text-amber-600 font-semibold">Rp 25k / Sesi (Langsung)</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Uang Lembur (Payroll)</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                Rp {filteredOvertimes.reduce((sum, o) => sum + (o.status === 'Approved' ? o.overtimePay : 0), 0).toLocaleString('id-ID')}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">&ge; 2 Jam (Rp 25k/Jam)</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Take-Home Lembur</p>
              <p className="text-2xl font-black text-[#b90f0f] dark:text-rose-400 mt-1">
                Rp {filteredOvertimes.reduce((sum, o) => sum + (o.status === 'Approved' ? o.totalPayout : 0), 0).toLocaleString('id-ID')}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Sudah disetujui</span>
            </div>
          </div>

          {/* Overtime Log Table */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Log Pengajuan & Kompensasi Lembur {viewRoleMode === 'staff' ? `(${activeStaff?.name})` : 'Seluruh Karyawan'}
                </h3>
                <p className="text-xs text-slate-500">Rincian jam lembur, kualifikasi jam, & total hak bayar karyawan</p>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-xl">
                {filteredOvertimes.length} Entri Lembur
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Karyawan & Divisi</th>
                    <th className="p-3">Tanggal Lembur</th>
                    <th className="p-3">Jam (Mulai - Selesai)</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3">Skema Kompensasi</th>
                    <th className="p-3">Rincian Hak Bayar</th>
                    <th className="p-3">Alasan Lembur</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-xl text-right">Aksi HR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {(!filteredOvertimes || filteredOvertimes.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Belum ada data pengajuan lembur.
                      </td>
                    </tr>
                  ) : (
                    (filteredOvertimes || []).map((ovt) => {
                      const emp = employees.find(e => e.id === ovt.employeeId || e.name.toLowerCase() === ovt.employeeName?.toLowerCase());
                      const empName = emp?.name || ovt.employeeName;
                      const empDept = emp?.department || ovt.department;
                      return (
                        <tr key={ovt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 font-semibold">
                            <div className="text-slate-900 dark:text-white font-bold">{empName}</div>
                            <div className="text-[10px] text-slate-400">{empDept} • {ovt.id}</div>
                          </td>
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{ovt.date}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {ovt.startTime} - {ovt.endTime}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {ovt.hours} Jam
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            ovt.hours < 2 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {ovt.compensationType}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">
                          <div className="text-slate-900 dark:text-white font-mono font-extrabold">
                            Rp {ovt.totalPayout.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Makan: Rp {ovt.mealAllowance.toLocaleString('id-ID')} | Upah: Rp {ovt.overtimePay.toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 italic max-w-xs">{ovt.reason}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            ovt.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : ovt.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {ovt.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {ovt.status === 'Pending' && viewRoleMode === 'management' && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => updateOvertimeStatus(ovt.id, 'Approved', currentUser.name)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => updateOvertimeStatus(ovt.id, 'Rejected', currentUser.name)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                              >
                                Tolak
                              </button>
                            </div>
                          )}
                          {viewRoleMode === 'management' && (
                            <button
                              onClick={() => {
                                if (confirm('Hapus data lembur ini?')) {
                                  deleteOvertimeRequest(ovt.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 ml-2"
                              title="Hapus Lembur"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FORM: CUTI / IZIN */}
      {/* ========================================================================= */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#b90f0f]" />
                  Formulir Pengajuan Cuti / Izin Karyawan
                </h3>
                <p className="text-xs text-slate-500">Isi formulir pengajuan sesuai kebijakan owner & manajemen</p>
              </div>
              <button
                onClick={() => {
                  setShowApplyLeaveModal(false);
                  setSelectedLeave(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Pilih Karyawan</label>
                  {isStaff && (
                    <span className="text-[10px] font-semibold text-[#b90f0f] bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900">
                      Pribadi (Terkunci)
                    </span>
                  )}
                </div>
                <select
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  disabled={isStaff}
                  className={`w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white ${
                    isStaff ? 'opacity-85 cursor-not-allowed' : ''
                  }`}
                >
                  {isStaff && loggedInEmployee ? (
                    <option value={loggedInEmployee.id}>{loggedInEmployee.name} — {loggedInEmployee.position} ({loggedInEmployee.department})</option>
                  ) : (
                    employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} — {e.position} ({e.department})</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Cuti / Izin</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[#b90f0f]"
                >
                  <option value="Cuti Tahunan">Cuti Tahunan (Potong 1 Hari / Hari)</option>
                  <option value="Cuti Pengganti Libur">Cuti Pengganti Libur (Potong Jatah Pengganti)</option>
                  <option value="Izin Full Day">Izin Full Day (Potong 1 Cuti Tahunan)</option>
                  <option value="Izin Setengah Hari">Izin Setengah Hari (3x Izin = Potong 1 Cuti)</option>
                  <option value="Cuti Sakit">Cuti Sakit (Lampirkan Surat Dokter - Tanpa Potong Cuti)</option>
                  <option value="Cuti Melahirkan">Cuti Melahirkan (Tanpa Potong Cuti)</option>
                  <option value="Izin Khusus">Izin Khusus / Duka Cita (Tanpa Potong Cuti)</option>
                </select>
              </div>

              {/* Deduction Indicator Card */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] space-y-1">
                  <p className="font-bold">Estimasi Dampak Kuota Cuti Owner:</p>
                  {leaveForm.type === 'Cuti Tahunan' && (
                    <p>Memotong <span className="font-bold">{leaveForm.totalDays} hari</span> dari kuota 12 hari cuti tahunan.</p>
                  )}
                  {leaveForm.type === 'Cuti Pengganti Libur' && (
                    <p>Memotong <span className="font-bold">{leaveForm.totalDays} hari</span> dari kuota cuti (prioritas menggunakan jatah pengganti libur).</p>
                  )}
                  {leaveForm.type === 'Izin Full Day' && (
                    <p>Izin fullday 1 hari penuh <span className="font-bold text-rose-600">otomatis memotong 1 hari cuti tahunan</span>.</p>
                  )}
                  {leaveForm.type === 'Izin Setengah Hari' && (
                    <p>Izin masuk setengah hari dihitung <span className="font-bold text-amber-700">1/3 tarif cuti</span>. Akumulasi 3x izin setengah hari akan memotong 1 hari cuti tahunan.</p>
                  )}
                  {['Cuti Sakit', 'Cuti Melahirkan', 'Izin Khusus'].includes(leaveForm.type) && (
                    <p className="text-emerald-700 dark:text-emerald-300 font-bold">Bebas potongan! Tidak akan mengurangi kuota 12 hari cuti tahunan Anda.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jumlah Hari / Sesi</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={leaveForm.totalDays}
                  onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Alasan Pengajuan</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan alasan keperluan izin atau cuti..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyLeaveModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold rounded-xl shadow-md"
                >
                  Kirim Pengajuan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FORM: LEMBUR (OVERTIME) */}
      {/* ========================================================================= */}
      {showApplyOvertimeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Formulir Pengajuan Lembur Karyawan
                </h3>
                <p className="text-xs text-slate-500">Sistem otomatis menghitung kelayakan uang makan & upah per jam</p>
              </div>
              <button
                onClick={() => setShowApplyOvertimeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOvertimeSubmit} className="space-y-4 text-xs">
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Pilih Karyawan</label>
                  {isStaff && (
                    <span className="text-[10px] font-semibold text-[#b90f0f] bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900">
                      Pribadi (Terkunci)
                    </span>
                  )}
                </div>
                <select
                  value={overtimeForm.employeeId}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, employeeId: e.target.value })}
                  disabled={isStaff}
                  className={`w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white ${
                    isStaff ? 'opacity-85 cursor-not-allowed' : ''
                  }`}
                >
                  {isStaff && loggedInEmployee ? (
                    <option value={loggedInEmployee.id}>{loggedInEmployee.name} — {loggedInEmployee.position} ({loggedInEmployee.department})</option>
                  ) : (
                    employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} — {e.position} ({e.department})</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Lembur</label>
                <input
                  type="date"
                  value={overtimeForm.date}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Mulai Lembur</label>
                  <input
                    type="time"
                    value={overtimeForm.startTime}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, startTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Selesai Lembur</label>
                  <input
                    type="time"
                    value={overtimeForm.endTime}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, endTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Automatic Overtime Calculator Card */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 border border-slate-700">
                <div className="flex items-center justify-between text-xs font-extrabold text-amber-400 border-b border-slate-700 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" /> Hasil Perhitungan Otomatis System
                  </span>
                  <span className="font-mono text-sm bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
                    {calculatedOvtHours} Jam
                  </span>
                </div>

                <div className="space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Kualifikasi Jam:</span>
                    <span className={`font-bold ${isLessThan2Hours ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isLessThan2Hours ? 'Lembur < 2 Jam' : 'Lembur ≥ 2 Jam'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-300">Uang Makan Lembur:</span>
                    <span className="font-bold text-white">Rp {estimatedMealAllowance.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-300">Upah Lembur Per Jam:</span>
                    <span className="font-bold text-white">
                      {isLessThan2Hours ? 'Rp 0 (Hanya Uang Makan Rp 25.000)' : `Rp ${estimatedOvertimePay.toLocaleString('id-ID')} (${calculatedOvtHours} Jam × Rp 25k)`}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-700 pt-1.5 mt-1 text-xs font-black text-amber-400">
                    <span>Estimasi Payout Lembur:</span>
                    <span className="font-mono">Rp {estimatedTotalPayout.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pekerjaan / Alasan Lembur</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan detail tugas/proyek yang dikerjakan saat lembur..."
                  value={overtimeForm.reason}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyOvertimeModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md"
                >
                  Kirim Pengajuan Lembur
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INFO: KEBIJAKAN OWNER */}
      {/* ========================================================================= */}
      {showRuleInfoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#b90f0f]" />
                Aturan & Regulasi Cuti/Izin/Lembur dari Owner
              </h3>
              <button onClick={() => setShowRuleInfoModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p className="font-extrabold text-slate-900 dark:text-white text-xs">1. Ketentuan Kuota Cuti Tahunan & Izin</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <li>Pihak Owner memberikan hak cuti tahunan sebesar <span className="font-bold text-[#b90f0f]">12 hari per tahun</span> untuk setiap karyawan tetap.</li>
                  <li>Jika karyawan mengambil <span className="font-bold">Izin 1 Hari Fullday</span>, maka secara otomatis memotong <span className="font-bold">1 hari kuota cuti tahunan</span>.</li>
                  <li>Jika karyawan mengambil <span className="font-bold">Izin Masuk Setengah Hari</span>, akumulasi <span className="font-bold">3 kali izin setengah hari</span> secara otomatis memotong <span className="font-bold">1 hari cuti tahunan</span>.</li>
                  <li>Jika karyawan bekerja (Hadir) di hari <span className="font-bold">Sabtu atau Minggu</span>, maka otomatis akan mendapatkan <span className="font-bold text-emerald-600">kompensasi 1 hari libur pengganti</span> yang menambah kuota cuti tahunan.</li>
                  <li>Izin sakit dengan Surat Dokter resmi dan Cuti Khusus (Melahirkan/Duka) tidak memotong kuota cuti tahunan.</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p className="font-extrabold text-slate-900 dark:text-white text-xs">2. Kebijakan Kompensasi Lembur</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <li><span className="font-bold text-amber-600">Lembur &lt; 2 Jam</span>: Karyawan hanya mendapatkan <span className="font-bold text-slate-900 dark:text-white">Uang Makan Lembur sebesar Rp 25.000</span> (Upah per jam = Rp 0). Uang makan langsung diberikan tunai/langsung dan tidak masuk ke penggajian.</li>
                  <li><span className="font-bold text-emerald-600">Lembur &ge; 2 Jam</span>: Karyawan mendapatkan <span className="font-bold text-slate-900 dark:text-white">Uang Lembur Per Jam (Rp 25.000/jam) + Uang Makan (Rp 25.000)</span>.</li>
                  <li><span className="font-bold text-blue-600">Komponen Penggajian (Payroll)</span>: Pada saat penggajian bulanan, yang dimasukkan ke komponen lembur <span className="font-bold text-slate-900 dark:text-white">HANYA lembur &ge; 2 jam</span> dan <span className="font-bold text-slate-900 dark:text-white">HANYA dihitung uang per jamnya saja (Rp 25.000/jam)</span>, karena uang makan pasti langsung diberikan terpisah.</li>
                  <li>Setiap lembur wajib mendapatkan persetujuan (approval) dari HR Manager / Atasan langsung.</li>
                </ul>
              </div>

            </div>

            <div className="pt-2 text-right border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowRuleInfoModal(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Saya Mengerti
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MULTI-STAGE LEAVE APPROVAL WORKFLOW */}
      {/* ========================================================================= */}
      {showApprovalModal && selectedLeave && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#b90f0f]" />
                Otorisasi Cuti & Izin (Multi-Stage)
              </h3>
              <button onClick={() => setShowApprovalModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Leave Details Summary */}
            {(() => {
              const selLeaveEmp = employees.find(e => e.id === selectedLeave.employeeId || e.name.toLowerCase() === selectedLeave.employeeName?.toLowerCase());
              const selLeaveEmpName = selLeaveEmp?.name || selectedLeave.employeeName;
              return (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-700 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-semibold">Nama Karyawan:</span>
                      <p className="font-bold text-slate-900 dark:text-white">{selLeaveEmpName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Tipe Pengajuan:</span>
                      <p className="font-bold text-[#b90f0f]">{selectedLeave.type}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Tanggal Periode:</span>
                      <p className="font-bold text-slate-900 dark:text-white">{selectedLeave.startDate} {selectedLeave.startDate !== selectedLeave.endDate ? `s/d ${selectedLeave.endDate}` : ''}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Durasi / Hari:</span>
                      <p className="font-bold text-slate-900 dark:text-white">{selectedLeave.totalDays} Hari</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-slate-400 font-semibold">Alasan Pengajuan:</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 italic mt-0.5">&ldquo;{selectedLeave.reason}&rdquo;</p>
                  </div>
                </div>
              );
            })()}

            {/* History of stages */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Histori Persetujuan Bertingkat:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Stage 1 box */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-150 dark:border-slate-700 text-xs">
                  <p className="font-extrabold text-slate-900 dark:text-white">Tahap 1: Manajer Divisi</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-[10px]">
                      Status: {selectedLeave.stage1Approved === true ? (
                        <span className="text-emerald-600 font-bold">✅ Disetujui</span>
                      ) : selectedLeave.stage1Approved === false ? (
                        <span className="text-rose-600 font-bold">❌ Ditolak</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">⏳ Menunggu</span>
                      )}
                    </p>
                    {selectedLeave.stage1ApprovedBy && <p className="text-[10px] text-slate-400">Oleh: {selectedLeave.stage1ApprovedBy}</p>}
                    {selectedLeave.stage1Comment && <p className="text-[10px] text-slate-500 italic mt-1 bg-white dark:bg-slate-900 p-1 rounded border dark:border-slate-800">&ldquo;{selectedLeave.stage1Comment}&rdquo;</p>}
                  </div>
                </div>

                {/* Stage 2 box */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-150 dark:border-slate-700 text-xs">
                  <p className="font-extrabold text-slate-900 dark:text-white">Tahap 2: HR / Direktur</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-[10px]">
                      Status: {selectedLeave.stage2Approved === true ? (
                        <span className="text-emerald-600 font-bold">✅ Disetujui</span>
                      ) : selectedLeave.stage2Approved === false ? (
                        <span className="text-rose-600 font-bold">❌ Ditolak</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">⏳ Menunggu</span>
                      )}
                    </p>
                    {selectedLeave.stage2ApprovedBy && <p className="text-[10px] text-slate-400">Oleh: {selectedLeave.stage2ApprovedBy}</p>}
                    {selectedLeave.stage2Comment && <p className="text-[10px] text-slate-500 italic mt-1 bg-white dark:bg-slate-900 p-1 rounded border dark:border-slate-800">&ldquo;{selectedLeave.stage2Comment}&rdquo;</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Action Form */}
            <form onSubmit={handleSubmitApproval} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahap Otorisasi Aktif:
                  </label>
                  <select
                    value={approvalStage}
                    onChange={(e) => setApprovalStage(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-slate-800 dark:text-slate-100 font-semibold"
                  >
                    <option value={1} disabled={selectedLeave.stage1Approved}>Tahap 1: Manajer Divisi</option>
                    <option value={2} disabled={!selectedLeave.stage1Approved && approvalStage === 2}>Tahap 2: HR Manager / Direktur</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Keputusan Tindakan:
                  </label>
                  <select
                    value={approvalDecision}
                    onChange={(e) => setApprovalDecision(e.target.value as 'Approved' | 'Rejected')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="Approved" className="text-emerald-600 font-bold">SETUJUI (Approve)</option>
                    <option value="Rejected" className="text-rose-600 font-bold">TOLAK (Reject)</option>
                  </select>
                </div>
              </div>

              {/* Approval Comment */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Komentar & Catatan (Tersimpan di Audit Trail):
                </label>
                <textarea
                  rows={2}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Contoh: Dokumen cuti lengkap / disetujui karena keperluan mendesak..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl text-xs shadow-md ${
                    approvalDecision === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Kirim Keputusan ({approvalDecision === 'Approved' ? 'Setuju' : 'Tolak'})
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
