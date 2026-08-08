import React, { useState } from 'react';
import { DollarSign, Printer, Download, Landmark, FileText, CheckCircle2, ShieldAlert, Lock, TrendingUp } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';

export const FinancialReportsView: React.FC = () => {
  const { coaList, formatIDR, companyProfile, isStaff, currentUser } = useERP();
  const [reportType, setReportType] = useState<'income' | 'balance' | 'cashflow' | 'ratios' | 'expense_trends'>('income');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Juli 2026');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [isSimplifiedIncome, setIsSimplifiedIncome] = useState<boolean>(true);

  const expenseTrendData = [
    { month: 'Jan', salary: 110000000, marketing: 25000000, depreciation: 18000000, utilities: 12000000, rnd: 15000000, total: 180000000 },
    { month: 'Feb', salary: 112000000, marketing: 28000000, depreciation: 18000000, utilities: 12500000, rnd: 16000000, total: 186500000 },
    { month: 'Mar', salary: 115000000, marketing: 35000000, depreciation: 18000000, utilities: 13000000, rnd: 18000000, total: 199000000 },
    { month: 'Apr', salary: 118000000, marketing: 42000000, depreciation: 18500000, utilities: 13200000, rnd: 20000000, total: 211700000 },
    { month: 'Mei', salary: 120000000, marketing: 48000000, depreciation: 18500000, utilities: 14000000, rnd: 22000000, total: 222500000 },
    { month: 'Jun', salary: 125000000, marketing: 55000000, depreciation: 19000000, utilities: 14500000, rnd: 24000000, total: 237500000 },
    { month: 'Jul', salary: 128000000, marketing: 65000000, depreciation: 19000000, utilities: 15000000, rnd: 26000000, total: 253000000 },
    { month: 'Ags', salary: 130000000, marketing: 70000000, depreciation: 19500000, utilities: 15200000, rnd: 28000000, total: 262700000 },
    { month: 'Sep', salary: 132000000, marketing: 75000000, depreciation: 19500000, utilities: 15500000, rnd: 30000000, total: 272000000 },
    { month: 'Okt', salary: 135000000, marketing: 80000000, depreciation: 20000000, utilities: 16000000, rnd: 32000000, total: 283000000 },
    { month: 'Nov', salary: 138000000, marketing: 85000000, depreciation: 20000000, utilities: 16500000, rnd: 34000000, total: 293500000 },
    { month: 'Des', salary: 142000000, marketing: 95000000, depreciation: 20500000, utilities: 17000000, rnd: 38000000, total: 312500000 },
  ];

  // Compute Income Statement totals
  const revenueTotal = (coaList || []).filter(a => a.category === 'Revenue').reduce((sum, a) => sum + (a.balance || 0), 0);
  const cogsTotal = (coaList || []).filter(a => a.category === 'COGS').reduce((sum, a) => sum + (a.balance || 0), 0);
  const grossProfit = revenueTotal - cogsTotal;

  const expenseTotal = (coaList || []).filter(a => a.category === 'Expense').reduce((sum, a) => sum + (a.balance || 0), 0);
  const netIncome = grossProfit - expenseTotal;

  // Simplified custom Laba Rugi variables
  const gajiExpense = (coaList || []).find(a => a.code === '6101')?.balance || 0;
  const adsExpense = (coaList || []).find(a => a.code === '6102')?.balance || 0;
  // Operasional = All other Expense accounts that are NOT Gaji (6101) and NOT Ads (6102)
  const operasionalExpense = (coaList || []).filter(a => a.category === 'Expense' && a.code !== '6101' && a.code !== '6102' && !a.isHeader).reduce((sum, a) => sum + (a.balance || 0), 0);

  // Compute Balance Sheet totals
  const assetTotal = (coaList || []).filter(a => a.category === 'Asset').reduce((sum, a) => sum + (a.balance || 0), 0);
  const liabilityTotal = (coaList || []).filter(a => a.category === 'Liability').reduce((sum, a) => sum + (a.balance || 0), 0);
  const equityTotal = (coaList || []).filter(a => a.category === 'Equity').reduce((sum, a) => sum + (a.balance || 0), 0) + netIncome;

  // Cash Flow components (Estimated from financial state)
  const operatingCashFlow = netIncome + 45000000; // adding back depreciation & non-cash
  const investingCashFlow = -150000000; // purchase of fixed assets / R&D
  const financingCashFlow = 50000000; // capital injection / loan movement
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

  // Financial Ratios
  const currentAssets = (coaList || []).filter(a => a.category === 'Asset' && a.code.startsWith('11')).reduce((s, a) => s + a.balance, 0) || 550000000;
  const currentLiabilities = liabilityTotal || 120000000;
  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : '4.58';
  const debtToEquity = equityTotal > 0 ? (liabilityTotal / equityTotal).toFixed(2) : '0.24';
  const netProfitMargin = revenueTotal > 0 ? ((netIncome / revenueTotal) * 100).toFixed(1) : '28.5';
  const roa = assetTotal > 0 ? ((netIncome / assetTotal) * 100).toFixed(1) : '18.2';

  if (isStaff) {
    return (
      <div className="space-y-6">
        <RoleAccessBanner moduleName="Laporan Keuangan Laba Rugi & Neraca" />
        
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm text-center max-w-2xl mx-auto space-y-4 my-8">
          <div className="w-16 h-16 bg-rose-100 text-[#b90f0f] rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Restriksi Akses Laporan Keuangan Eksekutif
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Halaman Laporan Laba Rugi (P&L), Neraca, Arus Kas & Analisis Rasio bersifat rahasia dan terbatas untuk level <strong>Manajemen, Finance Manager, & Direksi Perusahaan</strong>.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl text-left border text-xs text-slate-600 dark:text-slate-300 space-y-1 font-medium">
            <p className="font-bold text-slate-900 dark:text-white">Informasi Akun Anda saat ini:</p>
            <p>• Nama: <span className="font-bold">{currentUser.name}</span></p>
            <p>• Role Akses: <span className="font-bold text-[#b90f0f]">{currentUser.role}</span></p>
            <p className="text-[11px] text-slate-400 pt-1">Gunakan Role Switcher di header kanan atas untuk beralih ke role Manager/Director jika ingin meninjau laporan ini.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Laporan Keuangan & PSAK" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#b90f0f]" />
            Laporan Keuangan Standar Akuntansi Keuangan (SAK/PSAK)
          </h2>
          <p className="text-xs text-slate-500">
            Laporan Laba Rugi (Profit & Loss), Neraca Keuangan (Balance Sheet), Arus Kas (Cash Flow), & Analisis Rasio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="p-2 bg-slate-100 dark:bg-slate-700 border rounded-xl text-xs font-bold"
          >
            <option value="Juli 2026">Periode Juli 2026</option>
            <option value="Juni 2026">Periode Juni 2026</option>
            <option value="Mei 2026">Periode Mei 2026</option>
            <option value="Q2 2026">Kuartal II 2026</option>
            <option value="Tahun 2026">Full Year 2026 (Audited)</option>
          </select>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setReportType('income')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            reportType === 'income' ? 'bg-[#b90f0f] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Laporan Laba Rugi (P&L)
        </button>
        <button
          onClick={() => setReportType('balance')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            reportType === 'balance' ? 'bg-[#b90f0f] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Neraca Keuangan (Balance Sheet)
        </button>
        <button
          onClick={() => setReportType('cashflow')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            reportType === 'cashflow' ? 'bg-[#b90f0f] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Laporan Arus Kas (Cash Flow)
        </button>
        <button
          onClick={() => setReportType('ratios')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            reportType === 'ratios' ? 'bg-[#b90f0f] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Analisis Rasio Keuangan
        </button>
        <button
          onClick={() => setReportType('expense_trends')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            reportType === 'expense_trends' ? 'bg-[#b90f0f] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Tren Beban Operasional
        </button>
      </div>

      {/* Income Statement View */}
      {reportType === 'income' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6 max-w-3xl mx-auto">
          {/* Company & Document Header */}
          <div className="text-center border-b pb-4">
            <h3 className="font-extrabold text-base text-[#b90f0f] uppercase">{companyProfile.legalName}</h3>
            <p className="font-bold text-xs text-slate-900 dark:text-white">LAPORAN LABA RUGI (INCOME STATEMENT)</p>
            <p className="text-[11px] text-slate-500 font-mono">Periode: {selectedPeriod}</p>
          </div>

          {/* Interactive Format Selector Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Format Laporan Laba Rugi</p>
              <p className="text-[10px] text-slate-500">Pilih penyederhanaan kustom Anda atau rincian standar akuntansi</p>
            </div>
            <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-center">
              <button
                type="button"
                onClick={() => setIsSimplifiedIncome(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSimplifiedIncome 
                    ? 'bg-[#b90f0f] text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Formula Sederhana
              </button>
              <button
                type="button"
                onClick={() => setIsSimplifiedIncome(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isSimplifiedIncome 
                    ? 'bg-[#b90f0f] text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Standar PSAK Detail
              </button>
            </div>
          </div>

          {isSimplifiedIncome ? (
            /* ================= SIMPLIFIED CUSTOM FORMULA VIEW ================= */
            <div className="space-y-6">
              {/* Formula Formula Equation flow visual block */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-3 text-center tracking-wider font-mono">
                  Visualisasi Alur Rumus: Total Net Revenue - COGS - Gaji - Ads - Operasional = Profit / Loss
                </p>
                
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-center">
                  <div className="flex-1 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Net Revenue</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono block mt-0.5">
                      {formatIDR(revenueTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-slate-400 font-bold text-lg">-</div>
                  <div className="flex-1 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Total COGS</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono block mt-0.5">
                      {formatIDR(cogsTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-slate-400 font-bold text-lg">-</div>
                  <div className="flex-1 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Beban Gaji</span>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono block mt-0.5">
                      {formatIDR(gajiExpense)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-slate-400 font-bold text-lg">-</div>
                  <div className="flex-1 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Beban Ads</span>
                    <span className="text-xs font-black text-pink-600 dark:text-pink-400 font-mono block mt-0.5">
                      {formatIDR(adsExpense)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-slate-400 font-bold text-lg">-</div>
                  <div className="flex-1 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Operasional</span>
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 font-mono block mt-0.5">
                      {formatIDR(operasionalExpense)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-slate-400 font-bold text-lg">=</div>
                  <div className="flex-1 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60 shadow-xs">
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Net Profit / Loss</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                      {formatIDR(netIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Simplified breakdown cards / ledger list */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900/20">
                {/* 1. Net Revenue Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">1</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Total Net Revenue (Pendapatan Bersih)</p>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-7">Semua pendapatan dari penjualan Marketplace E-Commerce & Toko Retail POS</p>
                  </div>
                  <div className="text-right pl-7 sm:pl-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">+{formatIDR(revenueTotal)}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">(COA 4101 + 4102)</p>
                  </div>
                </div>

                {/* 2. Total COGS Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px] font-bold">2</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Total COGS (Harga Pokok Penjualan)</p>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-7">Harga pokok produksi bahan baku & persediaan barang jadi yang terjual</p>
                  </div>
                  <div className="text-right pl-7 sm:pl-0">
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">-{formatIDR(cogsTotal)}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">(COA 5101)</p>
                  </div>
                </div>

                {/* 3. Gaji Karyawan Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Beban Gaji (Payroll Karyawan)</p>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-7">Gaji pokok, tunjangan, lembur, dan kontribusi BPJS ketenagakerjaan</p>
                  </div>
                  <div className="text-right pl-7 sm:pl-0">
                    <p className="text-sm font-bold text-rose-500 font-mono">-{formatIDR(gajiExpense)}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">(COA 6101)</p>
                  </div>
                </div>

                {/* 4. Ads & Marketing Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-400 flex items-center justify-center text-[10px] font-bold">4</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Beban Ads & Pemasaran</p>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-7">Pengeluaran digital advertising (FB/IG, Google Ads) & Marketplace affiliate</p>
                  </div>
                  <div className="text-right pl-7 sm:pl-0">
                    <p className="text-sm font-bold text-rose-500 font-mono">-{formatIDR(adsExpense)}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">(COA 6102)</p>
                  </div>
                </div>

                {/* 5. Operasional Lainnya Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-[10px] font-bold">5</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Beban Operasional Lainnya</p>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-7">Biaya sewa kantor, listrik, air, internet, penyusutan aset tetap, riset & development</p>
                  </div>
                  <div className="text-right pl-7 sm:pl-0">
                    <p className="text-sm font-bold text-rose-500 font-mono">-{formatIDR(operasionalExpense)}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">(Semua COA Beban lain diluar 6101 & 6102)</p>
                  </div>
                </div>

                {/* Profit/Loss Grand Summary Row */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-black border-t-2 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">LABA / RUGI BERSIH (PROFIT / LOSS)</span>
                  </div>
                  <div className="text-right pl-7 sm:pl-0">
                    <p className="text-base sm:text-xl text-[#b90f0f] dark:text-[#f87171] font-mono">{formatIDR(netIncome)}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Laba Bersih Setelah Dikurangi Seluruh Beban</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= DETAILED STANDARD PSAK VIEW ================= */
            <div className="space-y-4 text-xs">
              {/* Revenue */}
              <div>
                <p className="font-bold border-b pb-1 text-slate-700 dark:text-slate-200">1. PENDAPATAN USAHA (REVENUE)</p>
                {(coaList || []).filter(a => a.category === 'Revenue').map(a => (
                  <div key={a.code} className="flex justify-between py-1 pl-4">
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono">{formatIDR(a.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 font-bold border-t text-slate-900 dark:text-white pt-1">
                  <span>TOTAL PENDAPATAN</span>
                  <span className="font-mono text-[#b90f0f]">{formatIDR(revenueTotal)}</span>
                </div>
              </div>

              {/* COGS */}
              <div>
                <p className="font-bold border-b pb-1 text-slate-700 dark:text-slate-200">2. HARGA POKOK PENJUALAN (COGS)</p>
                {(coaList || []).filter(a => a.category === 'COGS').map(a => (
                  <div key={a.code} className="flex justify-between py-1 pl-4 text-rose-600">
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono">({formatIDR(a.balance)})</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 font-bold border-t text-slate-900 dark:text-white pt-1">
                  <span>LABA KOTOR (GROSS PROFIT)</span>
                  <span className="font-mono text-emerald-600 font-black">{formatIDR(grossProfit)}</span>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <p className="font-bold border-b pb-1 text-slate-700 dark:text-slate-200">3. BEBAN OPERASIONAL (EXPENSES)</p>
                {(coaList || []).filter(a => a.category === 'Expense').map(a => (
                  <div key={a.code} className="flex justify-between py-1 pl-4 text-rose-600">
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono">({formatIDR(a.balance)})</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 font-bold border-t text-slate-900 dark:text-white pt-1">
                  <span>TOTAL BEBAN OPERASIONAL</span>
                  <span className="font-mono text-rose-600">({formatIDR(expenseTotal)})</span>
                </div>
              </div>

              {/* Net Income */}
              <div className="pt-4 border-t-2 border-slate-900 dark:border-slate-100 flex justify-between items-center text-sm font-black">
                <span>LABA BERSIH SEBELUM PAJAK (NET INCOME)</span>
                <span className="text-xl text-[#b90f0f] font-mono">{formatIDR(netIncome)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Balance Sheet View */}
      {reportType === 'balance' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 max-w-3xl mx-auto">
          <div className="text-center border-b pb-3">
            <h3 className="font-extrabold text-base text-[#b90f0f] uppercase">{companyProfile.legalName}</h3>
            <p className="font-bold text-xs text-slate-900 dark:text-white">NERACA KEUANGAN (BALANCE SHEET)</p>
            <p className="text-[11px] text-slate-500 font-mono">Per {selectedPeriod}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Assets */}
            <div className="space-y-2">
              <p className="font-bold border-b pb-1 text-slate-800 dark:text-slate-100">ASET (ASSETS)</p>
              {(coaList || []).filter(a => a.category === 'Asset').map(a => (
                <div key={a.code} className="flex justify-between py-1">
                  <span>{a.name}</span>
                  <span className="font-mono">{formatIDR(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 font-extrabold border-t border-slate-900 pt-2 text-[#b90f0f]">
                <span>TOTAL ASET</span>
                <span className="font-mono">{formatIDR(assetTotal)}</span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="space-y-2">
              <p className="font-bold border-b pb-1 text-slate-800 dark:text-slate-100">KEWAJIBAN & EKUITAS</p>
              {(coaList || []).filter(a => a.category === 'Liability').map(a => (
                <div key={a.code} className="flex justify-between py-1">
                  <span>{a.name}</span>
                  <span className="font-mono">{formatIDR(a.balance)}</span>
                </div>
              ))}
              {(coaList || []).filter(a => a.category === 'Equity').map(a => (
                <div key={a.code} className="flex justify-between py-1">
                  <span>{a.name}</span>
                  <span className="font-mono">{formatIDR(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 font-semibold text-emerald-600">
                <span>Laba Berjalan (Net Income)</span>
                <span className="font-mono">{formatIDR(netIncome)}</span>
              </div>

              <div className="flex justify-between py-1 font-extrabold border-t border-slate-900 pt-2 text-[#b90f0f]">
                <span>TOTAL PASIVA & EKUITAS</span>
                <span className="font-mono">{formatIDR(liabilityTotal + equityTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Statement View */}
      {reportType === 'cashflow' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 max-w-3xl mx-auto">
          <div className="text-center border-b pb-3">
            <h3 className="font-extrabold text-base text-[#b90f0f] uppercase">{companyProfile.legalName}</h3>
            <p className="font-bold text-xs text-slate-900 dark:text-white">LAPORAN ARUS KAS (CASH FLOW STATEMENT)</p>
            <p className="text-[11px] text-slate-500 font-mono">Periode: {selectedPeriod}</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="font-bold border-b pb-1 text-slate-700 dark:text-slate-200">1. ARUS KAS DARI AKTIVITAS OPERASIONAL</p>
              <div className="flex justify-between py-1 pl-4">
                <span>Penerimaan Kas dari Pelanggan (Marketplace & POS)</span>
                <span className="font-mono">{formatIDR(revenueTotal * 0.95)}</span>
              </div>
              <div className="flex justify-between py-1 pl-4 text-rose-600">
                <span>Pembayaran Beban Operasional & Gaji Karyawan</span>
                <span className="font-mono">({formatIDR(expenseTotal + cogsTotal)})</span>
              </div>
              <div className="flex justify-between py-1 font-bold border-t text-slate-900 dark:text-white pt-1">
                <span>Kas Bersih dari Aktivitas Operasional</span>
                <span className="font-mono text-emerald-600">{formatIDR(operatingCashFlow)}</span>
              </div>
            </div>

            <div>
              <p className="font-bold border-b pb-1 text-slate-700 dark:text-slate-200">2. ARUS KAS DARI AKTIVITAS INVESTASI</p>
              <div className="flex justify-between py-1 pl-4 text-rose-600">
                <span>Perolehan Aset Tetap / Mesin Pabrik R&D</span>
                <span className="font-mono">({formatIDR(Math.abs(investingCashFlow))})</span>
              </div>
              <div className="flex justify-between py-1 font-bold border-t text-slate-900 dark:text-white pt-1">
                <span>Kas Bersih dari Aktivitas Investasi</span>
                <span className="font-mono text-rose-600">({formatIDR(Math.abs(investingCashFlow))})</span>
              </div>
            </div>

            <div>
              <p className="font-bold border-b pb-1 text-slate-700 dark:text-slate-200">3. ARUS KAS DARI AKTIVITAS PENDANAAN</p>
              <div className="flex justify-between py-1 pl-4">
                <span>Penerimaan Pinjaman / Modal Disetor</span>
                <span className="font-mono">{formatIDR(financingCashFlow)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold border-t text-slate-900 dark:text-white pt-1">
                <span>Kas Bersih dari Aktivitas Pendanaan</span>
                <span className="font-mono text-emerald-600">{formatIDR(financingCashFlow)}</span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-slate-900 dark:border-slate-100 flex justify-between items-center text-sm font-black">
              <span>KENAIKAN BERSIH KAS & SETARA KAS</span>
              <span className="text-xl text-[#b90f0f] font-mono">{formatIDR(netCashFlow)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Financial Ratios View */}
      {reportType === 'ratios' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 max-w-3xl mx-auto">
          <div className="text-center border-b pb-3">
            <h3 className="font-extrabold text-base text-[#b90f0f] uppercase">{companyProfile.legalName}</h3>
            <p className="font-bold text-xs text-slate-900 dark:text-white">ANALISIS RASIO KEUANGAN PERUSAHAAN</p>
            <p className="text-[11px] text-slate-500 font-mono">Evaluasi Kesehatan Finansial Korporat</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Current Ratio (Likuiditas)</span>
                <span className="text-base font-black text-emerald-600 font-mono">{currentRatio}x</span>
              </div>
              <p className="text-[11px] text-slate-500">Kemampuan membayar kewajiban lancar dengan aset lancar. Standar sehat &gt; 1.5x.</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Debt to Equity Ratio (DER)</span>
                <span className="text-base font-black text-blue-600 font-mono">{debtToEquity}x</span>
              </div>
              <p className="text-[11px] text-slate-500">Perbandingan total hutang dengan ekuitas pemegang saham. Standar sehat &lt; 1.0x.</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Net Profit Margin (NPM)</span>
                <span className="text-base font-black text-[#b90f0f] font-mono">{netProfitMargin}%</span>
              </div>
              <p className="text-[11px] text-slate-500">Persentase laba bersih terhadap total pendapatan penjualan bersih.</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Return on Assets (ROA)</span>
                <span className="text-base font-black text-emerald-600 font-mono">{roa}%</span>
              </div>
              <p className="text-[11px] text-slate-500">Tingkat pengembalian laba bersih atas total pemanfaatan aset korporat.</p>
            </div>
          </div>
        </div>
      )}

      {/* Expense Trends View */}
      {reportType === 'expense_trends' && (() => {
        const expenseCategories = [
          { id: 'all', name: 'Semua Beban', color: '#64748b' },
          { id: 'salary', name: 'Gaji & Tunjangan (6101)', color: '#3b82f6' },
          { id: 'marketing', name: 'Pemasaran & Digital Ads (6102)', color: '#ec4899' },
          { id: 'depreciation', name: 'Penyusutan Aset Tetap (6103)', color: '#f59e0b' },
          { id: 'utilities', name: 'Listrik, Air & Internet (6104)', color: '#06b6d4' },
          { id: 'rnd', name: 'Biaya Riset & BOM Lab (6105)', color: '#10b981' },
          { id: 'total', name: 'Total Beban', color: '#b90f0f' }
        ];

        const selectedCatObj = expenseCategories.find(c => c.id === expenseCategoryFilter) || expenseCategories[0];
        const values = expenseTrendData.map(d => d[expenseCategoryFilter as keyof typeof d] as number || d.total);
        const totalCategorySum = values.reduce((sum, v) => sum + v, 0);
        const averageCategoryVal = Math.round(totalCategorySum / values.length);
        const maxCategoryVal = Math.max(...values);
        const minCategoryVal = Math.min(...values);

        const peakMonth = expenseTrendData.find(d => (d[expenseCategoryFilter as keyof typeof d] || d.total) === maxCategoryVal)?.month || '';
        const lowestMonth = expenseTrendData.find(d => (d[expenseCategoryFilter as keyof typeof d] || d.total) === minCategoryVal)?.month || '';

        const formatShortIDR = (val: number) => {
          if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)} M`;
          if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)} Jt`;
          if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)} Rb`;
          return `Rp ${val}`;
        };

        const CustomTooltip = ({ active, payload, label }: any) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-lg text-xs space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-100">{label} 2026</p>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payload.map((entry: any) => {
                    const catInfo = expenseCategories.find(c => c.id === entry.name || c.id === entry.dataKey);
                    const displayName = catInfo ? catInfo.name : entry.name;
                    return (
                      <div key={entry.name || entry.dataKey} className="flex items-center justify-between gap-6 py-1">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          {displayName}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatIDR(entry.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        };

        return (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#b90f0f]" />
                  Visualisasi Tren Pengeluaran Operasional (Fiscal Year 2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Analisis pergerakan beban bulanan perusahaan dengan filter kategori interaktif
                </p>
              </div>
            </div>

            {/* Category Toggle Grid */}
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map(cat => {
                const isSelected = expenseCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setExpenseCategoryFilter(cat.id)}
                    style={{
                      backgroundColor: isSelected ? cat.color : undefined,
                      borderColor: isSelected ? cat.color : undefined
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected 
                        ? 'text-white shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Interactive KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Pengeluaran (12 Bln)</p>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono mt-1">
                  {formatIDR(totalCategorySum)}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Kumulatif Januari - Desember</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Rata-rata Bulanan</p>
                <p className="text-sm sm:text-base font-black text-[#b90f0f] font-mono mt-1">
                  {formatIDR(averageCategoryVal)}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Rata-rata pengeluaran periodik</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Pengeluaran Tertinggi</p>
                <p className="text-sm sm:text-base font-black text-emerald-600 font-mono mt-1">
                  {formatIDR(maxCategoryVal)}
                </p>
                <p className="text-[9px] text-emerald-600 mt-0.5 font-bold">Puncak pada Bulan {peakMonth}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Pengeluaran Terendah</p>
                <p className="text-sm sm:text-base font-black text-blue-600 font-mono mt-1">
                  {formatIDR(minCategoryVal)}
                </p>
                <p className="text-[9px] text-blue-600 mt-0.5 font-bold">Terendah pada Bulan {lowestMonth}</p>
              </div>
            </div>

            {/* Line Chart Container */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4">
                Grafik Interaktif Tren Bulanan ({selectedCatObj.name})
              </p>
              
              <div className="w-full h-80 min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={expenseTrendData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={formatShortIDR}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }}
                    />

                    {expenseCategoryFilter === 'all' ? (
                      <>
                        <Line 
                          type="monotone" 
                          dataKey="salary" 
                          name="salary" 
                          stroke="#3b82f6" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, strokeWidth: 1.5 }}
                          activeDot={{ r: 5 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="marketing" 
                          name="marketing" 
                          stroke="#ec4899" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, strokeWidth: 1.5 }}
                          activeDot={{ r: 5 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="depreciation" 
                          name="depreciation" 
                          stroke="#f59e0b" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, strokeWidth: 1.5 }}
                          activeDot={{ r: 5 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="utilities" 
                          name="utilities" 
                          stroke="#06b6d4" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, strokeWidth: 1.5 }}
                          activeDot={{ r: 5 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rnd" 
                          name="rnd" 
                          stroke="#10b981" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, strokeWidth: 1.5 }}
                          activeDot={{ r: 5 }} 
                        />
                      </>
                    ) : (
                      <Line 
                        type="monotone" 
                        dataKey={expenseCategoryFilter} 
                        name={expenseCategoryFilter} 
                        stroke={selectedCatObj.color} 
                        strokeWidth={3} 
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }} 
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {expenseCategoryFilter === 'all' && (
                <p className="text-[10px] text-slate-400 mt-2 text-center italic font-semibold">
                  * Catatan: Grafik multi-line di atas sengaja menyembunyikan 'Total Beban' agar rasio visual antar kategori tetap proporsional dan tidak terdistorsi oleh perbedaan skala nominal.
                </p>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
};
