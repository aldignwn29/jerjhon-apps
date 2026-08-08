import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Calendar, Plus, FileText, Download, Edit2, Trash2, X, Upload, Image as ImageIcon, History, Folder, CheckCircle, Clock } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { ProductRND } from '../../../types';

const LAUNCH_STAGES = [
  { id: 'S1', name: 'Ideation & Research' },
  { id: 'S2', name: 'Market & Competitive Analysis' },
  { id: 'S3', name: 'Fabric Spec & Sourcing' },
  { id: 'S4', name: '3D Pattern & Design Mockup' },
  { id: 'S5', name: 'Sample Prototyping' },
  { id: 'S6', name: 'Fitting & Wear Testing' },
  { id: 'S7', name: 'Costing & Pricing' },
  { id: 'S8', name: 'Executive Design Review' },
  { id: 'S9', name: 'Mass Production' },
  { id: 'S10', name: 'QC & Packaging' },
  { id: 'S11', name: 'Marketing Preparation' },
  { id: 'S12', name: 'Official Product Launch' }
];

export const RNDDevelopmentView: React.FC = () => {
  const { rndProjects, addRndProject, updateRndProject, deleteRndProject } = useERP();
  const safeProjects = rndProjects || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeHistoryProject, setActiveHistoryProject] = useState<ProductRND | null>(null);

  const [formData, setFormData] = useState({
    ideaTitle: '',
    category: '',
    stage: 'S1',
    progress: 0,
    leadResearcher: '',
    targetLaunchDate: ''
  });

  const handleOpenModal = (project?: ProductRND) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        ideaTitle: project.ideaTitle || '',
        category: project.category || '',
        stage: project.stage || 'S1',
        progress: project.progress || 0,
        leadResearcher: project.leadResearcher || '',
        targetLaunchDate: project.targetLaunchDate || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        ideaTitle: '',
        category: '',
        stage: 'S1',
        progress: 0,
        leadResearcher: '',
        targetLaunchDate: new Date().toISOString().substring(0, 10)
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateRndProject(editingId, {
        ...formData,
        progress: Number(formData.progress)
      });
    } else {
      const newStage = formData.stage || 'S1';
      const stageIdx = parseInt(newStage.replace('S', '')) || 1;
      const initialProgress = Math.round((stageIdx / 12) * 100);
      const stageObj = LAUNCH_STAGES.find(s => s.id === newStage);

      addRndProject({
        code: `RND-PRJ-${Math.floor(100 + Math.random() * 900)}`,
        ...formData,
        estimatedBOMCost: 0,
        targetSellingPrice: 0,
        progress: initialProgress,
        stageData: {
          historyLogs: [
            {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleString('id-ID'),
              type: 'creation',
              title: 'Proyek Dibuat',
              description: `Proyek R&D ${formData.ideaTitle} resmi dibuat di Stage ${newStage}: ${stageObj?.name || ''}`
            }
          ]
        }
      });
    }
    setIsModalOpen(false);
  };

  const handleFileUpload = (project: ProductRND, file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const stageIdx = parseInt(project.stage.replace('S', '')) || 1;
      const currentStageObj = LAUNCH_STAGES.find(s => s.id === project.stage) || LAUNCH_STAGES[0];
      const newFileObj = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        url: event.target?.result as string,
        uploadDate: new Date().toLocaleString('id-ID'),
        stageId: project.stage,
        stageName: currentStageObj.name
      };

      const existingIdeaFiles = project.stageData?.ideaFiles || [];
      const updatedIdeaFiles = [...existingIdeaFiles, newFileObj];

      const existingHistory = project.stageData?.historyLogs || [];
      const newHistoryLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('id-ID'),
        type: 'file_upload',
        title: `Dokumen Diupload (${project.stage})`,
        description: `File "${file.name}" berhasil diupload pada Stage ${stageIdx}: ${currentStageObj.name}`,
        fileUrl: event.target?.result as string,
        fileName: file.name,
        fileType: newFileObj.type
      };

      updateRndProject(project.id, {
        stageData: {
          ...project.stageData,
          ideaFiles: updatedIdeaFiles,
          historyLogs: [newHistoryLog, ...existingHistory]
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleStageChange = (project: ProductRND, newStageId: string) => {
    const newStageIndex = parseInt(newStageId.replace('S', '')) || 1;
    const newProgress = Math.round((newStageIndex / 12) * 100);
    const stageObj = LAUNCH_STAGES.find(s => s.id === newStageId) || LAUNCH_STAGES[0];

    const existingHistory = project.stageData?.historyLogs || [];
    const newHistoryLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('id-ID'),
      type: 'stage_change',
      title: `Pindah Ke Stage ${newStageIndex}`,
      description: `Proyek melanjut ke ${newStageId}: ${stageObj.name} (${newProgress}% Progress)`
    };

    updateRndProject(project.id, {
      stage: newStageId,
      progress: newProgress,
      stageData: {
        ...project.stageData,
        historyLogs: [newHistoryLog, ...existingHistory]
      }
    });
  };

  const handleExportExcel = () => {
    const data = safeProjects.map(p => ({
      'ID Proyek': p.code,
      'Nama Proyek': p.ideaTitle,
      'Kategori': p.category,
      'Stage': p.stage,
      'PIC': p.leadResearcher,
      'Target Launch': p.targetLaunchDate,
      'Progress (%)': p.progress,
      'Jumlah Dokumen': (p.stageData?.ideaFiles || []).length
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RND_Projects");
    XLSX.writeFile(wb, "Data_RND_Projects.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 35;

    // Helper to add corporate header
    const addHeader = () => {
      // Red Header Bar
      doc.setFillColor(185, 15, 15);
      doc.rect(0, 0, pageWidth, 24, 'F');

      // Title & Subtitle
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("JERJHON ENTERPRISE", 14, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("LAPORAN RESMI PENGEMBANGAN PRODUK R&D (12 STAGES FRAMEWORK)", 14, 18);

      // Date on right
      const dateStr = `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      doc.setFontSize(8);
      doc.text(dateStr, pageWidth - 14, 15, { align: 'right' });
    };

    // Helper to add page footer
    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Jerjhon Enterprise ERP - R&D Module", 14, pageHeight - 6);
      doc.text(`Halaman ${pageNum} dari ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
    };

    // First page header
    addHeader();

    // Summary Metrics Cards
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 28, pageWidth - 28, 22, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 28, pageWidth - 28, 22, 3, 3, 'D');

    const totalProjects = safeProjects.length;
    const avgProgress = totalProjects > 0 ? Math.round(safeProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects) : 0;
    const totalFiles = safeProjects.reduce((acc, p) => acc + (p.stageData?.ideaFiles?.length || 0), 0);

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TOTAL PROYEK R&D", 22, 35);
    doc.setFontSize(12);
    doc.setTextColor(185, 15, 15);
    doc.text(`${totalProjects} Proyek`, 22, 43);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.text("RATA-RATA PROGRESS", 80, 35);
    doc.setFontSize(12);
    doc.setTextColor(185, 15, 15);
    doc.text(`${avgProgress}%`, 80, 43);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.text("DOKUMEN & FOTO TERSIMPAN", 140, 35);
    doc.setFontSize(12);
    doc.setTextColor(185, 15, 15);
    doc.text(`${totalFiles} File`, 140, 43);

    yPos = 58;

    // Iterate through projects
    safeProjects.forEach((p, idx) => {
      const stageIdx = parseInt(p.stage.replace('S', '')) || 1;
      const stageObj = LAUNCH_STAGES.find(s => s.id === p.stage) || LAUNCH_STAGES[0];
      const files = p.stageData?.ideaFiles || [];

      // Calculate box height needed
      let boxHeight = 48;
      if (files.length > 0) boxHeight += 12;
      if (p.stageData?.competitorNotes || p.stageData?.fabricType || p.stageData?.finalCost || p.stageData?.poQuantity) boxHeight += 10;

      // Page overflow check
      if (yPos + boxHeight > pageHeight - 20) {
        doc.addPage();
        addHeader();
        yPos = 32;
      }

      // Card Container
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, yPos, pageWidth - 28, boxHeight, 3, 3, 'FD');

      // Top Accent Line on Card
      doc.setFillColor(185, 15, 15);
      doc.rect(14, yPos, 4, boxHeight, 'F');

      // Title & Code
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(185, 15, 15);
      doc.text(`[${p.code}] ${p.ideaTitle}`, 22, yPos + 8);

      // Category Pill
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Kategori: ${p.category || '-'}`, 22, yPos + 14);

      // Stage Badge
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`Stage ${stageIdx}/12: ${stageObj.name}`, 22, yPos + 22);

      // Progress bar representation
      doc.setFillColor(241, 245, 249);
      doc.rect(22, yPos + 25, 120, 3, 'F');
      doc.setFillColor(185, 15, 15);
      doc.rect(22, yPos + 25, Math.max(2, (120 * (p.progress || 0)) / 100), 3, 'F');

      doc.setFontSize(8);
      doc.setTextColor(185, 15, 15);
      doc.text(`${p.progress}% Complete`, 146, yPos + 28);

      // PIC and Launch Date
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`PIC / Lead: ${p.leadResearcher || '-'}`, 22, yPos + 35);
      doc.text(`Target Launch: ${p.targetLaunchDate || '-'}`, 100, yPos + 35);

      let innerY = yPos + 40;

      // Stage-specific details if available
      if (p.stageData?.competitorNotes) {
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Analisis Kompetitor: ${p.stageData.competitorNotes.substring(0, 60)}...`, 22, innerY);
        innerY += 8;
      } else if (p.stageData?.fabricType) {
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Bahan: ${p.stageData.fabricType} | Supplier: ${p.stageData.supplier || '-'}`, 22, innerY);
        innerY += 8;
      } else if (p.stageData?.finalCost) {
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`BOM Cost / Pcs: Rp ${p.stageData.finalCost.toLocaleString('id-ID')}`, 22, innerY);
        innerY += 8;
      } else if (p.stageData?.poQuantity) {
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Initial PO Qty: ${p.stageData.poQuantity} pcs`, 22, innerY);
        innerY += 8;
      }

      // File list attachment line
      if (files.length > 0) {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        const fileNames = files.map((f: any) => f.name).join(', ');
        const truncatedNames = fileNames.length > 70 ? fileNames.substring(0, 67) + '...' : fileNames;
        doc.text(`Dokumen Terlampir (${files.length}): ${truncatedNames}`, 22, innerY);
      }

      yPos += boxHeight + 6;
    });

    // Add footers to all pages
    const totalPages = (doc as any).internal.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : (doc.internal.pages.length - 1);
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    doc.save(`Jerjhon_RND_Development_Report_${new Date().toISOString().substring(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 p-2 sm:p-6 bg-slate-50/50 min-h-screen">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">R&D Product Development</h1>
          <p className="text-xs text-slate-500 font-medium">Pengembangan Produk & Dokumentasi File Berjalan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors">
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold text-sm transition-colors">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-5 py-2.5 bg-[#b90f0f] text-white hover:bg-rose-700 rounded-xl font-bold text-sm shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Tambah Proyek
          </button>
        </div>
      </div>

      {/* 12 Stages Launch Framework Jerjhon */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60">
        <h2 className="text-[13px] font-bold text-slate-400 tracking-[0.1em] uppercase mb-6">
          12 STAGES LAUNCH FRAMEWORK JERJHON:
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {LAUNCH_STAGES.map((stage) => {
            const projectCount = safeProjects.filter(p => p.stage === stage.id).length;
            const isActive = projectCount > 0;
            
            return (
              <div 
                key={stage.id} 
                className={`relative p-4 rounded-2xl border ${
                  isActive 
                    ? 'border-[#b90f0f] bg-white dark:bg-slate-800 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-80'
                } flex flex-col justify-center min-h-[90px]`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-[#b90f0f] text-lg">{stage.id}</span>
                  {isActive && (
                    <span className="bg-[#b90f0f] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {projectCount} Proyek
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">
                  {stage.name.length > 20 ? stage.name.substring(0, 17) + '...' : stage.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {safeProjects.map((project) => {
          const stageIndex = parseInt(project.stage.replace('S', '')) || 1;
          const stageDetails = LAUNCH_STAGES.find(s => s.id === project.stage) || LAUNCH_STAGES[0];
          const nextStageIndex = stageIndex < 12 ? stageIndex + 1 : 12;
          const prevStageIndex = stageIndex > 1 ? stageIndex - 1 : 1;
          
          let isNextAllowed = true;
          if (stageIndex === 1) isNextAllowed = (project.stageData?.ideaFiles?.length || 0) > 0;
          if (stageIndex === 2) isNextAllowed = (project.stageData?.competitorNotes?.length || 0) > 0;
          if (stageIndex === 3) isNextAllowed = (project.stageData?.fabricType?.length || 0) > 0 && (project.stageData?.supplier?.length || 0) > 0;
          if (stageIndex === 7) isNextAllowed = (project.stageData?.finalCost || 0) > 0;
          if (stageIndex === 9) isNextAllowed = (project.stageData?.poQuantity || 0) > 0;

          const fileCount = project.stageData?.ideaFiles?.length || 0;
          const historyCount = project.stageData?.historyLogs?.length || 0;

          return (
            <div key={project.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 transition-all hover:shadow-md group relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-full text-xs">
                    {project.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 mr-2">
                      <button onClick={() => handleOpenModal(project)} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRndProject(project.id)} className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="px-4 py-1.5 bg-[#b90f0f] text-white font-bold rounded-full text-xs">
                      Stage {stageIndex} / 12
                    </span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-end justify-between mb-3">
                    <h3 className="font-bold text-[#b90f0f] text-lg">
                      {project.ideaTitle}
                    </h3>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {project.progress}% Complete
                    </span>
                  </div>
                  <div className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Stage {stageIndex}: {stageDetails.name}
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-[#b90f0f] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Dynamic Features Per Stage */}
                {stageIndex === 1 && (
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Referensi / Ide Foto Produk</h4>
                      <span className="text-xs font-semibold text-slate-500">
                        {fileCount} File Tersimpan
                      </span>
                    </div>
                    
                    {/* File Thumbnails */}
                    {fileCount > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {project.stageData.ideaFiles.map((file: any, idx: number) => (
                          <div key={idx} className="flex-shrink-0 w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center relative group">
                            {file.type === 'image' ? (
                              <img src={file.url} alt="Reference" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-slate-400" />
                            )}
                            <button 
                              onClick={() => {
                                const newFiles = [...(project.stageData?.ideaFiles || [])];
                                newFiles.splice(idx, 1);
                                updateRndProject(project.id, { stageData: { ...project.stageData, ideaFiles: newFiles } });
                              }}
                              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500 font-medium">Klik untuk upload dokumen/foto referensi</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(project, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {stageIndex === 2 && (
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Analisis Kompetitor</h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Catatan Analisis *</label>
                      <textarea 
                        value={project.stageData?.competitorNotes || ''}
                        onChange={(e) => updateRndProject(project.id, { stageData: { ...project.stageData, competitorNotes: e.target.value } })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] outline-hidden min-h-[80px] bg-white dark:bg-slate-900"
                        placeholder="Kelebihan/kekurangan kompetitor..."
                      />
                    </div>
                  </div>
                )}

                {stageIndex === 3 && (
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Spesifikasi Material & Supplier</h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Jenis Bahan / Fabric Type *</label>
                      <input 
                        type="text"
                        value={project.stageData?.fabricType || ''}
                        onChange={(e) => updateRndProject(project.id, { stageData: { ...project.stageData, fabricType: e.target.value } })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] outline-hidden bg-white dark:bg-slate-900"
                        placeholder="e.g. 100% Cotton Combed 30s"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Supplier *</label>
                      <input 
                        type="text"
                        value={project.stageData?.supplier || ''}
                        onChange={(e) => updateRndProject(project.id, { stageData: { ...project.stageData, supplier: e.target.value } })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] outline-hidden bg-white dark:bg-slate-900"
                        placeholder="e.g. PT Textile Jaya"
                      />
                    </div>
                  </div>
                )}

                {stageIndex === 7 && (
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Penentuan Harga (Costing)</h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Final BOM Cost / Pcs (Rp) *</label>
                      <input 
                        type="number"
                        value={project.stageData?.finalCost || ''}
                        onChange={(e) => updateRndProject(project.id, { stageData: { ...project.stageData, finalCost: Number(e.target.value) } })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] outline-hidden font-mono bg-white dark:bg-slate-900"
                        placeholder="50000"
                      />
                    </div>
                  </div>
                )}

                {stageIndex === 9 && (
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Produksi Massal</h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Kuantitas Initial PO *</label>
                      <input 
                        type="number"
                        value={project.stageData?.poQuantity || ''}
                        onChange={(e) => updateRndProject(project.id, { stageData: { ...project.stageData, poQuantity: Number(e.target.value) } })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] outline-hidden font-mono bg-white dark:bg-slate-900"
                        placeholder="1000"
                      />
                    </div>
                  </div>
                )}

                {/* History & Saved Files Action Button */}
                <div className="mb-6">
                  <button 
                    onClick={() => setActiveHistoryProject(project)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-[#b90f0f]" />
                      <span>Riwayat Dokumen & Progress</span>
                    </div>
                    <span className="px-2 py-0.5 bg-white dark:bg-slate-900 text-[#b90f0f] rounded-full text-[11px]">
                      {fileCount} Dokumen · {historyCount} Log
                    </span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mb-6 gap-4">
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <User className="w-4 h-4" />
                    <span>PIC: {project.leadResearcher}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    <span>Launch: {project.targetLaunchDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button 
                  className={`flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                    stageIndex === 1 ? 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  disabled={stageIndex === 1}
                  onClick={() => handleStageChange(project, `S${prevStageIndex}`)}
                >
                  <ArrowLeft className="w-4 h-4" /> Stage Sebelumnya
                </button>
                <button 
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors ${
                    !isNextAllowed
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-[#b90f0f] hover:bg-rose-700 text-white'
                  }`}
                  disabled={!isNextAllowed}
                  onClick={() => handleStageChange(project, `S${nextStageIndex}`)}
                >
                  Lanjut ke Stage {nextStageIndex} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* History & Documents Modal */}
      {activeHistoryProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Riwayat Dokumen & Progress</h2>
                <p className="text-xs text-[#b90f0f] font-semibold">{activeHistoryProject.ideaTitle} ({activeHistoryProject.code})</p>
              </div>
              <button onClick={() => setActiveHistoryProject(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Document Storage Section */}
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[#b90f0f]" /> Dokumen & Media Tersimpan
                </h3>
                {(activeHistoryProject.stageData?.ideaFiles || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">Belum ada dokumen/file yang diupload untuk produk R&D ini.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeHistoryProject.stageData.ideaFiles.map((file: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
                        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                          {file.type === 'image' ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={file.name}>{file.name}</p>
                          <p className="text-[10px] text-slate-400">{file.stageId || 'R&D'} · {file.uploadDate || 'Tersimpan'}</p>
                        </div>
                        <a 
                          href={file.url} 
                          download={file.name} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="mt-2 text-center py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        >
                          Unduh / Lihat
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity Logs Timeline */}
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#b90f0f]" /> Timeline Aktivitas Stage
                </h3>
                {(activeHistoryProject.stageData?.historyLogs || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">Belum ada log aktivitas terrekam.</p>
                ) : (
                  <div className="space-y-3 relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 pl-4">
                    {activeHistoryProject.stageData.historyLogs.map((log: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-[#b90f0f] border-2 border-white dark:border-slate-800" />
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.title}</span>
                            <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{log.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button 
                onClick={() => setActiveHistoryProject(null)} 
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Proyek' : 'Tambah Proyek Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama / Judul Proyek</label>
                <input required type="text" value={formData.ideaTitle} onChange={e => setFormData({...formData, ideaTitle: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Kategori</label>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Stage Initial</label>
                  <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] transition-all">
                    {LAUNCH_STAGES.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">PIC / Lead</label>
                  <input required type="text" value={formData.leadResearcher} onChange={e => setFormData({...formData, leadResearcher: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Launch</label>
                  <input required type="date" value={formData.targetLaunchDate} onChange={e => setFormData({...formData, targetLaunchDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Progress Initial ({formData.progress}%)</label>
                <input type="range" min="0" max="100" value={formData.progress} onChange={e => setFormData({...formData, progress: Number(e.target.value)})} className="w-full accent-[#b90f0f]" />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 bg-[#b90f0f] text-white hover:bg-rose-700 rounded-xl font-bold shadow-sm transition-colors">
                  Simpan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

