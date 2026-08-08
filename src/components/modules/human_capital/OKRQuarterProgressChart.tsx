import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  ReferenceLine, 
  Area, 
  ComposedChart 
} from 'recharts';
import { Target, TrendingUp, Calendar, CheckCircle2, Award, Zap, ArrowUpRight, Filter } from 'lucide-react';
import { OKRRecord, KPITask } from '../../../types';

interface OKRQuarterProgressChartProps {
  okrs: OKRRecord[];
  kpiTasks?: KPITask[];
}

export const OKRQuarterProgressChart: React.FC<OKRQuarterProgressChartProps> = ({ okrs, kpiTasks = [] }) => {
  // Selected Metric filter
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q3 2026');

  const overallAvgProgress = useMemo(() => {
    if (!okrs || okrs.length === 0) return 0;
    const total = okrs.reduce((acc, o) => acc + (o.progress || 0), 0);
    return Math.round(total / okrs.length);
  }, [okrs]);

  const kr1Val = useMemo(() => {
    for (const okr of okrs) {
      const kr = okr.keyResults?.find(k => k.id === 'KR-1');
      if (kr) return kr.current / 1000000000; // in Miliar Rp
    }
    return 0;
  }, [okrs]);

  const kr2Val = useMemo(() => {
    for (const okr of okrs) {
      const kr = okr.keyResults?.find(k => k.id === 'KR-2');
      if (kr) return kr.current;
    }
    return 0;
  }, [okrs]);

  const kr3Val = useMemo(() => {
    for (const okr of okrs) {
      const kr = okr.keyResults?.find(k => k.id === 'KR-201');
      if (kr) return kr.current;
    }
    return 0;
  }, [okrs]);

  // Custom Q3 2026 Timeline Data (12 Weeks of Q3: July W1-W4, August W1-W4, September W1-W4)
  // Current time anchor is late July 2026 (Week 4 of July / Week 4 of Q3)
  const quarterTimelineData = useMemo(() => {
    // 12 weeks of Q3 2026
    const weeks = [
      { week: 'Jul W1', label: 'Juli M1', isPast: true, expectedPace: 8.3 },
      { week: 'Jul W2', label: 'Juli M2', isPast: true, expectedPace: 16.6 },
      { week: 'Jul W3', label: 'Juli M3', isPast: true, expectedPace: 25.0 },
      { week: 'Jul W4', label: 'Juli M4 (Saat Ini)', isPast: true, isCurrent: true, expectedPace: 33.3 },
      { week: 'Ags W1', label: 'Agustus M1', isPast: false, expectedPace: 41.6 },
      { week: 'Ags W2', label: 'Agustus M2', isPast: false, expectedPace: 50.0 },
      { week: 'Ags W3', label: 'Agustus M3', isPast: false, expectedPace: 58.3 },
      { week: 'Ags W4', label: 'Agustus M4', isPast: false, expectedPace: 66.6 },
      { week: 'Sep W1', label: 'September M1', isPast: false, expectedPace: 75.0 },
      { week: 'Sep W2', label: 'September M2', isPast: false, expectedPace: 83.3 },
      { week: 'Sep W3', label: 'September M3', isPast: false, expectedPace: 91.6 },
      { week: 'Sep W4', label: 'September M4', isPast: false, expectedPace: 100.0 }
    ];

    if (selectedMetric === 'overall') {
      // Overall OKR % completion progress over Q3
      // Actual data up to Jul W4, and projections after Jul W4
      return weeks.map((w, idx) => {
        let actualProgress: number | null = null;
        let projectedProgress: number | null = null;

        if (idx === 0) actualProgress = Math.round(overallAvgProgress * 0.22);
        else if (idx === 1) actualProgress = Math.round(overallAvgProgress * 0.46);
        else if (idx === 2) actualProgress = Math.round(overallAvgProgress * 0.75);
        else if (idx === 3) actualProgress = overallAvgProgress; // Current actual Q3 progress achieved!

        // Projected line starting from current week
        if (idx >= 3) {
          projectedProgress = overallAvgProgress === 0 ? 0 : Math.min(100, Math.round(overallAvgProgress + (idx - 3) * 3.5));
        }

        return {
          weekLabel: w.label,
          targetPace: Math.round(w.expectedPace),
          CapaianAktual: actualProgress,
          ProyeksiTarget: projectedProgress,
          TargetIdeal: Math.round(w.expectedPace),
          isCurrent: w.isCurrent
        };
      });
    } else if (selectedMetric === 'kr-1') {
      // Key Result 1: GMV Target Rp 8.5 Miliar
      const targetGMV = 8.5; // in Miliar
      return weeks.map((w, idx) => {
        let actual: number | null = null;
        let projected: number | null = null;

        if (idx === 0) actual = Number((kr1Val * 0.2).toFixed(2));
        else if (idx === 1) actual = Number((kr1Val * 0.44).toFixed(2));
        else if (idx === 2) actual = Number((kr1Val * 0.74).toFixed(2));
        else if (idx === 3) actual = kr1Val; // Current Rp

        if (idx >= 3) {
          projected = kr1Val === 0 ? 0 : Number((kr1Val + (idx - 3) * 0.22).toFixed(2));
        }

        const targetPaceVal = Number(((targetGMV / 12) * (idx + 1)).toFixed(2));

        return {
          weekLabel: w.label,
          CapaianAktual: actual,
          ProyeksiTarget: projected,
          TargetIdeal: targetPaceVal,
          isCurrent: w.isCurrent
        };
      });
    } else if (selectedMetric === 'kr-2') {
      // Key Result 2: ROAS Target 4.5x
      return weeks.map((w, idx) => {
        let actual: number | null = null;
        let projected: number | null = null;

        if (idx === 0) actual = Number((kr2Val * 0.74).toFixed(2));
        else if (idx === 1) actual = Number((kr2Val * 0.82).toFixed(2));
        else if (idx === 2) actual = Number((kr2Val * 0.92).toFixed(2));
        else if (idx === 3) actual = kr2Val; // Current ROAS

        if (idx >= 3) {
          projected = kr2Val === 0 ? 0 : Number((kr2Val + (idx - 3) * 0.05).toFixed(2));
        }

        return {
          weekLabel: w.label,
          CapaianAktual: actual,
          ProyeksiTarget: projected,
          TargetIdeal: 4.5,
          isCurrent: w.isCurrent
        };
      });
    } else {
      // Key Result 3 or Operational OKR: Stock Accuracy 99.5%
      return weeks.map((w, idx) => {
        let actual: number | null = null;
        let projected: number | null = null;

        if (idx === 0) actual = kr3Val > 0 ? Number((kr3Val * 0.983).toFixed(1)) : 0;
        else if (idx === 1) actual = kr3Val > 0 ? Number((kr3Val * 0.99).toFixed(1)) : 0;
        else if (idx === 2) actual = kr3Val > 0 ? Number((kr3Val * 0.995).toFixed(1)) : 0;
        else if (idx === 3) actual = kr3Val;

        if (idx >= 3) {
          projected = kr3Val === 0 ? 0 : Number((kr3Val + (idx - 3) * 0.02).toFixed(1));
          if (projected > 100) projected = 100;
        }

        return {
          weekLabel: w.label,
          CapaianAktual: actual,
          ProyeksiTarget: projected,
          TargetIdeal: 99.5,
          isCurrent: w.isCurrent
        };
      });
    }
  }, [selectedMetric, overallAvgProgress, kr1Val, kr2Val, kr3Val]);

  // Metric metadata
  const metricInfo = useMemo(() => {
    switch (selectedMetric) {
      case 'kr-1': {
        const pct = Math.round((kr1Val / 8.5) * 100) || 0;
        return {
          title: 'Target Gross Merchandise Value (GMV E-Commerce)',
          unit: 'Miliar Rp',
          targetText: 'Rp 8.5 Miliar',
          currentText: `Rp ${kr1Val} Miliar (${pct}%)`,
          status: kr1Val === 0 ? 'Belum Ada Progres' : (kr1Val >= 8.5 * 0.33 ? 'Ahead of Pace' : 'Behind Pace'),
          statusBg: kr1Val === 0 ? 'bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300' : (kr1Val >= 8.5 * 0.33 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300')
        };
      }
      case 'kr-2': {
        const pct = kr2Val > 0 ? Math.round((kr2Val / 4.5) * 100) : 0;
        return {
          title: 'Target ROAS (Return on Ad Spend - TikTok Live)',
          unit: 'x Multiplier',
          targetText: '4.5x ROAS',
          currentText: `${kr2Val}x ROAS (${pct}%)`,
          status: kr2Val === 0 ? 'Belum Ada Progres' : (kr2Val >= 4.5 ? 'Exceeds Target' : 'On-Track'),
          statusBg: kr2Val === 0 ? 'bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300' : (kr2Val >= 4.5 ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300')
        };
      }
      case 'kr-3': {
        const pct = kr3Val > 0 ? Math.round((kr3Val / 99.5) * 100) : 0;
        return {
          title: 'Akurasi Stok Warehouse & Gudang Transit',
          unit: '% Akurasi',
          targetText: '99.5%',
          currentText: `${kr3Val}% (${pct}%)`,
          status: kr3Val === 0 ? 'Belum Ada Progres' : (kr3Val >= 99.5 ? 'Achieved' : 'On-Track'),
          statusBg: kr3Val === 0 ? 'bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300' : (kr3Val >= 99.5 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300')
        };
      }
      default: {
        let status = 'On-Track';
        let statusBg = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
        if (overallAvgProgress === 0) {
          status = 'Belum Ada Progres';
          statusBg = 'bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300';
        } else if (overallAvgProgress >= 80) {
          status = 'On-Track (Pace Tinggi)';
          statusBg = 'bg-rose-100 text-[#b90f0f] dark:bg-rose-950/60 dark:text-rose-300';
        }
        return {
          title: 'Akumulasi Progress Seluruh Strategic OKRs Q3 2026',
          unit: '% Progress Capaian',
          targetText: '100% Akhir Q3',
          currentText: `${overallAvgProgress}% (Minggu ke-4 Juli)`,
          status,
          statusBg
        };
      }
    }
  }, [selectedMetric, overallAvgProgress, kr1Val, kr2Val, kr3Val]);

  const estimatedEndValue = useMemo(() => {
    const lastPoint = quarterTimelineData[quarterTimelineData.length - 1];
    return lastPoint ? lastPoint.ProyeksiTarget || 0 : 0;
  }, [quarterTimelineData]);

  const formattedEstimatedEnd = useMemo(() => {
    const lastVal = estimatedEndValue;
    switch (selectedMetric) {
      case 'kr-1': {
        const pct = Math.round((lastVal / 8.5) * 100);
        return `Rp ${lastVal} Miliar (${pct}%)`;
      }
      case 'kr-2': {
        const pct = Math.round((lastVal / 4.5) * 100);
        return `${lastVal}x ROAS (${pct}%)`;
      }
      case 'kr-3': {
        const pct = Math.round((lastVal / 99.5) * 100);
        return `${lastVal}% (${pct}%)`;
      }
      default: {
        return `${lastVal}%`;
      }
    }
  }, [estimatedEndValue, selectedMetric]);

  const endStatusText = useMemo(() => {
    const lastVal = estimatedEndValue;
    if (lastVal === 0) return '(Belum Ada)';
    switch (selectedMetric) {
      case 'kr-1':
        return lastVal >= 8.5 ? '(Target Tercapai)' : '(Di Bawah Target)';
      case 'kr-2':
        return lastVal >= 4.5 ? '(Target Tercapai)' : '(Di Bawah Target)';
      case 'kr-3':
        return lastVal >= 99.5 ? '(Target Tercapai)' : '(Di Bawah Target)';
      default:
        return lastVal >= 100 ? '(Target Tercapai)' : `(${lastVal}% Proyeksi)`;
    }
  }, [estimatedEndValue, selectedMetric]);

  const formattedPaceIdeal = useMemo(() => {
    switch (selectedMetric) {
      case 'kr-1':
        return 'Rp 2.83 Miliar';
      case 'kr-2':
        return '4.5x ROAS';
      case 'kr-3':
        return '99.5%';
      default:
        return '33.3%';
    }
  }, [selectedMetric]);

  const dynamicOKRInsight = useMemo(() => {
    if (overallAvgProgress === 0) {
      return "Belum ada progres capaian target OKR kuartal ini yang tercatat. Silakan lakukan update berkala pada Key Results untuk memantau lintasan pertumbuhan.";
    }
    const diff = overallAvgProgress - 33.3;
    if (diff > 0) {
      return `Pertumbuhan kuartal ini melaju +${diff.toFixed(1)}% lebih cepat dari lintasan linier ideal (33.3%) berkat pencapaian realisasi sebesar ${overallAvgProgress}%.`;
    } else {
      return `Progres kuartal saat ini berada di ${overallAvgProgress}% dibandingkan lintasan ideal 33.3%. Perlu fokus tambahan untuk mencapai target akhir kuartal.`;
    }
  }, [overallAvgProgress]);

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-[#b90f0f] dark:text-rose-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Progres Capaian Target OKR Q3 2026
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${metricInfo.statusBg}`}>
                {metricInfo.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Grafik Recharts yang memantau lintasan progress mingguan (W1–W12) dibandingkan dengan benchmark target kuartal ini.
            </p>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-[#b90f0f]" /> Target:
          </div>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#b90f0f]"
          >
            <option value="overall">🎯 Overall Progress Q3 OKRs (%)</option>
            <option value="kr-1">💰 GMV Sales Target (Rp 8.5 Miliar)</option>
            <option value="kr-2">📊 ROAS Meta/TikTok Ads (4.5x)</option>
            <option value="kr-3">📦 Warehouse Stock Accuracy (99.5%)</option>
          </select>

          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#b90f0f]"
          >
            <option value="Q3 2026">Kuartal Saat Ini (Q3 2026)</option>
            <option value="Q2 2026">Kuartal Lalu (Q2 2026)</option>
          </select>
        </div>
      </div>

      {/* Metric Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Metrik Target</span>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
            {metricInfo.title}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pace Target Ideal</span>
          <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5 block">
            {formattedPaceIdeal} pada W4 Juli
          </span>
        </div>

        <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-900/40">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">Capaian Riil Saat Ini</span>
          <span className="text-sm font-black text-[#b90f0f] dark:text-rose-300 font-mono mt-0.5 block">
            {metricInfo.currentText}
          </span>
        </div>

        <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Estimasi Akhir Q3</span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-300 font-mono mt-0.5 block flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> {formattedEstimatedEnd} {endStatusText}
          </span>
        </div>
      </div>

      {/* Main Recharts Line Graph Component */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#b90f0f]" /> Line Chart Trajectory: Capaian Aktual (Minggu 1-4) vs Lintasan Target (Minggu 1-12)
          </span>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-[#b90f0f]">
              <span className="w-3 h-3 rounded-full bg-[#b90f0f] inline-block" /> Capaian Realisasi
            </span>
            <span className="flex items-center gap-1.5 text-blue-500">
              <span className="w-3 h-0.5 bg-blue-500 inline-block border-t-2 border-dashed border-blue-500" /> Target Ideal Pace
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-0.5 bg-slate-400 inline-block border-t-2 border-dotted border-slate-400" /> Proyeksi Akhir Q3
            </span>
          </div>
        </div>

        <div className="h-72 w-full text-xs font-medium">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={quarterTimelineData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
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
                unit={selectedMetric === 'overall' ? '%' : ''}
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
                    CapaianAktual: 'Realisasi Aktual',
                    TargetIdeal: 'Pace Target Ideal',
                    ProyeksiTarget: 'Proyeksi Akhir Kuartal'
                  };
                  return [`${value}${selectedMetric === 'overall' ? '%' : ''}`, labelMap[name] || name];
                }}
              />
              
              {/* Reference Line at Current Week (Jul W4) */}
              <ReferenceLine x="Juli M4 (Saat Ini)" stroke="#b90f0f" strokeDasharray="3 3" label={{ value: 'Saat Ini', fill: '#b90f0f', fontSize: 10, fontWeight: 800, position: 'top' }} />

              {/* Benchmark Target Ideal Pace Line */}
              <Line 
                type="monotone" 
                dataKey="TargetIdeal" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={false}
                name="TargetIdeal"
              />

              {/* Projected Progress Line */}
              <Line 
                type="monotone" 
                dataKey="ProyeksiTarget" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="2 2"
                dot={{ r: 3, fill: '#94a3b8' }}
                name="ProyeksiTarget"
              />

              {/* Actual Progress Achieved Line */}
              <Line 
                type="monotone" 
                dataKey="CapaianAktual" 
                stroke="#b90f0f" 
                strokeWidth={3.5} 
                dot={{ r: 5, fill: '#b90f0f', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: '#ffffff' }}
                name="CapaianAktual"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend & Analytical Insights */}
      <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#b90f0f] shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            <strong>Analisis Performa Q3:</strong> {dynamicOKRInsight}
          </span>
        </div>
        <button 
          onClick={() => alert('Laporan detail perkembangan target Q3 2026 siap diunduh dalam format PDF/Excel!')}
          className="px-3 py-1.5 bg-[#b90f0f] hover:bg-[#960c0c] text-white rounded-lg text-[11px] font-bold transition-all shadow-xs shrink-0 self-end sm:self-auto"
        >
          Export Report OKR Q3
        </button>
      </div>

    </div>
  );
};
