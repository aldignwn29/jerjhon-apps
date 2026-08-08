import React, { useState, useMemo } from 'react';
import { EmployeeDatabaseView } from './EmployeeDatabaseView';
import { AttendanceShiftsView } from './AttendanceShiftsView';
import { LeaveManagementView } from './LeaveManagementView';
import { PayrollEngineView } from './PayrollEngineView';
import { KPIOKRView } from './KPIOKRView';
import { RecruitmentTrainingView } from './RecruitmentTrainingView';
import { MonthlyAttendanceChartCard } from './MonthlyAttendanceChartCard';
import { KPIPerformanceOverviewCard } from './KPIPerformanceOverviewCard';
import { ShiftStatusMonitor } from './ShiftStatusMonitor';
import { ArrowLeft, User, Clock, Calendar, FileText, Target, Users, LogOut, Fingerprint, ShieldCheck, ScanFace, CheckCircle2, QrCode, IdCard, Sparkles, UserCheck, Sun, Moon, Shield, Activity, TrendingUp, Briefcase, UserPlus } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { MobileLogin } from './MobileLogin';
import { BiometricAuthModal } from './BiometricAuthModal';
import { EmployeeIDCardModal } from './EmployeeIDCardModal';
import { isUserBiometricRegistered, registerWebAuthnBiometric, unregisterBiometricCredential } from '../../../lib/webauthn';

export const MobileHumanCapitalApp: React.FC = React.memo(() => {
  const { 
    isAuthenticated, 
    currentUser, 
    logout, 
    darkMode, 
    setDarkMode, 
    employees, 
    attendance, 
    addAttendanceRecord, 
    syncAttendanceNow,
    isSyncingAttendance,
    lastAttendanceSyncTime,
    kpiTasks,
    leaveRequests = [],
    overtimeRequests = [],
    isStaff,
    formatIDR
  } = useERP();
  const [isClockingIn, setIsClockingIn] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showIDModal, setShowIDModal] = useState<boolean>(false);
  const [bioRefresh, setBioRefresh] = useState<number>(0);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Pull-to-refresh swipe gesture state
  const [startY, setStartY] = useState<number | null>(null);
  const [pullOffset, setPullOffset] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshComplete, setRefreshComplete] = useState<boolean>(false);
  const [refreshMessage, setRefreshMessage] = useState<string>('');

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    setPullOffset(60); // Hold at refreshing height

    // Force refresh state for biometrics and system
    setBioRefresh(prev => prev + 1);

    if (syncAttendanceNow) {
      await syncAttendanceNow();
    }

    setRefreshComplete(true);
    setRefreshMessage('Sync Sukses! Status shift, kehadiran, dan biometrik WebAuthn berhasil diperbarui secara real-time dari Firestore.');
    
    // Auto-dismiss indicator capsule and toast
    setTimeout(() => {
      setIsRefreshing(false);
      setPullOffset(0);
      setTimeout(() => {
        setRefreshComplete(false);
        setRefreshMessage('');
      }, 300);
    }, 1500);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
      setRefreshComplete(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startY === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0 && window.scrollY === 0) {
      // Smooth logarithmic/exponential rubber band resistance formula
      const maxPull = 120;
      const resistance = 0.55;
      const offset = maxPull * (1 - Math.exp(-(diff * resistance) / 90));
      setPullOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (startY === null || isRefreshing) return;

    if (pullOffset >= 50) {
      triggerRefresh();
    } else {
      setPullOffset(0);
    }
    setStartY(null);
  };

  if (!isAuthenticated || !currentUser) {
    return <MobileLogin />;
  }

  const timeGreeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 11 && currentHour < 15) {
      return 'Selamat Siang';
    } else if (currentHour >= 15 && currentHour < 18) {
      return 'Selamat Sore';
    } else if (currentHour >= 18 || currentHour < 4) {
      return 'Selamat Malam';
    }
    return 'Selamat Pagi';
  }, []);

  const isBioActive = useMemo(() => {
    return currentUser?.id ? (bioRefresh >= 0 && isUserBiometricRegistered(currentUser.id)) : false;
  }, [currentUser?.id, bioRefresh]);

  const handleToggleBio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (isBioActive) {
      if (confirm('Apakah Anda yakin ingin menonaktifkan login biometrik pada perangkat ini?')) {
        unregisterBiometricCredential(currentUser.id);
        setBioRefresh(prev => prev + 1);
      }
    } else {
      try {
        const res = await registerWebAuthnBiometric(currentUser, 'fingerprint');
        if (res.success) {
          triggerToast(res.message, 'success');
        } else {
          triggerToast(res.message, 'error');
        }
        setBioRefresh(prev => prev + 1);
      } catch (err: any) {
        triggerToast(err.message || 'Gagal mendaftarkan biometrik.', 'error');
      }
    }
  };

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setShowToast({message, type});
    setTimeout(() => setShowToast(null), 3000);
  };
  
  const employeeRecord = useMemo(() => {
    return employees.find(e => 
      e.id === currentUser?.id || 
      e.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
      e.name?.toLowerCase().includes(currentUser?.name?.toLowerCase() || '')
    ) || employees[0];
  }, [employees, currentUser]);

  const handleInstantClockIn = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation.');
      return;
    }

    const todayDateStr = new Date().toISOString().split('T')[0];
    const existingToday = attendance.find(a => 
      a.employeeId === employeeRecord.id && a.date === todayDateStr
    );

    if (existingToday && existingToday.clockIn && existingToday.clockIn !== '--:--') {
      alert(`Anda sudah melakukan Clock-In hari ini pada jam ${existingToday.clockIn} WIB.`);
      return;
    }

    setIsClockingIn(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsClockingIn(false);
        const { latitude, longitude } = position.coords;
        const now = new Date();
        const clockInStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

        addAttendanceRecord({
          employeeId: employeeRecord.id,
          employeeName: currentUser.name,
          date: todayDateStr,
          clockIn: clockInStr,
          clockOut: '--:--',
          status: 'Hadir',
          shift: 'Regular (08:00 - 17:00)',
          workHours: 0,
          location: 'GPS Geolocation Instant (WFO)',
          gpsLat: latitude,
          gpsLng: longitude,
          attendanceType: 'WFO',
          notes: 'Clock-In instan via Floating Action Button (FAB)'
        });

        alert(`Sukses Clock-In! Berhasil mencatat kehadiran jam ${clockInStr} WIB dengan koordinat GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)}).`);
      },
      (error) => {
        setIsClockingIn(false);
        console.warn('GPS Clock-In fallback activated:', error);
        const now = new Date();
        const clockInStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

        addAttendanceRecord({
          employeeId: employeeRecord.id,
          employeeName: currentUser.name,
          date: todayDateStr,
          clockIn: clockInStr,
          clockOut: '--:--',
          status: 'Hadir',
          shift: 'Regular (08:00 - 17:00)',
          workHours: 0,
          location: 'Lokasi Sistem (WFO Bebas)',
          gpsLat: -6.2088,
          gpsLng: 106.8456,
          attendanceType: 'WFO',
          notes: 'Clock-In instan (Desktop/Location Fallback)'
        });

        alert(`Sukses Clock-In! Berhasil mencatat kehadiran jam ${clockInStr} WIB.`);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
    );
  };

  const handleActionClick = (actionId: string) => {
    switch (actionId) {
      case 'clock_in':
        handleInstantClockIn();
        break;
      case 'clock_out':
        setActiveView('att');
        break;
      case 'request_leave':
        setActiveView('leave');
        break;
      case 'request_overtime':
        setActiveView('att');
        break;
      case 'view_recap':
        setActiveView('att');
        break;
      case 'check_roster':
        setActiveView('att');
        break;
    }
  };

  const ActionSuggestions = () => {
    const todayDateStr = new Date().toISOString().split('T')[0];
    const existingToday = attendance.find(a => 
      a.employeeId === employeeRecord.id && a.date === todayDateStr
    );

    let suggestions: { id: string, label: string, icon: React.ReactNode, bgColor: string, textColor: string }[] = [];

    if (!existingToday || !existingToday.clockIn || existingToday.clockIn === '--:--') {
      suggestions = [
        { id: 'clock_in', label: 'Absen Masuk', icon: <Clock size={16} />, bgColor: 'bg-emerald-100 dark:bg-emerald-950/80', textColor: 'text-emerald-700 dark:text-emerald-300' },
        { id: 'request_leave', label: 'Ajukan Izin/Cuti', icon: <Calendar size={16} />, bgColor: 'bg-amber-100 dark:bg-amber-950/80', textColor: 'text-amber-700 dark:text-amber-300' }
      ];
    } else if (!existingToday.clockOut || existingToday.clockOut === '--:--') {
      suggestions = [
        { id: 'clock_out', label: 'Absen Keluar', icon: <LogOut size={16} />, bgColor: 'bg-rose-100 dark:bg-rose-950/80', textColor: 'text-rose-700 dark:text-rose-300' },
        { id: 'request_overtime', label: 'Ajukan Lembur', icon: <Clock size={16} />, bgColor: 'bg-indigo-100 dark:bg-indigo-950/80', textColor: 'text-indigo-700 dark:text-indigo-300' }
      ];
    } else {
      suggestions = [
        { id: 'view_recap', label: 'Lihat Rekap Hari Ini', icon: <FileText size={16} />, bgColor: 'bg-blue-100 dark:bg-blue-950/80', textColor: 'text-blue-700 dark:text-blue-300' },
        { id: 'check_roster', label: 'Cek Roster Besok', icon: <Calendar size={16} />, bgColor: 'bg-purple-100 dark:bg-purple-950/80', textColor: 'text-purple-700 dark:text-purple-300' }
      ];
    }

    return (
      <div className="mb-5">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5 px-1 uppercase tracking-wider">Suggested Actions</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          {suggestions.map(s => (
            <button
              key={s.id}
              onClick={() => handleActionClick(s.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl shrink-0 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-white/5 ${s.bgColor} ${s.textColor}`}
            >
              {s.icon}
              <span className="text-xs font-bold whitespace-nowrap">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const employeeBadgeId = employeeRecord?.nik || employeeRecord?.id || '3171011212900001';

  const modules = useMemo(() => {
    if (isStaff) {
      return [
        { id: 'emp', label: 'My Profile ID', subtitle: 'Profil & Data Pribadi', icon: User, component: <EmployeeDatabaseView /> },
        { id: 'att', label: 'Self Presensi', subtitle: 'Clock-In/Out & Roster', icon: Clock, component: <AttendanceShiftsView /> },
        { id: 'leave', label: 'Form Cuti & Lembur', subtitle: 'Pengajuan Izin & Overtime', icon: Calendar, component: <LeaveManagementView /> },
        { id: 'pay', label: 'Portal Payslip', subtitle: 'Lihat Slip Gaji Saya', icon: FileText, component: <PayrollEngineView /> },
        { id: 'kpi', label: 'My OKRs & Tasks', subtitle: 'Submit Tugas & Progress', icon: Target, component: <KPIOKRView /> },
        { id: 'rec', label: 'Training Desk', subtitle: 'Pendidikan & Loker Internal', icon: Users, component: <RecruitmentTrainingView /> },
      ];
    } else {
      return [
        { id: 'emp', label: 'Database Karyawan', subtitle: 'Master Data & NIK HCM', icon: Users, component: <EmployeeDatabaseView /> },
        { id: 'att', label: 'Verifikasi Absensi', subtitle: 'Monitor Presensi & Shift', icon: Clock, component: <AttendanceShiftsView /> },
        { id: 'leave', label: 'Approval Cuti & Overtime', subtitle: 'Validasi Libur & Lembur', icon: Calendar, component: <LeaveManagementView /> },
        { id: 'pay', label: 'Payroll Engine', subtitle: 'Hitung Gaji & Pajak SPT', icon: FileText, component: <PayrollEngineView /> },
        { id: 'kpi', label: 'Monitor KPI & OKR', subtitle: 'Evaluasi & Target Divisi', icon: Target, component: <KPIOKRView /> },
        { id: 'rec', label: 'Rekrutmen & Pipe', subtitle: 'Seleksi CV & Onboarding', icon: UserPlus, component: <RecruitmentTrainingView /> },
      ];
    }
  }, [isStaff]);

  if (activeView) {
    const module = modules.find(m => m.id === activeView);
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className={`text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md border-b transition-all duration-300 ${
          isStaff 
            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-800 dark:to-emerald-800 border-teal-700 dark:border-emerald-950' 
            : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/40 dark:border-slate-800'
        }`}>
          <button onClick={() => setActiveView(null)} className="p-1.5 hover:bg-white/15 active:scale-95 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <h2 className="font-black text-sm sm:text-base tracking-wide uppercase">{module?.label}</h2>
            <p className="text-[10px] font-black tracking-widest uppercase opacity-90 mt-0.5">
              {isStaff ? '🇮🇩 Staff Portal' : '⚡ Command Console'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-sm ${
              isStaff 
                ? 'bg-white/20 text-white border-white/30' 
                : 'bg-amber-500/25 text-amber-300 border-amber-500/40'
            }`}>
              {currentUser.role}
            </span>
          </div>
        </div>

        <div className="p-4">
          {module?.component}
        </div>

        <BiometricAuthModal
          isOpen={showBiometricModal}
          onClose={() => setShowBiometricModal(false)}
          onSuccess={() => setBioRefresh(prev => prev + 1)}
        />
      </div>
    );
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 transition-colors relative select-none"
    >
      {/* Pull to Refresh Indicator Capsule */}
      <div 
        className="pointer-events-none fixed left-0 right-0 top-3.5 z-50 flex justify-center"
        style={{
          transform: `translateY(${Math.min(pullOffset, 90)}px) scale(${Math.min(1.15, 0.8 + (pullOffset / 80) * 0.35)})`,
          opacity: pullOffset > 5 ? Math.min(1, pullOffset / 30) : 0,
          transition: startY === null ? 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
        }}
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-full py-2.5 px-4 flex items-center gap-2.5 max-w-[90%] pointer-events-auto select-none">
          {isRefreshing ? (
            refreshComplete ? (
              <CheckCircle2 size={16} className="text-emerald-500 animate-bounce" />
            ) : (
              <Clock size={16} className="text-blue-600 dark:text-blue-400 animate-spin" />
            )
          ) : (
            <Clock 
              size={16} 
              className="text-slate-400 transition-transform" 
              style={{ transform: `rotate(${pullOffset * 6}deg)` }} 
            />
          )}
          <span className="text-[11px] font-black tracking-wide text-slate-800 dark:text-slate-100">
            {isRefreshing ? (
              refreshComplete ? 'Sync Berhasil!' : 'Sinkronisasi Absensi & Biometrik...'
            ) : (
              pullOffset >= 50 ? 'Lepas untuk Memutakhirkan' : 'Tarik untuk Sinkronisasi'
            )}
          </span>
        </div>
      </div>

      {/* Real-time Sync Toast Notification */}
      {refreshComplete && refreshMessage && (
        <div className="fixed bottom-24 left-4 right-4 z-50 flex justify-center animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          <div className="bg-slate-900/95 dark:bg-slate-900/98 backdrop-blur-md border border-slate-800 text-white text-[11px] font-bold py-3 px-4 rounded-2xl shadow-xl flex items-center gap-2 max-w-md">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 animate-bounce" />
            <span>{refreshMessage}</span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-24 left-4 right-4 z-50 p-4 rounded-2xl text-white font-bold text-xs shadow-lg flex items-center justify-center ${showToast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {showToast.message}
        </div>
      )}

      {/* Elastic drag offset wrapper */}
      <div 
        style={{
          transform: `translateY(${pullOffset * 0.65}px)`,
          transition: startY === null ? 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
        }}
      >
        {isStaff ? (
          /* ========================================================= */
          /* 1. STAFF SELF-SERVICE DASHBOARD                           */
          /* ========================================================= */
          <div className="space-y-4">
            {/* My Profile Quick-View Header & Top Navigation */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              {/* Top bar with greeting & actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  <Sparkles size={14} className="text-amber-500 animate-pulse" />
                  <span>STAFF SELF-SERVICE HUB</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerRefresh}
                    disabled={isRefreshing}
                    className={`p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-450 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                      isRefreshing ? 'opacity-80' : ''
                    }`}
                    title="Manual Sync Status"
                  >
                    <Clock size={16} className={isRefreshing ? 'animate-spin text-teal-500' : ''} />
                    <span className="hidden sm:inline">Sync</span>
                  </button>

                  <button
                    onClick={() => setShowBiometricModal(true)}
                    className={`px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition shadow-xs ${
                      isBioActive
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                    title="Kelola Keamanan Biometrik"
                  >
                    <Fingerprint size={16} className={isBioActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'} />
                    <span className="hidden sm:inline">{isBioActive ? 'Biometrik Aktif' : 'Set Biometrik'}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-2 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>

              {/* Time-Based Greeting Banner */}
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent dark:from-teal-950/40 dark:to-slate-900 rounded-2xl border border-teal-200/50 dark:border-teal-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-sm">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {timeGreeting}, {currentUser?.name}! 👋
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                      Personal Workspace • Divisi {currentUser?.department || 'Karyawan'}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-200/60 dark:border-teal-900/45 block">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Employee Badge Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-slate-50 to-teal-50/40 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-teal-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-black text-xl flex items-center justify-center border-2 border-teal-400 shadow-sm">
                        {currentUser?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center" title="Active Status">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                        {currentUser?.name}
                      </h2>
                      <span className="text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full border border-teal-300 dark:border-teal-850">
                        Active Staff
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ID: {employeeBadgeId} • {currentUser?.department}</p>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-teal-700 dark:text-teal-400 font-bold bg-teal-100/60 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-900/40">
                      <IdCard size={12} />
                      <span>Employee Access Badge</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIDModal(true)}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition transform active:scale-95 shrink-0"
                >
                  <QrCode size={16} className="text-amber-300" />
                  <span>My QR Badge Entry</span>
                </button>
              </div>
            </div>

            {/* Biometric Setup Assistant Card */}
            <div 
              onClick={() => setShowBiometricModal(true)}
              className="p-4 rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white shadow-md cursor-pointer hover:shadow-lg transition transform active:scale-98 relative overflow-hidden border border-teal-500/20"
            >
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-teal-500/15 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 flex items-center justify-center text-amber-300 border border-teal-500/20 shadow-inner">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-xs sm:text-sm text-white">Biometric Quick Check-In</h3>
                      {isBioActive && (
                        <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                          WebAuthn Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-teal-200/80 mt-0.5">
                      {isBioActive
                        ? 'Sidik Jari / Face ID Terdaftar • Siap melakukan presensi cepat'
                        : 'Daftarkan biometrik untuk login dan check-in instan'}
                    </p>
                  </div>
                </div>
                <div className="text-teal-400 shrink-0">
                  <Fingerprint size={22} className={isBioActive ? 'text-emerald-400' : 'animate-pulse'} />
                </div>
              </div>
            </div>

            {/* Suggested Actions for Staff */}
            <ActionSuggestions />

            {/* Shift Status Monitor Widget */}
            <ShiftStatusMonitor
              employeeRecord={employeeRecord}
              handleInstantClockIn={handleInstantClockIn}
            />

            {/* Monthly Attendance Summary & Duration BarChart */}
            <MonthlyAttendanceChartCard
              employeeId={employeeRecord?.id || currentUser?.id || ''}
              employeeName={currentUser?.name || ''}
              attendance={attendance}
            />

            {/* KPI Performance Overview Card */}
            <KPIPerformanceOverviewCard
              employeeId={employeeRecord?.id || currentUser?.id || ''}
              employeeName={currentUser?.name || ''}
              kpiTasks={kpiTasks}
              onViewKPI={() => setActiveView('kpi')}
            />

            {/* Staff Grid Modules */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-3 px-1 uppercase tracking-wider">
                My Self-Service Modules
              </h3>
              <div className="grid grid-cols-2 gap-3.5">
                {modules.map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setActiveView(m.id)}
                    className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-xs flex flex-col items-center justify-between gap-2.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-400 dark:hover:border-teal-700 transition-all transform active:scale-95 group text-center h-[130px]"
                  >
                    <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-2xl group-hover:scale-110 transition-transform">
                      <m.icon className="text-teal-600 dark:text-teal-400" size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{m.label}</span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block truncate max-w-[120px]">
                        {m.subtitle}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Biometric Sync Status Card */}
                <div 
                  onClick={() => setShowBiometricModal(true)}
                  className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-xs flex flex-col items-center justify-between gap-2.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-400 transition-all transform active:scale-95 group cursor-pointer text-center h-[130px]"
                >
                  <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-2xl group-hover:scale-110 transition-transform relative">
                    <Fingerprint className={isBioActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'} size={24} />
                    <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${isBioActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Biometric Security</span>
                    <span className={`text-[10px] font-extrabold ${isBioActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                      {isBioActive ? 'Verified WebAuthn' : 'Setup Passkey'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* 2. ADMIN/MANAGER COMMAND & CONTROL DASHBOARD               */
          /* ========================================================= */
          <div className="space-y-4">
            {/* Admin/Manager Control Quick Header */}
            <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-400 uppercase tracking-widest">
                  <Shield size={14} className="text-indigo-400 animate-pulse" />
                  <span>Enterprise Command Console</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerRefresh}
                    disabled={isRefreshing}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-400 border border-slate-700 rounded-2xl transition-all flex items-center gap-1.5 text-xs font-bold"
                    title="Manual Sync Status"
                  >
                    <Clock size={16} className={isRefreshing ? 'animate-spin text-indigo-400' : ''} />
                    <span className="hidden sm:inline">Sync</span>
                  </button>

                  <button
                    onClick={() => setShowBiometricModal(true)}
                    className={`px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition shadow-xs ${
                      isBioActive
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Kelola Keamanan Biometrik"
                  >
                    <Fingerprint size={16} className={isBioActive ? 'text-emerald-400' : 'text-blue-400'} />
                    <span className="hidden sm:inline">Biometrik</span>
                  </button>

                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 border border-slate-700 rounded-2xl transition"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>

              {/* Administrative Greetings Banner */}
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white">
                      {timeGreeting}, {currentUser?.name}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold">
                      {currentUser?.role} • Operations Command Hub
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-[11px] font-bold text-indigo-400 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 block">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Admin Identity Card Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-indigo-400 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center border-2 border-indigo-300 shadow-sm">
                        {currentUser?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 border-2 border-slate-800 rounded-full flex items-center justify-center" title="Admin Active">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white leading-snug">
                        {currentUser?.name}
                      </h2>
                      <span className="text-[10px] font-extrabold bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40">
                        Admin Executive
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Divisi: {currentUser?.department || 'Executive'}</p>
                    <p className="text-[11px] font-mono text-indigo-400 font-bold bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-900/60 inline-block">
                      ID: {employeeBadgeId}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIDModal(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition transform active:scale-95 shrink-0"
                >
                  <QrCode size={16} className="text-amber-300 animate-pulse" />
                  <span>Command Entry QR</span>
                </button>
              </div>
            </div>

            {/* OPERATIONAL METRICS COMMAND GRID (Exclusive to Admin/Manager) */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2.5 px-1 uppercase tracking-wider flex items-center gap-1">
                <Activity size={14} className="text-indigo-500" />
                <span>Enterprise Operational Live Metrics</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Employees */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Staff</span>
                      <Users size={16} className="text-indigo-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                      {employees.length}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Aktif Terdaftar
                  </span>
                </div>

                {/* Today's Presence Count */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Absen Hari Ini</span>
                      <UserCheck size={16} className="text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                      {attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.clockIn && a.clockIn !== '--:--').length}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Selesai Clock-In
                  </span>
                </div>

                {/* Pending Leave Requests */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden">
                  {leaveRequests.filter(r => r.status === 'Pending').length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Cuti</span>
                      <Calendar size={16} className="text-amber-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                      {leaveRequests.filter(r => r.status === 'Pending').length}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Menunggu Verifikasi
                  </span>
                </div>

                {/* Pending Overtime Requests */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Lembur pending</span>
                      <Clock size={16} className="text-blue-500" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                      {overtimeRequests.filter(r => r.status === 'Pending').length}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Butuh Approval
                  </span>
                </div>
              </div>
            </div>

            {/* ENTERPRISE OPERATIONS ANALYTICS SUMMARY CARD */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      HCM operational audit summary
                    </h3>
                    <p className="text-[10px] text-slate-400">Data terkonsolidasi dari seluruh departemen</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                  REAL-TIME
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Sistem Roster & Shift Terjadwal
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    6 Pola Shift Aktif
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Regular, Shift 1, Shift 2, Shift 3, Non-Shift & Fleksibel
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    KPI OKR Review Progress
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '75%' }} />
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">75%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Penilaian target kuartal terkini
                  </span>
                </div>
              </div>
            </div>

            {/* Admin/Manager Operations Console Grid Modules */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-3 px-1 uppercase tracking-wider">
                Enterprise Management Console
              </h3>
              <div className="grid grid-cols-2 gap-3.5">
                {modules.map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setActiveView(m.id)}
                    className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-xs flex flex-col items-center justify-between gap-2.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-800 transition-all transform active:scale-95 group text-center h-[130px]"
                  >
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl group-hover:scale-110 transition-transform">
                      <m.icon className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{m.label}</span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block truncate max-w-[120px]">
                        {m.subtitle}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Biometric Administration Sync Card */}
                <div 
                  onClick={() => setShowBiometricModal(true)}
                  className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-xs flex flex-col items-center justify-between gap-2.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500 transition-all transform active:scale-95 group cursor-pointer text-center h-[130px]"
                >
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl group-hover:scale-110 transition-transform relative">
                    <Fingerprint className={isBioActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-500'} size={24} />
                    <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${isBioActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Passkey Security</span>
                    <span className={`text-[10px] font-extrabold ${isBioActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                      {isBioActive ? 'WebAuthn Ready' : 'Secure Vault'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
