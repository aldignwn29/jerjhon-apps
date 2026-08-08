import React, { useMemo } from 'react';
import {
  TrendingUp, Users, DollarSign, ShoppingBag, Package, Award,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, Store, Building,
  Clock, Calendar, CheckCircle2, FileText, ArrowRight, ShieldCheck, ShoppingCart, Check, X
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { StatCard } from '../../common/StatCard';
import { GrowthPredictionCard } from './GrowthPredictionCard';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

export const ExecutiveDashboardView: React.FC = React.memo(() => {
  const {
    employees,
    marketplaceOrders,
    products,
    kpis,
    formatIDR,
    approvalRequests,
    companyProfile,
    currentUser,
    isStaff,
    isManager,
    isAdmin,
    setActiveTab,
    kpiTasks,
    leaves,
    leaveRequests,
    payrolls,
    attendance,
    approveRequest,
    rejectRequest
  } = useERP();

  const currentUserName = currentUser?.name || '';
  const currentUserId = currentUser?.id || '';
  const currentYear = useMemo(() => new Date().getFullYear().toString(), []);

  // Financial metrics
  const totalSalesGross = useMemo(() => (marketplaceOrders || []).reduce((sum, o) => sum + (o.grossAmount || 0), 0), [marketplaceOrders]);
  const totalNetRevenue = useMemo(() => totalSalesGross * 0.77, [totalSalesGross]);
  const totalNetProfit = useMemo(() => (marketplaceOrders || []).reduce((sum, o) => sum + (o.netProfit || 0), 0), [marketplaceOrders]);
  const totalStockValuation = useMemo(() => (products || []).reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.unitCostPrice || 0)), 0), [products]);
  const pendingApprovalsCount = useMemo(() => (approvalRequests || []).filter(a => a.status === 'Pending').length, [approvalRequests]);
  const lowStockCount = useMemo(() => (products || []).filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length, [products]);
  const averageKpi = useMemo(() => {
    const kpisList = kpis || [];
    return kpisList.length > 0 
      ? (kpisList.reduce((sum, k) => sum + (k.score || 0), 0) / kpisList.length).toFixed(1)
      : null;
  }, [kpis]);

  // Staff specific items
  const myTasks = useMemo(() => {
    return (kpiTasks || []).filter(t => (currentUserId && t.employeeId === currentUserId) || (t.employeeName && t.employeeName.toLowerCase().includes(currentUserName.toLowerCase())));
  }, [kpiTasks, currentUserId, currentUserName]);

  const pendingTasks = useMemo(() => myTasks.filter(t => t.status === 'Pending Submission' || t.status === 'Pending Review'), [myTasks]);
  const completedTasks = useMemo(() => myTasks.filter(t => t.status === 'Approved'), [myTasks]);

  // Staff Leave Balance (Current Calendar Year)
  const myApprovedLeaves = useMemo(() => {
    return (leaveRequests || []).filter(
      l => ((currentUserId && l.employeeId === currentUserId) || (l.employeeName && l.employeeName.toLowerCase().includes(currentUserName.toLowerCase()))) &&
           l.status === 'Approved' &&
           ((l.startDate && l.startDate.startsWith(currentYear)) || (l.appliedDate && l.appliedDate.startsWith(currentYear)))
    );
  }, [leaveRequests, currentUserId, currentUserName, currentYear]);

  const usedCutiTahunan = useMemo(() => myApprovedLeaves.filter(l => l.type === 'Cuti Tahunan').reduce((sum, l) => sum + l.totalDays, 0), [myApprovedLeaves]);
  const usedCutiPengganti = useMemo(() => myApprovedLeaves.filter(l => l.type === 'Cuti Pengganti Libur').reduce((sum, l) => sum + l.totalDays, 0), [myApprovedLeaves]);
  const usedIzinFullday = useMemo(() => myApprovedLeaves.filter(l => l.type === 'Izin Full Day').reduce((sum, l) => sum + l.totalDays, 0), [myApprovedLeaves]);
  const countIzinSetengahHari = useMemo(() => myApprovedLeaves.filter(l => l.type === 'Izin Setengah Hari').length, [myApprovedLeaves]);
  const deductionFromSetengahHari = useMemo(() => Math.floor(countIzinSetengahHari / 3), [countIzinSetengahHari]);

  const replacementQuota = useMemo(() => {
    return (attendance || []).filter(
      a => ((currentUserId && a.employeeId === currentUserId) || (a.employeeName && a.employeeName.toLowerCase().includes(currentUserName.toLowerCase()))) &&
           a.status === 'Hadir' &&
           a.date.startsWith(currentYear) &&
           (new Date(a.date).getDay() === 0 || new Date(a.date).getDay() === 6)
    ).length;
  }, [attendance, currentUserId, currentUserName, currentYear]);

  const totalDeductedDays = useMemo(() => usedCutiTahunan + usedIzinFullday + usedCutiPengganti + deductionFromSetengahHari, [usedCutiTahunan, usedIzinFullday, usedCutiPengganti, deductionFromSetengahHari]);
  const remainingAnnualLeave = useMemo(() => Math.max(0, (12 + replacementQuota) - totalDeductedDays), [replacementQuota, totalDeductedDays]);

  // Revenue by Channel Chart Data (Net Revenue per channel)
  const channelData = useMemo(() => [
    { channel: 'Shopee', revenue: (marketplaceOrders || []).filter(o => o.channel === 'Shopee').reduce((sum, o) => sum + (o.grossAmount || 0), 0) * 0.77 },
    { channel: 'TikTok Shop', revenue: (marketplaceOrders || []).filter(o => o.channel === 'TikTok Shop').reduce((sum, o) => sum + (o.grossAmount || 0), 0) * 0.77 },
    { channel: 'Tokopedia', revenue: (marketplaceOrders || []).filter(o => o.channel === 'Tokopedia').reduce((sum, o) => sum + (o.grossAmount || 0), 0) * 0.77 },
    { channel: 'POS Retail', revenue: (marketplaceOrders || []).filter(o => o.channel === 'POS Retail').reduce((sum, o) => sum + (o.grossAmount || 0), 0) * 0.77 },
  ], [marketplaceOrders]);

  const salesTrendData = useMemo(() => marketplaceOrders.length > 0 ? [
    { month: 'Jul', Omset: totalNetRevenue, Profit: totalNetProfit }
  ] : [], [marketplaceOrders, totalNetRevenue, totalNetProfit]);

  const PIE_COLORS = useMemo(() => ['#6366f1', '#f43f5e', '#10b981', '#f59e0b'], []);

  if (!currentUser) return null;

  // 1. STAFF VIEW
  if (isStaff) {
    return (
      <div className="space-y-6">
        <RoleAccessBanner moduleName="Staff Operations & Self-Service Portal" />

        {/* Staff Welcome Banner */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50/50 dark:bg-rose-950/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="space-y-2 text-center md:text-left relative z-10">
            <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Staff Workstation Active
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Selamat Datang, {currentUser.name}!
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {currentUser.role} • {currentUser.department || 'Operasional Jerjhon Indonesia'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
            <button
              onClick={() => setActiveTab('attendance_shifts')}
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-rose-100 transition-all flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" /> Clock-in Absensi
            </button>
            <button
              onClick={() => setActiveTab('pos_retail')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200"
            >
              <ShoppingCart className="w-4 h-4" /> Buka POS Kasir
            </button>
          </div>
        </div>

        {/* Staff Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Tugas KPI Pending</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {pendingTasks.length} Tugas
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Tugas Approved</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {completedTasks.length} Selesai
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Sisa Cuti Tahunan</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {remainingAnnualLeave} / 12 Hari
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-[#b90f0f] rounded-2xl font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Status Slip Gaji</p>
              <h3 className="text-sm font-bold text-emerald-600 mt-0.5">
                Paid / Transferred
              </h3>
            </div>
          </div>
        </div>

        {/* Staff Quick Actions Grid */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            Menu Pilihan & Modul Relevan Staff
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => setActiveTab('leave_management')}
              className="p-5 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-6 h-6 text-[#b90f0f]" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pengajuan Izin, Cuti & Lembur</h4>
              <p className="text-xs text-slate-500 mt-1">Ajukan cuti tahunan, izin setengah hari, atau klaim lembur.</p>
            </div>

            <div 
              onClick={() => setActiveTab('kpi_okr')}
              className="p-5 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Award className="w-6 h-6 text-[#b90f0f]" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Upload Bukti Task KPI</h4>
              <p className="text-xs text-slate-500 mt-1">Kirimkan file bukti laporan tugas untuk dinilai oleh Manager.</p>
            </div>

            <div 
              onClick={() => setActiveTab('payroll_engine')}
              className="p-5 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-6 h-6 text-[#b90f0f]" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Slip Gaji & Rekonsiliasi Saya</h4>
              <p className="text-xs text-slate-500 mt-1">Lihat dan unduh slip gaji bulanan resmi versi PDF.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. MANAGER VIEW
  if (isManager) {
    const userDept = currentUser?.department || '';
    const deptPrefix = userDept.toLowerCase().split(' ')[0] || '';
    const departmentEmployees = (employees || []).filter(e => (e.department || '').toLowerCase().includes(deptPrefix) || true);
    const pendingDepartmentApprovals = (approvalRequests || []).filter(a => a.status === 'Pending');
    const deptEmployeeNames = departmentEmployees.map(e => e.name.toLowerCase());
    const deptKpis = (kpis || []).filter(k => k.assignedToName && deptEmployeeNames.includes(k.assignedToName.toLowerCase()));
    const deptAverageKpi = deptKpis.length > 0
      ? (deptKpis.reduce((sum, k) => sum + (k.score || 0), 0) / deptKpis.length).toFixed(1)
      : null;

    return (
      <div className="space-y-6">
        <RoleAccessBanner moduleName={`Manager Portal • ${currentUser.department}`} />

        {/* Manager Welcome Banner */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 dark:bg-blue-950/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="space-y-2 text-center md:text-left relative z-10">
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Managerial Command Deck
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Halo, {currentUser.name}!
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {currentUser.role} • Mengawasi operasional departemen {currentUser.department}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
            <button
              onClick={() => setActiveTab('human_capital')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-blue-100 transition-all flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" /> Kelola Tim & Absensi
            </button>
            <button
              onClick={() => setActiveTab('kpi_okr')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200"
            >
              <Award className="w-4 h-4" /> Review Tugas KPI
            </button>
          </div>
        </div>

        {/* Manager Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Anggota Tim / Divisi</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {departmentEmployees.length} Orang
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Approval Pending</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {pendingDepartmentApprovals.length} Request
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Rata-rata KPI Tim</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {deptAverageKpi ? `${deptAverageKpi} / 100` : '-'}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-800 rounded-2xl font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Kehadiran Hari Ini</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                98.2% Hadir
              </h3>
            </div>
          </div>
        </div>

        {/* Manager Action Cards / Department Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Permintaan Approval Tim ({pendingDepartmentApprovals.length})
              </h3>
              <button 
                onClick={() => setActiveTab('governance_approval')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3">
              {pendingDepartmentApprovals.slice(0, 4).map((req) => (
                <div key={req.id} className="p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{req.requestType}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">{req.amountOrDays || 'Pending'}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Oleh: <strong>{req.requestedBy}</strong> ({req.department})</p>
                    <p className="text-[11px] text-slate-400 italic mt-1">"{req.description}"</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => approveRequest(req.id, currentUser.name)}
                      className="p-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Setujui"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id, currentUser.name)}
                      className="p-2 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Tolak"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {pendingDepartmentApprovals.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Tidak ada permintaan approval yang tertunda untuk saat ini.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Ringkasan Karyawan Departemen
            </h3>
            <div className="space-y-3">
              {departmentEmployees.slice(0, 4).map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-3">
                    <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover border" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{emp.name}</h4>
                      <p className="text-[10px] text-slate-500">{emp.position} • {emp.nik}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {emp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. ADMINISTRATOR VIEW (DEFAULT / SUPER ADMIN)
  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Executive Business Intelligence & Enterprise Command Center" />
      
      {/* Super Admin Command Center Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-50/30 dark:bg-rose-950/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50/30 dark:bg-indigo-950/5 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                ADMIN COMMAND CENTER
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-tight">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Real-Time Business Intelligence Active
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {companyProfile.companyName || 'Jerjhon Activewear'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed font-medium">
              Enterprise performance monitoring: Sales Marketplace, Finance, HCM, Inventory & Global System Governance.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shrink-0">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-rose-600 shadow-sm border border-slate-100 dark:border-slate-700">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">LEGAL ENTITY</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{companyProfile.legalName || 'JERJHON'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TOTAL OMSET PENJUALAN"
          value={formatIDR(totalNetRevenue)}
          subtitle="Total Net Revenue (Shopee, TikTok, Tokopedia & POS)"
          trend={{ value: "Real-time sync", isPositive: true }}
          icon={DollarSign}
        />
        <StatCard
          title="LABA BERSIH (NET PROFIT)"
          value={formatIDR(totalNetProfit)}
          subtitle="Setelah HPP, Biaya Ads & Admin"
          trend={{ value: "Real-time sync", isPositive: true }}
          icon={TrendingUp}
        />
        <StatCard
          title="VALUASI STOK GUDANG"
          value={formatIDR(totalStockValuation)}
          subtitle={`${products.length} SKU Aktif terdaftar`}
          trend={{ value: `${lowStockCount} SKU Stok Rendah`, isPositive: false }}
          icon={Package}
        />
        <StatCard
          title="TOTAL SDM & KARYAWAN"
          value={`${employees.length} Orang`}
          subtitle="100% Absensi Terverifikasi"
          icon={Users}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GrowthPredictionCard orders={marketplaceOrders} />
        
        {/* Sales & Profit Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Tren Penjualan & Laba Bersih (2026)
              </h3>
              <p className="text-xs text-slate-500">Konsolidasi seluruh channel marketplace e-commerce</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b90f0f" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#b90f0f" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `Rp ${(val/1000000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: any) => formatIDR(value)} />
                <Area type="monotone" dataKey="Omset" stroke="#6366f1" fillOpacity={1} fill="url(#colorOmset)" strokeWidth={2} />
                <Area type="monotone" dataKey="Profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              Kontribusi Sales per Channel
            </h3>
            <p className="text-xs text-slate-500 mb-4">Distribusi pendapatan e-commerce & retail</p>

            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="revenue"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatIDR(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            {channelData.map((c, i) => (
              <div key={c.channel} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{c.channel}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{formatIDR(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Operational Widgets & Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Pending Approval Widget */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Membutuhkan Approval ({pendingApprovalsCount})
            </h4>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-2">
            {approvalRequests.filter(a => a.status === 'Pending').slice(0, 3).map((req) => (
              <div key={req.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>{req.requestType}</span>
                  <span className="text-[#b90f0f]">{req.amountOrDays || 'Izin'}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{req.requestedBy} • {req.department}</p>
                <p className="text-[10px] text-slate-400 italic mt-1">"{req.description}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Peringatan Stok Gudang ({lowStockCount})
            </h4>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Package className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-2">
            {products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').map((p, idx) => (
              <div key={`${p.id}-${p.sku || ''}-${idx}`} className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="truncate max-w-[180px]">{p.name}</span>
                  <span className="text-rose-600 font-black">{p.stockQuantity} {p.unit}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Min Stock: {p.minimumStock} • Safety Stock: {p.safetyStock}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top KPI Leaders */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Top KPI Scorers Bulan Ini
            </h4>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-2">
            {kpis.slice(0, 3).map((kpi) => (
              <div key={kpi.id} className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>{kpi.assignedToName}</span>
                  <span className="text-emerald-600 font-extrabold">{kpi.score}% KPI</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{kpi.title}</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, kpi.score)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
});
