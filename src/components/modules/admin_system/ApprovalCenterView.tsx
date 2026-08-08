import React from 'react';
import { CheckCircle2, XCircle, Clock, ShieldCheck, FileCheck2 } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';

export const ApprovalCenterView: React.FC = () => {
  const { approvalRequests, approveRequest, rejectRequest, currentUser, formatIDR } = useERP();

  if (!currentUser) return null;

  const pendingCount = approvalRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#b90f0f]" />
            Persetujuan & Governance Center (Approval Workflows)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pusat Otentikasi & Otorisasi Pengeluaran Anggaran, Purchase Order, Pengajuan Cuti, dan Payroll Batch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            {pendingCount} Menunggu Persetujuan Anda
          </span>
        </div>
      </div>

      {/* Approval Requests Table */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-[#b90f0f]" />
          Daftar Pengajuan Persetujuan Berjalan
        </h3>

        <div className="overflow-x-auto">
          <table className="whitespace-nowrap w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">ID & Tipe Dokumen</th>
                <th className="p-3">Pemohon (Requester)</th>
                <th className="p-3">Departemen</th>
                <th className="p-3">Nilai Transaksi</th>
                <th className="p-3">Tanggal Pengajuan</th>
                <th className="p-3">Status</th>
                <th className="p-3 rounded-r-xl">Aksi Otorisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {(approvalRequests || []).map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                  <td className="p-3 font-bold">
                    <div className="text-slate-900 dark:text-white">{req.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{req.id} • {req.documentType}</div>
                  </td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{req.requestedByName}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{req.department}</td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {req.amount ? formatIDR(req.amount) : '-'}
                  </td>
                  <td className="p-3 text-slate-500 font-mono">{req.requestDate}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      req.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : req.status === 'Rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {req.status === 'Pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveRequest(req.id, currentUser.name)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                        </button>
                        <button
                          onClick={() => rejectRequest(req.id, currentUser.name)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Oleh: {req.approvedBy || '-'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
