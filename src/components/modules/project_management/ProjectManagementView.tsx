import React, { useState } from 'react';
import { 
  FolderGit2, Plus, Clock, GanttChart, LayoutGrid, 
  Calendar, Megaphone, Trash2, Edit3, X, CheckCircle2
} from 'lucide-react';
import { ContentCampaignItem } from '../../../types';
import { useERP } from '../../../context/ERPContext';

export const ProjectManagementView: React.FC = () => {
  const { campaigns, addCampaign, updateCampaign, deleteCampaign } = useERP();
  const [activeTab, setActiveTab] = useState<'content_timeline' | 'kanban' | 'gantt'>('content_timeline');
  const [campaignFilter, setCampaignFilter] = useState<string>('All');
  
  // Modal State for Add / Edit
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<ContentCampaignItem['type']>('Konten Harian');
  const [formPlatform, setFormPlatform] = useState<ContentCampaignItem['platform']>('TikTok');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formAssignee, setFormAssignee] = useState('Nia Rosalina');
  const [formPriority, setFormPriority] = useState<ContentCampaignItem['priority']>('Medium');
  const [formStatus, setFormStatus] = useState<ContentCampaignItem['status']>('To Do');
  const [formDesc, setFormDesc] = useState('');
  const [formDeliverables, setFormDeliverables] = useState('');

  const handleOpenAddModal = () => {
    setEditingCampaignId(null);
    setFormTitle('');
    setFormType('Konten Harian');
    setFormPlatform('TikTok');
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormAssignee('Nia Rosalina');
    setFormPriority('Medium');
    setFormStatus('To Do');
    setFormDesc('');
    setFormDeliverables('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: ContentCampaignItem) => {
    setEditingCampaignId(item.id);
    setFormTitle(item.title);
    setFormType(item.type);
    setFormPlatform(item.platform);
    setFormDate(item.scheduleDate);
    setFormAssignee(item.assignee);
    setFormPriority(item.priority);
    setFormStatus(item.status);
    setFormDesc(item.description);
    setFormDeliverables(item.deliverables || '');
    setShowAddModal(true);
  };

  const handleDeleteCampaign = (id: string) => {
    deleteCampaign(id);
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    if (editingCampaignId) {
      updateCampaign(editingCampaignId, {
        title: formTitle,
        type: formType,
        platform: formPlatform,
        scheduleDate: formDate,
        deadline: formDate,
        assignee: formAssignee,
        priority: formPriority,
        status: formStatus,
        description: formDesc,
        deliverables: formDeliverables
      });
    } else {
      addCampaign({
        title: formTitle,
        type: formType,
        platform: formPlatform,
        scheduleDate: formDate,
        deadline: formDate,
        assignee: formAssignee,
        status: formStatus,
        priority: formPriority,
        description: formDesc || 'Timeline konten baru dicanangkan oleh Project Manager',
        deliverables: formDeliverables || 'Deliverable standar'
      });
    }

    setShowAddModal(false);
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (campaignFilter === 'All') return true;
    return c.type === campaignFilter;
  });

  const kanbanColumns: { title: string; status: ContentCampaignItem['status']; color: string }[] = [
    { title: 'To Do / Ideation', status: 'To Do', color: 'border-slate-300 dark:border-slate-700' },
    { title: 'In Progress / Produksi', status: 'In Progress', color: 'border-blue-500' },
    { title: 'Review & QC', status: 'Review', color: 'border-amber-500' },
    { title: 'Published / Selesai', status: 'Published', color: 'border-emerald-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
              <FolderGit2 className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Project Management & Content Timeline Hub
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pusat perencanaan konten harian, kampanye seasonal, peluncuran produk, dan milestone eksekutif tim.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-700/60 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('content_timeline')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'content_timeline' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-rose-500" /> Timeline Konten & Seasonal
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'kanban' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-blue-500" /> Kanban Board
            </button>
            <button
              onClick={() => setActiveTab('gantt')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gantt' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GanttChart className="w-4 h-4 text-emerald-500" /> Gantt Roadmap
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4.5 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all min-h-[40px]"
          >
            <Plus className="w-4 h-4" /> Buat Timeline / Kampanye Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-6 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Megaphone className="w-4 h-4 text-[#b90f0f]" /> Filter Kategori:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Konten Harian', 'Seasonal Campaign', 'Product Launch', 'Brand Campaign'].map(cat => (
            <button
              key={cat}
              onClick={() => setCampaignFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                campaignFilter === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Timeline View (Read & CRUD Actions) */}
      {activeTab === 'content_timeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCampaigns.map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Top accent bar based on type */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  item.type === 'Product Launch' ? 'bg-purple-500' :
                  item.type === 'Seasonal Campaign' ? 'bg-amber-500' :
                  item.type === 'Konten Harian' ? 'bg-blue-500' : 'bg-rose-500'
                }`} />

                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-extrabold uppercase ${
                        item.type === 'Product Launch' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
                        item.type === 'Seasonal Campaign' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                        {item.platform}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                      item.status === 'Published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      item.status === 'Review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                      item.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {item.status}
                    </span>

                    {/* Edit & Delete Buttons */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      title="Edit Campaign"
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(item.id)}
                      title="Delete Campaign"
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>

                {item.deliverables && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">📦 Deliverable / Output:</span>
                    <p className="text-slate-600 dark:text-slate-400">{item.deliverables}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-600 font-bold flex items-center justify-center text-[10px]">
                      {item.assignee.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.assignee}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Jadwal: {item.scheduleDate}
                      </p>
                    </div>
                  </div>

                  <select
                    value={item.status}
                    onChange={(e) => {
                      updateCampaign(item.id, { status: e.target.value as any });
                    }}
                    className="text-xs bg-slate-100 dark:bg-slate-700 border-none rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board View */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const itemsInCol = campaigns.filter(c => c.status === col.status);

            return (
              <div key={col.status} className="bg-slate-100/70 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 min-h-[500px] flex flex-col">
                <div className={`flex items-center justify-between pb-2.5 border-b-2 ${col.color}`}>
                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">{col.title}</h3>
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    {itemsInCol.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {itemsInCol.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2.5 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {item.platform}
                        </span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleOpenEditModal(item)} className="text-slate-400 hover:text-blue-600 p-1" title="Edit">
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => handleDeleteCampaign(item.id)} className="text-slate-400 hover:text-rose-600 p-1" title="Hapus">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{item.assignee}</span>
                        <select
                          value={item.status}
                          onChange={(e) => {
                            updateCampaign(item.id, { status: e.target.value as any });
                          }}
                          className="text-[10px] bg-slate-100 dark:bg-slate-700 border-none rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-200 font-medium"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Review">Review</option>
                          <option value="Published">Published</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gantt Roadmap View */}
      {activeTab === 'gantt' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <GanttChart className="w-4 h-4 text-[#b90f0f]" />
              Gantt Roadmap & Campaign Timeline Q3 2026
            </h3>
            <span className="text-xs font-mono text-slate-500">Juli - September 2026</span>
          </div>

          <div className="space-y-4">
            {campaigns.map((c, idx) => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{c.title} <span className="text-[10px] text-slate-400 font-normal">({c.assignee})</span></span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#b90f0f] font-mono">{c.scheduleDate}</span>
                    <button type="button" onClick={() => handleDeleteCampaign(c.id)} className="text-slate-400 hover:text-rose-600 p-0.5" title="Hapus">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-7 rounded-xl overflow-hidden flex items-center px-3 relative">
                  <div
                    className={`h-4 rounded-lg text-[10px] font-bold text-white px-3 flex items-center shadow-xs truncate ${
                      c.status === 'Published' ? 'bg-emerald-600' :
                      c.status === 'Review' ? 'bg-amber-600' : 'bg-[#b90f0f]'
                    }`}
                    style={{ width: `${Math.max(30, (idx + 1) * 22)}%` }}
                  >
                    {c.type} - {c.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Campaign Modal (Full CRUD Modal) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingCampaignId ? 'Edit Jadwal Konten / Kampanye' : 'Buat Jadwal Konten / Kampanye Baru'}
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Judul Konten / Kampanye Seasonal</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Live Streaming Eksklusif Shopee Jam 19.00"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori Jenis</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Konten Harian">Konten Harian</option>
                    <option value="Seasonal Campaign">Seasonal Campaign</option>
                    <option value="Product Launch">Product Launch</option>
                    <option value="Brand Campaign">Brand Campaign</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Platform Utama</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as any)}
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Shopee">Shopee</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Omnichannel">Omnichannel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Eksekusi</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assignee</label>
                  <input
                    type="text"
                    required
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium text-[11px]"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deliverable / Output (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: 1 Video TikTok HD (45 detik)"
                  value={formDeliverables}
                  onChange={(e) => setFormDeliverables(e.target.value)}
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi & Catatan Briefing</label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan detail briefing..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white rounded-2xl font-bold shadow-md transition"
                >
                  {editingCampaignId ? 'Simpan Perubahan' : 'Simpan & Publikasikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
