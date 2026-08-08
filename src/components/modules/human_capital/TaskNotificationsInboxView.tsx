import React, { useState } from 'react';
import { useERP } from '../../../context/ERPContext';
import { 
  Mail, Sparkles, TrendingUp, Calendar, Clock, 
  AlertTriangle, CheckCircle2, XCircle, Send, 
  ExternalLink, FileText, User, Award, Bell, Check, ListTodo
} from 'lucide-react';

export const TaskNotificationsInboxView: React.FC = () => {
  const { 
    kpiTasks, employees, currentUser, submitKPITask, isStaff: ctxIsStaff 
  } = useERP();

  // Determine if the current user is a staff or admin/manager
  const isStaff = ctxIsStaff || currentUser?.role === 'Staff' || currentUser?.role === 'Employee';

  // State to simulate or select which employee's inbox to view (Admin/Manager can switch)
  const loggedInEmployee = employees.find(
    e => e.id === currentUser?.id || 
         e.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
         e.name?.toLowerCase().includes(currentUser?.name?.toLowerCase() || '')
  ) || employees[0];

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    isStaff && loggedInEmployee ? loggedInEmployee.id : (employees[0]?.id || '')
  );

  const activeEmployee = employees.find(e => e.id === selectedStaffId) || loggedInEmployee;

  // Active Tab: 'notifications' (Kotak Pesan) | 'task_management' (Daftar Tugas KPI)
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'task_management'>('notifications');

  // Filter tasks belonging to the active employee
  const activeEmployeeTasks = kpiTasks.filter(t => t.employeeId === activeEmployee?.id);

  // Filter tasks belonging to the active employee for the standard month ('Juli 2026') to align with KPI & OKR Management dashboard
  const activeEmployeeTasksForMonth = kpiTasks.filter(
    t => t.employeeId === activeEmployee?.id && t.month === 'Juli 2026'
  );

  // Calculate dynamic KPI Progress average based on all scored tasks in Juli 2026 to align with KPI & OKR Management dashboard card
  const scoredTasksForMonth = activeEmployeeTasksForMonth.filter(t => t.score !== undefined);
  const calculatedAvg = scoredTasksForMonth.length > 0
    ? Math.round(scoredTasksForMonth.reduce((sum, t) => sum + (t.score || 0), 0) / scoredTasksForMonth.length)
    : 0;

  // KPI notification type determination
  const getKpiNotificationType = (avg: number) => {
    if (scoredTasksForMonth.length === 0) return 'no_data';
    if (avg === 100) return '100';
    if (avg > 100) return 'di_atas';
    if (avg >= 80) return 'sesuai';
    if (avg >= 60) return 'menurun';
    return 'jauh';
  };

  const kpiNotifType = getKpiNotificationType(calculatedAvg);

  // Helper to parse dates and calculate remaining days
  const getDaysRemaining = (dueDateStr: string): number => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0,0,0,0);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Generate notifications list dynamically based on the employee's actual tasks
  const generatedNotifications = activeEmployeeTasks.map(task => {
    const daysLeft = getDaysRemaining(task.dueDate);
    let type: 'baru' | 'h3' | 'besok' | 'hari_ini' | 'terlambat' | 'selesai' = 'baru';
    let title = '';
    let message = '';
    let colorClass = '';
    let icon = <Bell className="w-4 h-4" />;

    if (task.status === 'Approved') {
      type = 'selesai';
      title = '🎉 Tugas Selesai';
      message = `Selamat! Tugas "${task.title}" berhasil diselesaikan. Terima kasih atas dedikasi dan kerja keras Anda.`;
      colorClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200';
      icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    } else if (task.status === 'Overdue' || (task.status === 'Pending' && daysLeft < 0)) {
      type = 'terlambat';
      title = '📅 Tugas Terlambat';
      message = `Tugas "${task.title}" telah melewati batas waktu. Mohon segera selesaikan dan berikan pembaruan progres kepada atasan.`;
      colorClass = 'border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200';
      icon = <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
    } else if (daysLeft === 0) {
      type = 'hari_ini';
      title = '🔴 Deadline Hari Ini';
      message = `Hari ini adalah batas akhir tugas "${task.title}". Segera selesaikan agar target tetap tercapai.`;
      colorClass = 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200';
      icon = <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    } else if (daysLeft === 1) {
      type = 'besok';
      title = '🟠 Deadline Besok';
      message = `Pengingat! Tugas "${task.title}" harus diselesaikan besok. Mari selesaikan tepat waktu.`;
      colorClass = 'border-orange-500/30 bg-orange-500/10 text-orange-900 dark:text-orange-200';
      icon = <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    } else if (daysLeft <= 3 && daysLeft > 1) {
      type = 'h3';
      title = '🟡 Deadline H-3';
      message = `Tugas "${task.title}" akan jatuh tempo dalam ${daysLeft} hari. Pastikan progres berjalan sesuai rencana.`;
      colorClass = 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200';
      icon = <Clock className="w-4 h-4 text-amber-500 dark:text-amber-300" />;
    } else {
      type = 'baru';
      title = '🟢 Tugas Baru';
      message = `📌 Anda mendapatkan tugas baru. Silakan tinjau detailnya dan susun prioritas pekerjaan Anda. (Detail: ${task.title})`;
      colorClass = 'border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200';
      icon = <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }

    return {
      id: task.id,
      taskTitle: task.title,
      type,
      title,
      message,
      colorClass,
      icon,
      dueDate: task.dueDate,
      month: task.month,
      week: task.week,
      weight: task.weight,
      status: task.status,
      score: task.score,
      reviewNotes: task.reviewNotes,
      reviewedBy: task.reviewedBy
    };
  });

  // State for submitting proof of a task inside this view
  const [submissionTaskId, setSubmissionTaskId] = useState<string | null>(null);
  const [submissionForm, setSubmissionForm] = useState({
    proofLink: '',
    notes: '',
    fileName: 'Bukti_Pekerjaan_Jerjhon.pdf',
    fileSize: '1.2 MB',
    fileType: 'pdf'
  });

  const handleOpenSubmission = (taskId: string) => {
    setSubmissionTaskId(taskId);
    setSubmissionForm({
      proofLink: '',
      notes: '',
      fileName: 'Bukti_Pekerjaan_Staff.pdf',
      fileSize: '1.4 MB',
      fileType: 'pdf'
    });
  };

  const handleSubmittingProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionTaskId) return;

    submitKPITask(submissionTaskId, {
      fileName: submissionForm.fileName,
      fileSize: submissionForm.fileSize,
      fileType: submissionForm.fileType,
      proofLink: submissionForm.proofLink || 'https://drive.google.com/drive/my-drive',
      notes: submissionForm.notes,
      submittedAt: new Date().toISOString()
    });

    setSubmissionTaskId(null);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
              <Mail className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Kotak Pesan & Notifikasi Tugas
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Pusat notifikasi pengingat tenggat waktu, pembagian tugas baru, dan umpan balik progress penilaian KPI langsung dari pimpinan.
          </p>
        </div>

        {/* Employee Simulator Dropdown (Visible only for non-staff, or for testing/simulation) */}
        {!isStaff && (
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Simulasi Inbox Karyawan:
            </span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-1.5 font-bold border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  👤 {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>
        )}

        {isStaff && activeEmployee && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold shrink-0">
            <User className="w-4 h-4" />
            <span>Karyawan Aktif: {activeEmployee.name} ({activeEmployee.department})</span>
          </div>
        )}
      </div>

      {/* KPI Progress Dynamic Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Tugas KPI Anda</span>
              <span className="p-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-black">
                {activeEmployeeTasksForMonth.length}
              </span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {activeEmployeeTasksForMonth.filter(t => t.status === 'Approved').length} / {activeEmployeeTasksForMonth.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Tugas berhasil disetujui & dinilai</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2 justify-between text-[11px]">
            <span className="text-slate-500">Menunggu Review:</span>
            <span className="font-bold text-amber-500">{activeEmployeeTasksForMonth.filter(t => t.status === 'Submitted').length} Tugas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rata-rata Nilai KPI</span>
              <span className="p-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-black">
                {calculatedAvg} / 100
              </span>
            </div>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {calculatedAvg}%
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Umpan balik dari pimpinan aktif</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2 justify-between text-[11px]">
            <span className="text-slate-500">Predikat Kinerja:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {calculatedAvg >= 100 ? 'Istimewa' : calculatedAvg >= 80 ? 'Sangat Baik' : calculatedAvg >= 60 ? 'Cukup' : 'Kurang'}
            </span>
          </div>
        </div>

        {/* Dynamic KPI Status Reminder Box */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between md:col-span-1">
          <div>
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status Capaian KPI</span>
            </div>
            {scoredTasksForMonth.length === 0 ? (
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl text-[11px] text-slate-500">
                Belum ada data nilai KPI yang disetujui untuk dinilai.
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl border text-[11px] font-bold transition-all shadow-xs bg-slate-50 dark:bg-slate-900/50">
                {kpiNotifType === 'di_atas' && (
                  <div className="text-emerald-800 dark:text-emerald-200 space-y-1">
                    <div className="font-extrabold flex items-center gap-1">
                      <span>🟢 KPI Di Atas Target</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">
                      🌟 Luar biasa! Pencapaian KPI Anda saat ini mencapai {calculatedAvg}%, melampaui target yang ditetapkan.
                    </p>
                  </div>
                )}
                {kpiNotifType === 'sesuai' && (
                  <div className="text-teal-800 dark:text-teal-200 space-y-1">
                    <div className="font-extrabold flex items-center gap-1">
                      <span>🟢 KPI Sesuai Target</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">
                      ✅ Anda berada di jalur yang tepat. Pertahankan performa agar target tetap tercapai hingga akhir periode.
                    </p>
                  </div>
                )}
                {kpiNotifType === 'menurun' && (
                  <div className="text-amber-800 dark:text-amber-200 space-y-1">
                    <div className="font-extrabold flex items-center gap-1">
                      <span>🟡 KPI Mulai Menurun</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">
                      📉 Performa KPI mulai berada di bawah target. Masih ada waktu untuk mengejar dan meningkatkan hasil.
                    </p>
                  </div>
                )}
                {kpiNotifType === 'jauh' && (
                  <div className="text-rose-800 dark:text-rose-200 space-y-1">
                    <div className="font-extrabold flex items-center gap-1">
                      <span>🔴 KPI Jauh dari Target</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">
                      🚨 KPI Anda berada di bawah target. Mari evaluasi prioritas dan fokus pada aktivitas yang memberikan dampak terbesar.
                    </p>
                  </div>
                )}
                {kpiNotifType === '100' && (
                  <div className="text-blue-800 dark:text-blue-200 space-y-1">
                    <div className="font-extrabold flex items-center gap-1">
                      <span>🏆 KPI 100%</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">
                      🏅 Selamat! Anda berhasil mencapai target KPI 100%. Terima kasih atas kontribusi luar biasa Anda.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">Dihitung otomatis dari nilai tugas Anda</div>
        </div>
      </div>

      {/* Tabs Navigation inside Inbox */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-black border-b-2 transition-all shrink-0 whitespace-nowrap ${
            activeSubTab === 'notifications'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Kotak Pesan Pengingat ({generatedNotifications.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('task_management')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-black border-b-2 transition-all shrink-0 whitespace-nowrap ${
            activeSubTab === 'task_management'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Task Management ({activeEmployeeTasks.length} Tugas)</span>
        </button>
      </div>

      {/* Main Content Pane */}
      {activeSubTab === 'notifications' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-600" />
              Notifikasi Pengingat Tugas Masuk
            </h2>

            {generatedNotifications.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Tidak Ada Notifikasi Baru</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Semua tugas Anda terorganisir dengan baik. Pimpinan belum menetapkan tugas KPI baru atau pengingat batas waktu saat ini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedNotifications.map((notif, idx) => (
                  <div 
                    key={notif.id + '_' + idx} 
                    className={`p-5 rounded-2xl border transition-all hover:translate-x-1 duration-200 flex flex-col md:flex-row gap-4 items-start ${notif.colorClass}`}
                  >
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xs self-start shrink-0">
                      {notif.icon}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-black tracking-tight">{notif.title}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-white/50 dark:bg-slate-950/20 px-2 py-0.5 rounded-lg border border-black/5">
                          <Calendar className="w-3 h-3" />
                          <span>Deadline: {notif.dueDate}</span>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed font-semibold">
                        {notif.message}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500 border-t border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <span>📅 {notif.month} ({notif.week})</span>
                          <span>•</span>
                          <span>⚖️ Bobot KPI: {notif.weight}%</span>
                        </div>

                        {notif.score !== undefined && (
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>Nilai: {notif.score} ({notif.scoreLabel || 'Selesai'})</span>
                          </div>
                        )}
                      </div>

                      {/* Display reviewer feedback if task was approved/declined */}
                      {notif.reviewNotes && (
                        <div className="mt-2 p-3 bg-white/80 dark:bg-slate-900/50 rounded-xl border border-black/5 text-[11px] leading-relaxed italic text-slate-600 dark:text-slate-300">
                          <strong className="font-black not-italic text-slate-800 dark:text-slate-200 block mb-0.5">Catatan Review dari {notif.reviewedBy || 'Manager'}:</strong>
                          "{notif.reviewNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Task Management Tab with full functionality, inline with user's instructions */
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-rose-600" />
              Daftar Tugas KPI Aktif Anda
            </h2>
            <span className="text-[11px] text-slate-400">Hubungkan penyelesaian tugas dengan skor penilaian KPI</span>
          </div>

          {activeEmployeeTasks.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <ListTodo className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Belum Ada Tugas Ditugaskan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Admin atau Manager belum memberikan tugas penilaian KPI khusus untuk periode ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeEmployeeTasks.map((task) => {
                const daysLeft = getDaysRemaining(task.dueDate);
                return (
                  <div 
                    key={task.id}
                    className="p-5 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-white">
                          {task.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          task.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          task.status === 'Submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                          task.status === 'Declined' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                          daysLeft < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {task.status === 'Approved' ? '✅ Selesai & Dinilai' :
                           task.status === 'Submitted' ? '⏳ Menunggu Review' :
                           task.status === 'Declined' ? '❌ Perlu Perbaikan' :
                           daysLeft < 0 ? '🚨 Terlambat' : '🟢 Sedang Berjalan'}
                        </span>

                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          Bobot: {task.weight}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Tenggat Waktu:</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">{task.dueDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Sisa Hari:</span>
                        <strong className={`font-bold ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {daysLeft < 0 ? `Terlambat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari lagi`}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Periode Penilaian:</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">{task.month} - {task.week}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Skor Penilaian KPI:</span>
                        <strong className="text-rose-600 dark:text-rose-400 font-black text-xs">
                          {task.score !== undefined ? `${task.score} / 100` : '-'}
                        </strong>
                      </div>
                    </div>

                    {/* Submission / Review Notes */}
                    {task.status === 'Approved' && task.reviewNotes && (
                      <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                        <strong className="font-extrabold text-emerald-800 dark:text-emerald-300 block mb-1">Catatan Pimpinan ({task.reviewedBy}):</strong>
                        "{task.reviewNotes}"
                      </div>
                    )}

                    {task.submission && (
                      <div className="bg-slate-100/50 dark:bg-slate-900/50 p-3.5 rounded-xl text-[11px] space-y-1.5 border border-slate-200/40 dark:border-slate-800/60">
                        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-1 mb-1">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">Bukti Pengiriman Pekerjaan:</span>
                          <span className="text-[10px] text-slate-400">{task.submission.submittedAt ? new Date(task.submission.submittedAt).toLocaleDateString('id-ID') : ''}</span>
                        </div>
                        <p className="font-medium text-slate-600 dark:text-slate-300">
                          <strong>Keterangan:</strong> "{task.submission.notes || 'Tidak ada catatan'}"
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {task.submission.fileName} ({task.submission.fileSize})
                          </span>
                          {task.submission.proofLink && (
                            <a 
                              href={task.submission.proofLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Link Bukti
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons to submit work */}
                    {task.status !== 'Approved' && task.status !== 'Submitted' && (
                      <div className="flex justify-end pt-1">
                        {submissionTaskId === task.id ? (
                          <form onSubmit={handleSubmittingProof} className="w-full bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <label className="block font-bold text-slate-700 dark:text-slate-300">Link Bukti Pekerjaan (Google Drive / GitHub / DLL)</label>
                                <input 
                                  type="url" 
                                  required
                                  placeholder="https://drive.google.com/..." 
                                  value={submissionForm.proofLink}
                                  onChange={(e) => setSubmissionForm({...submissionForm, proofLink: e.target.value})}
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block font-bold text-slate-700 dark:text-slate-300">File Dokumen Pendukung (Simulasi)</label>
                                <input 
                                  type="text" 
                                  required
                                  value={submissionForm.fileName}
                                  onChange={(e) => setSubmissionForm({...submissionForm, fileName: e.target.value})}
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                                />
                              </div>
                            </div>

                            <div className="space-y-1 text-xs">
                              <label className="block font-bold text-slate-700 dark:text-slate-300">Catatan Tambahan untuk Atasan</label>
                              <textarea 
                                rows={2}
                                required
                                placeholder="Jelaskan progres pekerjaan Anda secara ringkas..."
                                value={submissionForm.notes}
                                onChange={(e) => setSubmissionForm({...submissionForm, notes: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs resize-none"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 text-xs">
                              <button 
                                type="button"
                                onClick={() => setSubmissionTaskId(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-xl font-bold"
                              >
                                Batal
                              </button>
                              <button 
                                type="submit"
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm shadow-rose-200 dark:shadow-none"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Kirim Bukti Pekerjaan</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => handleOpenSubmission(task.id)}
                            className="bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-rose-100 dark:shadow-none"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim Bukti Tugas</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
