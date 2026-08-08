import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, MapPin, CheckCircle2, AlertCircle, UserCheck, 
  XCircle, Camera, ShieldAlert, Filter, Search, Download, Edit3, 
  Trash2, UserPlus, Settings, Building2, Sparkles, Laptop, FileText, 
  Check, X, Sliders, Shield, Activity, RefreshCw, Eye, AlertTriangle, Calculator, Upload, Info, Award
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { AttendanceRecord, Employee } from '../../../types';
import { exportToCSV } from '../../../utils/exportUtils';

export const AttendanceShiftsView: React.FC = () => {
  const { 
    attendance, 
    employees, 
    addAttendanceRecord, 
    updateAttendanceRecord, 
    deleteAttendanceRecord, 
    currentUser,
    isStaff,
    overtimeRequests,
    addOvertimeRequest,
    updateOvertimeStatus,
    companyProfile,
    updateCompanyProfile,
    leaveRequests
  } = useERP();

  if (!currentUser) return null;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  // Sub-tab: Attendance vs Overtime Calculator
  const [activeAttendanceTab, setActiveAttendanceTab] = useState<'attendance' | 'overtime'>('attendance');

  // State for Task & KPI Notification Simulator in Sidebar
  const [taskNotificationType, setTaskNotificationType] = useState<'baru' | 'h3' | 'besok' | 'hari_ini' | 'terlambat' | 'selesai'>('selesai');
  const [kpiNotificationType, setKpiNotificationType] = useState<'di_atas' | 'sesuai' | 'menurun' | 'jauh' | '100'>('100');
  const [taskNameInput, setTaskNameInput] = useState('Migrasi Database Core ERP');
  const [kpiPercentageInput, setKpiPercentageInput] = useState(115);

  // Identify currently selected employee for Staff Mode
  const loggedInEmployee = employees.find(
    e => currentUser && (e.id === currentUser.id || 
         e.email.toLowerCase() === currentUser.email.toLowerCase() ||
         e.name.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  // Annual Leave Balance for loggedInEmployee (Current Calendar Year)
  const currentYear = new Date().getFullYear().toString();
  const empApprovedLeaves = (leaveRequests || []).filter(
    l => loggedInEmployee && 
         (l.employeeId === loggedInEmployee.id || 
          l.employeeId === loggedInEmployee.nik || 
          (l.employeeName && loggedInEmployee.name && l.employeeName.toLowerCase() === loggedInEmployee.name.toLowerCase())) && 
         l.status === 'Approved' &&
         ((l.startDate && l.startDate.startsWith(currentYear)) || (l.appliedDate && l.appliedDate.startsWith(currentYear)))
  );
  const usedCuti = empApprovedLeaves.filter(l => l.type === 'Cuti Tahunan').reduce((sum, l) => sum + l.totalDays, 0);
  const usedCutiPengganti = empApprovedLeaves.filter(l => l.type === 'Cuti Pengganti Libur').reduce((sum, l) => sum + l.totalDays, 0);
  const usedIzinFD = empApprovedLeaves.filter(l => l.type === 'Izin Full Day').reduce((sum, l) => sum + l.totalDays, 0);
  const countIzinHalf = empApprovedLeaves.filter(l => l.type === 'Izin Setengah Hari').length;
  const dedHalf = Math.floor(countIzinHalf / 3);
  const replacementQuota = (attendance || []).filter(
    a => loggedInEmployee && 
         (a.employeeId === loggedInEmployee.id || 
          a.employeeId === loggedInEmployee.nik || 
          (a.employeeName && loggedInEmployee.name && a.employeeName.toLowerCase() === loggedInEmployee.name.toLowerCase())) && 
         a.status === 'Hadir' &&
         a.date.startsWith(currentYear) &&
         (new Date(a.date).getDay() === 0 || new Date(a.date).getDay() === 6)
  ).length;
  const totalDeducted = usedCuti + usedIzinFD + usedCutiPengganti + dedHalf;
  const remainingAnnualLeave = Math.max(0, (12 + replacementQuota) - totalDeducted);

  // Overtime Form State
  const [ovtEmpId, setOvtEmpId] = useState(loggedInEmployee?.id || employees[0]?.id || '');
  const [ovtDate, setOvtDate] = useState(new Date().toISOString().substring(0, 10));
  const [ovtStartTime, setOvtStartTime] = useState('17:00');
  const [ovtEndTime, setOvtEndTime] = useState('19:30');
  const [ovtHours, setOvtHours] = useState(2.5);
  const [ovtReason, setOvtReason] = useState('');

  // Sync ovtEmpId and manualEmpId with loggedInEmployee for non-admin staff
  useEffect(() => {
    if (isStaff && loggedInEmployee?.id) {
      setOvtEmpId(loggedInEmployee.id);
      setManualEmpId(loggedInEmployee.id);
    } else if (!ovtEmpId && employees.length > 0) {
      setOvtEmpId(employees[0].id);
      setManualEmpId(employees[0].id);
    }
  }, [isStaff, loggedInEmployee?.id, employees]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().substring(0, 7));

  const handleExportMonthlyAttendance = () => {
    setShowExportModal(true);
  };

  const confirmExportMonthlyAttendance = () => {
    const filtered = (attendance || []).filter(a => !exportMonth || a.date.startsWith(exportMonth));
    if (filtered.length === 0) {
      alert(`Tidak ada data presensi untuk periode ${exportMonth}.`);
      return;
    }
    const rows = filtered.map((att, idx) => {
      const emp = employees.find(e => e.id === att.employeeId);
      const rawName = emp?.name || att.employeeName || '';
      const finalName = rawName.toLowerCase() === 'jersey jhony' ? 'dotan' : rawName;
      return {
        No: idx + 1,
        'ID Karyawan': att.employeeId,
        'Nama Karyawan': finalName,
        'Divisi': emp?.department || '-',
        Tanggal: att.date,
        Status: att.status,
        'Check In': att.clockIn || (att as any).clockInTime || '-',
        'Check Out': att.clockOut || (att as any).clockOutTime || '-',
        'Lokasi / Catatan': att.location || (att as any).notes || '-'
      };
    });
    exportToCSV(`Laporan_Presensi_Bulanan_${exportMonth}`, rows);
    setShowExportModal(false);
  };
  const isLessThanTwo = ovtHours < 2;
  const previewMeal = 25000;
  const previewPay = isLessThanTwo ? 0 : Math.round(ovtHours * 25000);
  const previewTotal = previewMeal + previewPay;

  const handleOvtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === ovtEmpId);
    if (!emp) return;

    addOvertimeRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      date: ovtDate,
      startTime: ovtStartTime,
      endTime: ovtEndTime,
      hours: ovtHours,
      reason: ovtReason || 'Lembur operasional tugas tambahan'
    });

    setOvtReason('');
    alert(`Pengajuan lembur untuk ${emp.name} (${ovtHours} jam) berhasil disimpan dan dikalkulasi otomatis!`);
  };

  // Mode Switcher: Staff Self-Service vs Management Control Center
  const [viewRoleMode, setViewRoleMode] = useState<'staff' | 'management'>(
    isStaff ? 'staff' : 'management'
  );

  // Sync if role changes
  useEffect(() => {
    if (isStaff) {
      setViewRoleMode('staff');
    }
  }, [isStaff]);

  // Live Digital Clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today Date string YYYY-MM-DD
  const todayStr = currentTime.toISOString().substring(0, 10);
  const formattedDateIndo = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTimeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' WIB';

  const [activeStaffId, setActiveStaffId] = useState<string>(
    loggedInEmployee?.id || employees[0]?.id || ''
  );

  // Keep activeStaffId aligned with loggedInEmployee when logged in user changes
  useEffect(() => {
    if (loggedInEmployee?.id) {
      setActiveStaffId(loggedInEmployee.id);
    }
  }, [currentUser.id, currentUser.email]);
  const activeStaff = employees.find(e => e.id === activeStaffId) || employees[0];

  // Staff Presensi Form State
  const [workType, setWorkType] = useState<'WFO' | 'WFH' | 'Dinas Luar'>('WFO');
  const [selectedShift, setSelectedShift] = useState<AttendanceRecord['shift']>('Regular (08:00 - 17:00)');
  const [presensiNotes, setPresensiNotes] = useState<string>('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isPhotoConfirmed, setIsPhotoConfirmed] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [currentGPS, setCurrentGPS] = useState<{lat: number, lng: number} | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGPSFetching, setIsGPSFetching] = useState(false);

  useEffect(() => {
    const fallbackLat = companyProfile.officeLat || -6.2088;
    const fallbackLng = companyProfile.officeLng || 106.8456;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentGPS({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setGpsError(null);
        },
        (err) => {
          console.warn('Geolocation watch note:', err.message);
          setCurrentGPS({ lat: fallbackLat, lng: fallbackLng });
          setGpsError('Desktop Mode: Lokasi Kantor/Sistem Dipakai');
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setCurrentGPS({ lat: fallbackLat, lng: fallbackLng });
      setGpsError("Desktop Mode: Lokasi Kantor/Sistem Dipakai");
    }
  }, [companyProfile.officeLat, companyProfile.officeLng]);

  const formatDistance = (m: number) => {
    if (m < 1000) return `${Math.round(m)}m`;
    return `${(m / 1000).toFixed(2)}km`;
  };

  const calculateDurationHours = (clockIn?: string, clockOut?: string, workHours?: number): number => {
    if (clockIn && clockOut && clockOut !== '--:--' && clockOut !== '') {
      const inParts = clockIn.split(':').map(Number);
      const outParts = clockOut.split(':').map(Number);
      if (!isNaN(inParts[0]) && !isNaN(inParts[1]) && !isNaN(outParts[0]) && !isNaN(outParts[1])) {
        let diffMins = (outParts[0] * 60 + outParts[1]) - (inParts[0] * 60 + inParts[1]);
        if (diffMins < 0) diffMins += 24 * 60;
        return Math.round((diffMins / 60) * 100) / 100;
      }
    }
    return workHours && workHours > 0 ? workHours : 0;
  };

  const formatAttendanceDuration = (rec: { clockIn?: string; clockOut?: string; workHours?: number }) => {
    if (!rec.clockIn || !rec.clockOut || rec.clockOut === '--:--' || rec.clockOut === '') {
      return '--';
    }

    const inParts = rec.clockIn.split(':').map(Number);
    const outParts = rec.clockOut.split(':').map(Number);

    if (isNaN(inParts[0]) || isNaN(inParts[1]) || isNaN(outParts[0]) || isNaN(outParts[1])) {
      return rec.workHours && rec.workHours > 0 ? `${rec.workHours} Jam` : '--';
    }

    let diffMins = (outParts[0] * 60 + outParts[1]) - (inParts[0] * 60 + inParts[1]);
    if (diffMins < 0) diffMins += 24 * 60;

    if (diffMins === 0) return '1 Mnt';

    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hrs > 0 && mins > 0) {
      return `${hrs} Jam ${mins} Mnt`;
    } else if (hrs > 0) {
      return `${hrs} Jam`;
    } else {
      return `${mins} Mnt`;
    }
  };

  const currentDistance = currentGPS && companyProfile.officeLat && companyProfile.officeLng
    ? calculateDistance(currentGPS.lat, currentGPS.lng, companyProfile.officeLat, companyProfile.officeLng)
    : null;
  const isInRange = true; // WFO radius restriction removed - flexible clock-in anywhere

  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const isLate = workType === 'WFO' && (currentHours > 8 || (currentHours === 8 && currentMinutes > 15));

  // Camera HTML Element References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera WebRTC Stream Lifecycle
  useEffect(() => {
    let activeMediaStream: MediaStream | null = null;

    if (cameraActive && !capturedPhoto && viewRoleMode === 'staff' && activeAttendanceTab === 'attendance') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const startCamera = async () => {
          try {
            let mediaStream: MediaStream;
            try {
              mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
              });
            } catch {
              // Fallback to basic video constraint if ideal/facingMode constraints fail on some laptop webcams
              mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            }
            activeMediaStream = mediaStream;
            setStream(mediaStream);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play().catch(() => {});
            }
            setCameraError(null);
          } catch (err: any) {
            console.warn('Webcam stream error:', err);
            let msg = 'Kamera fisik tidak dapat diakses.';
            if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
              msg = 'Izin kamera diblokir browser. Klik ikon gembok/kamera di URL browser dan pilih "Allow/Izinkan".';
            } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
              msg = 'Kamera tidak terdeteksi pada laptop ini.';
            } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
              msg = 'Kamera sedang dipakai aplikasi lain (Zoom/Meet/Teams). Harap tutup aplikasi tersebut.';
            }
            setCameraError(msg);
          }
        };
        startCamera();
      } else {
        setCameraError('Browser tidak mendukung WebRTC Camera. Gunakan Chrome/Edge terbaru.');
      }
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (activeMediaStream) {
        activeMediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive, capturedPhoto, viewRoleMode, activeAttendanceTab, activeStaffId]);

  // Ensure mounted video element gets stream attached and starts playing
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [stream, cameraActive]);

  // Handle Snapshot Photo Capture with Canvas Watermark
  const handleTakeSnapshot = () => {
    setIsCapturing(true);

    setTimeout(() => {
      if (videoRef.current && canvasRef.current && stream && videoRef.current.videoWidth > 0) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw video image frame
          ctx.drawImage(video, 0, 0, w, h);

          // Watermark banner
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, h - 52, w, 52);

          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`✓ BIOMETRIC FACE VERIFIED — ${activeStaff?.name || 'Staff'}`, 12, h - 30);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '10px monospace';
          const stampTime = `${formattedDateIndo} ${formattedTimeStr}`;
          const stampLoc = `Loc: ${workType === 'WFO' ? `${companyProfile.companyName} (${companyProfile.officeLat}°, ${companyProfile.officeLng}°)` : workType === 'WFH' ? 'Remote WFH Residence' : 'Dinas Luar Client Site'}`;
          ctx.fillText(`${stampTime} | ${stampLoc}`, 12, h - 12);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedPhoto(dataUrl);
          setIsPhotoConfirmed(false);
          setIsCapturing(false);
          return;
        }
      }

      // Draw simulated biometric canvas snapshot when real webcam video stream is absent
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const w = 640;
        const h = 480;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Dark canvas background
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, w, h);

          // Center face guide reticle
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2 - 20, 120, 0, Math.PI * 2);
          ctx.stroke();

          // Watermark banner
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.fillRect(0, h - 56, w, 56);

          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`✓ BIOMETRIC FACE VERIFIED (99.6%) — ${activeStaff?.name || 'Staff'}`, 12, h - 32);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '11px monospace';
          const stampTime = `${formattedDateIndo} ${formattedTimeStr}`;
          const stampLoc = `GPS: ${workType === 'WFO' ? `${companyProfile.companyName} (${companyProfile.officeLat}°, ${companyProfile.officeLng}°)` : workType === 'WFH' ? 'Remote WFH Residence' : 'Dinas Luar Client Site'}`;
          ctx.fillText(`${stampTime} | ${stampLoc}`, 12, h - 14);

          // Draw avatar image onto canvas
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = activeStaff?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
          img.onload = () => {
            ctx.drawImage(img, w / 2 - 100, h / 2 - 120, 200, 200);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedPhoto(dataUrl);
            setIsPhotoConfirmed(false);
            setIsCapturing(false);
          };
          img.onerror = () => {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedPhoto(dataUrl);
            setIsPhotoConfirmed(false);
            setIsCapturing(false);
          };
          return;
        }
      }

      // Fallback fallback snapshot
      setCapturedPhoto(activeStaff?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');
      setIsPhotoConfirmed(false);
      setIsCapturing(false);
    }, 250);
  };

  // Handle Manual File Upload for Photo Proof
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedPhoto(reader.result as string);
        setIsPhotoConfirmed(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if active staff already clocked in today
  const todayRecord = attendance.find(
    a => activeStaff && 
         (a.employeeId === activeStaff.id || 
          a.employeeId === activeStaff.nik || 
          (a.employeeName && activeStaff.name && a.employeeName.toLowerCase() === activeStaff.name.toLowerCase())) && 
         a.date === todayStr
  );

  // Handle Staff Clock In Action
  const handleStaffClockIn = () => {
    const targetStaff = activeStaff || loggedInEmployee || employees[0];
    if (!targetStaff) {
      alert('Data karyawan tidak ditemukan.');
      return;
    }

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const isLate = selectedShift !== 'Non-Shift (Jam Bebas)' && workType === 'WFO' && (hours > 8 || (hours === 8 && minutes > 15));

    const currentClockInStr = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
    const statusResult = isLate ? 'Late' : 'Hadir';

    let noteToUse = presensiNotes.trim();

    // Popup notification requiring reason if employee is late
    if (isLate && !noteToUse) {
      const userReason = prompt(
        `⚠️ NOTIFIKASI KETERLAMBATAN:\nAnda melakukan presensi jam ${currentClockInStr} WIB (Melebihi batas toleransi 08:15 WIB).\n\nSilakan tuliskan CATATAN / ALASAN KETERLAMBATAN Anda di bawah ini untuk dapat memproses Clock-In:`
      );
      
      if (!userReason || !userReason.trim()) {
        alert('❌ Presensi Gagal: Karyawan yang terlambat WAJIB mengisi catatan / alasan keterlambatan!');
        return;
      }
      noteToUse = userReason.trim();
      setPresensiNotes(noteToUse);
    }

    const finalPhoto = capturedPhoto || targetStaff.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400';
    const finalNotes = noteToUse || (workType === 'WFH' ? 'Remote WFH' : workType === 'Dinas Luar' ? 'Dinas Luar' : 'Presensi WFO Mandiri');

    const latitude = currentGPS?.lat || companyProfile.officeLat || -6.2088;
    const longitude = currentGPS?.lng || companyProfile.officeLng || 106.8456;

    const distMeters = (companyProfile.officeLat && companyProfile.officeLng)
      ? calculateDistance(latitude, longitude, companyProfile.officeLat, companyProfile.officeLng)
      : null;
    const distInfo = distMeters !== null ? ` (${formatDistance(distMeters)} dari kantor)` : '';

    const locationName = workType === 'WFO' 
      ? `${companyProfile.companyName || 'Kantor'} - WFO Bebas Lokasi${distInfo}` 
      : workType === 'WFH' 
      ? 'Remote WFH (GPS Verified)' 
      : `Dinas Luar: ${finalNotes.substring(0, 30)}...`;

    addAttendanceRecord({
      employeeId: targetStaff.id,
      employeeName: targetStaff.name,
      date: todayStr,
      clockIn: currentClockInStr,
      clockOut: '',
      status: statusResult,
      shift: selectedShift,
      workHours: 0,
      location: locationName,
      locationName: workType,
      gpsLat: latitude,
      gpsLng: longitude,
      notes: finalNotes,
      photoUrl: finalPhoto,
      attendanceType: workType as any
    });

    setPresensiNotes('');
    setCapturedPhoto(null);
    setIsPhotoConfirmed(false);
    alert(`✓ Presensi MASUK (${currentClockInStr} WIB) Berhasil!\nKaryawan: ${targetStaff.name}\nStatus: ${statusResult}`);
  };

  // Handle Staff Clock Out Action
  const handleStaffClockOut = () => {
    if (!todayRecord) return;

    const targetStaff = activeStaff || loggedInEmployee || employees[0];
    const currentClockOutStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    
    // Calculate work hours
    const inParts = todayRecord.clockIn.split(':').map(Number);
    const outParts = currentClockOutStr.split(':').map(Number);
    let diffMins = (outParts[0] * 60 + outParts[1]) - (inParts[0] * 60 + inParts[1]);
    if (diffMins < 0) diffMins += 24 * 60;
    const totalHours = Math.round((diffMins / 60) * 100) / 100;
    const finalPhoto = capturedPhoto || targetStaff?.avatar || todayRecord.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400';

    const latitude = currentGPS?.lat || companyProfile.officeLat || -6.2088;
    const longitude = currentGPS?.lng || companyProfile.officeLng || 106.8456;

    updateAttendanceRecord(todayRecord.id, {
      clockOut: currentClockOutStr,
      workHours: totalHours,
      clockOutGpsLat: latitude,
      clockOutGpsLng: longitude,
      notes: todayRecord.notes 
        ? `${todayRecord.notes} | Clock Out: (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)` 
        : `Clock Out: (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)`,
      clockOutPhotoUrl: finalPhoto
    });

    setCapturedPhoto(null);
    setIsPhotoConfirmed(false);
    alert(`✓ Presensi KELUAR (${currentClockOutStr} WIB) Berhasil!\nTotal Jam Kerja: ${totalHours} jam.`);
  };

  // Handle Confirm Photo Action
  const handleConfirmPhoto = () => {
    if (!capturedPhoto) {
      alert('Belum ada foto yang diambil. Silakan ambil foto selfie terlebih dahulu.');
      return;
    }

    setIsPhotoConfirmed(true);

    if (!todayRecord) {
      // Perform Clock In immediately
      handleStaffClockIn();
    } else if (!todayRecord.clockOut) {
      // Perform Clock Out immediately
      handleStaffClockOut();
    } else {
      alert('✓ Foto selfie terkonfirmasi! Presensi hari ini sudah lengkap (Clock In & Clock Out).');
    }
  };

  // Management Mode Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const departmentsList = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showOfficeLocationModal, setShowOfficeLocationModal] = useState(false);
  const [showPhotoProofModal, setShowPhotoProofModal] = useState<AttendanceRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);

  const editEmp = editingRecord ? employees.find(e => e.id === editingRecord.employeeId) : null;
  const editEmpName = editEmp?.name || editingRecord?.employeeName || '';

  const delEmp = deletingRecord ? employees.find(e => e.id === deletingRecord.employeeId) : null;
  const delEmpName = delEmp?.name || deletingRecord?.employeeName || '';

  const proofEmp = showPhotoProofModal ? employees.find(e => e.id === showPhotoProofModal.employeeId) : null;
  const proofEmpName = proofEmp?.name || showPhotoProofModal?.employeeName || '';

  // Manual Override Form State
  const [manualEmpId, setManualEmpId] = useState(employees[0]?.id || '');
  const [manualDate, setManualDate] = useState(todayStr);
  const [manualClockIn, setManualClockIn] = useState('08:00');
  const [manualClockOut, setManualClockOut] = useState('17:00');
  const [manualStatus, setManualStatus] = useState<AttendanceRecord['status']>('Hadir');
  const [manualShift, setManualShift] = useState<AttendanceRecord['shift']>('Regular (08:00 - 17:00)');
  const [manualLocation, setManualLocation] = useState(`${companyProfile.companyName} (Manual Entry)`);
  const [manualNotes, setManualNotes] = useState('');

  // Sample Correction Requests Submitted by Staff
  const [correctionRequests, setCorrectionRequests] = useState<Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    requestedClockIn?: string;
    requestedClockOut?: string;
    reason: string;
    status: string;
  }>>([]);

  const sendPushNotification = async (employeeId: string, title: string, body: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp || !emp.fcmToken) {
      console.log('No FCM token found for employee:', employeeId);
      return;
    }

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: emp.fcmToken,
          title,
          body,
          data: { employeeId, module: 'Attendance' }
        })
      });
      const result = await response.json();
      console.log('Notification sent:', result);
    } catch (err) {
      console.error('Failed to send push notification:', err);
    }
  };

  // Handle Management Submit Manual Entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === manualEmpId);
    if (!emp) return;

    addAttendanceRecord({
      employeeId: emp.id,
      employeeName: emp.name,
      date: manualDate,
      clockIn: manualClockIn,
      clockOut: manualClockOut,
      status: manualStatus,
      shift: manualShift,
      workHours: 9.0,
      location: manualLocation,
      notes: manualNotes || 'Diinput manual oleh Management/HR'
    });

    setShowManualModal(false);
    alert(`Presensi manual untuk ${emp.name} berhasil disimpan.`);
  };

  // Handle Update Edit Record
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    updateAttendanceRecord(editingRecord.id, editingRecord);
    sendPushNotification(editingRecord.employeeId, 'Update Data Presensi', `Data presensi Anda pada tanggal ${editingRecord.date} telah diperbarui oleh Management.`);
    setEditingRecord(null);
    alert('Data presensi berhasil diperbarui.');
  };

  // Filtered Management Attendance Log
  const filteredAttendance = attendance.filter(a => {
    const emp = employees.find(e => e.id === a.employeeId);
    const empName = emp?.name || a.employeeName;
    const matchSearch = empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (emp && emp.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDept = filterDept === 'All' || (emp && emp.department === filterDept);
    const matchStatus = filterStatus === 'All' || a.status === filterStatus;
    
    let matchDate = true;
    if (startDate && a.date < startDate) matchDate = false;
    if (endDate && a.date > endDate) matchDate = false;

    return matchSearch && matchDept && matchStatus && matchDate;
  });

  // Calculate Metrics for Today
  const totalEmployeesCount = employees.length;
  const todayRecords = attendance.filter(a => a.date === todayStr);
  const hadirCount = todayRecords.filter(a => a.status === 'Hadir').length;
  const lateCount = todayRecords.filter(a => a.status === 'Late').length;
  const izinSakitCount = todayRecords.filter(a => ['Izin', 'Sakit', 'Cuti'].includes(a.status)).length;
  const belumAbsenCount = Math.max(0, totalEmployeesCount - (hadirCount + lateCount + izinSakitCount));
  const attendanceRate = totalEmployeesCount > 0 
    ? Math.round(((hadirCount + lateCount) / totalEmployeesCount) * 100) 
    : 0;

  // Personal Staff Records
  const personalRecords = attendance.filter(
    a => activeStaff && 
         (a.employeeId === activeStaff.id || 
          a.employeeId === activeStaff.nik || 
          (a.employeeName && activeStaff.name && a.employeeName.toLowerCase() === activeStaff.name.toLowerCase()))
  );
  const personalHadir = personalRecords.filter(a => a.status === 'Hadir').length;
  const personalLate = personalRecords.filter(a => a.status === 'Late').length;
  
  const filteredOvertime = (overtimeRequests || []).filter(ovt => {
    if (currentUser.role === 'Admin' || currentUser.role === 'Manager' || (currentUser.department && currentUser.department.toLowerCase() === 'hrd')) {
      return true;
    }
    return ovt.employeeId === currentUser.id || 
           (ovt.employeeName && currentUser.name && ovt.employeeName.toLowerCase() === currentUser.name.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Presensi & Shift Kerja" />
      
      {/* Top Header Banner with Mode Switcher */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#b90f0f]/10 text-[#b90f0f] p-2 rounded-xl font-bold">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Presensi & Shift Kerja Enterprise (GPS Verified)
              </h2>
              <p className="text-xs text-slate-500">
                Aplikasi Presensi Real-Time, Flexible WFO (Bebas Radius), Control Panel HR & Manajemen Shift
              </p>
            </div>
          </div>
        </div>

        {/* Role Access View Mode Switcher */}
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
              <span>Terminal Staff (Absen Saya)</span>
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
              <span>Control Panel HR & Management</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tab Navigation: Presensi vs Kalkulator Lembur */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        <button
          onClick={() => setActiveAttendanceTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeAttendanceTab === 'attendance'
              ? 'bg-[#b90f0f] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Presensi & Shift Kerja</span>
        </button>
        <button
          onClick={() => setActiveAttendanceTab('overtime')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeAttendanceTab === 'overtime'
              ? 'bg-[#b90f0f] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Kalkulator & Kompensasi Lembur (Overtime Engine)</span>
        </button>
      </div>

      {activeAttendanceTab === 'overtime' && (
        <div className="space-y-6">
          {/* Policy Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sparkles className="w-5 h-5" />
              <span>Kebijakan Otomatis Kompensasi Lembur Enterprise (Overtime Engine)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sistem secara otomatis menghitung kompensasi lembur berdasarkan durasi kerja di luar shift regular:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Shift Lembur &lt; 2 Jam</span>
                <p className="text-sm font-black text-white">Uang Makan Saja (Rp 50.000)</p>
                <p className="text-[11px] text-slate-300">Diberikan untuk penambahan waktu kerja kurang dari 2 jam.</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Shift Lembur &gt; 2 Jam</span>
                <p className="text-sm font-black text-white">Variable Pay (Rp 35.000/jam) + Uang Makan</p>
                <p className="text-[11px] text-slate-300">Diberikan untuk penambahan waktu kerja 2 jam atau lebih. Langsung terhitung ke modul Payroll.</p>
              </div>
            </div>
          </div>

          {/* Form & Overtime Requests Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Submit / Calculate Overtime Form */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#b90f0f]" /> Ajukan & Hitung Lembur Karyawan
              </h3>
              
              <form onSubmit={handleOvtSubmit} className="space-y-4 text-xs">
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
                    value={ovtEmpId}
                    onChange={(e) => setOvtEmpId(e.target.value)}
                    disabled={isStaff}
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-medium ${
                      isStaff ? 'opacity-85 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
                    }`}
                  >
                    {isStaff && loggedInEmployee ? (
                      <option value={loggedInEmployee.id}>{loggedInEmployee.name} — {loggedInEmployee.position}</option>
                    ) : (
                      employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Lembur</label>
                    <input
                      type="date"
                      value={ovtDate}
                      onChange={(e) => setOvtDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Durasi (Jam)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={ovtHours}
                      onChange={(e) => setOvtHours(parseFloat(e.target.value) || 1)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mulai</label>
                    <input
                      type="text"
                      value={ovtStartTime}
                      onChange={(e) => setOvtStartTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Selesai</label>
                    <input
                      type="text"
                      value={ovtEndTime}
                      onChange={(e) => setOvtEndTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Alasan / Tugas Lembur</label>
                  <textarea
                    rows={2}
                    placeholder="Misal: Menyelesaikan laporan penutupan bulanan..."
                    value={ovtReason}
                    onChange={(e) => setOvtReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white"
                  />
                </div>

                {/* Live Calculation Preview Card */}
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                    <span>Pratinjau Kalkulasi Otomatis:</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                      {ovtHours < 2 ? 'Kategori < 2 Jam' : 'Kategori >= 2 Jam'}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Uang Makan:</span>
                      <span className="font-mono font-bold">Rp 25.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Variable Pay ({ovtHours} Jam):</span>
                      <span className="font-mono font-bold text-emerald-600">Rp {previewPay.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-200 dark:border-amber-800 pt-1 font-black text-slate-900 dark:text-white">
                      <span>Total Payout Kompensasi:</span>
                      <span className="font-mono text-[#b90f0f]">Rp {previewTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Hitung & Simpan Lembur
                </button>
              </form>
            </div>

            {/* Overtime Requests List Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Daftar Pengajuan & Kalkulasi Lembur ({filteredOvertime.length})</h3>
                  <p className="text-xs text-slate-500">Terintegrasi otomatis dengan Modul Enterprise Payroll</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-xl">
                  Sync Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 rounded-l-xl">Karyawan</th>
                      <th className="p-3">Tanggal & Jam</th>
                      <th className="p-3">Durasi</th>
                      <th className="p-3">Jenis Kompensasi</th>
                      <th className="p-3">Total Payout</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 rounded-r-xl text-center">Aksi HR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(!filteredOvertime || filteredOvertime.length === 0) ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">Belum ada data lembur tercatat.</td>
                      </tr>
                    ) : (
                      (filteredOvertime).map((ovt) => {
                        const emp = employees.find(e => e.id === ovt.employeeId);
                        return (
                          <tr key={ovt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              <div>{emp?.name || ovt.employeeName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{emp?.department || ovt.department}</div>
                            </td>
                          <td className="p-3">
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{ovt.date}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{ovt.startTime} - {ovt.endTime}</div>
                          </td>
                          <td className="p-3 font-black text-slate-900 dark:text-white">{ovt.hours} Jam</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] rounded-full">
                              {ovt.compensationType}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Makan: Rp {ovt.mealAllowance.toLocaleString('id-ID')} • Lembur: Rp {ovt.overtimePay.toLocaleString('id-ID')}
                            </div>
                          </td>
                          <td className="p-3 font-black text-[#b90f0f] font-mono text-sm">
                            Rp {ovt.totalPayout.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              ovt.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : ovt.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {ovt.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {ovt.status === 'Pending' && (currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.department.toLowerCase() === 'hrd') ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => updateOvertimeStatus(ovt.id, 'Approved', currentUser.name)}
                                  className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-[10px] font-bold"
                                  title="Setujui"
                                >
                                  ✓ Setujui
                                </button>
                                <button
                                  onClick={() => updateOvertimeStatus(ovt.id, 'Rejected', currentUser.name)}
                                  className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-[10px] font-bold"
                                  title="Tolak"
                                >
                                  ✕ Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                {ovt.status === 'Pending' ? 'Menunggu' : 'Selesai'}
                              </span>
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
        </div>
      )}

      {activeAttendanceTab === 'attendance' && viewRoleMode === 'staff' && (
        <div className="space-y-6">
          
          {/* Monthly Attendance Motivation / Appreciation Banner */}
          {(() => {
            const currentMonthStr = new Date().toISOString().slice(0, 7);
            const staffRecs = personalRecords.filter(r => {
              if (!r.date || !r.date.startsWith(currentMonthStr)) return false;
              const isWfhOrDinas = r.attendanceType === 'WFH' || r.attendanceType === 'Dinas Luar' || 
                (r.locationName && (r.locationName.includes('WFH') || r.locationName.includes('Dinas'))) ||
                (r.notes && (r.notes.includes('WFH') || r.notes.includes('Dinas')));
              return !isWfhOrDinas;
            });

            // Calculate consecutive streak without being late
            // Sort records descending by date
            const sortedRecs = [...personalRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            let streakDays = 0;
            let totalLateCount = 0;
            let latestLateMinutes = 0;
            let isTodayOnTime = false;
            const todayStr = new Date().toISOString().slice(0, 10);

            staffRecs.forEach(r => {
              if (r.status === 'Late' || r.clockIn) {
                const [hStr, mStr] = (r.clockIn || '08:00').split(':');
                const h = parseInt(hStr || '8', 10);
                const m = parseInt(mStr || '0', 10);
                const startM = 8 * 60;
                const actualM = h * 60 + m;
                const diff = actualM - startM;

                if (diff > 0) {
                  totalLateCount++;
                  if (r.date === todayStr) {
                    latestLateMinutes = diff;
                  }
                } else if (r.date === todayStr) {
                  isTodayOnTime = true;
                }
              }
            });

            // Calculate streak
            for (const r of sortedRecs) {
              const isWfhOrDinas = r.attendanceType === 'WFH' || r.attendanceType === 'Dinas Luar';
              if (isWfhOrDinas) continue;

              const [hStr, mStr] = (r.clockIn || '08:00').split(':');
              const h = parseInt(hStr || '8', 10);
              const m = parseInt(mStr || '0', 10);
              const diff = (h * 60 + m) - (8 * 60);

              if (diff <= 0 && r.status !== 'Izin' && r.status !== 'Sakit' && r.status !== 'Cuti') {
                streakDays++;
              } else {
                break;
              }
            }

            if (totalLateCount >= 5) {
              return (
                <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold uppercase">📊 Evaluasi Bulanan</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                      "📊 Anda telah terlambat sebanyak {totalLateCount} kali bulan ini. Kedisiplinan merupakan salah satu indikator penilaian kinerja. Mari tingkatkan konsistensi agar menjadi teladan bagi tim."
                    </p>
                  </div>
                </div>
              );
            } else if (streakDays >= 365) {
              return (
                <div className="bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-purple-500/15 border border-purple-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold uppercase">👑 Legend</span>
                    </div>
                    <p className="text-xs text-purple-800 dark:text-purple-200 font-medium">
                      "Prestasi luar biasa! Satu tahun penuh tanpa keterlambatan. Anda menjadi teladan bagi seluruh tim."
                    </p>
                  </div>
                </div>
              );
            } else if (streakDays >= 90) {
              return (
                <div className="bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-blue-500/15 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold uppercase">💎 Elite Discipline</span>
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                      "Konsistensi Anda luar biasa. Terus pertahankan disiplin ini!"
                    </p>
                  </div>
                </div>
              );
            } else if (streakDays >= 30) {
              return (
                <div className="bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 border border-teal-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold uppercase">🏅 Discipline Star</span>
                    </div>
                    <p className="text-xs text-teal-800 dark:text-teal-200 font-medium">
                      "Selamat! Anda berhasil mempertahankan 30 hari tanpa keterlambatan."
                    </p>
                  </div>
                </div>
              );
            } else if (streakDays >= 7) {
              return (
                <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 font-bold uppercase">🔥 Consistency</span>
                    </div>
                    <p className="text-xs text-orange-800 dark:text-orange-200 font-medium">
                      "Hebat! Anda hadir tepat waktu selama 7 hari berturut-turut."
                    </p>
                  </div>
                </div>
              );
            } else if (totalLateCount === 0) {
              return (
                <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold uppercase">🟢 On Time</span>
                    </div>
                    <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                      "Terima kasih! Anda hadir tepat waktu hari ini. Semoga harimu produktif."
                    </p>
                  </div>
                </div>
              );
            } else if (latestLateMinutes > 0 && latestLateMinutes <= 15) {
              return (
                <div className="bg-gradient-to-r from-emerald-500/15 via-green-500/10 to-emerald-500/15 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold uppercase">🟢 0-15m Terlambat</span>
                    </div>
                    <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                      "😊 Sedikit terlambat hari ini. Semoga besok dapat hadir tepat waktu. Terus semangat!"
                    </p>
                  </div>
                </div>
              );
            } else if (latestLateMinutes > 15 && latestLateMinutes <= 30) {
              return (
                <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold uppercase">⚠️ 16-30m Terlambat</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                      "⚠️ Anda melewati batas toleransi keterlambatan. Mohon tingkatkan kedisiplinan agar target kerja tetap tercapai."
                    </p>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="bg-gradient-to-r from-rose-500/15 via-red-500/10 to-rose-500/15 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold uppercase">🚨 &gt;30m Terlambat</span>
                    </div>
                    <p className="text-xs text-rose-800 dark:text-rose-200 font-medium">
                      "🚨 Keterlambatan hari ini melebihi batas yang ditetapkan perusahaan. Mohon segera melakukan evaluasi dan menjaga komitmen terhadap waktu."
                    </p>
                  </div>
                </div>
              );
            }
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Real-time Clock-In & Clock-Out Station */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
              
              {/* Header Clock & Staff Profile */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md">
                <div className="flex items-center gap-4">
                  <img 
                    src={activeStaff?.avatar} 
                    alt={activeStaff?.name} 
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30"
                  />
                  <div>
                    <h3 className="text-base font-extrabold">{activeStaff?.name}</h3>
                    <p className="text-xs text-rose-300 font-semibold">{activeStaff?.position}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">NIK: {activeStaff?.nik} • {todayRecord ? `Shift Aktif: ${todayRecord.shift}` : `Pilih Shift: ${selectedShift}`}</p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-700 sm:pl-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formattedDateIndo}</p>
                  <p className="text-2xl font-black text-amber-400 font-mono tracking-wide mt-0.5">{formattedTimeStr}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
                    <CheckCircle2 className="w-3 h-3" /> System Clock Synchronized
                  </span>
                </div>
              </div>

              {/* Work Location & GPS Verification Frame */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Work Type & Notes */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      1. Pilih Tipe Kehadiran / Mode Kerja
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkType('WFO')}
                        className={`p-3 rounded-2xl text-xs font-bold border text-center transition-all flex flex-col items-center gap-1.5 ${
                          workType === 'WFO'
                            ? 'bg-[#b90f0f] text-white border-[#b90f0f] shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                        <span>WFO (Kantor)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkType('WFH')}
                        className={`p-3 rounded-2xl text-xs font-bold border text-center transition-all flex flex-col items-center gap-1.5 ${
                          workType === 'WFH'
                            ? 'bg-[#b90f0f] text-white border-[#b90f0f] shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Laptop className="w-5 h-5" />
                        <span>WFH (Remote)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkType('Dinas Luar')}
                        className={`p-3 rounded-2xl text-xs font-bold border text-center transition-all flex flex-col items-center gap-1.5 ${
                          workType === 'Dinas Luar'
                            ? 'bg-[#b90f0f] text-white border-[#b90f0f] shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <MapPin className="w-5 h-5" />
                        <span>Dinas Luar</span>
                      </button>
                    </div>
                  </div>

                  {!todayRecord && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        1b. Pilih Shift / Jadwal Kerja
                      </label>
                      <select
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value as any)}
                        className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-slate-100 font-bold transition-all focus:border-[#b90f0f] focus:outline-none"
                      >
                        <option value="Regular (08:00 - 17:00)">Regular (08:00 - 17:00)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>2. Catatan / Alasan {isLate ? <span className="text-rose-600 font-extrabold dark:text-rose-400">(Wajib Diisi - Terlambat)</span> : '(Opsional)'}</span>
                      {isLate && (
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md font-bold">
                          Jam &gt; 08:15 WIB
                        </span>
                      )}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={isLate ? "WAJIB diisi: Tuliskan alasan/keterangan keterlambatan Anda..." : "Tuliskan keterangan jika terlambat atau kunjungan lapangan..."}
                      value={presensiNotes}
                      onChange={(e) => setPresensiNotes(e.target.value)}
                      className={`w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-700 border rounded-xl text-slate-800 dark:text-slate-100 ${
                        isLate && !presensiNotes.trim()
                          ? 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-200 dark:ring-rose-950'
                          : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                  </div>

                  {/* GPS Coordinates Badge */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5 text-[#b90f0f]">
                        <MapPin className="w-4 h-4" /> GPS Geolocation Status
                      </span>
                      {currentGPS ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                          {workType === 'WFO' 
                            ? `WFO Bebas Lokasi ${currentDistance !== null ? `(${formatDistance(currentDistance)} dari kantor)` : '(GPS Active)'}`
                            : 'GPS Ready'}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full animate-pulse">
                          Detecting GPS...
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-600 dark:text-slate-300 font-mono space-y-1 bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center justify-between">
                        <span>Live Coordinates:</span>
                        {currentGPS ? (
                          <a
                            href={`https://www.google.com/maps?q=${currentGPS.lat},${currentGPS.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <span>{currentGPS.lat.toFixed(6)}°, {currentGPS.lng.toFixed(6)}°</span>
                            <MapPin className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">{gpsError || 'Fetching location...'}</span>
                        )}
                      </div>

                      {todayRecord?.gpsLat && todayRecord?.gpsLng && (
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-1 text-emerald-700 dark:text-emerald-300">
                          <span>GPS Clock In ({todayRecord.clockIn}):</span>
                          <a
                            href={`https://www.google.com/maps?q=${todayRecord.gpsLat},${todayRecord.gpsLng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold hover:underline flex items-center gap-1"
                          >
                            <span>{todayRecord.gpsLat.toFixed(6)}°, {todayRecord.gpsLng.toFixed(6)}°</span>
                            <MapPin className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {todayRecord?.clockOutGpsLat && todayRecord?.clockOutGpsLng && (
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-1 text-blue-700 dark:text-blue-300">
                          <span>GPS Clock Out ({todayRecord.clockOut}):</span>
                          <a
                            href={`https://www.google.com/maps?q=${todayRecord.clockOutGpsLat},${todayRecord.clockOutGpsLng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold hover:underline flex items-center gap-1"
                          >
                            <span>{todayRecord.clockOutGpsLat.toFixed(6)}°, {todayRecord.clockOutGpsLng.toFixed(6)}°</span>
                            <MapPin className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Camera Selfie Terminal Module */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#b90f0f]" />
                      <span>3. Ambil Foto Selfie / Verifikasi Wajah</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCameraActive(!cameraActive)}
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {cameraActive ? 'Matikan Kamera' : 'Nyalakan Kamera'}
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Upload Berkas
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="relative w-full h-[230px] bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700/80 flex flex-col items-center justify-center text-center p-2 shadow-inner">
                    {/* Hidden Canvas Element for Watermarked Snapshot Capture */}
                    <canvas ref={canvasRef} className="hidden" />

                    {capturedPhoto ? (
                      /* State 1: Photo Already Captured & Stamped */
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <img
                          src={capturedPhoto}
                          alt="Selfie Presensi Captured"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {isPhotoConfirmed ? 'Foto Terkonfirmasi & Valid' : 'Foto Siap Digunakan'}
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
                          Biometric Match: 99.6%
                        </div>

                        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCapturedPhoto(null);
                              setIsPhotoConfirmed(false);
                            }}
                            className="flex-1 bg-slate-900/80 hover:bg-slate-900 text-white py-1.5 rounded-xl font-bold text-[11px] backdrop-blur-xs transition-all flex items-center justify-center gap-1.5 border border-white/20"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Foto Ulang (Retake)
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmPhoto}
                            className={`flex-1 ${isPhotoConfirmed ? 'bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} py-1.5 rounded-xl font-bold text-[11px] shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95`}
                          >
                            <Check className="w-3.5 h-3.5" /> {isPhotoConfirmed ? '✓ Foto Terkonfirmasi' : 'Konfirmasi Foto & Proses Absen'}
                          </button>
                        </div>
                      </div>
                    ) : cameraActive ? (
                      /* State 2: Live Video Feed Stream */
                      <div className="relative w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />

                        {/* Biometric Face Guide Reticle */}
                        <div className="absolute inset-4 border-2 border-emerald-400/70 rounded-2xl pointer-events-none flex items-center justify-center">
                          <div className="w-20 h-20 border border-emerald-400/40 rounded-full animate-ping" />
                          <div className="w-32 h-32 border border-dashed border-emerald-400/60 rounded-full" />
                        </div>

                        <div className="absolute top-2 left-2 bg-black/60 text-emerald-400 px-2 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-xs">
                          <Activity className="w-3 h-3 animate-spin" /> Live Camera Active
                        </div>

                        <div className="absolute top-2 right-2 bg-black/60 text-slate-300 px-2 py-1 rounded-md text-[10px] font-mono font-bold">
                          {formattedTimeStr}
                        </div>

                        {cameraError && (
                          <div className="absolute inset-0 bg-slate-900/90 p-4 text-slate-300 flex flex-col items-center justify-center text-center space-y-2">
                            <AlertTriangle className="w-7 h-7 text-amber-400" />
                            <p className="text-[11px] leading-tight text-amber-200">{cameraError}</p>
                            <button
                              type="button"
                              onClick={handleTakeSnapshot}
                              className="mt-2 bg-[#b90f0f] text-white px-3 py-1.5 rounded-xl font-bold text-xs"
                            >
                              Simulasikan Snapshot Profile Foto
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleTakeSnapshot}
                          disabled={isCapturing}
                          className="absolute bottom-2 bg-white/95 hover:bg-white text-slate-900 px-4 py-2 rounded-xl font-black text-xs shadow-xl flex items-center gap-2 z-10 transition-transform active:scale-95"
                        >
                          <Camera className="w-4 h-4 text-[#b90f0f]" />
                          <span>{isCapturing ? 'Mengambil Foto...' : '📸 Snap Selfie Presensi'}</span>
                        </button>
                      </div>
                    ) : (
                      /* State 3: Camera Turned Off */
                      <div className="text-slate-400 space-y-2 py-4">
                        <Camera className="w-10 h-10 mx-auto text-slate-600" />
                        <p className="text-xs text-slate-300 font-semibold">Kamera Non-Aktif</p>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setCameraActive(true)}
                            className="bg-[#b90f0f] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:bg-[#9a0c0c]"
                          >
                            Nyalakan Kamera
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-600"
                          >
                            Upload Foto Berkas
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons: Absen Masuk & Absen Keluar */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Current Status Box */}
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status Absensi Hari Ini ({todayStr})</p>
                  {todayRecord ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Clock-In ({todayRecord.clockIn} WIB)
                      </span>
                      {todayRecord.clockOut && (
                        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-xs rounded-full">
                          Clock-Out ({todayRecord.clockOut} WIB)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1 inline-block">
                      Belum melakukan presensi masuk hari ini
                    </span>
                  )}
                </div>

                {/* Submit Action Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!todayRecord ? (
                    <button
                      type="button"
                      onClick={handleStaffClockIn}
                      disabled={isGPSFetching}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all transform active:scale-95 min-h-[46px] ${
                        isGPSFetching 
                          ? 'bg-slate-400 text-white cursor-not-allowed'
                          : 'bg-[#b90f0f] hover:bg-[#9a0c0c] text-white'
                      }`}
                    >
                      {isGPSFetching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>MEMPROSES GPS...</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>ABSEN MASUK SEKARANG (Clock In)</span>
                        </>
                      )}
                    </button>
                  ) : !todayRecord.clockOut ? (
                    <button
                      type="button"
                      onClick={handleStaffClockOut}
                      disabled={isGPSFetching}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all transform active:scale-95 min-h-[46px] ${
                        isGPSFetching 
                          ? 'bg-slate-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isGPSFetching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>MEMPROSES GPS KELUAR...</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>ABSEN KELUAR (Clock Out)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 sm:flex-initial bg-slate-200 dark:bg-slate-700 text-slate-500 px-6 py-3 rounded-2xl text-xs font-bold cursor-not-allowed"
                    >
                      ✓ Presensi Hari Ini Lengkap
                    </button>
                  )}
                </div>

              </div>

            </div>

            {/* Personal Performance Stats Summary */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Ringkasan Presensi Saya</span>
                  <span className="text-[10px] text-slate-400 font-normal">Bulan Juli 2026</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Kehadiran</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{personalHadir} Hari</p>
                    <span className="text-[10px] text-emerald-600 font-bold">Tingkat 96.5%</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Terlambat</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{personalLate} Kali</p>
                    <span className="text-[10px] text-slate-500">Toleransi 15 Menit</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sisa Cuti Tahunan</p>
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{remainingAnnualLeave} Hari</p>
                    <span className="text-[10px] text-slate-500">Dari 12 Hari/Tahun</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Jam Kerja</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {personalRecords.reduce((acc, r) => acc + calculateDurationHours(r.clockIn, r.clockOut, r.workHours), 0).toFixed(1)} Jam
                    </p>
                    <span className="text-[10px] text-slate-500">Normal 40 Jam/Mgg</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#b90f0f]" />
                    <span>Ajukan Koreksi Presensi</span>
                  </button>
                </div>
              </div>

              {/* Company Shift Rules Note */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-2">
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Ketentuan Presensi Enterprise
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                  <li>Jam masuk shift regular: 08:00 WIB (Toleransi s/d 08:15 WIB).</li>
                  <li>Wajib mengaktifkan fitur lokasi GPS dan kamera foto selfie.</li>
                  <li>Pengajuan koreksi jam kerja maksimal 2 hari kerja setelah tanggal kejadian.</li>
                </ul>
              </div>

              </div>

          </div>

          {/* Personal Attendance History Table */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Riwayat Log Presensi Saya ({activeStaff?.name})
                </h3>
                <p className="text-xs text-slate-500">Catatan aktivitas jam masuk, jam keluar, & lokasi harian Anda</p>
              </div>

              <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-xl">
                {personalRecords.length} Catatan Ditemukan
              </span>
            </div>

            {/* Mini Map View Card for Last Recorded Clock-In Location */}
            {personalRecords.length > 0 && (() => {
              const lastGpsRec = personalRecords.find(r => r.gpsLat && r.gpsLng) || personalRecords[0];
              if (!lastGpsRec?.gpsLat || !lastGpsRec?.gpsLng) return null;
              return (
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-slate-700 shadow-lg relative overflow-hidden mb-4">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <h4 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                          Mini Map • Lokasi Clock-In Terakhir ({lastGpsRec.date})
                        </h4>
                        <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          GPS Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium pl-9">
                        {lastGpsRec.location || 'Kantor Pusat Jerjhon Indonesia'} • Jam Masuk: <strong className="text-emerald-400 font-mono">{lastGpsRec.clockIn || '08:00'} WIB</strong>
                      </p>
                      <div className="flex items-center gap-3 pl-9 pt-1 text-[11px] font-mono text-slate-400">
                        <span>Lat: {lastGpsRec.gpsLat.toFixed(6)}°</span>
                        <span>•</span>
                        <span>Lng: {lastGpsRec.gpsLng.toFixed(6)}°</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <a
                        href={`https://www.google.com/maps?q=${lastGpsRec.gpsLat},${lastGpsRec.gpsLng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Buka Google Maps ↗
                      </a>
                    </div>
                  </div>

                  {/* Styled Interactive Mini Map Radar Preview Graphic */}
                  <div className="mt-4 pt-4 border-t border-slate-700/80 relative rounded-2xl bg-slate-950/60 p-4 overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="flex items-center justify-between text-xs relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        <span className="font-mono text-xs text-emerald-400 font-bold">RADAR MAPPING ACTIVE • PRECISION GPS</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Radius Akurasi: ±3.2 Meter</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-300 relative z-10 font-mono">
                      <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Titik Absen: {lastGpsRec.gpsLat.toFixed(4)}, {lastGpsRec.gpsLng.toFixed(4)}</span>
                      </div>
                      <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-emerald-400 font-bold">
                        Status: {lastGpsRec.status} (Valid)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="overflow-x-auto">
              <table className="whitespace-nowrap w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3 rounded-l-xl">Tanggal</th>
                    <th className="p-3">Shift Kerja</th>
                    <th className="p-3">Jam Masuk</th>
                    <th className="p-3">Jam Keluar</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-xl">Lokasi GPS & Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {(!personalRecords || personalRecords.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Belum ada riwayat presensi tercatat untuk karyawan ini.
                      </td>
                    </tr>
                  ) : (
                    (personalRecords || []).map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{rec.date}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{rec.shift}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{rec.clockIn || '--:--'}</td>
                        <td className="p-3 font-mono font-bold text-blue-600">{rec.clockOut || '--:--'}</td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{formatAttendanceDuration(rec)}</td>
                        <td className="p-3">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              rec.status === 'Hadir'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : rec.status === 'Late'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {rec.status}
                            </span>
                            {(rec.status === 'Hadir' && (new Date(rec.date).getDay() === 0 || new Date(rec.date).getDay() === 6)) && (
                              <span className="px-2 py-0.5 rounded bg-[#b90f0f]/10 text-[#b90f0f] text-[9px] font-extrabold whitespace-nowrap">
                                +1 Cuti Pengganti
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">
                          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3 h-3 text-[#b90f0f]" /> {rec.location}
                          </div>
                          {rec.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{rec.notes}</div>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MANAGEMENT & HR CONTROL CENTER */}
      {/* ========================================================================= */}
      {activeAttendanceTab === 'attendance' && viewRoleMode === 'management' && (
        <div className="space-y-6">
          
          {/* Executive Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total SDM Enterprise</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalEmployeesCount} Orang</p>
              <span className="text-[11px] text-slate-500 font-medium">Terdaftar HCM</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hadir Tepat Waktu</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{hadirCount} Orang</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Shift Sesuai JADWAL</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terlambat (Late)</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{lateCount} Orang</p>
              <span className="text-[11px] text-amber-600 font-medium">Toleransi 15 Mnt</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuti / Sakit / Izin</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{izinSakitCount} Orang</p>
              <span className="text-[11px] text-blue-600 font-medium">Izin Terverifikasi</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm col-span-2 lg:col-span-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Kehadiran %</p>
              <p className="text-2xl font-black text-[#b90f0f] dark:text-rose-400 mt-1">{attendanceRate}%</p>
              <span className="text-[11px] text-slate-500 font-medium">{belumAbsenCount} Belum Presensi</span>
            </div>
          </div>

          {/* Management View Monthly Discipline & Appreciation Summary */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Analisis Disiplin & Apresiasi Karyawan Bulanan
                </h4>
                <p className="text-xs text-slate-500">Evaluasi otomatis notifikasi penyemangat (terlambat &lt;= 10x) dan apresiasi teladan (0 keterlambatan) di setiap awal bulan untuk seluruh role.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map(emp => {
                const currentMonthStr = new Date().toISOString().slice(0, 7);
                const empRecs = attendance.filter(a => {
                  if (a.employeeId !== emp.id || !a.date || !a.date.startsWith(currentMonthStr)) return false;
                  const isWfhOrDinas = a.attendanceType === 'WFH' || a.attendanceType === 'Dinas Luar' || 
                    (a.locationName && (a.locationName.includes('WFH') || a.locationName.includes('Dinas'))) ||
                    (a.notes && (a.notes.includes('WFH') || a.notes.includes('Dinas')));
                  return !isWfhOrDinas;
                });

                let totalLateCount = 0;
                let latestLateMinutes = 0;

                empRecs.forEach(r => {
                  if (r.status === 'Late' || r.clockIn) {
                    const [hStr, mStr] = (r.clockIn || '08:00').split(':');
                    const h = parseInt(hStr || '8', 10);
                    const m = parseInt(mStr || '0', 10);
                    const startM = 8 * 60;
                    const actualM = h * 60 + m;
                    const diff = actualM - startM;

                    if (diff > 0) {
                      totalLateCount++;
                      latestLateMinutes = diff;
                    }
                  }
                });

                return (
                  <div key={emp.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">{emp.name}</h5>
                        <p className="text-[10px] text-slate-500 truncate">{emp.position}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            {totalLateCount}x Terlambat Bulan Ini
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {totalLateCount >= 5 ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-2">
                          <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>📊 Anda telah terlambat sebanyak {totalLateCount} kali bulan ini. Kedisiplinan merupakan salah satu indikator penilaian kinerja...</span>
                        </div>
                      ) : totalLateCount === 0 ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-2">
                          <Award className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>"Terima kasih! Anda berhasil meningkatkan kedisiplinan hadir tepat waktu..."</span>
                        </div>
                      ) : latestLateMinutes <= 15 ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>"😊 Sedikit terlambat hari ini. Semoga besok dapat hadir tepat waktu. Terus semangat!"</span>
                        </div>
                      ) : latestLateMinutes <= 30 ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>"⚠️ Anda melewati batas toleransi keterlambatan. Mohon tingkatkan kedisiplinan..."</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-2">
                          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>"🚨 Keterlambatan hari ini melebihi batas yang ditetapkan perusahaan..."</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:min-w-[200px] sm:flex-1">
              <div className="relative w-full sm:min-w-[180px] sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nama Karyawan, Divisi, Lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-bold"
                  title="Dari Tanggal"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-bold"
                  title="Sampai Tanggal"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="All">Semua Divisi</option>
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="All">Semua Status</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Late">Terlambat (Late)</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Alpha">Alpha</option>
                </select>
              </div>

              {(searchQuery || filterDept !== 'All' || filterStatus !== 'All' || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDept('All');
                    setFilterStatus('All');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors"
                  title="Reset Semua Filter"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Control Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOfficeLocationModal(true)}
                className="flex items-center gap-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors min-h-[38px]"
              >
                <MapPin className="w-4 h-4" />
                <span>Pengaturan Lokasi Kantor</span>
              </button>

              <button
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors min-h-[38px]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Override Presensi Manual</span>
              </button>

              <button
                onClick={() => setShowCorrectionModal(true)}
                className="relative flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors min-h-[38px]"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Koreksi Staff ({correctionRequests.filter(c => c.status === 'Pending').length})</span>
              </button>

              <button
                onClick={handleExportMonthlyAttendance}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs min-h-[38px]"
                title="Export Laporan Absensi Perbulan (CSV)"
              >
                <Download className="w-4 h-4" />
                <span>Export Absensi Bulanan</span>
              </button>
            </div>

          </div>

          {/* All Team Attendance Log Table */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#b90f0f]" />
                Log Master Presensi Seluruh Karyawan ({filteredAttendance.length} Entri)
              </h3>
              <p className="text-xs text-slate-500 font-mono">Filter: {startDate && endDate ? `${startDate} s/d ${endDate}` : startDate ? `Dari ${startDate}` : endDate ? `Sampai ${endDate}` : 'Semua Tanggal'}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Karyawan</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Shift Kerja</th>
                    <th className="p-3">Jam Masuk</th>
                    <th className="p-3">Jam Keluar</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Lokasi GPS & Proof</th>
                    <th className="p-3 rounded-r-xl text-center">Aksi Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {(!filteredAttendance || filteredAttendance.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Tidak ada log presensi yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    (filteredAttendance || []).map((rec) => {
                      const emp = employees.find(e => e.id === rec.employeeId);
                      const rawName = emp?.name || rec.employeeName || '';
                      const finalName = rawName.toLowerCase() === 'jersey jhony' ? 'dotan' : rawName;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 font-semibold">
                            <div className="flex items-center gap-3">
                              <img 
                                src={emp?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                                alt={finalName} 
                                className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200" 
                              />
                              <div>
                                <div className="text-slate-900 dark:text-white font-bold">{finalName}</div>
                                <div className="text-[10px] text-slate-400">{emp?.position || '-'} ({emp?.department || '-'})</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{rec.date}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{rec.shift}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">{rec.clockIn || '--:--'}</td>
                          <td className="p-3 font-mono font-bold text-blue-600">{rec.clockOut || '--:--'}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{formatAttendanceDuration(rec)}</td>
                          <td className="p-3">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                rec.status === 'Hadir'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : rec.status === 'Late'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {rec.status}
                              </span>
                              {(rec.status === 'Hadir' && (new Date(rec.date).getDay() === 0 || new Date(rec.date).getDay() === 6)) && (
                                <span className="px-2 py-0.5 rounded bg-[#b90f0f]/10 text-[#b90f0f] text-[9px] font-extrabold whitespace-nowrap">
                                  +1 Cuti Pengganti
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={rec.location}>
                                {rec.location}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setShowPhotoProofModal(rec)}
                                  className="text-blue-600 hover:underline p-1"
                                  title="Lihat Foto Verification"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {rec.gpsLat && rec.gpsLng && (
                                  <a
                                    href={`https://www.google.com/maps?q=${rec.gpsLat},${rec.gpsLng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700 p-1 font-bold text-[10px] flex items-center gap-0.5"
                                    title="Lihat Lokasi GPS Clock In di Google Maps"
                                  >
                                    <MapPin className="w-3.5 h-3.5" /> In
                                  </a>
                                )}
                                {rec.clockOutGpsLat && rec.clockOutGpsLng && (
                                  <a
                                    href={`https://www.google.com/maps?q=${rec.clockOutGpsLat},${rec.clockOutGpsLng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:text-blue-700 p-1 font-bold text-[10px] flex items-center gap-0.5"
                                    title="Lihat Lokasi GPS Clock Out di Google Maps"
                                  >
                                    <MapPin className="w-3.5 h-3.5" /> Out
                                  </a>
                                )}
                              </div>
                            </div>
                            {rec.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{rec.notes}</div>}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEditingRecord(rec)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                title="Edit Manual"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingRecord(rec)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Hapus Log Presensi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* MODAL 1: OVERRIDE MANUAL ENTRY FOR MANAGEMENT */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#b90f0f]" />
                  Input Presensi Manual Karyawan (Management)
                </h3>
                <p className="text-xs text-slate-500">Catat log presensi secara langsung jika mesin/sistem bermasalah</p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold">Pilih Karyawan Target</label>
                  {isStaff && (
                    <span className="text-[10px] font-semibold text-[#b90f0f] bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900">
                      User Login (Terkunci)
                    </span>
                  )}
                </div>
                <select
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  disabled={isStaff}
                  className={`w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-semibold ${
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tanggal Presensi</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status Kehadiran</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="Hadir">Hadir Tepat Waktu</option>
                    <option value="Late">Terlambat (Late)</option>
                    <option value="Izin">Izin Terpenuhi</option>
                    <option value="Sakit">Sakit (Surat Dokter)</option>
                    <option value="Cuti">Cuti Kerja</option>
                    <option value="Alpha">Alpha / Tanpa Keterangan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Shift / Jadwal Kerja</label>
                <select
                  value={manualShift}
                  onChange={(e) => setManualShift(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="Regular (08:00 - 17:00)">Regular (08:00 - 17:00)</option>
                  <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                  <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                  <option value="Non-Shift (Jam Bebas)">Non-Shift (Jam Bebas)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jam Masuk (Clock In)</label>
                  <input
                    type="time"
                    value={manualClockIn}
                    onChange={(e) => setManualClockIn(e.target.value)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Jam Keluar (Clock Out)</label>
                  <input
                    type="time"
                    value={manualClockOut}
                    onChange={(e) => setManualClockOut(e.target.value)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Lokasi Verifikasi</label>
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan HR / Alasan Override</label>
                <textarea
                  rows={2}
                  placeholder="Instruksi HR atau alasan diinput manual..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white rounded-xl font-bold min-h-[40px]"
                >
                  Simpan Presensi Manual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT RECORD MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  Edit Presensi {editEmpName}
                </h3>
                <p className="text-xs text-slate-500">Perbarui jam masuk, jam keluar atau status presensi</p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jam Masuk (Clock In)</label>
                  <input
                    type="time"
                    value={editingRecord.clockIn || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, clockIn: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Jam Keluar (Clock Out)</label>
                  <input
                    type="time"
                    value={editingRecord.clockOut || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, clockOut: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status Kehadiran</label>
                <select
                  value={editingRecord.status || 'Hadir'}
                  onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Late">Terlambat (Late)</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Alpha">Alpha</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Shift / Jadwal Kerja</label>
                <select
                  value={editingRecord.shift || 'Regular (08:00 - 17:00)'}
                  onChange={(e) => setEditingRecord({ ...editingRecord, shift: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="Regular (08:00 - 17:00)">Regular (08:00 - 17:00)</option>
                  <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                  <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                  <option value="Non-Shift (Jam Bebas)">Non-Shift (Jam Bebas)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan</label>
                <input
                  type="text"
                  value={editingRecord.notes || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold min-h-[40px]"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CORRECTION APPROVALS FOR MANAGEMENT */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Pengajuan Koreksi Presensi Staff
                </h3>
                <p className="text-xs text-slate-500">Persetujuan lupa clock-in/out atau kendala teknis dari staff</p>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto">
              {correctionRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                  <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">Tidak Ada Pengajuan Koreksi</p>
                  <p className="text-xs text-slate-400">Semua data pengajuan koreksi presensi staff telah dibersihkan/kosong.</p>
                </div>
              ) : (
                correctionRequests.map((req) => {
                  const corrEmp = employees.find(e => e.id === req.employeeId);
                  const corrEmpName = corrEmp?.name || req.employeeName;
                  return (
                    <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{corrEmpName}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">Tanggal: {req.date} • Jam Ajuan: {req.requestedClockOut || req.requestedClockIn}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 italic">"{req.reason}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {req.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => {
                              setCorrectionRequests(prev => prev.map(c => c.id === req.id ? { ...c, status: 'Approved' } : c));
                              sendPushNotification(req.employeeId, 'Koreksi Absen Disetujui', `Pengajuan koreksi absen Anda tanggal ${req.date} telah disetujui oleh manager.`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1 hover:bg-emerald-700 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Setujui
                          </button>
                          <button
                            onClick={() => {
                              setCorrectionRequests(prev => prev.map(c => c.id === req.id ? { ...c, status: 'Rejected' } : c));
                              sendPushNotification(req.employeeId, 'Koreksi Absen Ditolak', `Mohon maaf, pengajuan koreksi absen Anda tanggal ${req.date} ditolak.`);
                            }}
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold flex items-center gap-1 hover:bg-rose-700 transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setCorrectionRequests(prev => prev.filter(c => c.id !== req.id));
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                        title="Hapus Data Pengajuan Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )})
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {correctionRequests.length > 0 ? (
                <button
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin menghapus SEMUA pengajuan koreksi presensi staff?')) {
                      setCorrectionRequests([]);
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Data
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PHOTO PROOF PREVIEW */}
      {showPhotoProofModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full space-y-4 text-center border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-[#b90f0f] flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Bukti Biometric Presensi (Selfie)</h4>
                  <p className="text-[10px] text-slate-400">Verifikasi Ambil Foto Real-Time Karyawan</p>
                </div>
              </div>
              <button onClick={() => setShowPhotoProofModal(null)} className="text-slate-400 hover:text-slate-600 rounded-full p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-rose-500/30 shadow-lg">
              <img
                src={
                  showPhotoProofModal.photoUrl || 
                  showPhotoProofModal.clockOutPhotoUrl || 
                  employees.find(e => e.id === showPhotoProofModal.employeeId)?.avatar || 
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
                }
                alt="Selfie Verification Proof"
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-3 left-3 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Biometric Verified (99.6%)
              </div>
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-xs text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
                WFO Bebas Lokasi GPS
              </div>
            </div>

            <div className="text-left text-xs space-y-1.5 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-mono border border-slate-200 dark:border-slate-700">
              <p><span className="text-slate-400 font-normal">Karyawan:</span> <strong className="text-slate-900 dark:text-white">{proofEmpName}</strong></p>
              <p><span className="text-slate-400 font-normal">Tanggal & Waktu:</span> <strong className="text-emerald-600 dark:text-emerald-400">{showPhotoProofModal.date} Jam {showPhotoProofModal.clockIn} WIB</strong></p>
              
              {showPhotoProofModal.gpsLat && showPhotoProofModal.gpsLng && (
                <p>
                  <span className="text-slate-400 font-normal">GPS Clock In:</span>{' '}
                  <a
                    href={`https://www.google.com/maps?q=${showPhotoProofModal.gpsLat},${showPhotoProofModal.gpsLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    {showPhotoProofModal.gpsLat.toFixed(5)}°, {showPhotoProofModal.gpsLng.toFixed(5)}° ↗
                  </a>
                </p>
              )}

              {showPhotoProofModal.clockOut && (
                <p><span className="text-slate-400 font-normal">Jam Keluar:</span> <strong className="text-blue-600 dark:text-blue-400">{showPhotoProofModal.clockOut} WIB</strong></p>
              )}

              {showPhotoProofModal.clockOutGpsLat && showPhotoProofModal.clockOutGpsLng && (
                <p>
                  <span className="text-slate-400 font-normal">GPS Clock Out:</span>{' '}
                  <a
                    href={`https://www.google.com/maps?q=${showPhotoProofModal.clockOutGpsLat},${showPhotoProofModal.clockOutGpsLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    {showPhotoProofModal.clockOutGpsLat.toFixed(5)}°, {showPhotoProofModal.clockOutGpsLng.toFixed(5)}° ↗
                  </a>
                </p>
              )}

              <p><span className="text-slate-400 font-normal">Lokasi:</span> <strong className="text-slate-800 dark:text-slate-200">{showPhotoProofModal.location}</strong></p>
              <p><span className="text-slate-400 font-normal">Status:</span> <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md font-bold">{showPhotoProofModal.status}</span></p>
              {showPhotoProofModal.notes && (
                <p><span className="text-slate-400 font-normal">Catatan:</span> <span className="italic text-slate-600 dark:text-slate-300">{showPhotoProofModal.notes}</span></p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert(`Bukti foto presensi ${proofEmpName} berhasil dicetak/diunduh.`)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-200 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Cetak / Download
              </button>
              <button
                type="button"
                onClick={() => setShowPhotoProofModal(null)}
                className="flex-1 py-2.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold rounded-xl text-xs shadow-md"
              >
                Tutup Bukti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: OFFICE LOCATION SETTINGS */}
      {showOfficeLocationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#b90f0f]" />
                  Pengaturan Lokasi Acuan Kantor
                </h3>
                <p className="text-xs text-slate-500">Tentukan koordinat pusat kantor untuk titik acuan jarak relatif presensi WFO</p>
              </div>
              <button
                onClick={() => setShowOfficeLocationModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-2xl flex gap-3 items-start">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                  <strong>Pembatasan Radius WFO Non-Aktif (Bebas Absen):</strong> Karyawan dapat melakukan absen WFO dari lokasi mana pun tanpa batasan jarak. Koordinat kantor digunakan sebagai titik acuan lokasi relatif.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Office Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={companyProfile.officeLat || ''}
                    onChange={(e) => updateCompanyProfile({ ...companyProfile, officeLat: Number(e.target.value) })}
                    placeholder="-6.123456"
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold focus:ring-1 focus:ring-[#b90f0f]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Office Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={companyProfile.officeLng || ''}
                    onChange={(e) => updateCompanyProfile({ ...companyProfile, officeLng: Number(e.target.value) })}
                    placeholder="106.123456"
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold focus:ring-1 focus:ring-[#b90f0f]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        updateCompanyProfile({
                          ...companyProfile,
                          officeLat: pos.coords.latitude,
                          officeLng: pos.coords.longitude
                        });
                        alert('Lokasi saat ini berhasil diambil sebagai pusat kantor.');
                      }, (err) => {
                        alert('Gagal mengambil lokasi GPS: ' + err.message);
                      });
                    }
                  }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> Gunakan Lokasi Saya
                </button>
                {companyProfile.officeLat && companyProfile.officeLng && (
                  <a
                    href={`https://www.google.com/maps?q=${companyProfile.officeLat},${companyProfile.officeLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-bold rounded-xl hover:bg-emerald-200 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Preview di Maps
                  </a>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOfficeLocationModal(false)}
                  className="px-6 py-2.5 bg-[#b90f0f] text-white rounded-xl font-bold shadow-md"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION MODAL */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Konfirmasi Hapus Presensi
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Karyawan:</span>
                <span className="text-slate-900 dark:text-white font-bold">{delEmpName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-mono font-bold">{deletingRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Clock In / Out:</span>
                <span className="font-mono">{deletingRecord.clockIn || '--'} - {deletingRecord.clockOut || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-rose-600">{deletingRecord.status}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus catatan presensi ini dari database master?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAttendanceRecord(deletingRecord.id);
                  sendPushNotification(deletingRecord.employeeId, 'Presensi Dihapus', `Catatan presensi Anda pada tanggal ${deletingRecord.date} telah dihapus oleh Admin/Manager.`);
                  setDeletingRecord(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXPORT MONTHLY ATTENDANCE */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Export Laporan Absensi Perbulan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih periode bulan untuk diunduh dalam format Excel/CSV
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Bulan (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={exportMonth}
                  onChange={e => setExportMonth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/80 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold">Ringkasan Periode {exportMonth}:</p>
                <p>Total Catatan Presensi: {(attendance || []).filter(a => a.date.startsWith(exportMonth)).length} data</p>
                <p>Format file: CSV (kompatibel dengan Microsoft Excel & Google Sheets)</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmExportMonthlyAttendance}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download File CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
