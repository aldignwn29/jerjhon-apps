import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine 
} from 'recharts';
import { Target, TrendingUp, Calendar, CheckCircle2, Award, Zap, ArrowUpRight, ShieldCheck, User } from 'lucide-react';
import { KPITask, Employee } from '../../../types';

interface StaffQuarterlyPerformanceChartProps {
  employee: Employee;
  kpiTasks: KPITask[];
}

export const StaffQuarterlyPerformanceChart: React.FC<StaffQuarterlyPerformanceChartProps> = ({ employee, kpiTasks }) => {
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q3 2026');

  // Filter tasks for this staff member
  const staffTasks = useMemo(() => {
    return kpiTasks.filter(t => 
      t.employeeId === employee.id || 
      (t.employeeName && employee.name && t.employeeName.toLowerCase() === employee.name.toLowerCase())
    );
  }, [kpiTasks, employee]);

  // Summary statistics for logged in staff member
  const staffStats = useMemo(() => {
    const total = staffTasks.length;
    const approved = staffTasks.filter(t => t.status === 'Approved').length;
    const pending = staffTasks.filter(t => t.status === 'Pending').length;
    const submitted = staffTasks.filter(t => t.status === 'Submitted').length;
    
    const graded = staffTasks.filter(t => t.score !== undefined);
    
    // Generate a beautiful, realistic, deterministic baseline score based on the employee's name/ID if no tasks have been graded yet
    const baselineScore = 0;
    
    const avg = graded.length > 0 
      ? Math.round(graded.reduce((acc, t) => acc + (t.score || 0), 0) / graded.length) 
      : (total > 0 ? 0 : baselineScore);

    let predicate = 'Sangat Baik (On Track)';
    let badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
    if (avg === 0) {
      predicate = 'Belum Ada Penilaian';
      badgeColor = 'bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300';
    } else if (avg >= 90) {
      predicate = 'Istimewa (Exceeds Target)';
      badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    } else if (avg < 75) {
      predicate = 'Perlu Peningkatan';
      badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    }

    const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      totalTasks: total,
      approvedTasks: approved,
      pendingTasks: pending,
      submittedTasks: submitted,
      avgScore: avg,
      predicate,
      badgeColor,
      completionRate
    };
  }, [staffTasks, employee]);

  // Calculate staff Q3 2026 quarterly performance trajectory data (12 Weeks of Q3)
  const staffQuarterTimeline = useMemo(() => {
    const weeks = [
      { week: 'Jul W1', label: 'Juli M1', expected: 8.3, name: 'Minggu 1' },
      { week: 'Jul W2', label: 'Juli M2', expected: 16.6, name: 'Minggu 2' },
      { week: 'Jul W3', label: 'Juli M3', expected: 25.0, name: 'Minggu 3' },
      { week: 'Jul W4', label: 'Juli M4 (Saat Ini)', expected: 33.3, name: 'Minggu 4' },
      { week: 'Ags W1', label: 'Agustus M1', expected: 41.6, name: '' },
      { week: 'Ags W2', label: 'Agustus M2', expected: 50.0, name: '' },
      { week: 'Ags W3', label: 'Agustus M3', expected: 58.3, name: '' },
      { week: 'Ags W4', label: 'Agustus M4', expected: 66.6, name: '' },
      { week: 'Sep W1', label: 'September M1', expected: 75.0, name: '' },
      { week: 'Sep W2', label: 'September M2', expected: 83.3, name: '' },
      { week: 'Sep W3', label: 'September M3', expected: 91.6, name: '' },
      { week: 'Sep W4', label: 'September M4', expected: 100.0, name: '' }
    ];

    const overallAvg = staffStats.avgScore;

    return weeks.map((w, idx) => {
      let actual: number | null = null;
      let projected: number | null = null;

      // Actual progression up to Jul W4 (idx 3)
      if (idx <= 3) {
        // Collect cumulative tasks up to this week in Juli 2026
        const allowedWeeks = weeks.slice(0, idx + 1).map(x => x.name);
        const cumulativeTasks = staffTasks.filter(t => 
          t.month === 'Juli 2026' && allowedWeeks.includes(t.week)
        );
        const gradedCumulative = cumulativeTasks.filter(t => t.score !== undefined);

        if (gradedCumulative.length > 0) {
          actual = Math.round(gradedCumulative.reduce((acc, t) => acc + (t.score || 0), 0) / gradedCumulative.length);
        } else {
          // Fallback to deterministic curve ending at overallAvg
          const multipliers = [0.75, 0.85, 0.95, 1.0];
          actual = Math.min(100, Math.round(overallAvg * multipliers[idx]));
        }
      }

      // Projected progression from Jul W4 onwards
      if (idx >= 3) {
        // Find actual at idx 3 to start projection from there
        const hasScoredTasks = staffTasks.filter(t => t.month === 'Juli 2026' && t.score !== undefined).length > 0;
        const startScore = hasScoredTasks
          ? Math.round(
              staffTasks.filter(t => t.month === 'Juli 2026' && t.score !== undefined)
                .reduce((acc, t) => acc + (t.score || 0), 0) / 
              staffTasks.filter(t => t.month === 'Juli 2026' && t.score !== undefined).length
            )
          : overallAvg;

        projected = Math.min(100, Math.round(startScore + (idx - 3) * 1.5));
      }

      const targetIdeal = Math.round(w.expected);

      return {
        weekLabel: w.label,
        TargetIdeal: targetIdeal,
        CapaianAktual: actual,
        ProyeksiPencapaian: projected,
        isCurrent: idx === 3
      };
    });
  }, [staffTasks, staffStats, employee]);

  const estimatedEndScore = useMemo(() => {
    const lastPoint = staffQuarterTimeline[staffQuarterTimeline.length - 1];
    return lastPoint ? lastPoint.ProyeksiPencapaian || staffStats.avgScore : staffStats.avgScore;
  }, [staffQuarterTimeline, staffStats]);

  // Dynamic insight text
  const dynamicInsightNote = useMemo(() => {
    const avg = staffStats.avgScore;
    const completionRate = staffStats.completionRate;
    if (avg >= 90) {
      return `Luar biasa! Anda berada di jalur istimewa (Exceeds Target) untuk melampaui target KPI Q3 2026 dengan tingkat penyelesaian tugas ${completionRate}% dan rata-rata skor ${avg}/100. Kinerja luar biasa!`;
    } else if (avg >= 75) {
      return `Anda berada di jalur yang sangat baik (On Track) untuk mencapai target KPI Q3 2026 dengan tingkat penyelesaian tugas ${completionRate}% dan rata-rata skor ${avg}/100. Pertahankan konsistensi Anda!`;
    } else if (avg > 0) {
      return `Tingkat penyelesaian tugas Anda saat ini ${completionRate}% dengan rata-rata skor ${avg}/100. Disarankan meningkatkan fokus untuk mencapai target minimal kuartal ini.`;
    } else {
      return `Belum ada tugas KPI yang selesai dan dinilai kuartal ini. Selesaikan tugas Anda dan ajukan penilaian untuk melihat perkembangan performa Anda secara real-time.`;
    }
  }, [staffStats]);

  return (
    <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
      
      {/* Header with Staff Identity & Quarter Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Progres Target Kinerja Personal: {employee.name}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${staffStats.badgeColor}`}>
                {staffStats.predicate}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              NIK: {employee.nik || employee.id} • {employee.position} ({employee.department}) • Kuartal {selectedQuarter}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="Q3 2026">Q3 2026 (Juli - Sep)</option>
            <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
          </select>
        </div>
      </div>

      {/* Metric Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skor KPI Rata-rata</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
            {staffStats.avgScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Penyelesaian</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
            {staffStats.completionRate}% <span className="text-xs font-normal text-slate-500">Selesai</span>
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tugas Disetujui</span>
          <span className="text-xl font-black text-slate-800 dark:text-white font-mono mt-0.5 block">
            {staffStats.approvedTasks} <span className="text-xs font-normal text-slate-500">/ {staffStats.totalTasks} Task</span>
          </span>
        </div>

        <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/40">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">Estimasi Akhir Q3</span>
          <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5 block flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> {estimatedEndScore}% {estimatedEndScore >= 75 ? '(Target Tercapai)' : '(Perlu Peningkatan)'}
          </span>
        </div>
      </div>

      {/* Graphical Recharts Progress Indicator */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" /> 
            Grafik Trajectory Progres Target Kinerja Karyawan (Q3 2026: Minggu 1 - Minggu 12)
          </span>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Realisasi Anda
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-0.5 bg-slate-400 inline-block border-t border-dashed" /> Target Pace Ideal
            </span>
          </div>
        </div>

        <div className="h-72 w-full text-xs font-medium">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={staffQuarterTimeline} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="weekLabel" 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderRadius: '12px', 
                  border: '1px solid #334155', 
                  color: '#f8fafc', 
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
                formatter={(value: any, name: any) => {
                  if (value === null) return ['-', name];
                  const labelMap: Record<string, string> = {
                    CapaianAktual: 'Realisasi Skor Anda',
                    TargetIdeal: 'Pace Target Ideal Q3',
                    ProyeksiPencapaian: 'Proyeksi Akhir Kuartal'
                  };
                  return [`${value}%`, labelMap[name] || name];
                }}
              />
              
              <ReferenceLine x="Juli M4 (Saat Ini)" stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Saat Ini', fill: '#3b82f6', fontSize: 10, fontWeight: 800, position: 'top' }} />

              <Line 
                type="monotone" 
                dataKey="TargetIdeal" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={false}
                name="TargetIdeal"
              />

              <Line 
                type="monotone" 
                dataKey="ProyeksiPencapaian" 
                stroke="#6366f1" 
                strokeWidth={2} 
                strokeDasharray="2 2"
                dot={{ r: 3, fill: '#6366f1' }}
                name="ProyeksiPencapaian"
              />

              <Line 
                type="monotone" 
                dataKey="CapaianAktual" 
                stroke="#2563eb" 
                strokeWidth={3.5} 
                dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: '#ffffff' }}
                name="CapaianAktual"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight Footer */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
        <Zap className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Catatan Kinerja Anda:</strong> {dynamicInsightNote}
        </span>
      </div>

    </div>
  );
};
