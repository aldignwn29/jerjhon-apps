import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Award } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';

export const QualityControlView: React.FC = () => {
  const { qualityLogs, addQualityLog } = useERP();

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#b90f0f]" />
            Quality Control (QC), BPOM & Halal Assurance
          </h2>
          <p className="text-xs text-slate-500">
            Pengujian Sampel Batch Produksi: Kadar pH, Viskositas, Uji Mikrobiologi, Packaging & Sertifikasi Halal
          </p>
        </div>
      </div>

      {/* QC Logs Table */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-x-auto">
        <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/60 border-b text-slate-600 dark:text-slate-300 font-bold">
              <th className="p-3">Batch # & Ref QC</th>
              <th className="p-3">Batch Produksi</th>
              <th className="p-3">Tanggal Uji</th>
              <th className="p-3">Parameter Uji Fisik & Lab</th>
              <th className="p-3">Inspector QC</th>
              <th className="p-3 text-center">Hasil Uji Quality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {(qualityLogs || []).map((qc) => (
              <tr key={qc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="p-3 font-mono font-bold text-[#b90f0f]">{qc.inspectionCode}</td>
                <td className="p-3 font-semibold">{qc.batchNumber}</td>
                <td className="p-3 font-mono text-slate-500">{qc.inspectionDate}</td>
                <td className="p-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">{qc.parametersChecked}</td>
                <td className="p-3 font-semibold">{qc.inspectorName}</td>
                <td className="p-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    qc.status === 'Passed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {qc.status} BPOM/Halal Verified
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
