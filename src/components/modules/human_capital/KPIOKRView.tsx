import React, { useState, useMemo } from 'react';
import {
  Award, Target, Plus, TrendingUp, CheckCircle2, FileText, Upload, Clock,
  AlertCircle, Check, X, FileSpreadsheet, ExternalLink, Eye, Star, UserCheck,
  Calendar, Filter, BarChart3, Search, Trash2, ArrowUpRight, ChevronRight,
  ShieldAlert, RefreshCw, FileImage, PieChart as PieChartIcon, Download, Info, Printer
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, ReferenceLine, PieChart, Pie, Cell
} from 'recharts';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { KPITask, KPITaskSubmission } from '../../../types';
import { OKRQuarterProgressChart } from './OKRQuarterProgressChart';
import { StaffQuarterlyPerformanceChart } from './StaffQuarterlyPerformanceChart';
import { printKPIReportPDF } from '../../../utils/exportUtils';

export function getTaskWeight(
  task: { employeeId: string; month: string; week: string },
  allTasks: Array<{ employeeId: string; month: string; week: string }>
): number {
  const sameWeekTasks = allTasks.filter(t =>
    t.employeeId === task.employeeId &&
    t.month === task.month &&
    t.week === task.week
  );
  const count = sameWeekTasks.length || 1;
  const weight = 100 / count;
  return Number(weight.toFixed(1));
}

export const KPIOKRView: React.FC = () => {
  const {
    kpis, okrs, employees, kpiTasks, addKPITask, submitKPITask,
    reviewKPITask, deleteKPITask, addAuditLog, currentUser, isStaff
  } = useERP();
  if (!currentUser) return null;

  // Active view tab
  const [activeTab, setActiveTab] = useState<'tasks' | 'accumulation' | 'trends' | 'okr' | 'manager_review' | 'assignees'>('tasks');
  const [managerReviewSelectedId, setManagerReviewSelectedId] = useState<string | null>(null);

  // Visual Trends State
  const [trendPeriodType, setTrendPeriodType] = useState<'last6' | 'custom'>('last6');
  const [trendStartDate, setTrendStartDate] = useState<string>('2026-02-01');
  const [trendEndDate, setTrendEndDate] = useState<string>('2026-07-26');
  const [trendSelectedStaffId, setTrendSelectedStaffId] = useState<string>('All');
  const [trendSelectedDept, setTrendSelectedDept] = useState<string>('All');

  // Role simulator: Manager vs Staff
  const loggedInEmployee = employees.find(
    e => e.id === currentUser.id || 
         e.email.toLowerCase() === currentUser.email.toLowerCase() ||
         e.name.toLowerCase().includes(currentUser.name.toLowerCase())
  );
  const userRole = isStaff ? 'Staff' : 'Manager';
  const selectedStaffId = loggedInEmployee?.id || 'EMP-1004';

  // Filters
  const [filterMonth, setFilterMonth] = useState<string>('Juli 2026');
  const [filterWeek, setFilterWeek] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KPITask | null>(null);
  const [inspectingTaskProof, setInspectingTaskProof] = useState<KPITask | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState<boolean>(false);
  const [selectedDetailEmployeeId, setSelectedDetailEmployeeId] = useState<string | null>(null);
  const [selectedReportEmployeeId, setSelectedReportEmployeeId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // New Task Form State
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    employeeId: employees[0]?.id || 'EMP-1004',
    department: employees[0]?.department || 'Marketing',
    month: 'Juli 2026',
    week: 'Minggu 1' as 'Minggu 1' | 'Minggu 2' | 'Minggu 3' | 'Minggu 4' | 'Minggu 5',
    weight: 25,
    dueDate: new Date().toISOString().substring(0, 10)
  });

  // Submission Form State
  const [submissionForm, setSubmissionForm] = useState({
    fileName: '',
    fileSize: '',
    fileType: 'pdf',
    proofLink: '',
    notes: '',
    isSimulatingUpload: false
  });

  // KPI Notification Simulator state
  const [kpiNotifType, setKpiNotifType] = useState<'di_atas' | 'sesuai' | 'menurun' | 'jauh' | '100'>('di_atas');
  const [kpiPersentaseInput, setKpiPersentaseInput] = useState(115);

  // Review Form State
  const [reviewForm, setReviewForm] = useState<{
    score: number;
    scorePreset: 100 | 85 | 70 | 50 | 0;
    scoreLabel: string;
    reviewNotes: string;
    status: 'Approved' | 'Declined';
  }>({
    score: 100,
    scorePreset: 100,
    scoreLabel: '100 - Pekerjaan berhasil & sesuai ekspektasi',
    reviewNotes: '',
    status: 'Approved'
  });

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return kpiTasks.filter(task => {
      // Role constraint if staff
      if (isStaff) {
        if (task.employeeId !== loggedInEmployee?.id) return false;
      } else if (userRole === 'Staff' && task.employeeId !== selectedStaffId) {
        // simulation mode for manager
        return false;
      }
      if (filterMonth !== 'All' && task.month !== filterMonth) return false;
      if (filterWeek !== 'All' && task.week !== filterWeek) return false;
      if (filterStatus !== 'All' && task.status !== filterStatus) return false;
      if (filterDept !== 'All' && task.department !== filterDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(q) ||
          task.employeeName.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [kpiTasks, userRole, selectedStaffId, filterMonth, filterWeek, filterStatus, filterDept, searchQuery]);

  // =========================================================================
  // ANALYTICAL MEMO CALCULATIONS FOR VISUAL PERFORMANCE TRENDS & KPI DASHBOARD
  // =========================================================================

  // Helper to generate deterministic score based on string seed
  const getDeterministicTrendScore = (seed: string, monthIndex: number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const diff = (Math.abs(hash + monthIndex * 31) % 22) - 12;
    return diff;
  };

  // 1. Core Performance Trend Chart Data
  const trendChartData = useMemo(() => {
    const months = ['Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli'];
    
    const staffBaselines: Record<string, { name: string; dept: string; julyAvg: number }> = {};
    employees.forEach(emp => {
      const empTasks = kpiTasks.filter(t => t.employeeId === emp.id);
      const gradedTasks = empTasks.filter(t => t.score !== undefined);
      const avg = gradedTasks.length > 0 
        ? gradedTasks.reduce((acc, t) => acc + (t.score || 0), 0) / gradedTasks.length 
        : 82;
      staffBaselines[emp.id] = {
        name: emp.name,
        dept: emp.department,
        julyAvg: Math.round(avg)
      };
    });

    if (trendPeriodType === 'last6') {
      return months.map((m, idx) => {
        const item: any = { period: `${m} 2026` };
        
        const targetEmployees = employees.filter(emp => {
          const matchDept = trendSelectedDept === 'All' || emp.department === trendSelectedDept;
          const matchStaff = trendSelectedStaffId === 'All' || emp.id === trendSelectedStaffId;
          return matchDept && matchStaff;
        });

        if (targetEmployees.length === 0) {
          item.Skor = 0;
          return item;
        }

        let sum = 0;
        targetEmployees.forEach(emp => {
          const baseline = staffBaselines[emp.id]?.julyAvg || 82;
          if (idx === 5) {
            sum += baseline;
          } else {
            const monthDiff = getDeterministicTrendScore(emp.id, idx);
            const scoreVal = Math.min(100, Math.max(60, baseline + monthDiff - (5 - idx) * 1.5));
            sum += scoreVal;
          }
        });

        item.Skor = Math.round(sum / targetEmployees.length);
        return item;
      });
    } else {
      const start = new Date(trendStartDate);
      const end = new Date(trendEndDate);
      
      const filtered = kpiTasks.filter(t => {
        if (!t.dueDate) return false;
        const taskDate = new Date(t.dueDate);
        const matchDate = taskDate >= start && taskDate <= end;
        
        const emp = employees.find(e => e.id === t.employeeId);
        const matchDept = trendSelectedDept === 'All' || (emp && emp.department === trendSelectedDept) || t.department === trendSelectedDept;
        const matchStaff = trendSelectedStaffId === 'All' || t.employeeId === trendSelectedStaffId;
        
        return matchDate && matchDept && matchStaff;
      });

      const dateMap = new Map<string, { totalScore: number; count: number }>();
      filtered.forEach(t => {
        if (t.score !== undefined) {
          const existing = dateMap.get(t.dueDate) || { totalScore: 0, count: 0 };
          dateMap.set(t.dueDate, {
            totalScore: existing.totalScore + t.score,
            count: existing.count + 1
          });
        }
      });

      const sortedDates = Array.from(dateMap.keys()).sort();
      if (sortedDates.length === 0) {
        return [
          { period: trendStartDate, Skor: 0 },
          { period: trendEndDate, Skor: 0 }
        ];
      }

      return sortedDates.map(date => {
        const data = dateMap.get(date)!;
        return {
          period: date,
          Skor: Math.round(data.totalScore / data.count)
        };
      });
    }
  }, [trendPeriodType, trendStartDate, trendEndDate, trendSelectedStaffId, trendSelectedDept, kpiTasks, employees]);

  // 2. Department Comparison Data
  const departmentTrendData = useMemo(() => {
    const depts = Array.from(new Set((employees || []).map(e => e.department || 'General')));
    return depts.map(dept => {
      const deptEmployees = (employees || []).filter(e => (e.department || 'General') === dept);
      let totalScore = 0;
      let count = 0;
      
      deptEmployees.forEach(emp => {
        const empTasks = (kpiTasks || []).filter(t => t.employeeId === emp.id && t.score !== undefined);
        if (empTasks.length > 0) {
          totalScore += empTasks.reduce((acc, t) => acc + (t.score || 0), 0) / empTasks.length;
          count++;
        } else {
          totalScore += 0;
          count++;
        }
      });
      
      const avgScore = count > 0 ? Math.round(totalScore / count) : 0;
      return {
        department: dept,
        Skor: avgScore,
        Target: 80
      };
    });
  }, [employees, kpiTasks]);

  // 3. Task Status Distribution Pie Chart Data
  const taskStatusSummary = useMemo(() => {
    const filtered = kpiTasks.filter(t => {
      const emp = employees.find(e => e.id === t.employeeId);
      const matchDept = trendSelectedDept === 'All' || (emp && emp.department === trendSelectedDept) || t.department === trendSelectedDept;
      const matchStaff = trendSelectedStaffId === 'All' || t.employeeId === trendSelectedStaffId;
      return matchDept && matchStaff;
    });

    const counts = { Approved: 0, Pending: 0, Submitted: 0, Declined: 0, Overdue: 0 };
    filtered.forEach(t => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });

    return [
      { name: 'Disetujui', value: counts.Approved || 4, color: '#10b981' },
      { name: 'Belum Dikerjakan', value: counts.Pending || 2, color: '#f59e0b' },
      { name: 'Menunggu Review', value: counts.Submitted || 1, color: '#3b82f6' },
      { name: 'Ditolak', value: counts.Declined || 0, color: '#ef4444' },
      { name: 'Terlambat', value: counts.Overdue || 0, color: '#64748b' }
    ].filter(item => item.value > 0);
  }, [kpiTasks, trendSelectedDept, trendSelectedStaffId, employees]);

  // 4. Executive Summary KPI Metrics Cards
  const trendSummaryMetrics = useMemo(() => {
    const targetEmployees = employees.filter(emp => {
      const matchDept = trendSelectedDept === 'All' || emp.department === trendSelectedDept;
      const matchStaff = trendSelectedStaffId === 'All' || emp.id === trendSelectedStaffId;
      return matchDept && matchStaff;
    });

    let totalScore = 0;
    let gradedCount = 0;
    let totalTasksCount = 0;
    let approvedTasksCount = 0;

    targetEmployees.forEach(emp => {
      const empTasks = kpiTasks.filter(t => t.employeeId === emp.id);
      totalTasksCount += empTasks.length;
      approvedTasksCount += empTasks.filter(t => t.status === 'Approved').length;
      
      const graded = empTasks.filter(t => t.score !== undefined);
      if (graded.length > 0) {
        totalScore += graded.reduce((acc, t) => acc + (t.score || 0), 0);
        gradedCount += graded.length;
      } else {
        totalScore += 0;
        gradedCount += 0;
      }
    });

    const avgScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0;
    const completionRate = totalTasksCount > 0 ? Math.round((approvedTasksCount / totalTasksCount) * 100) : 85;

    let grade = 'E';
    let label = 'Kurang Memuaskan';
    let badgeColor = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-800';
    if (avgScore >= 90) {
      grade = 'A';
      label = 'Istimewa (Exceeds Target)';
      badgeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800';
    } else if (avgScore >= 80) {
      grade = 'B';
      label = 'Sangat Baik (On Track)';
      badgeColor = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-800';
    } else if (avgScore >= 70) {
      grade = 'C';
      label = 'Cukup Baik (Needs Review)';
      badgeColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-800';
    } else if (avgScore >= 50) {
      grade = 'D';
      label = 'Butuh Peningkatan';
      badgeColor = 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-800';
    }

    return {
      avgScore,
      completionRate,
      totalTasks: totalTasksCount || 12,
      grade,
      label,
      badgeColor
    };
  }, [trendSelectedDept, trendSelectedStaffId, employees, kpiTasks]);

  // 5. Top Performers
  const topPerformers = useMemo(() => {
    return employees.map(emp => {
      const empTasks = kpiTasks.filter(t => t.employeeId === emp.id && t.score !== undefined);
      const avg = empTasks.length > 0 
        ? Math.round(empTasks.reduce((acc, t) => acc + (t.score || 0), 0) / empTasks.length)
        : 0;
      return {
        ...emp,
        avgScore: Math.min(100, avg)
      };
    }).sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
  }, [employees, kpiTasks]);

  // Employee Weekly -> Monthly Aggregation Calculation
  const employeeAccumulations = useMemo(() => {
    // Unique employees
    const empMap = new Map<string, {
      employeeId: string;
      employeeName: string;
      department: string;
      weeks: {
        'Minggu 1': { totalScore: number; count: number; tasks: KPITask[] };
        'Minggu 2': { totalScore: number; count: number; tasks: KPITask[] };
        'Minggu 3': { totalScore: number; count: number; tasks: KPITask[] };
        'Minggu 4': { totalScore: number; count: number; tasks: KPITask[] };
        'Minggu 5': { totalScore: number; count: number; tasks: KPITask[] };
      };
    }>();

    employees.forEach(emp => {
      empMap.set(emp.id, {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        weeks: {
          'Minggu 1': { totalScore: 0, count: 0, tasks: [] },
          'Minggu 2': { totalScore: 0, count: 0, tasks: [] },
          'Minggu 3': { totalScore: 0, count: 0, tasks: [] },
          'Minggu 4': { totalScore: 0, count: 0, tasks: [] },
          'Minggu 5': { totalScore: 0, count: 0, tasks: [] }
        }
      });
    });

    kpiTasks.forEach(task => {
      if (filterMonth !== 'All' && task.month !== filterMonth) return;
      let record = empMap.get(task.employeeId);
      if (!record) {
        empMap.set(task.employeeId, {
          employeeId: task.employeeId,
          employeeName: task.employeeName,
          department: task.department,
          weeks: {
            'Minggu 1': { totalScore: 0, count: 0, tasks: [] },
            'Minggu 2': { totalScore: 0, count: 0, tasks: [] },
            'Minggu 3': { totalScore: 0, count: 0, tasks: [] },
            'Minggu 4': { totalScore: 0, count: 0, tasks: [] },
            'Minggu 5': { totalScore: 0, count: 0, tasks: [] }
          }
        });
        record = empMap.get(task.employeeId)!;
      }

      if (record.weeks[task.week]) {
        record.weeks[task.week].tasks.push(task);
        if (task.score !== undefined) {
          record.weeks[task.week].totalScore += task.score;
          record.weeks[task.week].count += 1;
        }
      }
    });

    const result = Array.from(empMap.values()).map(emp => {
      const w1 = emp.weeks['Minggu 1'].count > 0 ? Math.round(emp.weeks['Minggu 1'].totalScore / emp.weeks['Minggu 1'].count) : 0;
      const w2 = emp.weeks['Minggu 2'].count > 0 ? Math.round(emp.weeks['Minggu 2'].totalScore / emp.weeks['Minggu 2'].count) : 0;
      const w3 = emp.weeks['Minggu 3'].count > 0 ? Math.round(emp.weeks['Minggu 3'].totalScore / emp.weeks['Minggu 3'].count) : 0;
      const w4 = emp.weeks['Minggu 4'].count > 0 ? Math.round(emp.weeks['Minggu 4'].totalScore / emp.weeks['Minggu 4'].count) : 0;
      const w5 = emp.weeks['Minggu 5'].count > 0 ? Math.round(emp.weeks['Minggu 5'].totalScore / emp.weeks['Minggu 5'].count) : 0;

      const evaluatedWeeks = [w1, w2, w3, w4, w5].filter((w, idx) => {
        const weekKey = `Minggu ${idx + 1}` as 'Minggu 1' | 'Minggu 2' | 'Minggu 3' | 'Minggu 4' | 'Minggu 5';
        return emp.weeks[weekKey].count > 0;
      });

      const monthlyScore = evaluatedWeeks.length > 0
        ? Math.round(evaluatedWeeks.reduce((a, b) => a + b, 0) / evaluatedWeeks.length)
        : 0;

      let grade = 'E';
      let gradeLabel = 'Kurang / Unsubmitted';
      let badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';

      if (monthlyScore >= 90) {
        grade = 'A';
        gradeLabel = 'Sangat Baik (Exceeds Target)';
        badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
      } else if (monthlyScore >= 80) {
        grade = 'B';
        gradeLabel = 'Baik (Meets Target)';
        badgeBg = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
      } else if (monthlyScore >= 70) {
        grade = 'C';
        gradeLabel = 'Cukup (Satisfactory)';
        badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
      } else if (monthlyScore >= 50) {
        grade = 'D';
        gradeLabel = 'Butuh Perbaikan (Needs Improvement)';
        badgeBg = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800';
      }

      return {
        ...emp,
        w1,
        w2,
        w3,
        w4,
        w5,
        monthlyScore,
        grade,
        gradeLabel,
        badgeBg,
        totalTasks: emp.weeks['Minggu 1'].tasks.length + emp.weeks['Minggu 2'].tasks.length + emp.weeks['Minggu 3'].tasks.length + emp.weeks['Minggu 4'].tasks.length + emp.weeks['Minggu 5'].tasks.length
      };
    });

    return result.filter(r => r.totalTasks > 0 || userRole === 'Manager');
  }, [employees, kpiTasks, filterMonth, userRole]);

  // Statistics
  const stats = useMemo(() => {
    const total = kpiTasks.length;
    const pending = kpiTasks.filter(t => t.status === 'Pending').length;
    const submitted = kpiTasks.filter(t => t.status === 'Submitted').length;
    const approved = kpiTasks.filter(t => t.status === 'Approved').length;
    const avgScore = kpiTasks.filter(t => t.score !== undefined).length > 0
      ? Math.round(kpiTasks.filter(t => t.score !== undefined).reduce((sum, t) => sum + (t.score || 0), 0) / kpiTasks.filter(t => t.score !== undefined).length)
      : 0;

    return { total, pending, submitted, approved, avgScore };
  }, [kpiTasks]);

  // Handle Employee Change in Create Task Form
  const handleEmployeeSelectInCreate = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setNewTaskForm(prev => ({
      ...prev,
      employeeId: empId,
      department: emp ? emp.department : prev.department
    }));
  };

  // Submit Task Creation
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === newTaskForm.employeeId);
    if (!emp) return;

    const existingCount = kpiTasks.filter(t => 
      t.employeeId === emp.id && 
      t.month === newTaskForm.month && 
      t.week === newTaskForm.week
    ).length;
    const calculatedWeight = Number((100 / (existingCount + 1)).toFixed(1));

    addKPITask({
      title: newTaskForm.title,
      description: newTaskForm.description,
      department: newTaskForm.department,
      employeeId: emp.id,
      employeeName: emp.name,
      month: newTaskForm.month,
      week: newTaskForm.week,
      weight: calculatedWeight,
      dueDate: newTaskForm.dueDate
    });

    setShowCreateTaskModal(false);
    setNewTaskForm({
      title: '',
      description: '',
      employeeId: employees[0]?.id || 'EMP-1004',
      department: employees[0]?.department || 'Marketing',
      month: 'Juli 2026',
      week: 'Minggu 1',
      weight: 25,
      dueDate: new Date().toISOString().substring(0, 10)
    });
  };

  // Open Work Proof Inspector Modal for Admin & Manager
  const handleInspectTaskProof = (task: KPITask) => {
    setInspectingTaskProof(task);
    setShowDocumentViewer(false);
    const initialPreset = (task.scorePreset || 100) as 100 | 85 | 70 | 50 | 0;
    setReviewForm({
      score: task.score !== undefined ? task.score : 100,
      scorePreset: initialPreset,
      scoreLabel: task.scoreLabel || '100 - Pekerjaan berhasil & sesuai ekspektasi',
      reviewNotes: task.reviewNotes || '',
      status: task.status === 'Approved' ? 'Approved' : 'Approved'
    });
  };

  // Select Sample Template for Staff Upload Simulation
  const selectPresetTemplate = (type: 'pdf' | 'excel' | 'image') => {
    if (type === 'pdf') {
      setSubmissionForm(prev => ({
        ...prev,
        fileName: 'Laporan_Hasil_Pekerjaan_Jerjhon.pdf',
        fileSize: '1.8 MB',
        fileType: 'pdf',
        notes: prev.notes || 'Telah menyelesaikan tugas KPI sesuai dengan spesifikasi dan standar operasional.'
      }));
    } else if (type === 'excel') {
      setSubmissionForm(prev => ({
        ...prev,
        fileName: 'Rekap_Data_Analisis_KPI_Juli_2026.xlsx',
        fileSize: '2.4 MB',
        fileType: 'xlsx',
        notes: prev.notes || 'Spreadsheet rekapitulasi data lengkap dengan rumus kalkulasi dan grafik.'
      }));
    } else if (type === 'image') {
      setSubmissionForm(prev => ({
        ...prev,
        fileName: 'Screenshot_Hasil_Desain_Figma.png',
        fileSize: '950 KB',
        fileType: 'png',
        proofLink: prev.proofLink || 'https://figma.com/file/sample-kpi-design',
        notes: prev.notes || 'Tangkapan layar bukti penyelesaian modul dan tautan akses langsung.'
      }));
    }
  };

  // Open Submit Proof Modal
  const handleOpenSubmitModal = (task: KPITask) => {
    setSelectedTask(task);
    setSubmissionForm({
      fileName: task.submission?.fileName || '',
      fileSize: task.submission?.fileSize || '',
      fileType: task.submission?.fileType || 'pdf',
      proofLink: task.submission?.proofLink || '',
      notes: task.submission?.notes || '',
      isSimulatingUpload: false
    });
    setShowSubmitModal(true);
  };

  // Simulate File Upload Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmissionForm(prev => ({
        ...prev,
        isSimulatingUpload: true
      }));

      setTimeout(() => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
        setSubmissionForm(prev => ({
          ...prev,
          fileName: file.name,
          fileSize: sizeMB,
          fileType: ext,
          isSimulatingUpload: false
        }));
      }, 600);
    }
  };

  // Submit Proof Action
  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    submitKPITask(selectedTask.id, {
      fileName: submissionForm.fileName || 'Bukti_Pekerjaan_Jerjhon.pdf',
      fileSize: submissionForm.fileSize || '1.5 MB',
      fileType: submissionForm.fileType || 'pdf',
      proofLink: submissionForm.proofLink,
      notes: submissionForm.notes
    });

    setShowSubmitModal(false);
    setSelectedTask(null);
  };

  // Open Manager Review Modal
  const handleOpenReviewModal = (task: KPITask) => {
    setSelectedTask(task);
    const initialPreset = (task.scorePreset || 100) as 100 | 85 | 70 | 50 | 0;
    setReviewForm({
      score: task.score !== undefined ? task.score : 100,
      scorePreset: initialPreset,
      scoreLabel: task.scoreLabel || '100 - Pekerjaan berhasil & sesuai ekspektasi',
      reviewNotes: task.reviewNotes || '',
      status: task.status === 'Approved' ? 'Approved' : 'Approved'
    });
    setShowReviewModal(true);
  };

  // Quick Preset Selection Helper
  const applyScorePreset = (preset: 100 | 85 | 70 | 50 | 0) => {
    let label = '';
    switch (preset) {
      case 100:
        label = '100 - Pekerjaan Berhasil & Sesuai Ekspektasi';
        break;
      case 85:
        label = '85 - Berhasil Tetapi Ada Catatan Perbaikan';
        break;
      case 70:
        label = '70 - Pekerjaan Pending / Butuh Penyelesaian Lanjut';
        break;
      case 50:
        label = '50 - Belum Memenuhi Semua Kriteria (Ada Progres & Catatan)';
        break;
      case 0:
        label = '0 - Tidak Mengerjakan Sama Sekali / Overdue';
        break;
    }
    setReviewForm(prev => ({
      ...prev,
      score: preset,
      scorePreset: preset,
      scoreLabel: label
    }));
  };

  // Save Review Action
  const handleSaveReview = (status: 'Approved' | 'Declined') => {
    if (!selectedTask) return;

    reviewKPITask(
      selectedTask.id,
      reviewForm.score,
      reviewForm.scorePreset,
      reviewForm.scoreLabel,
      reviewForm.reviewNotes,
      status,
      'Budi Santoso (HR & Ops Director)'
    );

    setShowReviewModal(false);
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <RoleAccessBanner moduleName="KPI & OKR Management" />
      
      {/* Top Banner & Title */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#b90f0f]/10 text-[#b90f0f] rounded-xl font-bold text-xs flex items-center gap-1.5">
              <Award className="w-4 h-4" /> 
              {isStaff ? 'My KPI & OKR Performance' : 'Management KPI Jerjhon'}
            </span>
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-medium">
              {isStaff ? 'Pantau Capaian & Target Anda' : 'Perhitungan Mingguan & Akumulasi Bulanan Otomatis'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {isStaff ? `Performance Dashboard: ${loggedInEmployee?.name || 'Karyawan'}` : 'KPI & OKR Task Assignment System'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isStaff 
              ? 'Lihat penugasan mingguan Anda, kirim bukti pekerjaan (file upload), dan pantau skor KPI bulanan Anda secara real-time.'
              : 'Penugasan tugas mingguan karyawan, kirim bukti pekerjaan (file upload), review manager, dan penilaian preset otomatis (0 - 100).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Management Only Controls */}
          {!isStaff && (
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Buat Assignment KPI Baru
            </button>
          )}
          
          {/* Staff Only Actions */}
          {isStaff && (
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <UserCheck className="w-4 h-4 text-[#b90f0f]" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{loggedInEmployee?.department || '-'}</span>
             </div>
          )}
        </div>
      </div>

      {/* Summary KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {isStaff ? 'Tugas Saya' : 'Total Assignment'}
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white block">
            {isStaff ? filteredTasks.length : stats.total} Task
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Periode: {filterMonth}</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
            {isStaff ? 'Belum Dikirim' : 'Belum Dikerjakan'}
          </span>
          <span className="text-2xl font-black text-amber-600 block">
            {isStaff ? filteredTasks.filter(t => t.status === 'Pending').length : stats.pending} Task
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Status: Pending</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider block">
            {isStaff ? 'Sedang Direview' : 'Butuh Review Manager'}
          </span>
          <span className="text-2xl font-black text-blue-600 block">
            {isStaff ? filteredTasks.filter(t => t.status === 'Submitted').length : stats.submitted} Bukti
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Menunggu Nilai</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block">
            {isStaff ? 'Target Tercapai' : 'Selesai & Disetujui'}
          </span>
          <span className="text-2xl font-black text-emerald-600 block">
            {isStaff ? filteredTasks.filter(t => t.status === 'Approved').length : stats.approved} Task
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Sudah Dinilai</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1 col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-[#b90f0f] uppercase tracking-wider block">
            {isStaff ? 'Rata-rata Nilai Saya' : 'Rata-rata Nilai KPI'}
          </span>
          <span className="text-2xl font-black text-[#b90f0f] block">
            {isStaff 
              ? (filteredTasks.filter(t => t.score !== undefined).length > 0
                ? Math.round(filteredTasks.filter(t => t.score !== undefined).reduce((s, t) => s + (t.score || 0), 0) / filteredTasks.filter(t => t.score !== undefined).length)
                : 0)
              : stats.avgScore} / 100
          </span>
          <span className="text-[10px] text-slate-500 font-medium">{isStaff ? 'Predikat Anda' : 'Skor Perusahaan'}</span>
        </div>
      </div>

      {/* Progress KPI Notification Box */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> {isStaff ? 'Notifikasi Progress KPI Anda' : 'Progress KPI Notifikasi'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {isStaff ? 'Berdasarkan penilaian tugas oleh Manager & HRD' : 'Pilih atau simulasikan status pencapaian KPI'}
            </span>
          </div>
          {!isStaff && (
            <div className="flex items-center gap-2">
              {kpiNotifType === 'di_atas' && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Persentase (%):</span>
                  <input
                    type="number"
                    value={kpiPersentaseInput}
                    onChange={(e) => setKpiPersentaseInput(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg font-bold border-none"
                  />
                </div>
              )}
              <select
                value={kpiNotifType}
                onChange={(e) => setKpiNotifType(e.target.value as any)}
                className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 font-bold border-none"
              >
                <option value="di_atas">🟢 KPI Di Atas Target</option>
                <option value="sesuai">🟢 KPI Sesuai Target</option>
                <option value="menurun">🟡 KPI Mulai Menurun</option>
                <option value="jauh">🔴 KPI Jauh dari Target</option>
                <option value="100">🏆 KPI 100%</option>
              </select>
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl border text-xs font-medium transition-all shadow-xs bg-slate-50 dark:bg-slate-900/50">
          {(() => {
            const calculatedAvg = isStaff 
              ? (filteredTasks.filter(t => t.score !== undefined).length > 0
                ? Math.round(filteredTasks.filter(t => t.score !== undefined).reduce((s, t) => s + (t.score || 0), 0) / filteredTasks.filter(t => t.score !== undefined).length)
                : 0)
              : 0;

            const activeType = isStaff 
              ? (calculatedAvg > 100 ? 'di_atas' : calculatedAvg === 100 ? '100' : calculatedAvg >= 80 ? 'sesuai' : calculatedAvg >= 60 ? 'menurun' : 'jauh')
              : kpiNotifType;

            const displayPercentage = isStaff ? calculatedAvg : kpiPersentaseInput;

            if (activeType === 'di_atas') {
              return (
                <div className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 p-3.5 rounded-xl border space-y-1">
                  <div className="font-black flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-sm">
                    <span>🟢 KPI Di Atas Target</span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">
                    "🌟 Luar biasa! Pencapaian KPI Anda saat ini mencapai {displayPercentage}%, melampaui target yang ditetapkan."
                  </p>
                </div>
              );
            }
            if (activeType === 'sesuai') {
              return (
                <div className="border-teal-500/30 bg-teal-500/10 text-teal-900 dark:text-teal-200 p-3.5 rounded-xl border space-y-1">
                  <div className="font-black flex items-center gap-1.5 text-teal-700 dark:text-teal-300 text-sm">
                    <span>🟢 KPI Sesuai Target</span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">
                    "✅ Anda berada di jalur yang tepat. Pertahankan performa agar target tetap tercapai hingga akhir periode."
                  </p>
                </div>
              );
            }
            if (activeType === 'menurun') {
              return (
                <div className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 p-3.5 rounded-xl border space-y-1">
                  <div className="font-black flex items-center gap-1.5 text-amber-700 dark:text-amber-300 text-sm">
                    <span>🟡 KPI Mulai Menurun</span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">
                    "📉 Performa KPI mulai berada di bawah target. Masih ada waktu untuk mengejar dan meningkatkan hasil."
                  </p>
                </div>
              );
            }
            if (activeType === 'jauh') {
              return (
                <div className="border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200 p-3.5 rounded-xl border space-y-1">
                  <div className="font-black flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-sm">
                    <span>🔴 KPI Jauh dari Target</span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">
                    "🚨 KPI Anda berada di bawah target. Mari evaluasi prioritas dan fokus pada aktivitas yang memberikan dampak terbesar."
                  </p>
                </div>
              );
            }
            return (
              <div className="border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 p-3.5 rounded-xl border space-y-1">
                <div className="font-black flex items-center gap-1.5 text-blue-700 dark:text-blue-300 text-sm">
                  <span>🏆 KPI 100%</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  "🏅 Selamat! Anda berhasil mencapai target KPI 100%. Terima kasih atas kontribusi luar biasa Anda."
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'tasks'
              ? 'border-[#b90f0f] text-[#b90f0f]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          {isStaff ? 'Daftar Tugas Saya' : 'Assignment & Bukti Pekerjaan'} ({filteredTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('accumulation')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'accumulation'
              ? 'border-[#b90f0f] text-[#b90f0f]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          {isStaff ? 'History Performa Saya' : 'Akumulasi Mingguan & Bulanan'}
        </button>

        {!isStaff && (
          <button
            onClick={() => setActiveTab('trends')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'trends'
                ? 'border-[#b90f0f] text-[#b90f0f]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#b90f0f]" />
            Visual Trends & Analitik
          </button>
        )}

        <button
          onClick={() => setActiveTab('okr')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'okr'
              ? 'border-[#b90f0f] text-[#b90f0f]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Target className="w-4 h-4" />
          {isStaff ? 'My Strategic OKRs' : 'Strategic OKRs'}
        </button>

        {!isStaff && (
          <button
            onClick={() => setActiveTab('manager_review')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'manager_review'
                ? 'border-[#b90f0f] text-[#b90f0f]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Star className="w-4 h-4 text-[#b90f0f]" />
            Manager Review Pane ({kpiTasks.filter(t => t.status === 'Submitted').length})
          </button>
        )}

        {!isStaff && userRole === 'Manager' && (
          <button
            onClick={() => setActiveTab('assignees')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'assignees'
                ? 'border-[#b90f0f] text-[#b90f0f]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#b90f0f]" />
            Daftar Penerima Tugas ({employees.length})
          </button>
        )}
      </div>

      {/* TAB 1: TASKS & SUBMISSIONS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold mr-1">
                <Filter className="w-3.5 h-3.5 text-[#b90f0f]" /> Filter:
              </div>

              {/* Month */}
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 font-semibold outline-none"
              >
                <option value="Juli 2026">Juli 2026</option>
                <option value="Agustus 2026">Agustus 2026</option>
                <option value="All">Semua Bulan</option>
              </select>

              {/* Week */}
              <select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 font-semibold outline-none"
              >
                <option value="All">Semua Minggu (W1-W5)</option>
                <option value="Minggu 1">Minggu 1</option>
                <option value="Minggu 2">Minggu 2</option>
                <option value="Minggu 3">Minggu 3</option>
                <option value="Minggu 4">Minggu 4</option>
                <option value="Minggu 5">Minggu 5</option>
              </select>

              {/* Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 font-semibold outline-none"
              >
                <option value="All">Semua Status</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
              </select>

              {/* Department - Management only */}
              {!isStaff && (
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 font-semibold outline-none"
                >
                  <option value="All">Semua Departemen</option>
                  <option value="Creative">Creative</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                </select>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={isStaff ? "Cari tugas saya..." : "Cari nama task atau karyawan..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-[#b90f0f]"
              />
            </div>
          </div>

          {/* Task Grid Cards */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Tidak ada Assignment KPI ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Silakan atur ulang filter pencarian atau buat penugasan KPI baru untuk karyawan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(filteredTasks || []).map((task) => {
                const isOverdue = task.status === 'Pending' && new Date(task.dueDate) < new Date();

                return (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 hover:border-slate-300 transition-all relative overflow-hidden"
                  >
                    {/* Top Meta */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                            {task.week} • {task.month}
                          </span>
                          <span className="text-[10px] font-bold bg-[#b90f0f]/10 text-[#b90f0f] px-2 py-0.5 rounded-md">
                            Bobot: {getTaskWeight(task, kpiTasks)}%
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            ID: {task.id}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1.5 leading-snug">
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="text-right shrink-0">
                        {task.status === 'Approved' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        )}
                        {task.status === 'Submitted' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 animate-pulse">
                            <Clock className="w-3.5 h-3.5" /> Butuh Review
                          </span>
                        )}
                        {task.status === 'Pending' && (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                            isOverdue
                              ? 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800'
                              : 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
                          }`}>
                            <AlertCircle className="w-3.5 h-3.5" /> {isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        )}
                        {task.status === 'Declined' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                            <X className="w-3.5 h-3.5" /> Declined
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Assignee & Due Date - Only show for manager/simulated mode */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      {!isStaff ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-[#b90f0f]/10 text-[#b90f0f] font-bold text-[10px] flex items-center justify-center">
                            {task.employeeName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{task.employeeName}</span>
                            <span className="text-[10px] text-slate-400">{task.department}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium uppercase tracking-tighter text-[10px]">Tugas Saya</span>
                        </div>
                      )}

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Tenggat Waktu:</span>
                        <span className={`font-mono font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          📅 {task.dueDate}
                        </span>
                      </div>
                    </div>

                    {/* Submission Attachment Info if available */}
                    {task.submission && (
                      <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-600/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[#b90f0f] font-bold">
                          <span className="flex items-center gap-1.5">
                            <FileSpreadsheet className="w-4 h-4 text-[#b90f0f]" /> Bukti Pekerjaan Dikirim:
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{task.submission.submittedAt}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
                          <div className="truncate pr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                              📄 {task.submission.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400">{task.submission.fileSize || 'Dokumen Terlampir'}</span>
                          </div>
                          {task.submission.proofLink && (
                            <a
                              href={task.submission.proofLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Buka Link
                            </a>
                          )}
                        </div>

                        {task.submission.notes && (
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] italic bg-slate-100/60 dark:bg-slate-800/60 p-2 rounded-lg">
                            &ldquo;{task.submission.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Score & Review Notes if Approved / Graded */}
                    {task.score !== undefined && (
                      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">
                            Evaluasi Manager:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {task.scoreLabel || `Skor Diberikan: ${task.score}`}
                          </span>
                          {task.reviewNotes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              Catatan: {task.reviewNotes}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-2xl font-black text-[#b90f0f] block">
                            {task.score}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Skor / 100</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons based on Role & Status */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      {/* Inspection button for Admin & Manager */}
                      {userRole === 'Manager' && (
                        <div className="flex items-center gap-2 w-full">
                          {task.submission && (
                            <button
                              onClick={() => handleInspectTaskProof(task)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspeksi Hasil Kerja
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenReviewModal(task)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                              !task.submission
                                ? 'bg-[#b90f0f] hover:bg-[#9a0c0c] text-white'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" />
                            {task.status === 'Submitted' ? 'Review & Beri Nilai' : 'Edit Penilaian Manager'}
                          </button>

                          <button
                            onClick={() => deleteKPITask(task.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                            title="Hapus Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Employee Actions */}
                      {userRole === 'Staff' && (
                        <div className="flex items-center gap-2 w-full">
                          {task.submission && (
                            <button
                              onClick={() => handleInspectTaskProof(task)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-xl text-xs font-bold transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> Liht Bukti Dikirim
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenSubmitModal(task)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {task.submission ? 'Perbarui Bukti' : 'Kirim Bukti Kerja'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY TO MONTHLY ACCUMULATION */}
      {activeTab === 'accumulation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#b90f0f]" /> Matriks Perhitungan Akumulasi KPI Bulanan Jerjhon
                </h3>
                <p className="text-xs text-slate-500">
                  Perhitungan otomatis: 1 Tugas di minggu yang sama = Bobot 100%. Jika &gt;1 tugas, bobot 100% dibagi rata per minggu. Skor Bulanan = Akumulasi rata-rata skor per minggu (Minggu 1 s/d 4).
                </p>
              </div>

              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="Juli 2026">Periode: Juli 2026</option>
                <option value="Agustus 2026">Periode: Agustus 2026</option>
              </select>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Karyawan & Departemen</th>
                    <th className="p-3.5 text-center">Minggu 1</th>
                    <th className="p-3.5 text-center">Minggu 2</th>
                    <th className="p-3.5 text-center">Minggu 3</th>
                    <th className="p-3.5 text-center">Minggu 4</th>
                    <th className="p-3.5 text-center">Minggu 5</th>
                    <th className="p-3.5 text-center bg-slate-200/60 dark:bg-slate-800/80 text-slate-900 dark:text-white">
                      Skor Akumulasi Bulanan
                    </th>
                    <th className="p-3.5 text-center">Grade Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {employeeAccumulations
                    .filter(emp => !isStaff || emp.employeeId === loggedInEmployee?.id)
                    .map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all">
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#b90f0f]/10 text-[#b90f0f] font-bold text-xs flex items-center justify-center shrink-0">
                            {emp.employeeName.charAt(0)}
                          </div>
                          <div>
                            <span className="block text-slate-900 dark:text-white font-extrabold">{emp.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{emp.department}</span>
                          </div>
                        </div>
                      </td>

                      {/* W1 */}
                      <td className="p-3.5 text-center font-mono font-bold">
                        {emp.weeks['Minggu 1'].count > 0 ? (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200">
                            {emp.w1}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* W2 */}
                      <td className="p-3.5 text-center font-mono font-bold">
                        {emp.weeks['Minggu 2'].count > 0 ? (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200">
                            {emp.w2}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* W3 */}
                      <td className="p-3.5 text-center font-mono font-bold">
                        {emp.weeks['Minggu 3'].count > 0 ? (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200">
                            {emp.w3}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* W4 */}
                      <td className="p-3.5 text-center font-mono font-bold">
                        {emp.weeks['Minggu 4'].count > 0 ? (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200">
                            {emp.w4}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* W5 */}
                      <td className="p-3.5 text-center font-mono font-bold">
                        {emp.weeks['Minggu 5'].count > 0 ? (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200">
                            {emp.w5}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Monthly Score */}
                      <td className="p-3.5 text-center font-mono font-black text-base text-[#b90f0f] bg-slate-50 dark:bg-slate-800/80">
                        {emp.monthlyScore} / 100
                      </td>

                      {/* Grade Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border ${emp.badgeBg}`}>
                          Grade {emp.grade} • {emp.gradeLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Score Preset Rules Legend */}
            {!isStaff && (
              <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#b90f0f]" /> Panduan Aturan Setting Skor Reviewer Manager Jerjhon:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                  <div className="bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-2.5 rounded-lg">
                    <span className="font-black text-emerald-800 dark:text-emerald-300 block text-sm">Nilai 100</span>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">Pekerjaan berhasil & sesuai ekspektasi penuh.</span>
                  </div>
                  <div className="bg-blue-100/60 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 p-2.5 rounded-lg">
                    <span className="font-black text-blue-800 dark:text-blue-300 block text-sm">Nilai 85</span>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">Pekerjaan berhasil tetapi masih ada catatan.</span>
                  </div>
                  <div className="bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-2.5 rounded-lg">
                    <span className="font-black text-amber-800 dark:text-amber-300 block text-sm">Nilai 70</span>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">Pekerjaan pending / butuh kelanjutan.</span>
                  </div>
                  <div className="bg-orange-100/60 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 p-2.5 rounded-lg">
                    <span className="font-black text-orange-800 dark:text-orange-300 block text-sm">Nilai 50</span>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">Belum memenuhi, tapi ada progres & catatan.</span>
                  </div>
                  <div className="bg-rose-100/60 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 p-2.5 rounded-lg">
                    <span className="font-black text-rose-800 dark:text-rose-300 block text-sm">Nilai 0</span>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">Tidak mengerjakan sama sekali / overdue.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: VISUAL TRENDS & ANALYTICS (Recharts KPI Trends Analysis) */}
      {/* ========================================================================= */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <OKRQuarterProgressChart okrs={okrs} kpiTasks={kpiTasks} />
          
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#b90f0f]" /> 
                  Tren & Analitik Visual Kinerja Karyawan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analisis perbandingan departemen, fluktuasi pencapaian target mingguan/bulanan, dan status penyelesaian tugas KPI.
                </p>
              </div>

              {/* Quick Period Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setTrendPeriodType('last6')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    trendPeriodType === 'last6'
                      ? 'bg-[#b90f0f] text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                  }`}
                >
                  6 Bulan Terakhir
                </button>
                <button
                  onClick={() => setTrendPeriodType('custom')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    trendPeriodType === 'custom'
                      ? 'bg-[#b90f0f] text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pilih Rentang Tanggal Custom
                </button>
              </div>
            </div>

            {/* Filter Section Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              
              {/* Date pickers (for Custom Range) */}
              {trendPeriodType === 'custom' ? (
                <>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">Tanggal Mulai:</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={trendStartDate}
                        onChange={(e) => setTrendStartDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">Tanggal Selesai:</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={trendEndDate}
                        onChange={(e) => setTrendEndDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-700/40 border border-slate-150 dark:border-slate-700/50 rounded-xl p-2.5 flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#b90f0f] shrink-0" />
                  <div className="text-xs">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">6 Bulan Terakhir</p>
                    <p className="text-[10px] text-slate-500">Februari 2026 s/d Juli 2026 (Analisis Historis Jerjhon)</p>
                  </div>
                </div>
              )}

              {/* Department Filter */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase">Departemen:</label>
                <select
                  value={trendSelectedDept}
                  onChange={(e) => {
                    setTrendSelectedDept(e.target.value);
                    setTrendSelectedStaffId('All'); // reset staff
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="All">Semua Departemen (All)</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Creative">Creative</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="HR & Operations">HR & Operations</option>
                </select>
              </div>

              {/* Employee/Staff Filter */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase">Karyawan / Staf:</label>
                <select
                  value={trendSelectedStaffId}
                  onChange={(e) => setTrendSelectedStaffId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="All">Semua Staf (All Staff)</option>
                  {(employees || [])
                    .filter(emp => trendSelectedDept === 'All' || emp.department === trendSelectedDept)
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id})
                      </option>
                    ))}
                </select>
              </div>

            </div>
          </div>

          {/* Visual KPI Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Rata-rata Skor */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#b90f0f] flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/50">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Rata-rata Skor KPI</span>
                <span className="text-xl font-black text-[#b90f0f] block mt-0.5">{trendSummaryMetrics.avgScore} / 100</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">▲ +3.1% vs Q1</span>
              </div>
            </div>

            {/* Card 2: Kelulusan */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Penyelesaian Task</span>
                <span className="text-xl font-black text-emerald-600 block mt-0.5">{trendSummaryMetrics.completionRate}%</span>
                <span className="text-[9px] text-slate-500 block">Tingkat persetujuan manager</span>
              </div>
            </div>

            {/* Card 3: Total Task */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Penugasan KPI</span>
                <span className="text-xl font-black text-blue-600 block mt-0.5">{trendSummaryMetrics.totalTasks} Unit</span>
                <span className="text-[9px] text-slate-500 block">Tugas aktif dalam filter</span>
              </div>
            </div>

            {/* Card 4: Predikat */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/50">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Grade Predikat</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white block truncate max-w-[140px]" title={trendSummaryMetrics.label}>
                  Grade {trendSummaryMetrics.grade} • {trendSummaryMetrics.label.split(' ')[0]}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Sesuai rata-rata akumulasi</span>
              </div>
            </div>

          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Main Trend Line Area Chart (occupies 2 cols on lg) */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#b90f0f]" />
                    {trendPeriodType === 'last6' 
                      ? 'Kurva Tren Nilai Rata-rata Kinerja (6 Bulan)' 
                      : `Kurva Tren Kinerja Kustom (${trendStartDate} s/d ${trendEndDate})`}
                  </h4>
                  <p className="text-[10px] text-slate-400">Target minimal standar kinerja perusahaan adalah skor 80.</p>
                </div>
              </div>

              {/* Chart container */}
              <div className="h-72 w-full text-xs font-bold">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b90f0f" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#b90f0f" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="period" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <YAxis 
                      domain={[50, 100]} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        borderRadius: '12px', 
                        border: 'none', 
                        color: '#f8fafc', 
                        fontSize: '11px',
                        fontWeight: 'bold' 
                      }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Target (80)', fill: '#ef4444', fontSize: 9, position: 'insideBottomRight' }} />
                    <Area 
                      type="monotone" 
                      dataKey="Skor" 
                      stroke="#b90f0f" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#scoreColor)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Task Status Distribution (1 col on lg) */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-[#b90f0f]" />
                  Proporsi Status KPI Task
                </h4>
                <p className="text-[10px] text-slate-400">Distribusi status pengerjaan penugasan saat ini.</p>
              </div>

              {/* Pie chart container */}
              <div className="h-44 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusSummary}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(taskStatusSummary || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        borderRadius: '12px', 
                        border: 'none', 
                        color: '#f8fafc', 
                        fontSize: '10px' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text overlay */}
                <div className="absolute text-center">
                  <p className="text-xl font-black text-slate-800 dark:text-white">{trendSummaryMetrics.totalTasks}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Task Total</p>
                </div>
              </div>

              {/* Pie chart custom legends */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                {(taskStatusSummary || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[90px]" title={item.name}>
                      {item.name}: <strong className="font-bold">{item.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Row 3: Department Bar Chart & Top Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 3: Department Bar Chart */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 lg:col-span-2">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#b90f0f]" />
                  Komparasi Nilai KPI Antar Departemen
                </h4>
                <p className="text-[10px] text-slate-400">Rata-rata skor performa seluruh staff di masing-masing divisi.</p>
              </div>

              {/* Bar Chart container */}
              <div className="h-60 w-full text-xs font-bold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="department" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 9 }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        borderRadius: '12px', 
                        border: 'none', 
                        color: '#f8fafc', 
                        fontSize: '11px' 
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', pt: 10 }} />
                    <Bar dataKey="Skor" fill="#b90f0f" radius={[6, 6, 0, 0]} barSize={32} />
                    <Bar dataKey="Target" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performers highlight panel */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#b90f0f]" />
                  Staf Berprestasi (Top Performers)
                </h4>
                <p className="text-[10px] text-slate-400">Tiga karyawan dengan rata-rata penilaian terbaik.</p>
              </div>

              <div className="space-y-3.5 pt-2">
                {(topPerformers || []).map((perf, index) => {
                  const medalColors = [
                    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400',
                    'bg-slate-150 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300',
                    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400'
                  ];
                  const medalTitles = ['🥇 #1 Top', '🥈 #2 Runner Up', '🥉 #3 Best Performance'];

                  return (
                    <div key={perf.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-150 dark:border-slate-700/60 flex items-center justify-between gap-3 transition-all hover:scale-[1.01]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#b90f0f]/10 text-[#b90f0f] font-bold text-xs flex items-center justify-center shrink-0">
                          {perf.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{perf.name}</p>
                          <p className="text-[9px] text-slate-400">{perf.department}</p>
                          <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full border mt-1 ${medalColors[index]}`}>
                            {medalTitles[index]}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-semibold">Skor KPI</span>
                        <span className="text-base font-black text-[#b90f0f]">{perf.avgScore}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quality Note */}
              <div className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100/60 dark:border-red-900/20 rounded-xl text-[10px] text-slate-500 italic mt-2">
                &ldquo;Penilaian ini diperbarui secara berkala berdasarkan review hasil approval tugas mingguan oleh manager divisi masing-masing.&rdquo;
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 3: STRATEGIC OKR */}
      {activeTab === 'okr' && (
        <div className="space-y-6">
          <StaffQuarterlyPerformanceChart 
            employee={loggedInEmployee || employees[0]} 
            kpiTasks={kpiTasks} 
          />

          <OKRQuarterProgressChart 
            okrs={(okrs || []).filter(okr => !isStaff || okr.department === loggedInEmployee?.department)} 
            kpiTasks={kpiTasks.filter(t => !isStaff || t.employeeId === loggedInEmployee?.id)} 
          />

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-[#b90f0f]" /> Strategic Objectives & Key Results (OKR Q3 2026)
          </h3>

          <div className="space-y-4">
            {(okrs || [])
              .filter(okr => !isStaff || okr.department === loggedInEmployee?.department)
              .map((okr) => (
              <div key={okr.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    🎯 {okr.objective}
                  </h4>
                  <span className="text-xs font-bold bg-[#b90f0f]/10 text-[#b90f0f] px-2.5 py-1 rounded-full">
                    Progress: {okr.progress}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#b90f0f] h-full rounded-full transition-all duration-300"
                    style={{ width: `${okr.progress}%` }}
                  ></div>
                </div>

                <div className="space-y-2 pt-2">
                  {(okr.keyResults || []).map((kr) => (
                    <div key={kr.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{kr.title}</span>
                      <span className="font-bold font-mono text-[#b90f0f]">
                        {kr.current.toLocaleString()} / {kr.target.toLocaleString()} {kr.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* TAB 4: DEDICATED MANAGER REVIEW PANE */}
      {activeTab === 'manager_review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Review Queue List */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-[#b90f0f]" /> Antrean Review Submission
              </h3>
              <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-bold px-2.5 py-1 rounded-full">
                {(kpiTasks || []).filter(t => t.status === 'Submitted').length} Pending Review
              </span>
            </div>

            <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
              {(kpiTasks || []).map((task) => {
                const isSelected = managerReviewSelectedId === task.id;
                const isSubmitted = task.status === 'Submitted';

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setManagerReviewSelectedId(task.id);
                      const initialPreset = (task.scorePreset || 100) as 100 | 85 | 70 | 50 | 0;
                      setReviewForm({
                        score: task.score !== undefined ? task.score : 100,
                        scorePreset: initialPreset,
                        scoreLabel: task.scoreLabel || '100 - Pekerjaan berhasil & sesuai ekspektasi',
                        reviewNotes: task.reviewNotes || '',
                        status: 'Approved'
                      });
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#b90f0f] bg-rose-50/40 dark:bg-rose-950/20 shadow-sm ring-2 ring-[#b90f0f]/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                        {task.week} • {task.month}
                      </span>
                      {isSubmitted ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          Submitted (Review)
                        </span>
                      ) : task.status === 'Approved' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          Approved ({task.score})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400 px-2 py-0.5 rounded-full">
                          {task.status}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {task.employeeName} • {task.department}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dedicated Inspector & Scoring Interface */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
            {(() => {
              const activeReviewTask = kpiTasks.find(t => t.id === managerReviewSelectedId) || kpiTasks.find(t => t.status === 'Submitted') || kpiTasks[0];

              if (!activeReviewTask) {
                return (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    Pilih tugas dari antrean sebelah kiri untuk mulai melakukan review manager.
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {/* Task Header & Metadata */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold bg-[#b90f0f]/10 text-[#b90f0f] px-2.5 py-0.5 rounded-md">
                          {activeReviewTask.week} • {activeReviewTask.month}
                        </span>
                        <span className="text-xs text-slate-400">ID: {activeReviewTask.id}</span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base">
                        {activeReviewTask.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Karyawan: <strong className="text-slate-800 dark:text-slate-200">{activeReviewTask.employeeName}</strong> ({activeReviewTask.department}) • Bobot: {getTaskWeight(activeReviewTask, kpiTasks)}%
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-400 uppercase block">Status Saat Ini</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-0.5 inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        {activeReviewTask.status}
                      </span>
                    </div>
                  </div>

                  {/* FILE PREVIEW FOR EVIDENCE */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-[#b90f0f]" /> File Preview & Bukti Pekerjaan Karyawan
                    </h4>

                    {activeReviewTask.submission ? (
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-100 text-[#b90f0f] rounded-xl font-bold">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                {activeReviewTask.submission.fileName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Ukuran: {activeReviewTask.submission.fileSize || '1.2 MB'} • Diunggah: {activeReviewTask.submission.submittedAt}
                              </span>
                            </div>
                          </div>

                          {activeReviewTask.submission.proofLink && (
                            <a
                              href={activeReviewTask.submission.proofLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 text-blue-600 dark:text-blue-400 font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Buka Tautan Eksternal
                            </a>
                          )}
                        </div>

                        {activeReviewTask.submission.notes && (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-600 text-xs">
                            <span className="font-bold text-slate-400 block mb-0.5">Catatan Pengiriman Karyawan:</span>
                            <p className="text-slate-700 dark:text-slate-300 italic">
                              &ldquo;{activeReviewTask.submission.notes}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Interactive File Preview Simulator box */}
                        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-800">
                          <div className="flex items-center justify-between text-slate-400 text-[10px] pb-2 border-b border-slate-800">
                            <span>PREVIEW VIRTUAL VIEWER • {activeReviewTask.submission.fileType.toUpperCase()} FORMAT</span>
                            <span className="text-emerald-400">● 100% Verifikasi Aman</span>
                          </div>
                          <p className="text-white font-bold">📄 [Jerjhon Enterprise Document Inspector]</p>
                          <p className="text-slate-400">File: {activeReviewTask.submission.fileName} terverifikasi valid sesuai standar audit operasional.</p>
                          <p className="text-emerald-400">✓ Checksum & Anti-Tamper signature valid.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-50/60 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Karyawan belum mengunggah file bukti pekerjaan untuk task ini. Anda tetap dapat memberikan nilai 0 atau meminta revisi.
                      </div>
                    )}
                  </div>

                  {/* QUICK-ACTION SCORING INTERFACE (0-100 SCALE) */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                      <Star className="w-4 h-4 text-[#b90f0f]" /> Quick-Action Scoring Interface (Skala 0 - 100)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => applyScorePreset(100)}
                        className={`p-2.5 rounded-xl text-center border transition-all ${
                          reviewForm.scorePreset === 100
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-black text-emerald-600 text-sm block">100</span>
                        <span className="font-bold block text-[11px] mt-0.5">Sempurna</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyScorePreset(85)}
                        className={`p-2.5 rounded-xl text-center border transition-all ${
                          reviewForm.scorePreset === 85
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-black text-blue-600 text-sm block">85</span>
                        <span className="font-bold block text-[11px] mt-0.5">Baik</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyScorePreset(70)}
                        className={`p-2.5 rounded-xl text-center border transition-all ${
                          reviewForm.scorePreset === 70
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-black text-amber-600 text-sm block">70</span>
                        <span className="font-bold block text-[11px] mt-0.5">Cukup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyScorePreset(50)}
                        className={`p-2.5 rounded-xl text-center border transition-all ${
                          reviewForm.scorePreset === 50
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/70 text-orange-900 dark:text-orange-300 ring-2 ring-orange-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-black text-orange-600 text-sm block">50</span>
                        <span className="font-bold block text-[11px] mt-0.5">Kurang</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyScorePreset(0)}
                        className={`p-2.5 rounded-xl text-center border transition-all ${
                          reviewForm.scorePreset === 0
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-300 ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-black text-rose-600 text-sm block">0</span>
                        <span className="font-bold block text-[11px] mt-0.5">Ditolak</span>
                      </button>
                    </div>

                    {/* Slider Precision */}
                    <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Atur Presisi Angka Skor:</span>
                        <span className="font-mono font-black text-[#b90f0f] text-lg">{reviewForm.score} / 100</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={reviewForm.score}
                        onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value) })}
                        className="w-full accent-[#b90f0f] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Manager Feedback Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Catatan Feedback Reviewer Manager:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Tuliskan catatan apresiasi atau instruksi perbaikan..."
                      value={reviewForm.reviewNotes}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#b90f0f]"
                    />
                  </div>

                  {/* AUTOMATED STATUS TRANSITION LOGIC BUTTONS */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        reviewKPITask(
                          activeReviewTask.id,
                          reviewForm.score,
                          reviewForm.scorePreset as any,
                          reviewForm.scoreLabel,
                          reviewForm.reviewNotes,
                          'Declined',
                          currentUser.name
                        );
                      }}
                      className="px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Tolak & Minta Revisi
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        reviewKPITask(
                          activeReviewTask.id,
                          reviewForm.score,
                          reviewForm.scorePreset as any,
                          reviewForm.scoreLabel,
                          reviewForm.reviewNotes,
                          'Approved',
                          currentUser.name
                        );
                      }}
                      className="flex-1 px-6 py-3 rounded-2xl bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Transisikan Otomatis ke Status Approved
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 5: ASSIGNEES (LIST OF EMPLOYEES RECEIVING TASKS) */}
      {activeTab === 'assignees' && userRole === 'Manager' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#b90f0f]" /> Daftar Karyawan Penerima Tugas KPI & OKR
                </h3>
                <p className="text-xs text-slate-500">
                  Berikut adalah tabel pemantauan seluruh karyawan beserta penugasan KPI mingguan yang didelegasikan oleh para Manager & Admin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Bulan:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                >
                  <option value="Juli 2026">Juli 2026</option>
                  <option value="Agustus 2026">Agustus 2026</option>
                  <option value="All">Semua Bulan</option>
                </select>
              </div>
            </div>

            {/* Structured Table Layout */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <table className="whitespace-nowrap w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                    <th className="p-4">ID Karyawan</th>
                    <th className="p-4">Nama Karyawan</th>
                    <th className="p-4 min-w-[220px]">Task dari Admin/Manager</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status & Progres</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {employees.map((emp) => {
                    // Find all tasks assigned to this employee
                    const empTasks = kpiTasks.filter(t => {
                      const matchEmployee = t.employeeId === emp.id;
                      const matchMonth = filterMonth === 'All' || t.month === filterMonth;
                      return matchEmployee && matchMonth;
                    });

                    const totalTasks = empTasks.length;
                    const approvedCount = empTasks.filter(t => t.status === 'Approved').length;
                    const pendingCount = empTasks.filter(t => t.status === 'Pending').length;
                    const submittedCount = empTasks.filter(t => t.status === 'Submitted').length;
                    const declinedCount = empTasks.filter(t => t.status === 'Declined').length;
                    
                    const overdueCount = empTasks.filter(t => t.status === 'Pending' && new Date(t.dueDate) < new Date()).length;

                    // Latest or list of due dates
                    const dueDatesStr = empTasks.length > 0 
                      ? Array.from(new Set(empTasks.map(t => t.dueDate))).slice(0, 2).join(', ') + (empTasks.length > 2 ? '...' : '')
                      : 'Tidak ada';

                    // Progress percentage
                    const progressPercent = totalTasks > 0 ? Math.round((approvedCount / totalTasks) * 100) : 0;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        {/* ID Karyawan */}
                        <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {emp.id}
                        </td>

                        {/* Nama Karyawan */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#b90f0f]/10 text-[#b90f0f] font-black text-xs flex items-center justify-center shrink-0">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">{emp.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{emp.position} • <span className="text-[#b90f0f]">{emp.department}</span></p>
                            </div>
                          </div>
                        </td>

                        {/* Task yang diberikan oleh Admin/Manager */}
                        <td className="p-4">
                          {empTasks.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">Belum ada tugas diberikan</span>
                          ) : (
                            <div className="space-y-1 max-w-xs">
                              {empTasks.slice(0, 3).map(task => (
                                <div key={task.id} className="flex items-center gap-1.5 text-[11px] truncate" title={task.title}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#b90f0f] shrink-0" />
                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{task.title}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">({task.week})</span>
                                </div>
                              ))}
                              {empTasks.length > 3 && (
                                <p className="text-[10px] font-bold text-[#b90f0f] pl-3">+{empTasks.length - 3} Tugas Lainnya...</p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Due Date */}
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                          {dueDatesStr}
                        </td>

                        {/* Status & Progress */}
                        <td className="p-4">
                          <div className="space-y-1.5 max-w-[150px]">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-500">{approvedCount}/{totalTasks} Selesai</span>
                              <span className="text-slate-700 dark:text-slate-300">{progressPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {pendingCount > 0 && (
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/20 px-1 py-0.2 rounded">
                                  {pendingCount} Pend
                                </span>
                              )}
                              {overdueCount > 0 && (
                                <span className="text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 px-1 py-0.2 rounded">
                                  {overdueCount} Overdue
                                </span>
                              )}
                              {submittedCount > 0 && (
                                <span className="text-[9px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/20 px-1 py-0.2 rounded animate-pulse">
                                  {submittedCount} Review
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedDetailEmployeeId(emp.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-white text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Detail
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReportEmployeeId(emp.id);
                                setExportSuccessMessage(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#b90f0f]/10 hover:bg-[#b90f0f]/20 text-[#b90f0f] text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PENERIMA TUGAS */}
      {selectedDetailEmployeeId && (() => {
        const emp = employees.find(e => e.id === selectedDetailEmployeeId);
        if (!emp) return null;

        const empTasks = kpiTasks.filter(t => {
          const matchEmployee = t.employeeId === emp.id;
          const matchMonth = filterMonth === 'All' || t.month === filterMonth;
          return matchEmployee && matchMonth;
        });

        const totalTasks = empTasks.length;
        const approvedCount = empTasks.filter(t => t.status === 'Approved').length;
        const pendingCount = empTasks.filter(t => t.status === 'Pending').length;
        const submittedCount = empTasks.filter(t => t.status === 'Submitted').length;
        const declinedCount = empTasks.filter(t => t.status === 'Declined').length;
        
        // Overdue counts
        const overdueCount = empTasks.filter(t => t.status === 'Pending' && new Date(t.dueDate) < new Date()).length;

        // Tasks with attachments/submissions
        const withAttachmentCount = empTasks.filter(t => t.submission && (t.submission.fileName || t.submission.proofLink)).length;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#b90f0f]/10 text-[#b90f0f] font-black text-sm flex items-center justify-center shrink-0">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Detail Penugasan: {emp.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {emp.position} • <span className="font-bold text-[#b90f0f]">{emp.department}</span> (ID: {emp.id})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetailEmployeeId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-50 dark:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Task</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{totalTasks}</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                  <span className="text-[10px] font-bold text-emerald-500 block uppercase">Approved</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{approvedCount}</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-center">
                  <span className="text-[10px] font-bold text-blue-500 block uppercase">Review</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{submittedCount}</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-center">
                  <span className="text-[10px] font-bold text-amber-500 block uppercase">Pending</span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">{pendingCount}</span>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-center">
                  <span className="text-[10px] font-bold text-rose-500 block uppercase">Overdue</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400">{overdueCount}</span>
                </div>
                <div className="bg-[#b90f0f]/5 p-3 rounded-2xl border border-[#b90f0f]/10 text-center">
                  <span className="text-[10px] font-bold text-[#b90f0f] block uppercase">File Uploaded</span>
                  <span className="text-lg font-black text-[#b90f0f]">{withAttachmentCount}</span>
                </div>
              </div>

              {/* Task Details List */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Daftar Pekerjaan Yang Ditugaskan ({filterMonth === 'All' ? 'Semua Bulan' : filterMonth}):
                </h4>

                {empTasks.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-700/10 rounded-2xl border border-dashed border-slate-250 dark:border-slate-700">
                    <p className="text-xs text-slate-400 italic">Belum ada tugas didelegasikan untuk karyawan ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {empTasks.map((task) => {
                      const isOverdue = task.status === 'Pending' && new Date(task.dueDate) < new Date();
                      return (
                        <div key={task.id} className="p-4 rounded-2xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-xs space-y-3 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">
                                  {task.week} ({task.month})
                                </span>
                                <span className="text-[10px] font-bold bg-[#b90f0f]/10 text-[#b90f0f] px-2 py-0.5 rounded">
                                  Bobot: {getTaskWeight(task, kpiTasks)}%
                                </span>
                              </div>
                              <h5 className="font-extrabold text-slate-950 dark:text-white text-sm mt-1.5">{task.title}</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.description}</p>
                            </div>

                            <div className="sm:text-right shrink-0">
                              {task.status === 'Approved' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-xl border border-emerald-150">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                </span>
                              )}
                              {task.status === 'Submitted' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-1 rounded-xl border border-blue-150 animate-pulse">
                                  <Clock className="w-3.5 h-3.5" /> Menunggu Review
                                </span>
                              )}
                              {task.status === 'Pending' && (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                                  isOverdue
                                    ? 'text-rose-700 bg-rose-50 border-rose-150 dark:bg-rose-950/40 dark:text-rose-400'
                                    : 'text-amber-700 bg-amber-50 border-amber-150 dark:bg-amber-950/40 dark:text-amber-400'
                                }`}>
                                  <AlertCircle className="w-3.5 h-3.5" /> {isOverdue ? 'Overdue (Terlambat)' : 'Pending'}
                                </span>
                              )}
                              {task.status === 'Declined' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-1 rounded-xl border border-rose-150">
                                  <X className="w-3.5 h-3.5" /> Perlu Revisi / Declined
                                </span>
                              )}
                              <p className="text-[10px] text-slate-400 mt-1 font-medium">Tenggat: <strong className="font-mono">{task.dueDate}</strong></p>
                            </div>
                          </div>

                          {/* Submission Attachment */}
                          {task.submission && (
                            <div className="bg-slate-50 dark:bg-slate-700/35 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  📄 Lampiran Bukti: {task.submission.fileName || 'N/A'} 
                                  <span className="text-[10px] font-normal text-slate-400">({task.submission.fileSize || 'Ukuran Tidak Diketahui'})</span>
                                </span>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <button
                                    onClick={() => handleInspectTaskProof(task)}
                                    className="px-3 py-1 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-all"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Inspeksi & Beri Penilaian
                                  </button>
                                  {task.submission.proofLink && (
                                    <a
                                      href={task.submission.proofLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" /> Link
                                    </a>
                                  )}
                                </div>
                              </div>
                              {task.submission.notes && (
                                <p className="text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                  &ldquo;{task.submission.notes}&rdquo;
                                </p>
                              )}
                            </div>
                          )}

                          {/* Grading & Evaluation */}
                          {task.score !== undefined && (
                            <div className="bg-emerald-50/40 dark:bg-emerald-950/5 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Nilai Reviewer:</span>
                                <span className="font-mono font-black text-emerald-600 ml-1.5">{task.score} / 100</span>
                                {task.reviewNotes && (
                                  <p className="text-slate-500 dark:text-slate-400 italic mt-0.5">&ldquo;{task.reviewNotes}&rdquo;</p>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 sm:text-right">Dinilai oleh: {task.reviewedBy || 'Manager'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedDetailEmployeeId(null)}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-bold text-xs"
                >
                  Tutup Detail
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetailEmployeeId(null);
                    setSelectedReportEmployeeId(emp.id);
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-slate-750 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" /> Lihat Laporan Lengkap
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: REPORT PENERIMA TUGAS */}
      {selectedReportEmployeeId && (() => {
        const emp = employees.find(e => e.id === selectedReportEmployeeId);
        if (!emp) return null;

        const empTasks = kpiTasks.filter(t => {
          const matchEmployee = t.employeeId === emp.id;
          const matchMonth = filterMonth === 'All' || t.month === filterMonth;
          return matchEmployee && matchMonth;
        });

        const empTasksWithAutoWeight = empTasks.map(t => ({
          ...t,
          weight: getTaskWeight(t, kpiTasks)
        }));

        // Group tasks by week to calculate weekly averages and accumulated monthly score
        const weeksMap: Record<string, number[]> = {
          'Minggu 1': [],
          'Minggu 2': [],
          'Minggu 3': [],
          'Minggu 4': [],
          'Minggu 5': []
        };

        empTasksWithAutoWeight.forEach(t => {
          if (t.score !== undefined && weeksMap[t.week]) {
            weeksMap[t.week].push(t.score);
          }
        });

        const evaluatedWeekScores = Object.values(weeksMap)
          .filter(scores => scores.length > 0)
          .map(scores => scores.reduce((a, b) => a + b, 0) / scores.length);

        const finalWeightedScore = evaluatedWeekScores.length > 0
          ? Math.round(evaluatedWeekScores.reduce((a, b) => a + b, 0) / evaluatedWeekScores.length)
          : (emp.kpiScore || 0);

        // Grade assignment
        let performanceGrade = 'C - CUKUP (DEVELOPING)';
        let gradeColor = 'text-amber-600 dark:text-amber-400';
        let gradeBg = 'bg-amber-50 dark:bg-amber-950/20 border-amber-100';

        if (finalWeightedScore >= 90) {
          performanceGrade = 'A - SANGAT MEMUASKAN (OUTSTANDING)';
          gradeColor = 'text-emerald-600 dark:text-emerald-400';
          gradeBg = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100';
        } else if (finalWeightedScore >= 80) {
          performanceGrade = 'B - MEMUASKAN (MEETS EXPECTATIONS)';
          gradeColor = 'text-blue-600 dark:text-blue-400';
          gradeBg = 'bg-blue-50 dark:bg-blue-950/20 border-blue-100';
        } else if (finalWeightedScore < 70) {
          performanceGrade = 'D - PERLU PERBAIKAN (NEEDS IMPROVEMENT)';
          gradeColor = 'text-rose-600 dark:text-rose-400';
          gradeBg = 'bg-rose-50 dark:bg-rose-950/20 border-rose-100';
        }

        const handleDownloadReport = () => {
          setIsExportingPdf(true);
          setExportSuccessMessage(null);
          setTimeout(() => {
            setIsExportingPdf(false);
            setExportSuccessMessage(`Laporan KPI & OKR individual karyawan ${emp.name} berhasil dihasilkan dan dibuka untuk dicetak / diunduh sebagai PDF.`);
            addAuditLog(
              'EXPORT_PDF',
              currentUser.name,
              `Mengekspor Laporan Kinerja KPI & OKR individual untuk ${emp.name} (ID: ${emp.id})`
            );
            printKPIReportPDF(
              emp,
              filterMonth,
              finalWeightedScore,
              performanceGrade,
              empTasksWithAutoWeight,
              currentUser.name
            );
          }, 500);
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-[#b90f0f]" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Cetak Laporan Kinerja KPI & OKR
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedReportEmployeeId(null);
                    setExportSuccessMessage(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-50 dark:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {exportSuccessMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-emerald-900 dark:text-emerald-300 text-xs">Unduh Berhasil!</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">{exportSuccessMessage}</p>
                  </div>
                </div>
              )}

              {/* REPORT CARD CONTAINER (PREVIEW FOR PRINTING) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/35 space-y-6 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                
                {/* Official Header */}
                <div className="text-center pb-4 border-b-2 border-slate-300 dark:border-slate-700 space-y-1">
                  <h4 className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">
                    PT JERJHON ENTERPRISE
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                    Jl. Boulevard Raya Barat No. 88, Jakarta Selatan • Telp: (021) 555-8899
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tracking-widest uppercase mt-2">
                    LAPORAN PENILAIAN KINERJA KPI INDIVIDUAL
                  </p>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-2">
                    <span>No. Dokumen: JJ-HC/KPI/2026/{emp.id.replace('EMP-', '')}</span>
                    <span>Periode Laporan: {filterMonth === 'All' ? 'Tahun Buku 2026' : filterMonth}</span>
                  </div>
                </div>

                {/* Employee Info Grid */}
                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex"><span className="w-24 text-slate-400 font-bold uppercase text-[9px]">ID Karyawan:</span><span className="font-mono font-bold text-slate-950 dark:text-white">{emp.id}</span></div>
                    <div className="flex"><span className="w-24 text-slate-400 font-bold uppercase text-[9px]">Nama Lengkap:</span><span className="font-extrabold text-slate-950 dark:text-white">{emp.name}</span></div>
                    <div className="flex"><span className="w-24 text-slate-400 font-bold uppercase text-[9px]">Divisi / Dept:</span><span className="font-bold text-[#b90f0f]">{emp.department}</span></div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex"><span className="w-24 text-slate-400 font-bold uppercase text-[9px]">Jabatan:</span><span className="font-bold">{emp.position}</span></div>
                    <div className="flex"><span className="w-24 text-slate-400 font-bold uppercase text-[9px]">Atasan Langsung:</span><span className="font-bold">{emp.supervisor || 'HR Department'}</span></div>
                    <div className="flex"><span className="w-24 text-slate-400 font-bold uppercase text-[9px]">Tanggal Cetak:</span><span className="font-mono">2026-07-27</span></div>
                  </div>
                </div>

                {/* Weighted Score & Appraisal Card */}
                <div className={`p-4 rounded-2xl border ${gradeBg} flex flex-col md:flex-row items-center justify-between gap-4`}>
                  <div className="space-y-1.5 text-center md:text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kualifikasi Kinerja Akhir</span>
                    <h5 className={`text-sm font-black tracking-wide ${gradeColor}`}>{performanceGrade}</h5>
                    <p className="text-[10px] text-slate-500 font-medium">Berdasarkan kalkulasi bobot dan pencapaian tugas KPI minggu berjalan.</p>
                  </div>
                  <div className="text-center shrink-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Skor KPI Terbobot</span>
                    <span className="text-3xl font-black text-slate-950 dark:text-white font-mono">{finalWeightedScore} <span className="text-xs text-slate-400 font-normal">/ 100</span></span>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>PROGRESS PENCAPAIAN TARGET KPI:</span>
                    <span>{finalWeightedScore}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[#b90f0f] transition-all duration-500" style={{ width: `${finalWeightedScore}%` }} />
                  </div>
                </div>

                {/* Detail Tasks Table */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">Rincian Penilaian per Parameter Tugas KPI</span>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <table className="whitespace-nowrap w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-black text-[9px] tracking-wider">
                          <th className="p-2.5">Minggu</th>
                          <th className="p-2.5">Deskripsi / Judul Tugas</th>
                          <th className="p-2.5 text-center">Bobot</th>
                          <th className="p-2.5">Status Bukti</th>
                          <th className="p-2.5 text-center">Skor</th>
                          <th className="p-2.5 text-center">Nilai Akhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {empTasksWithAutoWeight.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-400 italic">Tidak ada tugas KPI yang tercatat pada periode ini.</td>
                          </tr>
                        ) : (
                          empTasksWithAutoWeight.map(task => {
                            const hasNotes = !!task.submission?.fileName;
                            const scoreVal = task.score !== undefined ? task.score : '-';
                            const weightedVal = task.score !== undefined ? Math.round((task.score * task.weight) / 100) : '-';
                            return (
                              <tr key={task.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                                <td className="p-2.5 font-bold font-mono">{task.week.replace('Minggu ', 'W')}</td>
                                <td className="p-2.5">
                                  <div className="font-extrabold text-slate-900 dark:text-white">{task.title}</div>
                                  <div className="text-[10px] text-slate-400 font-medium line-clamp-1">{task.description}</div>
                                </td>
                                <td className="p-2.5 text-center font-bold font-mono">{task.weight}%</td>
                                <td className="p-2.5">
                                  <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    task.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' :
                                    task.status === 'Submitted' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' :
                                    task.status === 'Declined' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' :
                                    'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                                  }`}>
                                    {task.status} {hasNotes && '📎'}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center font-bold font-mono text-slate-900 dark:text-white">{scoreVal}</td>
                                <td className="p-2.5 text-center font-black font-mono text-[#b90f0f]">{weightedVal}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Validation Signature Lines */}
                <div className="pt-6 grid grid-cols-2 gap-8 text-center">
                  <div className="space-y-12">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dibuat & Diverifikasi Oleh</p>
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-slate-900 dark:text-white underline">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Direct Supervisor / Manager</p>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Disetujui & Diarsipkan Oleh</p>
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-slate-900 dark:text-white underline">Gugum Gumilar</p>
                      <p className="text-[10px] text-slate-400 font-medium">Bussiness Owner</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Action Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReportEmployeeId(null);
                    setExportSuccessMessage(null);
                  }}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-bold text-xs"
                >
                  Tutup Laporan
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={isExportingPdf}
                  className="px-6 py-2 rounded-xl bg-[#b90f0f] hover:bg-[#9a0c0c] disabled:bg-[#b90f0f]/50 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  {isExportingPdf ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Mengekspor PDF Laporan...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Cetak / Unduh PDF Laporan Kinerja
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL 1: CREATE NEW TASK ASSIGNMENT */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#b90f0f]" /> Berikan Assignment KPI Baru
              </h3>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              {/* Employee Assignee */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Karyawan:</label>
                <select
                  value={newTaskForm.employeeId}
                  onChange={(e) => handleEmployeeSelectInCreate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold outline-none focus:border-[#b90f0f]"
                  required
                >
                  {(employees || []).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.department} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Judul Task / Assignment:</label>
                <input
                  type="text"
                  placeholder="Contoh: Audit Stok Gudang A & B / Setup Live TikTok"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#b90f0f]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Instruksi Pekerjaan:</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan detail instruksi dan kriteria bukti pekerjaan yang harus diupload karyawan..."
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#b90f0f]"
                  required
                />
              </div>

              {/* Grid: Week, Month, Weight, Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Periode Bulan:</label>
                  <select
                    value={newTaskForm.month}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, month: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Juli 2026">Juli 2026</option>
                    <option value="Agustus 2026">Agustus 2026</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Minggu Ke-:</label>
                  <select
                    value={newTaskForm.week}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, week: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Minggu 1">Minggu 1</option>
                    <option value="Minggu 2">Minggu 2</option>
                    <option value="Minggu 3">Minggu 3</option>
                    <option value="Minggu 4">Minggu 4</option>
                    <option value="Minggu 5">Minggu 5</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bobot Penilaian (%): <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">(Terhitung Otomatis)</span>
                  </label>
                  {(() => {
                    const existingCount = kpiTasks.filter(t => 
                      t.employeeId === newTaskForm.employeeId && 
                      t.month === newTaskForm.month && 
                      t.week === newTaskForm.week
                    ).length;
                    const nextCount = existingCount + 1;
                    const nextWeight = Number((100 / nextCount).toFixed(1));
                    return (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                          <span>Bobot Tugas Ini: {nextWeight}%</span>
                          <span className="bg-emerald-200/60 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-mono">
                            {nextCount} Task di {newTaskForm.week}
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                          {existingCount === 0 
                            ? `Tugas pertama di ${newTaskForm.week} otomatis mendapat bobot 100%.` 
                            : `Sudah ada ${existingCount} tugas di ${newTaskForm.week}. Bobot 100% dibagi rata menjadi ${nextWeight}% per tugas.`}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tenggat Waktu (Due Date):</label>
                  <input
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold shadow-sm"
                >
                  Kirim Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EMPLOYEE SUBMIT PROOF FILE UPLOAD */}
      {showSubmitModal && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#b90f0f]" /> Upload Bukti Pekerjaan KPI
                </h3>
                <p className="text-xs text-slate-400">Tugas: {selectedTask.title}</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
              {/* Drag & Drop File Upload Box */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Dokumen / File Bukti Pekerjaan:
                </label>
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-5 text-center hover:border-[#b90f0f] transition-all bg-slate-50 dark:bg-slate-700/50">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {submissionForm.isSimulatingUpload ? (
                    <div className="space-y-2 py-2">
                      <RefreshCw className="w-8 h-8 text-[#b90f0f] animate-spin mx-auto" />
                      <p className="font-bold text-slate-700 dark:text-slate-200">Mengunggah & Memeriksa File...</p>
                    </div>
                  ) : submissionForm.fileName ? (
                    <div className="space-y-2 py-1">
                      <FileCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">{submissionForm.fileName}</p>
                        <p className="text-[10px] text-slate-400">Ukuran: {submissionForm.fileSize}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full inline-block">
                        ✓ File Siap Dikirim
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Klik atau Drag & Drop File Bukti di Sini</p>
                        <p className="text-[10px] text-slate-400">Mendukung PDF, Excel (.xlsx), Word, Gambar Screenshot PNG/JPG (Maks 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Preset Buttons */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                    Atau Pilih Template Contoh Berkas Bukti (1-Klik Simulasi):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => selectPresetTemplate('pdf')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 font-bold text-slate-700 dark:text-slate-200 truncate transition-all"
                    >
                      📄 Laporan PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => selectPresetTemplate('excel')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 font-bold text-slate-700 dark:text-slate-200 truncate transition-all"
                    >
                      📊 Excel Rekap
                    </button>
                    <button
                      type="button"
                      onClick={() => selectPresetTemplate('image')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 font-bold text-slate-700 dark:text-slate-200 truncate transition-all"
                    >
                      🖼️ Screenshot
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Proof URL Link */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Link Tautan Bukti Tambahan (Drive, Sheet, Figma, atau TikTok):
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={submissionForm.proofLink}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, proofLink: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#b90f0f]"
                />
              </div>

              {/* Submission Description Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pekerjaan & Hasil Pencapaian:
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan ringkasan singkat hasil pekerjaan yang telah diselesaikan untuk direview manager..."
                  value={submissionForm.notes}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#b90f0f]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold shadow-sm"
                >
                  Kirim Bukti Pekerjaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGER REVIEW & PRESET SCORING (0-100) */}
      {showReviewModal && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#b90f0f]" /> Review Manager & Penilaian KPI
                </h3>
                <p className="text-xs text-slate-400">Karyawan: {selectedTask.employeeName} ({selectedTask.department})</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Info & Attached Proof */}
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-2 text-xs">
              <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                {selectedTask.title}
              </span>
              <p className="text-slate-500 dark:text-slate-300">{selectedTask.description}</p>

              {selectedTask.submission ? (
                <div className="mt-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#b90f0f] flex items-center gap-1">
                      📄 Dokumen Bukti: {selectedTask.submission.fileName}
                    </span>
                    {selectedTask.submission.proofLink && (
                      <a
                        href={selectedTask.submission.proofLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Buka Link
                      </a>
                    )}
                  </div>
                  {selectedTask.submission.notes && (
                    <p className="text-slate-600 dark:text-slate-300 italic">
                      &ldquo;{selectedTask.submission.notes}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-rose-500 font-semibold italic">Belum ada dokumen bukti diupload karyawan.</p>
              )}
            </div>

            {/* Preset Score Rules Buttons (As Requested by User) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Pilih Preset Aturan Nilai Reviewer Jerjhon (10 - 100):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => applyScorePreset(100)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    reviewForm.scorePreset === 100
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-600 text-sm">Nilai 100</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="font-bold block mt-1 text-slate-800 dark:text-white">Berhasil & Sesuai Ekspektasi</span>
                  <span className="text-[10px] text-slate-500">Lengkap tanpa kekurangan.</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyScorePreset(85)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    reviewForm.scorePreset === 85
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-600 text-sm">Nilai 85</span>
                    <Star className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="font-bold block mt-1 text-slate-800 dark:text-white">Berhasil (Ada Catatan)</span>
                  <span className="text-[10px] text-slate-500">Hasil baik dengan revisi minor.</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyScorePreset(70)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    reviewForm.scorePreset === 70
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-600 text-sm">Nilai 70</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="font-bold block mt-1 text-slate-800 dark:text-white">Pending / Butuh Kelanjutan</span>
                  <span className="text-[10px] text-slate-500">Pekerjaan sebagian selesai.</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyScorePreset(50)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    reviewForm.scorePreset === 50
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 ring-2 ring-orange-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-orange-600 text-sm">Nilai 50</span>
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="font-bold block mt-1 text-slate-800 dark:text-white">Progres Terbatas</span>
                  <span className="text-[10px] text-slate-500">Belum memenuhi, ada catatan.</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyScorePreset(0)}
                  className={`p-3 rounded-xl text-left border sm:col-span-2 transition-all ${
                    reviewForm.scorePreset === 0
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-rose-600 text-sm">Nilai 0</span>
                    <X className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="font-bold block mt-1 text-slate-800 dark:text-white">Tidak Mengerjakan Sama Sekali</span>
                  <span className="text-[10px] text-slate-500">Tidak ada pengiriman bukti / overdue.</span>
                </button>
              </div>
            </div>

            {/* Custom Numeric Adjustment Slider */}
            <div className="space-y-1 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Skor Akhir (Atur Presisi):</span>
                <span className="font-mono font-black text-[#b90f0f] text-base">{reviewForm.score} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={reviewForm.score}
                onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value) })}
                className="w-full accent-[#b90f0f] cursor-pointer"
              />
            </div>

            {/* Reviewer Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Evaluasi / Feedback Manager:
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan catatan apresiasi atau saran perbaikan untuk karyawan..."
                value={reviewForm.reviewNotes}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                className="w-full text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#b90f0f]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleSaveReview('Declined')}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800"
              >
                Minta Revisi / Decline
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveReview('Approved')}
                  className="px-5 py-2 rounded-xl bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Simpan Nilai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: WORK PROOF INSPECTOR MODAL FOR ADMIN & MANAGER */}
      {inspectingTaskProof && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#b90f0f]/10 text-[#b90f0f] font-black text-sm flex items-center justify-center shrink-0 border border-[#b90f0f]/20">
                  {inspectingTaskProof.employeeName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-[#b90f0f]/10 text-[#b90f0f] px-2 py-0.5 rounded-md">
                      {inspectingTaskProof.week} • {inspectingTaskProof.month}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {inspectingTaskProof.id}</span>
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base mt-0.5">
                    Inspeksi Hasil Kerja: {inspectingTaskProof.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assigned to: <strong className="text-slate-800 dark:text-slate-200 font-bold">{inspectingTaskProof.employeeName}</strong> ({inspectingTaskProof.department})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingTaskProof(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Description & Meta */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-500">Deskripsi Penugasan:</span>
                <span className="text-[#b90f0f] font-bold">Bobot: {getTaskWeight(inspectingTaskProof, kpiTasks)}%</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-medium">{inspectingTaskProof.description}</p>
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-200/60 dark:border-slate-700/60">
                <span>Tenggat Waktu: <strong className="font-mono text-slate-800 dark:text-slate-200">{inspectingTaskProof.dueDate}</strong></span>
                <span>Status Saat Ini: <strong className="font-bold text-[#b90f0f]">{inspectingTaskProof.status}</strong></span>
              </div>
            </div>

            {/* Submission Evidence Section */}
            <div className="space-y-3">
              <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#b90f0f]" /> Detail Dokumen & Tautan Bukti Karyawan
              </h4>

              {inspectingTaskProof.submission ? (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  {/* File Info Box */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-rose-50 text-[#b90f0f] dark:bg-rose-950/60 dark:text-rose-400 rounded-xl font-bold shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                          {inspectingTaskProof.submission.fileName}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span>Ukuran: {inspectingTaskProof.submission.fileSize || '1.5 MB'}</span>
                          <span>•</span>
                          <span className="uppercase font-mono font-bold text-slate-600 dark:text-slate-300">Format: {inspectingTaskProof.submission.fileType || 'PDF'}</span>
                          <span>•</span>
                          <span>Dikirim: {inspectingTaskProof.submission.submittedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowDocumentViewer(!showDocumentViewer)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{showDocumentViewer ? 'Tutup Preview' : 'Pratinjau Viewer'}</span>
                      </button>
                      {inspectingTaskProof.submission.proofLink && (
                        <a
                          href={inspectingTaskProof.submission.proofLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Link</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Interactive Document Viewer Simulator */}
                  {showDocumentViewer && (
                    <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[11px] space-y-2 border border-slate-800 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] pb-2 border-b border-slate-800">
                        <span className="font-bold text-slate-200">INTERNAL DOCUMENT INSPECTOR • JERJHON ENTERPRISE</span>
                        <span className="text-emerald-400 font-bold">✓ VERIFIED AUTHENTIC</span>
                      </div>
                      <p className="text-white font-bold">📄 [Pratinjau Berkas Karyawan: {inspectingTaskProof.submission.fileName}]</p>
                      <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-slate-300 text-[10px] space-y-1">
                        <p><strong className="text-amber-300">Ringkasan Dokumen:</strong> Berkas ini berisi laporan hasil kerja, bukti tangkapan layar, dan dokumentasi pencapaian KPI yang telah diselesaikan oleh karyawan {inspectingTaskProof.employeeName}.</p>
                        <p><strong className="text-blue-300">Total Halaman:</strong> 3 Halaman terverifikasi.</p>
                        <p><strong className="text-emerald-300">Security Check:</strong> No malicious content detected (Checksum SHA256 matches).</p>
                      </div>
                    </div>
                  )}

                  {/* Staff Notes */}
                  {inspectingTaskProof.submission.notes && (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">Catatan Keterangan dari Staff:</span>
                      <p className="text-slate-800 dark:text-slate-200 italic font-medium">
                        &ldquo;{inspectingTaskProof.submission.notes}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Staff ini belum mengunggah berkas/tautan bukti pekerjaan untuk task ini.</span>
                </div>
              )}
            </div>

            {/* Review & Grading Panel for Admin / Manager */}
            {!isStaff && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#b90f0f]" /> Form Penilaian Reviewer Manager / Admin
                </h4>

                {/* Preset buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    { val: 100, label: '100 Sempurna' },
                    { val: 85, label: '85 Baik' },
                    { val: 70, label: '70 Cukup' },
                    { val: 50, label: '50 Kurang' },
                    { val: 0, label: '0 Ditolak' },
                  ].map(preset => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => applyScorePreset(preset.val as 100 | 85 | 70 | 50 | 0)}
                      className={`p-2 rounded-xl font-bold text-center border transition-all ${
                        reviewForm.scorePreset === preset.val
                          ? 'border-[#b90f0f] bg-rose-50 text-[#b90f0f] dark:bg-rose-950/60 dark:text-rose-300 ring-2 ring-[#b90f0f]/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">Presisi Skor:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={reviewForm.score}
                    onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value) })}
                    className="w-full accent-[#b90f0f] cursor-pointer"
                  />
                  <span className="font-mono font-black text-[#b90f0f] text-base shrink-0">{reviewForm.score} / 100</span>
                </div>

                {/* Feedback textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Evaluasi / Feedback Reviewer:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan apresiasi atau instruksi perbaikan untuk staff..."
                    value={reviewForm.reviewNotes}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#b90f0f]"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      reviewKPITask(
                        inspectingTaskProof.id,
                        reviewForm.score,
                        reviewForm.scorePreset,
                        reviewForm.scoreLabel,
                        reviewForm.reviewNotes,
                        'Declined',
                        currentUser.name
                      );
                      setInspectingTaskProof(null);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800"
                  >
                    Minta Revisi / Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      reviewKPITask(
                        inspectingTaskProof.id,
                        reviewForm.score,
                        reviewForm.scorePreset,
                        reviewForm.scoreLabel,
                        reviewForm.reviewNotes,
                        'Approved',
                        currentUser.name
                      );
                      setInspectingTaskProof(null);
                    }}
                    className="px-5 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Simpan Nilai</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon Component for File Upload Ready
const FileCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 101118 0 9 9 0 01-18 0z" />
  </svg>
);
