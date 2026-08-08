import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Edit,
  Award,
  BookOpen,
  CheckCircle2,
  Star,
  Search,
  Plus,
  X,
  ChevronRight,
  Filter,
  TrendingUp,
  Calendar,
  DollarSign,
  UserCheck,
  Briefcase,
  Trash2,
  FileText,
  Users,
  Check,
  ChevronDown,
  Info,
  Shield,
  Clock,
  BookMarked,
  MessageSquare,
  Sparkles,
  PieChart as PieChartIcon,
  MessageCircle,
  Mail
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

interface CandidateChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

interface Candidate {
  id: string;
  name: string;
  position: string;
  department: string;
  stage: 'Screening' | 'Technical Interview' | 'Offering' | 'Hired' | 'Rejected';
  rating: number;
  appliedDate: string;
  email: string;
  phone: string;
  experience: number; // in years
  education: string;
  skills: string[];
  interviewerNotes: string;
  interviewScore: number; // 0-100
  checklist: CandidateChecklistItem[];
}

interface TrainingReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface Training {
  id: string;
  title: string;
  trainerId: string; // Employee ID or external
  trainer: string;
  participantsCount: number;
  participants: string[]; // employee ids
  status: 'Upcoming' | 'In Progress' | 'Completed';
  budget: number;
  description: string;
  department: string;
  startDate: string;
  endDate: string;
  syllabus: string[];
  reviews: TrainingReview[];
}

export const RecruitmentTrainingView: React.FC = () => {
  const { employees } = useERP();

  // Core Local States for Candidates and Trainings
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: 'CND-1',
      name: 'Dewi Lestari, S.T.',
      position: 'Warehouse Automation Lead',
      department: 'Operations',
      stage: 'Technical Interview',
      rating: 5,
      appliedDate: '2026-07-20',
      email: 'dewi.lestari@gmail.com',
      phone: '+62 812-3456-7890',
      experience: 6,
      education: 'S1 Teknik Elektro - Institut Teknologi Bandung',
      skills: ['PLC Programming', 'IoT Solutions', 'SCADA', 'Warehouse Systems'],
      interviewerNotes: 'Sangat menguasai sistem otomasi robotika logistik modern. Portofolio di e-commerce logistik terkemuka sangat impresif.',
      interviewScore: 92,
      checklist: [
        { id: '1', label: 'Screening Resume', done: true },
        { id: '2', label: 'HR Interview & English Test', done: true },
        { id: '3', label: 'Technical Assessment Coding', done: true },
        { id: '4', label: 'Reference Check', done: false },
        { id: '5', label: 'Offering Letter', done: false }
      ]
    },
    {
      id: 'CND-2',
      name: 'Bambang Triatmojo',
      position: 'TikTok Shop Live Specialist',
      department: 'Marketing',
      stage: 'Offering',
      rating: 4,
      appliedDate: '2026-07-22',
      email: 'bambang.tri@hotmail.com',
      phone: '+62 821-9876-5432',
      experience: 4,
      education: 'S1 Ilmu Komunikasi - Universitas Indonesia',
      skills: ['Live Selling', 'Video Editing', 'Social Media Campaign', 'TikTok Ads'],
      interviewerNotes: 'Karisma luar biasa di depan kamera. Memiliki rekam jejak mendongkrak GMV toko kosmetik lokal hingga 200%. Menunggu konfirmasi offering letter.',
      interviewScore: 88,
      checklist: [
        { id: '1', label: 'Screening Resume', done: true },
        { id: '2', label: 'Kamera & Livestream Audition', done: true },
        { id: '3', label: 'Interview Manager Marketing', done: true },
        { id: '4', label: 'Offering Letter Issued', done: true },
        { id: '5', label: 'Offering Contract Signed', done: false }
      ]
    },
    {
      id: 'CND-3',
      name: 'Siska Putri, S.Farm',
      position: 'Quality Control R&D Assistant',
      department: 'Production',
      stage: 'Screening',
      rating: 4,
      appliedDate: '2026-07-25',
      email: 'siska.putri@unpad.ac.id',
      phone: '+62 878-1122-3344',
      experience: 2,
      education: 'S1 Farmasi - Universitas Padjadjaran',
      skills: ['Chemical Analysis', 'BPOM Regulation', 'Halal Certification', 'HPLC'],
      interviewerNotes: 'Lulusan baru dengan sertifikasi laboratorium lengkap. Sangat bersemangat, menguasai alur pengajuan sertifikasi BPOM.',
      interviewScore: 78,
      checklist: [
        { id: '1', label: 'Screening Resume', done: true },
        { id: '2', label: 'Technical Test & Interview', done: false },
        { id: '3', label: 'Panel Interview', done: false },
        { id: '4', label: 'Medical Check Up', done: false }
      ]
    },
    {
      id: 'CND-4',
      name: 'Andi Wijaya, M.B.A',
      position: 'Senior Brand Manager',
      department: 'Marketing',
      stage: 'Hired',
      rating: 5,
      appliedDate: '2026-07-12',
      email: 'andi.wijaya@gmail.com',
      phone: '+62 811-2233-4455',
      experience: 8,
      education: 'S2 Magister Bisnis - Gadjah Mada University',
      skills: ['Brand Positioning', 'Digital Analytics', 'ATL & BTL Campaign', 'Budgeting'],
      interviewerNotes: 'Pengalaman memimpin produk FMCG multinasional. Hired dengan kesepakatan gaji yang kompetitif.',
      interviewScore: 95,
      checklist: [
        { id: '1', label: 'Screening Resume', done: true },
        { id: '2', label: 'Panel Presentation', done: true },
        { id: '3', label: 'Offering Approved', done: true },
        { id: '4', label: 'Signed Contract & Onboarding', done: true }
      ]
    },
    {
      id: 'CND-5',
      name: 'Rian Hidayat',
      position: 'Warehouse Picker Specialist',
      department: 'Operations',
      stage: 'Rejected',
      rating: 2,
      appliedDate: '2026-07-15',
      email: 'rian.hidayat@yahoo.com',
      phone: '+62 856-7890-1234',
      experience: 1,
      education: 'SMA Negeri 1 Bekasi',
      skills: ['Inventory Checking', 'Forklift operation'],
      interviewerNotes: 'Keterampilan dasar baik, namun skor tes integritas & kedisiplinan kerja kurang memenuhi standar operasional Jerjhon.',
      interviewScore: 55,
      checklist: [
        { id: '1', label: 'Screening Resume', done: true },
        { id: '2', label: 'Physical & Security Check', done: true },
        { id: '3', label: 'Interviewer Review', done: true }
      ]
    }
  ]);

  const [trainings, setTrainings] = useState<Training[]>([
    {
      id: 'TRN-101',
      title: 'Standard Operating Procedure (SOP) Halal & BPOM GMP Cosmetics',
      trainerId: 'EMP-1002',
      trainer: 'Drs. Irwan Hermawan',
      participantsCount: 24,
      participants: ['EMP-1004', 'EMP-1005', 'EMP-1006'],
      status: 'Completed',
      budget: 15000000,
      description: 'Pelatihan intensif pemahaman regulasi BPOM, sanitasi ruang produksi kosmetik GMP (Good Manufacturing Practice), serta alur sistem jaminan halal (SJH).',
      department: 'Production',
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      syllabus: [
        'Prinsip Dasar Cara Pembuatan Kosmetika yang Baik (CPKB)',
        'Sistem Dokumentasi Batch Record & Sanitasi Alat',
        'Titik Kritis Kehalalan Bahan Baku & Pengajuan via SiHalal',
        'Audit Internal & Penanganan Temuan BPOM'
      ],
      reviews: [
        { id: 'r1', author: 'Rina Wijaya', rating: 5, comment: 'Sangat praktikal dan mudah dipahami. Membantu tim logistik memahami penempatan bahan halal.', date: '2026-07-04' },
        { id: 'r2', author: 'Budi Santoso', rating: 4, comment: 'Materi audit internal sangat mendalam. Waktu pelatihan bisa ditambah.', date: '2026-07-05' }
      ]
    },
    {
      id: 'TRN-102',
      title: 'TikTok Live Stream GMV Booster & Ads Algorithm 2026',
      trainerId: 'EMP-1004',
      trainer: 'Rina Wijaya',
      participantsCount: 12,
      participants: ['EMP-1004', 'EMP-1007'],
      status: 'In Progress',
      budget: 8500000,
      description: 'Strategi optimasi interaksi live streaming, pengaturan hook retensi 3 detik pertama, optimalisasi voucher penarik konversi belanja, dan cara mengarahkan traffic berbayar (Paid Ads) ke keranjang kuning.',
      department: 'Marketing',
      startDate: '2026-07-28',
      endDate: '2026-08-02',
      syllabus: [
        'Psikologi Penjualan & Hook Kata-kata Pembuka Live',
        'Membaca Data Dashboard Live Real-Time & CTR',
        'A/B Testing Campaign Ads Tik Tok Shop',
        'Trik Menghindari Banned Konten Sensitif'
      ],
      reviews: []
    },
    {
      id: 'TRN-103',
      title: 'Cybersecurity & ISO 27001 Data Privacy Compliance',
      trainerId: 'EMP-1001',
      trainer: 'Heri Gunawan',
      participantsCount: 18,
      participants: ['EMP-1001', 'EMP-1002', 'EMP-1004'],
      status: 'Upcoming',
      budget: 12000000,
      description: 'Pelatihan pengenalan protokol keamanan data pelanggan Jerjhon ERP, mitigasi serangan Social Engineering (Phishing), serta kepatuhan undang-undang perlindungan data pribadi.',
      department: 'Operations',
      startDate: '2026-08-10',
      endDate: '2026-08-12',
      syllabus: [
        'Ancaman Siber Terkini & Ransomware Mitigation',
        'Keamanan Password & Autentikasi Multi-Faktor (MFA)',
        'SOP Penanganan Kebocoran Data',
        'Kepatuhan Regulasi UU Pelindungan Data Pribadi (UU PDP)'
      ],
      reviews: []
    }
  ]);

  // Main navigation & filters state
  const [activeSubTab, setActiveSubTab] = useState<'recruitment' | 'training' | 'analytics'>('recruitment');
  
  // Recruitment view state filters
  const [recSearch, setRecSearch] = useState('');
  const [recStageFilter, setRecStageFilter] = useState<'All' | 'Screening' | 'Technical Interview' | 'Offering' | 'Hired' | 'Rejected'>('All');
  const [recDeptFilter, setRecDeptFilter] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showEditCandidateModal, setShowEditCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Training view state filters
  const [trnStatusFilter, setTrnStatusFilter] = useState<'All' | 'Upcoming' | 'In Progress' | 'Completed'>('All');
  const [trnDeptFilter, setTrnDeptFilter] = useState('All');
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showAddTrainingModal, setShowAddTrainingModal] = useState(false);
  const [showEditTrainingModal, setShowEditTrainingModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [regParticipantId, setRegParticipantId] = useState('');

  // Add Candidate Form State
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    position: '',
    department: 'Marketing',
    email: '',
    phone: '',
    experience: 1,
    education: '',
    skills: '',
    interviewerNotes: ''
  });

  // AI CV/Portfolio Parsing State
  const [candidateAddMode, setCandidateAddMode] = useState<'ai' | 'manual'>('ai');
  const [cvFile, setCvFile] = useState<{ base64: string, name: string, size: string, mimeType: string } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedCandidate, setParsedCandidate] = useState<any | null>(null);

  // File helper to check format and read as DataURL (base64)
  const processUploadedFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Format berkas harus berupa PDF (.pdf) untuk CV & Portofolio.');
      setCvFile(null);
      return;
    }
    
    // File size check (cap at 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setParseError('Ukuran file maksimal adalah 8MB');
      setCvFile(null);
      return;
    }

    setParseError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const base64 = dataUrl.split(',')[1];
        setCvFile({
          base64,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          mimeType: 'application/pdf'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Parse CV/Portfolio with Gemini AI
  const handleParseCV = async () => {
    if (!cvFile) {
      setParseError('Silakan unggah berkas CV & Portofolio dalam format PDF terlebih dahulu.');
      return;
    }
    setIsParsing(true);
    setParseError('');
    setParsedCandidate(null);
    try {
      const res = await fetch('/api/gemini/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileBase64: cvFile.base64,
          mimeType: cvFile.mimeType
        })
      });
      const data = await res.json();
      if (data.success && data.candidate) {
        setParsedCandidate(data.candidate);
      } else {
        setParseError(data.error || 'Gagal menganalisis CV dengan AI. Silakan coba beberapa saat lagi.');
      }
    } catch (err) {
      console.error(err);
      setParseError('Terjadi kesalahan koneksi saat menghubungi server AI.');
    } finally {
      setIsParsing(false);
    }
  };

  // Submit AI parsed candidate
  const handleAddAICandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedCandidate || !parsedCandidate.name || !parsedCandidate.position) return;

    const created: Candidate = {
      id: `CND-${candidates.length + 1}`,
      name: parsedCandidate.name,
      position: parsedCandidate.position,
      department: parsedCandidate.department,
      stage: 'Screening',
      rating: parsedCandidate.rating || 3,
      appliedDate: new Date().toISOString().substring(0, 10),
      email: parsedCandidate.email || 'applicant@jerjhon.com',
      phone: parsedCandidate.phone || '+62 800-0000',
      experience: Number(parsedCandidate.experience || 1),
      education: parsedCandidate.education || 'Sarjana (S1)',
      skills: Array.isArray(parsedCandidate.skills) ? parsedCandidate.skills : ['Interpersonal'],
      interviewerNotes: parsedCandidate.interviewerNotes || 'Selesai screening awal, berkas dokumen administrasi lengkap.',
      interviewScore: parsedCandidate.interviewScore || 0,
      checklist: [
        { id: '1', label: 'Screening Resume', done: true },
        { id: '2', label: 'Technical Assessment', done: false },
        { id: '3', label: 'Interview HR / Manager', done: false },
        { id: '4', label: 'Offering Letter', done: false }
      ]
    };

    setCandidates(prev => [created, ...prev]);
    setShowAddCandidateModal(false);
    // Reset AI states
    setCvFile(null);
    setParsedCandidate(null);
    setParseError('');
    setCandidateAddMode('ai');
  };

  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Add Training Form State
  const [newTraining, setNewTraining] = useState({
    title: '',
    trainer: '',
    description: '',
    department: 'Marketing',
    budget: 5000000,
    startDate: '',
    endDate: '',
    syllabus: ''
  });

  // --- HANDLERS & INTERACTIONS ---

  // Handle Candidate Stage Transitions
  const handleUpdateStage = (id: string, nextStage: Candidate['stage']) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        // Automatically check off checklists according to stages
        const updatedChecklist = [...c.checklist];
        if (nextStage === 'Technical Interview' && updatedChecklist[1]) updatedChecklist[1].done = true;
        if (nextStage === 'Offering' && updatedChecklist[2]) updatedChecklist[2].done = true;
        if (nextStage === 'Hired') {
          updatedChecklist.forEach(item => item.done = true);
        }
        
        const updated = { ...c, stage: nextStage, checklist: updatedChecklist };
        if (selectedCandidate && selectedCandidate.id === id) {
          setSelectedCandidate(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  // Toggle checklist item for candidate
  const handleToggleChecklist = (candidateId: string, checklistItemId: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        const updatedChecklist = c.checklist.map(item => 
          item.id === checklistItemId ? { ...item, done: !item.done } : item
        );
        const updated = { ...c, checklist: updatedChecklist };
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          setSelectedCandidate(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  // Rate candidate
  const handleRateCandidate = (id: string, score: number) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, rating: score };
        if (selectedCandidate && selectedCandidate.id === id) {
          setSelectedCandidate(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  // Submit Candidate Interview Score
  const handleUpdateInterviewScore = (id: string, score: number, notes: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, interviewScore: score, interviewerNotes: notes };
        if (selectedCandidate && selectedCandidate.id === id) {
          setSelectedCandidate(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  // Create a new Candidate
  const handleAddCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.position) return;

    const skillList = newCandidate.skills
      ? newCandidate.skills.split(',').map(s => s.trim())
      : ['Interpersonal', 'Adaptability'];

    const created: Candidate = {
      id: `CND-${candidates.length + 1}`,
      name: newCandidate.name,
      position: newCandidate.position,
      department: newCandidate.department,
      stage: 'Screening',
      rating: 3,
      appliedDate: new Date().toISOString().substring(0, 10),
      email: newCandidate.email || 'applicant@jerjhon.com',
      phone: newCandidate.phone || '+62 800-0000',
      experience: Number(newCandidate.experience),
      education: newCandidate.education || 'Sarjana (S1)',
      skills: skillList,
      interviewerNotes: newCandidate.interviewerNotes || 'Selesai screening awal, berkas dokumen administrasi lengkap.',
      interviewScore: 0,
      checklist: [
        { id: '1', label: 'Screening Resume', done: true },
        { id: '2', label: 'Technical Assessment', done: false },
        { id: '3', label: 'Interview HR / Manager', done: false },
        { id: '4', label: 'Offering Letter', done: false }
      ]
    };

    setCandidates(prev => [created, ...prev]);
    setShowAddCandidateModal(false);
    // Reset form
    setNewCandidate({
      name: '',
      position: '',
      department: 'Marketing',
      email: '',
      phone: '',
      experience: 1,
      education: '',
      skills: '',
      interviewerNotes: ''
    });
  };

  // Delete Candidate from local state
  const handleDeleteCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    if (selectedCandidate?.id === id) {
      setSelectedCandidate(null);
    }
  };

  // Submit Candidate Edits
  const handleEditCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    setCandidates(prev => prev.map(c => {
      if (c.id === editingCandidate.id) {
        if (selectedCandidate && selectedCandidate.id === editingCandidate.id) {
          setSelectedCandidate(editingCandidate);
        }
        return editingCandidate;
      }
      return c;
    }));
    setShowEditCandidateModal(false);
    setEditingCandidate(null);
  };

  // Register Participant to Training
  const handleAddParticipant = (trainingId: string) => {
    if (!regParticipantId) return;
    const emp = employees.find(e => e.id === regParticipantId);
    if (!emp) return;

    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        if (t.participants.includes(regParticipantId)) return t;
        const updatedParticipants = [...t.participants, regParticipantId];
        const updated = {
          ...t,
          participants: updatedParticipants,
          participantsCount: updatedParticipants.length
        };
        if (selectedTraining && selectedTraining.id === trainingId) {
          setSelectedTraining(updated);
        }
        return updated;
      }
      return t;
    }));
    setRegParticipantId('');
  };

  // Remove Participant from Training
  const handleRemoveParticipant = (trainingId: string, empId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        const updatedParticipants = t.participants.filter(id => id !== empId);
        const updated = {
          ...t,
          participants: updatedParticipants,
          participantsCount: Math.max(0, updatedParticipants.length)
        };
        if (selectedTraining && selectedTraining.id === trainingId) {
          setSelectedTraining(updated);
        }
        return updated;
      }
      return t;
    }));
  };

  // Create a new Training Program
  const handleAddTrainingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraining.title || !newTraining.trainer) return;

    const syllabusList = newTraining.syllabus
      ? newTraining.syllabus.split('\n').filter(s => s.trim().length > 0)
      : ['Prinsip Dasar Kerja', 'Implementasi Alur Kerja Jerjhon', 'Evaluasi & Sertifikasi'];

    const created: Training = {
      id: `TRN-${Date.now().toString().slice(-4)}`,
      title: newTraining.title,
      trainerId: 'EXTERNAL',
      trainer: newTraining.trainer,
      participantsCount: 0,
      participants: [],
      status: 'Upcoming',
      budget: Number(newTraining.budget),
      description: newTraining.description || 'Deskripsi program pelatihan karyawan internal.',
      department: newTraining.department,
      startDate: newTraining.startDate || new Date().toISOString().substring(0, 10),
      endDate: newTraining.endDate || new Date().toISOString().substring(0, 10),
      syllabus: syllabusList,
      reviews: []
    };

    setTrainings(prev => [...prev, created]);
    setShowAddTrainingModal(false);
    // Reset form
    setNewTraining({
      title: '',
      trainer: '',
      description: '',
      department: 'Marketing',
      budget: 5000000,
      startDate: '',
      endDate: '',
      syllabus: ''
    });
  };

  // Submit Training Edits
  const handleEditTrainingSubmit = (e: React.FormEvent, syllabusStr: string) => {
    e.preventDefault();
    if (!editingTraining) return;

    const syllabusList = syllabusStr
      ? syllabusStr.split('\n').filter(s => s.trim().length > 0)
      : editingTraining.syllabus;

    const updated: Training = {
      ...editingTraining,
      syllabus: syllabusList
    };

    setTrainings(prev => prev.map(t => {
      if (t.id === updated.id) {
        if (selectedTraining && selectedTraining.id === updated.id) {
          setSelectedTraining(updated);
        }
        return updated;
      }
      return t;
    }));
    setShowEditTrainingModal(false);
    setEditingTraining(null);
  };

  // Delete Training Program
  const handleDeleteTraining = (id: string) => {
    setTrainings(prev => prev.filter(t => t.id !== id));
    if (selectedTraining && selectedTraining.id === id) {
      setSelectedTraining(null);
    }
  };

  // Add Review / Rating to Completed Training
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', author: '' });
  const handleAddReview = (trainingId: string) => {
    if (!reviewForm.comment) return;

    const newReview: TrainingReview = {
      id: `REV-${Date.now()}`,
      author: reviewForm.author || 'Anonim',
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      date: new Date().toISOString().substring(0, 10)
    };

    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        const updatedReviews = [...t.reviews, newReview];
        const updated = { ...t, reviews: updatedReviews };
        if (selectedTraining && selectedTraining.id === trainingId) {
          setSelectedTraining(updated);
        }
        return updated;
      }
      return t;
    }));
    setReviewForm({ rating: 5, comment: '', author: '' });
  };

  // --- MEMOIZED CALCULATIONS & FILTERING ---

  // Dashboard Stats Calculations
  const metrics = useMemo(() => {
    const totalApplicants = candidates.length;
    const activeInterviews = candidates.filter(c => c.stage === 'Technical Interview').length;
    const pendingReview = candidates.filter(c => c.stage === 'Screening').length;
    const totalHired = candidates.filter(c => c.stage === 'Hired').length;

    const totalActiveTrainings = trainings.filter(t => t.status === 'In Progress').length;
    const totalBudget = trainings.reduce((acc, t) => acc + t.budget, 0);

    const averageRating = candidates.length > 0
      ? (candidates.reduce((sum, c) => sum + c.rating, 0) / candidates.length).toFixed(1)
      : '0.0';

    return {
      totalApplicants,
      activeInterviews,
      pendingReview,
      totalHired,
      totalActiveTrainings,
      totalBudget,
      averageRating
    };
  }, [candidates, trainings]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(recSearch.toLowerCase()) ||
                          c.position.toLowerCase().includes(recSearch.toLowerCase());
      const matchStage = recStageFilter === 'All' || c.stage === recStageFilter;
      const matchDept = recDeptFilter === 'All' || c.department === recDeptFilter;
      return matchSearch && matchStage && matchDept;
    });
  }, [candidates, recSearch, recStageFilter, recDeptFilter]);

  // Filtered Trainings
  const filteredTrainings = useMemo(() => {
    return trainings.filter(t => {
      const matchStatus = trnStatusFilter === 'All' || t.status === trnStatusFilter;
      const matchDept = trnDeptFilter === 'All' || t.department === trnDeptFilter;
      return matchStatus && matchDept;
    });
  }, [trainings, trnStatusFilter, trnDeptFilter]);

  // --- RECHARTS CHART DATA PREPARATION ---

  // 1. Candidate Pipeline Funnel Data
  const funnelData = useMemo(() => {
    const screening = candidates.filter(c => c.stage === 'Screening').length;
    const interview = candidates.filter(c => c.stage === 'Technical Interview').length;
    const offering = candidates.filter(c => c.stage === 'Offering').length;
    const hired = candidates.filter(c => c.stage === 'Hired').length;
    const rejected = candidates.filter(c => c.stage === 'Rejected').length;

    return [
      { name: '1. Screening', 'Jumlah Pelamar': screening, fill: '#64748b' },
      { name: '2. Wawancara', 'Jumlah Pelamar': interview, fill: '#f59e0b' },
      { name: '3. Offering', 'Jumlah Pelamar': offering, fill: '#3b82f6' },
      { name: '4. Hired', 'Jumlah Pelamar': hired, fill: '#10b981' },
      { name: '5. Rejected', 'Jumlah Pelamar': rejected, fill: '#ef4444' }
    ];
  }, [candidates]);

  // 2. Training Budget Allocation by Department
  const budgetAllocationData = useMemo(() => {
    const depts: Record<string, number> = {};
    trainings.forEach(t => {
      depts[t.department] = (depts[t.department] || 0) + t.budget;
    });

    return Object.entries(depts).map(([name, value]) => ({
      name,
      value
    }));
  }, [trainings]);

  // Colors for Budget Pie Chart
  const COLORS = ['#b90f0f', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      
      {/* Dynamic Jumbotron Header */}
      <div className="bg-gradient-to-r from-[#b90f0f] via-rose-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-rose-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-rose-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-12 -mt-12 pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-[#b90f0f] rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-rose-200">
              <Sparkles size={12} /> Recruitment & Certified Academy
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Sistem Otomasi Rekrutmen & Pengembangan Karyawan
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-sans">
              Kelola seluruh proses akuisisi bakat (Talent Acquisition) hingga pengayaan keterampilan kerja (Training Academy) secara real-time dan terintegrasi di Jerjhon Cosmetics Group.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => {
                setNewCandidate({
                  name: '',
                  position: '',
                  department: 'Marketing',
                  email: '',
                  phone: '',
                  experience: 1,
                  education: '',
                  skills: '',
                  interviewerNotes: ''
                });
                setShowAddCandidateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl hover:bg-slate-50 transition active:scale-95 shadow-md"
            >
              <UserPlus className="w-4 h-4 text-[#b90f0f]" /> Add Candidate
            </button>
            
            <button
              onClick={() => setShowAddTrainingModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#b90f0f] text-white font-extrabold text-xs sm:text-sm rounded-2xl border border-rose-700 hover:bg-rose-850 transition active:scale-95 shadow-md"
            >
              <Plus className="w-4 h-4" /> Schedule Academy
            </button>
          </div>
        </div>
      </div>

      {/* Top Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Candidates */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Total Pelamar</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{metrics.totalApplicants}</span>
            <span className="text-[9px] text-slate-500 block">Screening: {metrics.pendingReview}</span>
          </div>
        </div>

        {/* Interviews */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Interview Aktif</span>
            <span className="text-lg font-black text-amber-600 font-mono">{metrics.activeInterviews}</span>
            <span className="text-[9px] text-slate-500 block">Jadwal Minggu ini</span>
          </div>
        </div>

        {/* Hired Metrics */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Berhasil Diterima</span>
            <span className="text-lg font-black text-emerald-600 font-mono">{metrics.totalHired}</span>
            <span className="text-[9px] text-slate-500 block">Rate: {metrics.averageRating}★</span>
          </div>
        </div>

        {/* Academy budget */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-[#b90f0f] flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Investasi Academy</span>
            <span className="text-base font-black text-[#b90f0f] font-mono leading-none">Rp {(metrics.totalBudget / 1000000).toFixed(1)}jt</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">{metrics.totalActiveTrainings} Program Berjalan</span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setActiveSubTab('recruitment');
            setSelectedCandidate(null);
          }}
          className={`pb-3 px-4 font-extrabold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'recruitment'
              ? 'border-[#b90f0f] text-[#b90f0f]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Rekrutmen & Pipeline ({filteredCandidates.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab('training');
            setSelectedTraining(null);
          }}
          className={`pb-3 px-4 font-extrabold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'training'
              ? 'border-[#b90f0f] text-[#b90f0f]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Certified Academy ({filteredTrainings.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab('analytics');
          }}
          className={`pb-3 px-4 font-extrabold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'analytics'
              ? 'border-[#b90f0f] text-[#b90f0f]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Analisis Keuangan & Funnel
        </button>
      </div>

      {/* VIEWPORT CONTROLLER */}
      {activeSubTab === 'recruitment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Candidates Pipeline Column list (Col 7) */}
          <div className={`${selectedCandidate ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'} space-y-4`}>
            
            {/* Filter controls panel */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama pelamar atau posisi..."
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              {/* Department & Stage Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Department Filter */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={recDeptFilter}
                    onChange={(e) => setRecDeptFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold outline-none text-slate-700 dark:text-slate-300 cursor-pointer pr-1"
                  >
                    <option value="All">Semua Divisi</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Production">Production</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Creative">Creative</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                {/* Stage selector pills */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <select
                    value={recStageFilter}
                    onChange={(e) => setRecStageFilter(e.target.value as any)}
                    className="bg-transparent border-none text-xs font-semibold outline-none text-slate-700 dark:text-slate-300 cursor-pointer pr-1"
                  >
                    <option value="All">Semua Tahap</option>
                    <option value="Screening">1. Screening</option>
                    <option value="Technical Interview">2. Interview</option>
                    <option value="Offering">3. Offering</option>
                    <option value="Hired">4. Hired</option>
                    <option value="Rejected">5. Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Candidate List Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
              {filteredCandidates.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center space-y-2 col-span-full">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Tidak ada pelamar ditemukan</p>
                  <p className="text-xs text-slate-400">Silakan sesuaikan kriteria filter atau buat pendaftaran pelamar baru.</p>
                </div>
              ) : (
                filteredCandidates.map((c) => {
                  const isSelected = selectedCandidate?.id === c.id;
                  let stageBg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  if (c.stage === 'Technical Interview') stageBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400';
                  if (c.stage === 'Offering') stageBg = 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400';
                  if (c.stage === 'Hired') stageBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400';
                  if (c.stage === 'Rejected') stageBg = 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400';

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
                      className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs ${
                        isSelected
                          ? 'border-[#b90f0f] bg-rose-50/10 dark:bg-rose-950/10'
                          : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        {/* Status bar */}
                        <div className={`w-1 h-12 rounded-full shrink-0 ${
                          c.stage === 'Hired' ? 'bg-emerald-500' :
                          c.stage === 'Rejected' ? 'bg-rose-500' :
                          c.stage === 'Offering' ? 'bg-blue-500' :
                          c.stage === 'Technical Interview' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm hover:text-[#b90f0f]">{c.name}</h4>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                              ({c.id})
                            </span>
                          </div>
                          <p className="text-xs font-black text-[#b90f0f] mt-0.5">{c.position}</p>
                          
                          {/* Details line */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-500 mt-1.5 font-sans">
                            <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">
                              {c.department}
                            </span>
                            <span>• Exp: {c.experience} thn</span>
                            <span>• Applied: {c.appliedDate}</span>
                          </div>
                          
                          {/* Quick Contacts */}
                          <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            {c.phone && (
                              <a 
                                href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-bold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 px-2 py-1 rounded-md transition-colors"
                                title="Hubungi via WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                              </a>
                            )}
                            {c.email && (
                              <a 
                                href={`mailto:${c.email}`} 
                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 px-2 py-1 rounded-md transition-colors"
                                title="Kirim Email"
                              >
                                <Mail className="w-3 h-3" /> Email
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right action block */}
                      <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${stageBg}`}>
                          {c.stage}
                        </span>

                        <div className="flex items-center gap-1">
                          <div className="flex items-center text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < c.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            ({c.rating}.0)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Candidate Profile Details Drawer Panel (Col 5) */}
          {selectedCandidate ? (
            <div className="lg:col-span-6 xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md space-y-5 sticky top-4">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md">
                      {selectedCandidate.id}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">Terdaftar: {selectedCandidate.appliedDate}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedCandidate.name}</h3>
                  <p className="text-sm font-bold text-[#b90f0f]">{selectedCandidate.position} • {selectedCandidate.department}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCandidate({ ...selectedCandidate });
                      setShowEditCandidateModal(true);
                    }}
                    title="Edit Pelamar"
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCandidate(selectedCandidate.id)}
                    title="Hapus Pelamar"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bio & Resume Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Kontak Telepon & Email</span>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedCandidate.phone}</p>
                    {selectedCandidate.phone && (
                      <a 
                        href={`https://wa.me/${selectedCandidate.phone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
                        title="Hubungi via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedCandidate.email}</p>
                    {selectedCandidate.email && (
                      <a 
                        href={`mailto:${selectedCandidate.email}`} 
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400"
                        title="Kirim Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Riwayat Pendidikan Terakhir</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedCandidate.education}</p>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Spesialisasi Kompetensi & Skill</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.map((skill, index) => (
                    <span key={index} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md text-[10px]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Checklist Progress Bar */}
              <div className="space-y-2 border-t border-b border-slate-100 dark:border-slate-800/80 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#b90f0f]" /> Kelayakan Rekrutmen (Pipeline Checklist)
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    {Math.round(
                      (selectedCandidate.checklist.filter(item => item.done).length /
                        selectedCandidate.checklist.length) * 100
                    )}% Completed
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedCandidate.checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer select-none transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleChecklist(selectedCandidate.id, item.id)}
                        className="accent-[#b90f0f]"
                      />
                      <span className={`font-semibold ${item.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating & Assessment Board */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Interviewer Assessment & Score
                  </span>
                  
                  {/* Active Rating Clicker */}
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/40">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 mr-1">Nilai Kualifikasi:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateCandidate(selectedCandidate.id, star)}
                        className="text-amber-500 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Star className={`w-3.5 h-3.5 ${star <= selectedCandidate.rating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score updater fields */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14">
                      <span className="text-[9px] font-extrabold text-slate-400 block uppercase mb-1">Skor Tes</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={selectedCandidate.interviewScore}
                        onChange={(e) => handleUpdateInterviewScore(selectedCandidate.id, Number(e.target.value), selectedCandidate.interviewerNotes)}
                        className="w-full text-center font-mono font-black text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg p-1.5 focus:border-[#b90f0f]"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <span className="text-[9px] font-extrabold text-slate-400 block uppercase mb-1">Catatan Interviewer</span>
                      <textarea
                        rows={2}
                        value={selectedCandidate.interviewerNotes}
                        onChange={(e) => handleUpdateInterviewScore(selectedCandidate.id, selectedCandidate.interviewScore, e.target.value)}
                        placeholder="Tulis feedback evaluasi..."
                        className="w-full text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg p-1.5 focus:border-[#b90f0f]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Pipeline Stage Action Controller */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ubah Status Kandidat (Workflow Action)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleUpdateStage(selectedCandidate.id, 'Technical Interview')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedCandidate.stage === 'Technical Interview'
                        ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Wawancara
                  </button>

                  <button
                    onClick={() => handleUpdateStage(selectedCandidate.id, 'Offering')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedCandidate.stage === 'Offering'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Offering
                  </button>

                  <button
                    onClick={() => handleUpdateStage(selectedCandidate.id, 'Hired')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedCandidate.stage === 'Hired'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Terima (Hire)
                  </button>

                  <button
                    onClick={() => handleUpdateStage(selectedCandidate.id, 'Rejected')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedCandidate.stage === 'Rejected'
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Tolak (Reject)
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="hidden lg:block lg:col-span-6 xl:col-span-7 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 h-fit sticky top-4">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">Panel Assessment Kandidat</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-normal">
                Silakan pilih salah satu kandidat di sebelah kiri untuk melihat resume detail, memperbarui checklist, menginput nilai wawancara, dan memproses status kelulusan.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ACADEMY TRAININGS VIEW */}
      {activeSubTab === 'training' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Training Program List Column (Col 7) */}
          <div className={`${selectedTraining ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'} space-y-4`}>
            
            {/* Filter controls panel */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-bold">
                List Certified Academy Program
              </div>

              {/* Status & Department Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={trnDeptFilter}
                    onChange={(e) => setTrnDeptFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold outline-none text-slate-700 dark:text-slate-300 cursor-pointer pr-1"
                  >
                    <option value="All">Semua Divisi</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Production">Production</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Creative">Creative</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <select
                    value={trnStatusFilter}
                    onChange={(e) => setTrnStatusFilter(e.target.value as any)}
                    className="bg-transparent border-none text-xs font-semibold outline-none text-slate-700 dark:text-slate-300 cursor-pointer pr-1"
                  >
                    <option value="All">Semua Status</option>
                    <option value="Upcoming">Upcoming (Akan Datang)</option>
                    <option value="In Progress">In Progress (Berlangsung)</option>
                    <option value="Completed">Completed (Selesai)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List of training items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
              {filteredTrainings.map((t) => {
                const isSelected = selectedTraining?.id === t.id;
                let statusBg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                if (t.status === 'Completed') statusBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400';
                if (t.status === 'In Progress') statusBg = 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-400';
                if (t.status === 'Upcoming') statusBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTraining(t)}
                    className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer relative shadow-2xs ${
                      isSelected
                        ? 'border-[#b90f0f] bg-rose-50/10 dark:bg-rose-950/10'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                            {t.id}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 rounded">
                            {t.department}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight hover:text-[#b90f0f]">
                          {t.title}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1 font-sans">
                          <span>Trainer: <strong className="text-slate-700 dark:text-slate-300 font-bold">{t.trainer}</strong></span>
                          <span>• {t.participants.length} Peserta Terdaftar</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col justify-between items-end h-full min-h-[60px]">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${statusBg}`}>
                          {t.status}
                        </span>
                        
                        <span className="text-xs font-mono font-black text-[#b90f0f] mt-2 block">
                          Rp {t.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Training Detailed view drawer (Col 5) */}
          {selectedTraining ? (
            <div className="lg:col-span-6 xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md space-y-5 sticky top-4">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md">
                      {selectedTraining.id}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      Jadwal: {selectedTraining.startDate} s/d {selectedTraining.endDate}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1 leading-tight">
                    {selectedTraining.title}
                  </h3>
                  <p className="text-xs font-bold text-[#b90f0f] mt-0.5">
                    Trainer: {selectedTraining.trainer} • {selectedTraining.department} Division Academy
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingTraining({ ...selectedTraining });
                      setShowEditTrainingModal(true);
                    }}
                    title="Edit Academy Program"
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTraining(selectedTraining.id)}
                    title="Hapus Academy Program"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedTraining(null)}
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description & Budgets */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Tentang Pelatihan & Silabus</span>
                <p className="text-slate-600 dark:text-slate-300 leading-normal bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {selectedTraining.description}
                </p>
              </div>

              {/* Syllabus points */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Materi Pokok & Kurikulum</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTraining.syllabus.map((syl, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-200/40 dark:border-slate-800/60">
                      <BookMarked size={14} className="text-[#b90f0f] shrink-0 mt-0.5" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{syl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Participants Management Section */}
              <div className="space-y-3 border-t border-b border-slate-100 dark:border-slate-800/80 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#b90f0f]" /> Karyawan Terdaftar ({selectedTraining.participants.length} Peserta)
                  </span>

                  {/* Add participant selector form */}
                  <div className="flex items-center gap-1">
                    <select
                      value={regParticipantId}
                      onChange={(e) => setRegParticipantId(e.target.value)}
                      className="bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300"
                    >
                      <option value="">-- Pilih Karyawan --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddParticipant(selectedTraining.id)}
                      className="p-1.5 bg-[#b90f0f] text-white rounded-lg hover:bg-rose-850 active:scale-95 transition-all text-xs font-bold shrink-0"
                    >
                      Daftar
                    </button>
                  </div>
                </div>

                {/* List of registered company staff */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedTraining.participants.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-2 col-span-full text-center">
                      Belum ada karyawan yang diregistrasi pada program pelatihan ini.
                    </p>
                  ) : (
                    selectedTraining.participants.map(pId => {
                      const emp = employees.find(e => e.id === pId);
                      return (
                        <div key={pId} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate">{emp ? emp.name : 'Peserta Eksternal'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{emp ? emp.position : pId}</p>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveParticipant(selectedTraining.id, pId)}
                            title="Hapus Peserta"
                            className="p-1 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Feedbacks Assessment Panel (Only for Completed Trainings) */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ulasan & Feedback Kepuasan Pelatihan
                </span>

                {selectedTraining.status === 'Completed' ? (
                  <div className="space-y-3">
                    {/* Reviews feed */}
                    {selectedTraining.reviews.length > 0 && (
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        {selectedTraining.reviews.map((rev) => (
                          <div key={rev.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-200/40 text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{rev.author}</span>
                              <div className="flex items-center text-amber-400 gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span className="font-bold font-mono">{rev.rating}</span>
                              </div>
                            </div>
                            <p className="text-slate-500 italic">"{rev.comment}"</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Review input fields */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <select
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                          className="bg-white dark:bg-slate-700 text-xs border border-slate-200 p-1.5 rounded-lg font-bold"
                        >
                          <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                          <option value="4">⭐⭐⭐⭐ (4)</option>
                          <option value="3">⭐⭐⭐ (3)</option>
                          <option value="2">⭐⭐ (2)</option>
                          <option value="1">⭐ (1)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Nama penilai..."
                          value={reviewForm.author}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, author: e.target.value }))}
                          className="flex-1 bg-white dark:bg-slate-700 text-xs border border-slate-200 rounded-lg p-1.5"
                        />
                      </div>
                      
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Tulis ulasan/kritik membangun..."
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                          className="flex-1 bg-white dark:bg-slate-700 text-xs border border-slate-200 rounded-lg p-1.5"
                        />
                        <button
                          onClick={() => handleAddReview(selectedTraining.id)}
                          className="px-3 bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 text-xs font-bold rounded-lg transition"
                        >
                          Kirim
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <p className="leading-normal">
                      Ulasan kepuasan & evaluasi kepatuhan sertifikat hanya dapat diberikan setelah status training program ini diperbarui menjadi <strong className="font-extrabold">Completed</strong>.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="hidden lg:block lg:col-span-6 xl:col-span-7 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 h-fit sticky top-4">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">Dashboard Kurikulum Training</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-normal">
                Pilih salah satu agenda pelatihan di samping kiri untuk mengelola daftar absensi peserta, melihat rincian silabus kelas, budget alokasi, serta mengisi ulasan rating program.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ANALYTICS & BUDGET PERFORMANCE TAB */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Recruitment Funnel Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck size={16} className="text-[#b90f0f]" /> Konversi Pipeline Recruitment (Funnel)
                </h3>
                <p className="text-[10px] text-slate-400">Distribusi sebaran kandidat pelamar kerja di setiap tingkatan interview.</p>
              </div>

              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                    <RechartsTooltip />
                    <Bar dataKey="Jumlah Pelamar" radius={[4, 4, 0, 0]}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Budget Allocation Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <PieChartIcon size={16} className="text-[#b90f0f]" /> Alokasi Anggaran Academy Berdasarkan Divisi
                </h3>
                <p className="text-[10px] text-slate-400">Total sebaran budget investasi program peningkatan mutu karyawan (Sertifikat Halal, GMP, Tik Tok).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 h-[250px]">
                <div className="sm:col-span-7 h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {budgetAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => `Rp ${val.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="sm:col-span-5 text-xs space-y-2 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pl-4">
                  {budgetAllocationData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Rp {item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* 3. Training Progress vs Budget Trend Line */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp size={16} className="text-[#b90f0f]" /> Hubungan Budget Program & Efisiensi Jumlah Partisipan
              </h3>
              <p className="text-[10px] text-slate-400">Analisis perbandingan antara biaya budget teralokasi dengan jumlah jangkauan partisipan karyawan yang lulus pelatihan.</p>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trainings.map(t => ({ name: t.id, Budget: t.budget / 1000000, Peserta: t.participants.length }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="left" label={{ value: 'Budget (Juta Rp)', angle: -90, position: 'insideLeft', style: {fontSize: 8} }} tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Peserta', angle: 90, position: 'insideRight', style: {fontSize: 8} }} tick={{ fontSize: 9 }} />
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line yAxisId="left" type="monotone" dataKey="Budget" stroke="#b90f0f" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Peserta" stroke="#0ea5e9" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DIALOGS --- */}

      {/* 1. Add Candidate Modal */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus size={18} className="text-[#b90f0f]" /> Registrasi Pelamar Baru
              </h3>
              <button
                onClick={() => {
                  setShowAddCandidateModal(false);
                  setParsedCandidate(null);
                  setCvFile(null);
                  setParseError('');
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCandidateAddMode('ai')}
                className={`flex-1 pb-2 text-center font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  candidateAddMode === 'ai'
                    ? 'border-[#b90f0f] text-[#b90f0f]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4" /> AI Auto-Parse CV & Portofolio
              </button>
              <button
                type="button"
                onClick={() => setCandidateAddMode('manual')}
                className={`flex-1 pb-2 text-center font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  candidateAddMode === 'manual'
                    ? 'border-[#b90f0f] text-[#b90f0f]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Registrasi Manual
              </button>
            </div>

            {/* AI AUTO PARSING MODE */}
            {candidateAddMode === 'ai' && (
              <div className="space-y-4">
                {isParsing ? (
                  /* Loading State */
                  <div className="p-8 text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-rose-100 dark:border-rose-950/40"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-[#b90f0f] animate-spin"></div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">Menganalisis CV & Portofolio...</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">Gemini AI sedang memproses berkas PDF Anda untuk mengekstrak profil kompetensi, riwayat kerja, tingkat pendidikan, rating, serta info kontak.</p>
                    </div>
                  </div>
                ) : !parsedCandidate ? (
                  /* Form Input CV File Drop */
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Format Wajib: Dokumen PDF (.pdf)</p>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Unggah berkas CV dan Portofolio gabungan milik pelamar dalam format PDF. AI kami akan mendeteksi nama, jabatan, info kontak, pengalaman, dan menyusunnya langsung ke dalam Pipeline Rekrutmen.
                      </p>
                    </div>

                    {!cvFile ? (
                      /* Drag and Drop Zone */
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative ${
                          dragActive
                            ? 'border-[#b90f0f] bg-rose-50/10'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 dark:text-slate-300">Seret & letakkan file PDF CV/Portofolio di sini</p>
                        <p className="text-[10px] text-slate-400 mt-1">atau klik untuk menelusuri file dari komputer Anda (Maksimal 8MB)</p>
                      </div>
                    ) : (
                      /* File Preview Mode */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/40 text-[#b90f0f] rounded-xl">
                              <FileText size={24} />
                            </div>
                            <div className="text-left">
                              <p className="font-extrabold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[300px]">
                                {cvFile.name}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{cvFile.size} • PDF Document</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCvFile(null)}
                            className="p-1.5 text-slate-400 hover:text-[#b90f0f] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                            title="Hapus File"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {parseError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-[#b90f0f] rounded-xl font-bold">
                        {parseError}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAddCandidateModal(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleParseCV}
                        disabled={!cvFile}
                        className="px-5 py-2 bg-[#b90f0f] hover:bg-[#b90f0f]/90 text-white font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles size={14} /> Konversi & Analisis PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Review and Edit AI Parsed Candidate fields */
                  <form onSubmit={handleAddAICandidateSubmit} className="space-y-4 text-xs">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-emerald-800 dark:text-emerald-300">Ekstraksi CV Berhasil!</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Silakan tinjau dan sesuaikan data pelamar di bawah ini sebelum disimpan ke rekrutmen pipeline.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Nama Lengkap & Gelar *</label>
                        <input
                          type="text"
                          required
                          value={parsedCandidate.name}
                          onChange={(e) => setParsedCandidate(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Posisi Rekomendasi *</label>
                        <input
                          type="text"
                          required
                          value={parsedCandidate.position}
                          onChange={(e) => setParsedCandidate(prev => ({ ...prev, position: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Divisi Departemen</label>
                        <select
                          value={parsedCandidate.department}
                          onChange={(e) => setParsedCandidate(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                        >
                          <option value="Marketing">Marketing</option>
                          <option value="Production">Production</option>
                          <option value="Operations">Operations</option>
                          <option value="Finance">Finance</option>
                          <option value="Creative">Creative</option>
                          <option value="HR">HR</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Pengalaman (Tahun)</label>
                        <input
                          type="number"
                          min="0"
                          value={parsedCandidate.experience}
                          onChange={(e) => setParsedCandidate(prev => ({ ...prev, experience: Number(e.target.value) }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Alamat Email</label>
                        <input
                          type="email"
                          value={parsedCandidate.email}
                          onChange={(e) => setParsedCandidate(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Nomor WA / Telepon</label>
                        <input
                          type="text"
                          value={parsedCandidate.phone}
                          onChange={(e) => setParsedCandidate(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Riwayat Pendidikan</label>
                      <input
                        type="text"
                        value={parsedCandidate.education}
                        onChange={(e) => setParsedCandidate(prev => ({ ...prev, education: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Kompetensi Utama (Pisahkan dengan koma)</label>
                      <input
                        type="text"
                        value={Array.isArray(parsedCandidate.skills) ? parsedCandidate.skills.join(', ') : parsedCandidate.skills}
                        onChange={(e) => setParsedCandidate(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()) }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-400">AI Assessment Notes</label>
                      <textarea
                        rows={2}
                        value={parsedCandidate.interviewerNotes}
                        onChange={(e) => setParsedCandidate(prev => ({ ...prev, interviewerNotes: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">AI Recommended Rating (1-5)</label>
                        <div className="flex items-center gap-2">
                          <select
                            value={parsedCandidate.rating}
                            onChange={(e) => setParsedCandidate(prev => ({ ...prev, rating: Number(e.target.value) }))}
                            className="bg-white dark:bg-slate-700 border border-slate-200 rounded-lg p-1.5 font-bold outline-none"
                          >
                            <option value="1">⭐ (1)</option>
                            <option value="2">⭐⭐ (2)</option>
                            <option value="3">⭐⭐⭐ (3)</option>
                            <option value="4">⭐⭐⭐⭐ (4)</option>
                            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400 block">AI Predicted Capability Score</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={parsedCandidate.interviewScore}
                          onChange={(e) => setParsedCandidate(prev => ({ ...prev, interviewScore: Number(e.target.value) }))}
                          className="w-24 bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 outline-none font-bold text-center"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setParsedCandidate(null);
                          setCvFile(null);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                      >
                        Reset & Analisis CV Lain
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCandidateModal(false);
                            setParsedCandidate(null);
                            setCvFile(null);
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#b90f0f] hover:bg-rose-850 text-white font-bold rounded-xl transition shadow-xs"
                        >
                          Konversi & Daftarkan ke Pipeline
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* MANUAL REGISTRATION MODE */}
            {candidateAddMode === 'manual' && (
              <form onSubmit={handleAddCandidateSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Nama Lengkap & Gelar *</label>
                    <input
                      type="text"
                      required
                      value={newCandidate.name}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Contoh: Andi Saputra, M.T."
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Posisi yang Dilamar *</label>
                    <input
                      type="text"
                      required
                      value={newCandidate.position}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Contoh: Digital Marketer Expert"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Divisi / Departemen</label>
                    <select
                      value={newCandidate.department}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                    >
                      <option value="Marketing">Marketing</option>
                      <option value="Production">Production</option>
                      <option value="Operations">Operations</option>
                      <option value="Finance">Finance</option>
                      <option value="Creative">Creative</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Pengalaman Kerja (Tahun)</label>
                    <input
                      type="number"
                      min="0"
                      value={newCandidate.experience}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, experience: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Alamat Email</label>
                    <input
                      type="email"
                      value={newCandidate.email}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@pelamar.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Nomor Telepon WA</label>
                    <input
                      type="text"
                      value={newCandidate.phone}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+62 8..."
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Riwayat Pendidikan Terakhir</label>
                  <input
                    type="text"
                    value={newCandidate.education}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, education: e.target.value }))}
                    placeholder="Contoh: S1 Farmasi - Unpad"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Keahlian Utama (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    value={newCandidate.skills}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="Contoh: Excel, Live Selling, Copywriting"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Catatan Awal / Motivasi Lamaran</label>
                  <textarea
                    rows={2}
                    value={newCandidate.interviewerNotes}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, interviewerNotes: e.target.value }))}
                    placeholder="Tulis ulasan ringkas screening dokumen..."
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddCandidateModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#b90f0f] hover:bg-rose-850 text-white font-bold rounded-xl transition shadow-xs"
                  >
                    Daftarkan Pelamar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Candidate Modal */}
      {showEditCandidateModal && editingCandidate && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit size={18} className="text-[#b90f0f]" /> Edit Data Pelamar ({editingCandidate.id})
              </h3>
              <button
                onClick={() => {
                  setShowEditCandidateModal(false);
                  setEditingCandidate(null);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditCandidateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={editingCandidate.name}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Posisi yang Dilamar *</label>
                  <input
                    type="text"
                    required
                    value={editingCandidate.position}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, position: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Divisi / Departemen</label>
                  <select
                    value={editingCandidate.department}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, department: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Production">Production</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Creative">Creative</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Pengalaman Kerja (Tahun)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCandidate.experience}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, experience: Number(e.target.value) }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Alamat Email</label>
                  <input
                    type="email"
                    value={editingCandidate.email}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Nomor Telepon WA</label>
                  <input
                    type="text"
                    value={editingCandidate.phone}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Riwayat Pendidikan Terakhir</label>
                  <input
                    type="text"
                    value={editingCandidate.education}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, education: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Tahap Pipeline (Workflow Stage)</label>
                  <select
                    value={editingCandidate.stage}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, stage: e.target.value as Candidate['stage'] }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  >
                    <option value="Screening">1. Screening</option>
                    <option value="Technical Interview">2. Technical Interview</option>
                    <option value="Offering">3. Offering</option>
                    <option value="Hired">4. Hired</option>
                    <option value="Rejected">5. Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Rating Kualifikasi (1-5)</label>
                  <select
                    value={editingCandidate.rating}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, rating: Number(e.target.value) }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  >
                    <option value="1">⭐ (1)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Predicted/Interview Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingCandidate.interviewScore}
                    onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, interviewScore: Number(e.target.value) }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500 text-center font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Keahlian Utama (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={editingCandidate.skills.join(', ')}
                  onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()) }) : null)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Catatan Interviewer & Evaluasi</label>
                <textarea
                  rows={3}
                  value={editingCandidate.interviewerNotes}
                  onChange={(e) => setEditingCandidate(prev => prev ? ({ ...prev, interviewerNotes: e.target.value }) : null)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCandidateModal(false);
                    setEditingCandidate(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b90f0f] hover:bg-rose-850 text-white font-bold rounded-xl transition shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Training Modal */}
      {showEditTrainingModal && editingTraining && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit size={18} className="text-[#b90f0f]" /> Edit Academy Program ({editingTraining.id})
              </h3>
              <button
                onClick={() => {
                  setShowEditTrainingModal(false);
                  setEditingTraining(null);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => handleEditTrainingSubmit(e, editingTraining.syllabus.join('\n'))} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Judul Pelatihan (Certified Program) *</label>
                <input
                  type="text"
                  required
                  value={editingTraining.title}
                  onChange={(e) => setEditingTraining(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Nama Trainer / Pemateri *</label>
                  <input
                    type="text"
                    required
                    value={editingTraining.trainer}
                    onChange={(e) => setEditingTraining(prev => prev ? ({ ...prev, trainer: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Divisi Departemen</label>
                  <select
                    value={editingTraining.department}
                    onChange={(e) => setEditingTraining(prev => prev ? ({ ...prev, department: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Production">Production</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Creative">Creative</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Mulai Pelatihan</label>
                  <input
                    type="date"
                    required
                    value={editingTraining.startDate}
                    onChange={(e) => setEditingTraining(prev => prev ? ({ ...prev, startDate: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Selesai Pelatihan</label>
                  <input
                    type="date"
                    required
                    value={editingTraining.endDate}
                    onChange={(e) => setEditingTraining(prev => prev ? ({ ...prev, endDate: e.target.value }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Alokasi Anggaran Biaya (Rp)</label>
                  <input
                    type="number"
                    min="500000"
                    step="500000"
                    value={editingTraining.budget}
                    onChange={(e) => setEditingTraining(prev => prev ? ({ ...prev, budget: Number(e.target.value) }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Status Pelatihan</label>
                  <select
                    value={editingTraining.status}
                    onChange={(e) => setEditingTraining(prev => prev ? ({ ...prev, status: e.target.value as Training['status'] }) : null)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Deskripsi Ringkas Silabus Program</label>
                <textarea
                  rows={2}
                  value={editingTraining.description}
                  onChange={(e) => setEditingTraining(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Silabus Materi Pokok (Satu materi per baris)</label>
                <textarea
                  rows={3}
                  value={editingTraining.syllabus.join('\n')}
                  onChange={(e) => setEditingTraining(prev => prev ? ({ ...prev, syllabus: e.target.value.split('\n') }) : null)}
                  placeholder="Contoh:&#10;Cara Pembuatan Kosmetika&#10;Regulasi Halal & BPOM&#10;Praktek Sanitasi Lab"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTrainingModal(false);
                    setEditingTraining(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b90f0f] hover:bg-rose-850 text-white font-bold rounded-xl transition shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Training Modal */}
      {showAddTrainingModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen size={18} className="text-[#b90f0f]" /> Jadwalkan Kelas Academy Baru
              </h3>
              <button
                onClick={() => setShowAddTrainingModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTrainingSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Judul Pelatihan (Certified Program) *</label>
                <input
                  type="text"
                  required
                  value={newTraining.title}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Cara Pembuatan Kosmetika yang Baik (CPKB) Level 2"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Nama Trainer / Pemateri *</label>
                  <input
                    type="text"
                    required
                    value={newTraining.trainer}
                    onChange={(e) => setNewTraining(prev => ({ ...prev, trainer: e.target.value }))}
                    placeholder="Contoh: Drs. Irwan Hermawan"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Divisi Departemen</label>
                  <select
                    value={newTraining.department}
                    onChange={(e) => setNewTraining(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Production">Production</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Creative">Creative</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Mulai Pelatihan</label>
                  <input
                    type="date"
                    required
                    value={newTraining.startDate}
                    onChange={(e) => setNewTraining(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Selesai Pelatihan</label>
                  <input
                    type="date"
                    required
                    value={newTraining.endDate}
                    onChange={(e) => setNewTraining(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Alokasi Anggaran Biaya (Rp)</label>
                  <input
                    type="number"
                    min="500000"
                    step="500000"
                    value={newTraining.budget}
                    onChange={(e) => setNewTraining(prev => ({ ...prev, budget: Number(e.target.value) }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Deskripsi Ringkas Silabus Program</label>
                <textarea
                  rows={2}
                  value={newTraining.description}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Contoh: Pemahaman regulasi SJH, batch record, sanitasi ruang kosmetik..."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Silabus Materi Pokok (Satu materi per baris)</label>
                <textarea
                  rows={3}
                  value={newTraining.syllabus}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, syllabus: e.target.value }))}
                  placeholder="Contoh:&#10;Cara Pembuatan Kosmetika&#10;Regulasi Halal & BPOM&#10;Praktek Sanitasi Lab"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-semibold focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTrainingModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b90f0f] hover:bg-rose-850 text-white font-bold rounded-xl transition shadow-xs"
                >
                  Jadwalkan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
