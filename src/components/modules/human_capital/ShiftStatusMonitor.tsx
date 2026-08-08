import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Coffee, Hourglass, Play, CheckCircle2, AlertTriangle, Activity, Sunrise, Sun, Moon, Sparkles } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';

interface ShiftStatusMonitorProps {
  employeeRecord: any;
  handleInstantClockIn: () => void;
}

export const ShiftStatusMonitor: React.FC<ShiftStatusMonitorProps> = ({
  employeeRecord,
  handleInstantClockIn
}) => {
  const { attendance } = useERP();
  const [now, setNow] = useState<Date>(new Date());

  // Keep current time updated every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Today's attendance record
  const todayRecord = useMemo(() => {
    if (!employeeRecord?.id) return null;
    const todayDateStr = now.toISOString().split('T')[0];
    return attendance.find(a => 
      a.employeeId === employeeRecord.id && a.date === todayDateStr
    );
  }, [attendance, employeeRecord?.id, now]);

  const isClockedIn = useMemo(() => {
    return !!(todayRecord && todayRecord.clockIn && todayRecord.clockIn !== '--:--' && (!todayRecord.clockOut || todayRecord.clockOut === '--:--' || todayRecord.clockOut === ''));
  }, [todayRecord]);

  // Determine current active shift and schedule bounds
  const shiftInfo = useMemo(() => {
    const shiftName = todayRecord?.shift || 'Regular (08:00 - 17:00)';
    let startHour = 8, startMinute = 0;
    let endHour = 17, endMinute = 0;
    let breakStartHour = 12, breakStartMinute = 0;
    let breakEndHour = 13, breakEndMinute = 0;
    let icon = <Sun className="text-amber-500" size={16} />;
    let colorClass = 'from-amber-500/10 to-amber-600/5 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30';

    if (shiftName.includes('Morning')) {
      startHour = 7; startMinute = 0;
      endHour = 15; endMinute = 0;
      breakStartHour = 11; breakStartMinute = 30;
      breakEndHour = 12; breakEndMinute = 30;
      icon = <Sunrise className="text-blue-500" size={16} />;
      colorClass = 'from-blue-500/10 to-indigo-600/5 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-900/30';
    } else if (shiftName.includes('Night')) {
      startHour = 22; startMinute = 0;
      endHour = 6; endMinute = 0; // next day
      breakStartHour = 2; breakStartMinute = 0; // next day
      breakEndHour = 3; breakEndMinute = 0; // next day
      icon = <Moon className="text-purple-500" size={16} />;
      colorClass = 'from-purple-500/10 to-indigo-950/5 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-900/30';
    } else if (shiftName.includes('Non-Shift')) {
      startHour = 0; startMinute = 0;
      endHour = 23; endMinute = 59;
      breakStartHour = 0; breakStartMinute = 0;
      breakEndHour = 0; breakEndMinute = 0;
      icon = <Sparkles className="text-teal-500" size={16} />;
      colorClass = 'from-teal-500/10 to-emerald-600/5 text-teal-700 dark:text-teal-300 border-teal-200/50 dark:border-teal-900/30';
    }

    return {
      name: shiftName,
      startHour, startMinute,
      endHour, endMinute,
      breakStartHour, breakStartMinute,
      breakEndHour, breakEndMinute,
      icon,
      colorClass
    };
  }, [todayRecord?.shift]);

  // Time calculations (returns strings representing countdowns and elapsed percentages)
  const stats = useMemo(() => {
    if (!isClockedIn) {
      return {
        remainingTime: '--:--:--',
        breakStatus: 'Belum Shift',
        breakTime: '--:--:--',
        progressPercent: 0,
        statusLabel: 'Offline',
        statusColor: 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
      };
    }

    const todayStr = now.toISOString().split('T')[0];
    const shiftStart = new Date(todayStr);
    shiftStart.setHours(shiftInfo.startHour, shiftInfo.startMinute, 0, 0);

    let shiftEnd = new Date(todayStr);
    shiftEnd.setHours(shiftInfo.endHour, shiftInfo.endMinute, 0, 0);

    let breakStart = new Date(todayStr);
    breakStart.setHours(shiftInfo.breakStartHour, shiftInfo.breakStartMinute, 0, 0);

    let breakEnd = new Date(todayStr);
    breakEnd.setHours(shiftInfo.breakEndHour, shiftInfo.breakEndMinute, 0, 0);

    // Adjust for cross-day shifts (like Night shift)
    if (shiftInfo.endHour < shiftInfo.startHour) {
      // If end hour is less than start, shift end and break times are on the next calendar day
      if (now.getHours() >= shiftInfo.startHour) {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
        breakStart.setDate(breakStart.getDate() + 1);
        breakEnd.setDate(breakEnd.getDate() + 1);
      } else {
        // If current time is after midnight, shiftStart was yesterday
        shiftStart.setDate(shiftStart.getDate() - 1);
      }
    }

    const totalDuration = shiftEnd.getTime() - shiftStart.getTime();
    const elapsedDuration = now.getTime() - shiftStart.getTime();
    
    let progressPercent = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));

    // Calculate Remaining Shift Time
    let remainingTime = '--:--:--';
    let statusLabel = 'Dalam Shift';
    let statusColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';

    if (shiftInfo.name.includes('Non-Shift')) {
      let elapsedMs = 0;
      if (todayRecord && todayRecord.clockIn) {
        const [h, m] = todayRecord.clockIn.split(':').map(Number);
        const clockInTime = new Date(todayStr);
        clockInTime.setHours(h, m, 0, 0);
        elapsedMs = Math.max(0, now.getTime() - clockInTime.getTime());
      }
      const workedSecs = Math.floor((elapsedMs / 1000) % 60);
      const workedMins = Math.floor((elapsedMs / 1000 / 60) % 60);
      const workedHours = Math.floor(elapsedMs / 1000 / 60 / 60);
      remainingTime = `${String(workedHours).padStart(2, '0')}:${String(workedMins).padStart(2, '0')}:${String(workedSecs).padStart(2, '0')}`;
      statusLabel = 'Fleksibel (Bebas)';
      statusColor = 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20';
      progressPercent = Math.min(100, (elapsedMs / (8 * 60 * 60 * 1000)) * 100);
    } else if (now < shiftStart) {
      remainingTime = 'Belum Mulai';
      statusLabel = 'Shift Bersiap';
      statusColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    } else if (now > shiftEnd) {
      const overtimeDiff = now.getTime() - shiftEnd.getTime();
      const ovSecs = Math.floor((overtimeDiff / 1000) % 60);
      const ovMins = Math.floor((overtimeDiff / 1000 / 60) % 60);
      const ovHours = Math.floor(overtimeDiff / 1000 / 60 / 60);
      remainingTime = `+${String(ovHours).padStart(2, '0')}:${String(ovMins).padStart(2, '0')}:${String(ovSecs).padStart(2, '0')}`;
      statusLabel = 'Lembur (Overtime)';
      statusColor = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
    } else {
      const diff = shiftEnd.getTime() - now.getTime();
      const secs = Math.floor((diff / 1000) % 60);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const hours = Math.floor(diff / 1000 / 60 / 60);
      remainingTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Calculate Break Time Countdown
    let breakStatus = 'Sebelum Istirahat';
    let breakTime = '--:--:--';

    if (shiftInfo.name.includes('Non-Shift')) {
      breakStatus = 'Bebas Mandiri';
      breakTime = 'Fleksibel';
    } else if (now < breakStart) {
      const diff = breakStart.getTime() - now.getTime();
      const secs = Math.floor((diff / 1000) % 60);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const hours = Math.floor(diff / 1000 / 60 / 60);
      breakTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      breakStatus = 'Istirahat Nanti';
    } else if (now >= breakStart && now < breakEnd) {
      const diff = breakEnd.getTime() - now.getTime();
      const secs = Math.floor((diff / 1000) % 60);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const hours = Math.floor(diff / 1000 / 60 / 60);
      breakTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      breakStatus = 'Sedang Istirahat';
      statusLabel = 'Istirahat (Break)';
      statusColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    } else {
      breakTime = 'Selesai';
      breakStatus = 'Sudah Istirahat';
    }

    return {
      remainingTime,
      breakStatus,
      breakTime,
      progressPercent,
      statusLabel,
      statusColor
    };
  }, [isClockedIn, now, shiftInfo]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm mb-4 space-y-4">
      {/* Card Header with real-time heartbeat animation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Shift Status Monitor</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">Attendance Real-Time Sync</p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${stats.statusColor}`}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
          {stats.statusLabel}
        </span>
      </div>

      {/* Grid of Monitor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Shift Info */}
        <div className={`p-4 rounded-2xl border bg-gradient-to-br ${shiftInfo.colorClass} flex flex-col justify-between h-28 relative overflow-hidden`}>
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Shift Aktif</span>
              <h4 className="text-sm font-black text-slate-950 dark:text-white truncate max-w-[150px]">{shiftInfo.name.split(' (')[0]}</h4>
            </div>
            <div className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 shadow-xs shrink-0">
              {shiftInfo.icon}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">Waktu Shift</span>
            <span className="text-xs font-black font-mono tracking-wide">{shiftInfo.name.substring(shiftInfo.name.indexOf('(') + 1, shiftInfo.name.length - 1)}</span>
          </div>
        </div>

        {/* Card 2: Remaining Time Countdown */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col justify-between h-28">
          <div>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Remaining Time</span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white tracking-wider block mt-1">{stats.remainingTime}</span>
          </div>
          <div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
              <span>Shift Progress</span>
              <span className="font-bold font-mono">{stats.progressPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Break Time Countdown */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col justify-between h-28">
          <div>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Break Time Countdown</span>
            <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-wider block mt-1">{stats.breakTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coffee size={14} className="text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{stats.breakStatus}</span>
          </div>
        </div>
      </div>

      {/* Connection with Attendance Action Banner */}
      {!isClockedIn && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs font-black text-rose-700 dark:text-rose-400">Kehadiran Hari Ini Belum Tercatat</p>
              <p className="text-[10px] text-rose-600/80 dark:text-rose-400/60 leading-normal">
                Sistem mendeteksi Anda belum melakukan absensi masuk (Clock-In) untuk shift hari ini.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstantClockIn}
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Clock-In Instan Sekarang</span>
          </button>
        </div>
      )}

      {isClockedIn && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
          <div>
            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">Shift Berjalan Lancar</p>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/60 leading-normal">
              Kehadiran Anda telah dicatat pada jam <strong className="font-mono text-slate-800 dark:text-slate-200">{todayRecord?.clockIn} WIB</strong>. Selamat bekerja dengan produktif!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
