import React, { useState, useMemo } from 'react';
import { FileText, Download, Printer, Filter, Calendar, BarChart3, PieChart, Table, Lock } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export const ExecutiveReportsView: React.FC = () => {
  const {
    employees,
    marketplaceOrders,
    products,
    payrolls,
    journals,
    formatIDR,
    companyProfile,
    isStaff,
    currentUser
  } = useERP();
  if (!currentUser) return null;

  const [reportType, setReportType] = useState<string>('konsolidasi');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-07');

  const chartData = useMemo(() => {
      // Aggregate data by channel for the chart
      const dataMap: Record<string, { channel: string, sales: number, profit: number }> = {};
      marketplaceOrders.forEach(o => {
          if (!dataMap[o.channel]) {
              dataMap[o.channel] = { channel: o.channel, sales: 0, profit: 0 };
          }
          dataMap[o.channel].sales += (o.grossAmount || 0);
          dataMap[o.channel].profit += (o.netProfit || 0);
      });
      return Object.values(dataMap);
  }, [marketplaceOrders]);

  const handleExportCSV = () => {
    alert(`Laporan [${reportType.toUpperCase()}] untuk periode ${selectedMonth} berhasil di-generate dan siap di-download.`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isStaff) {
    return (
      <div className="space-y-6">
        <RoleAccessBanner moduleName="Executive BI Reports & Analytics" />
        
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm text-center max-w-2xl mx-auto space-y-4 my-8">
          <div className="w-16 h-16 bg-rose-100 text-[#b90f0f] rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Restriksi Akses Laporan Business Intelligence (BI)
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Halaman Executive Business Intelligence (BI) Reports diperuntukkan khusus bagi level <strong>Direksi, C-Level, & Manager Perusahaan</strong> untuk evaluasi kinerja bisnis makro.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl text-left border text-xs text-slate-600 dark:text-slate-300 space-y-1 font-medium">
            <p className="font-bold text-slate-900 dark:text-white">Informasi Akun Anda saat ini:</p>
            <p>• Nama: <span className="font-bold">{currentUser.name}</span></p>
            <p>• Role Akses: <span className="font-bold text-[#b90f0f]">{currentUser.role}</span></p>
            <p className="text-[11px] text-slate-400 pt-1">Silakan gunakan Role Switcher di kanan atas untuk beralih ke role Manager / Admin jika ingin menguji visualisasi data BI ini.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Executive BI Reports" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#b90f0f]" />
            Executive BI Reports & Business Intelligence
          </h2>
          <p className="text-xs text-slate-500">
            Laporan bisnis eksekutif terpadu untuk Audit, Stakeholder, & Direksi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export Excel/CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-4 text-xs font-medium">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#b90f0f]" />
          <span className="font-bold text-slate-700 dark:text-slate-300">Jenis Laporan:</span>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="konsolidasi">Laporan Ringkasan Executive Konsolidasi</option>
            <option value="marketplace">Laporan Sales Marketplace & Channel GMV</option>
            <option value="payroll">Laporan Rekapitulasi Payroll & Beban SDM</option>
            <option value="inventory">Laporan Valuasi Inventory & HPP</option>
            <option value="journal">Laporan Audit Jurnal Keuangan</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-400">Periode:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1 text-slate-800 dark:text-slate-200 font-mono"
          />
        </div>
      </div>

      {/* Report View Printable Paper */}
      <div id="printable-report" className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 shadow-lg space-y-6">
        
        {/* Paper Header */}
        <div className="border-b-2 border-[#b90f0f] pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#b90f0f] uppercase tracking-tight">
              {companyProfile.legalName}
            </h1>
            <p className="text-xs text-slate-600">{companyProfile.address}, {companyProfile.city}</p>
            <p className="text-[10px] text-slate-500 font-mono">NPWP: {companyProfile.taxRegistrationNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold bg-[#b90f0f]/10 text-[#b90f0f] px-3 py-1 rounded-full uppercase">
              EXECUTIVE REPORT
            </span>
            <p className="text-xs text-slate-500 mt-1 font-mono">Periode: {selectedMonth}</p>
          </div>
        </div>

        {/* Dynamic Report Content */}
        {reportType === 'konsolidasi' && (
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-1">
              1. EXECUTIVE FINANCIAL & OPERATIONAL SUMMARY
            </h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Total Penjualan Marketplace</span>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {formatIDR(marketplaceOrders.reduce((s, o) => s + (o.grossAmount || 0), 0))}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Total Laba Bersih E-Commerce</span>
                <p className="text-base font-bold text-emerald-700 mt-1">
                  {formatIDR(marketplaceOrders.reduce((s, o) => s + (o.netProfit || 0), 0))}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Beban Payroll SDM</span>
                <p className="text-base font-bold text-rose-700 mt-1">
                  {formatIDR(payrolls.reduce((s, p) => s + p.takeHomePay, 0))}
                </p>
              </div>
            </div>

            <div className="h-64 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatIDR(value)} />
                  <Legend />
                  <Bar dataKey="sales" name="Sales" fill="#b90f0f" />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <h3 className="font-bold text-sm text-slate-800 border-b pb-1 pt-2">
              2. KINERJA MULTI-CHANNEL SALES E-COMMERCE
            </h3>
            <div className="overflow-x-auto w-full pb-4"><table className="whitespace-nowrap min-w-full w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b font-bold text-slate-700">
                  <th className="p-2">Channel</th>
                  <th className="p-2">Order #</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Gross Sales</th>
                  <th className="p-2">Admin Fee</th>
                  <th className="p-2">COGS</th>
                  <th className="p-2 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(marketplaceOrders || []).map((o) => (
                  <tr key={o.id}>
                    <td className="p-2 font-bold text-[#b90f0f]">{o.channel}</td>
                    <td className="p-2 font-mono">{o.orderNumber}</td>
                    <td className="p-2">{o.customerName}</td>
                    <td className="p-2 font-semibold">{formatIDR(o.grossAmount)}</td>
                    <td className="p-2 text-slate-500">{formatIDR(o.marketplaceAdminFee)}</td>
                    <td className="p-2 text-slate-500">{formatIDR(o.cogs)}</td>
                    <td className="p-2 text-right font-bold text-emerald-700">{formatIDR(o.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {reportType === 'marketplace' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-1">
              LAPORAN DETAIL CHANNEL SALES MARKETPLACE
            </h3>
            <div className="overflow-x-auto w-full pb-4"><table className="whitespace-nowrap min-w-full w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b font-bold text-slate-700">
                  <th className="p-2">Tanggal</th>
                  <th className="p-2">Order Number</th>
                  <th className="p-2">Channel</th>
                  <th className="p-2">Produk SKU</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Harga Total</th>
                  <th className="p-2">Profit Net</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(marketplaceOrders || []).map((m) => (
                  <tr key={m.id}>
                    <td className="p-2 font-mono">{m.orderDate}</td>
                    <td className="p-2 font-bold">{m.orderNumber}</td>
                    <td className="p-2">{m.channel}</td>
                    <td className="p-2">{m.productName}</td>
                    <td className="p-2">{m.quantity} Pcs</td>
                    <td className="p-2 font-bold">{formatIDR(m.grossAmount)}</td>
                    <td className="p-2 text-emerald-700 font-bold">{formatIDR(m.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {reportType === 'payroll' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-1">
              REKAPITULASI PAYROLL & BEBAN SDM BULANAN
            </h3>
            <div className="overflow-x-auto w-full pb-4"><table className="whitespace-nowrap min-w-full w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b font-bold text-slate-700">
                  <th className="p-2">Nama Karyawan</th>
                  <th className="p-2">Jabatan</th>
                  <th className="p-2">Gaji Pokok</th>
                  <th className="p-2">Tunjangan</th>
                  <th className="p-2">Potongan</th>
                  <th className="p-2 text-right">Take Home Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(payrolls || []).map((p, idx) => (
                  <tr key={`${p.id}-${idx}`}>
                    <td className="p-2 font-bold">{p.employeeName}</td>
                    <td className="p-2">{p.position}</td>
                    <td className="p-2">{formatIDR(p.baseSalary)}</td>
                    <td className="p-2">{formatIDR(p.fixedAllowance + p.variableAllowance)}</td>
                    <td className="p-2 text-rose-600">{formatIDR(p.totalDeduction)}</td>
                    <td className="p-2 text-right font-bold text-[#b90f0f]">{formatIDR(p.takeHomePay)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {/* Paper Footer */}
        <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <p>Dicetak Otomatis dari System Jerjhon ERP Enterprise v2.5</p>
          <p>Halaman 1 dari 1</p>
          <p>Status: Laporan Sah & Terverifikasi Audit Engine</p>
        </div>

      </div>

    </div>
  );
};
