import React, { useState, useMemo } from 'react';
import { useERP } from '../../../context/ERPContext';
import { 
  Plus, Calendar, MapPin, Users, Trash2, Edit2, X, Eye, 
  DollarSign, PieChart, BarChart3, Search, Filter, 
  ChevronRight, Building2, TrendingUp, Info, Wallet, Download, FileSpreadsheet,
  Image, Upload, LayoutGrid, List, Sparkles, Link, Check, Camera
} from 'lucide-react';
import { ERPEvent, Sponsor } from '../../../types';

const PRESET_BANNERS = [
  { 
    label: 'Gathering & Runway', 
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    desc: 'Fashion show & community networking' 
  },
  { 
    label: 'Workshop & Edu', 
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    desc: 'Edukasi styling & creative talk' 
  },
  { 
    label: 'Sports & Active', 
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
    desc: 'Fun run & outdoor activewear' 
  },
  { 
    label: 'Exhibition & Fair', 
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
    desc: 'Pameran produk & booth bazaar' 
  },
  { 
    label: 'Concert & Music', 
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    desc: 'Musik, stage & grand event' 
  },
  { 
    label: 'Community Meetup', 
    url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
    desc: 'Diskusi santai & gathering' 
  },
];

export const EventManagementView: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useERP();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ERPEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ERPEvent['status']>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [imageTab, setImageTab] = useState<'upload' | 'preset' | 'url'>('preset');

  const [formData, setFormData] = useState<Omit<ERPEvent, 'id'>>({
    title: '',
    description: '',
    activity: '',
    date: '',
    jenisEvent: 'mandiri',
    isCollaboration: false,
    communityName: '',
    location: '',
    status: 'planned',
    targetParticipants: 0,
    actualParticipants: 0,
    budget: 0,
    actualCost: 0,
    variance: 0,
    bannerUrl: PRESET_BANNERS[0].url,
    sponsors: []
  });

  // Statistics
  const stats = useMemo(() => {
    const totalBudget = events.reduce((sum, e) => sum + e.budget, 0);
    const totalActual = events.reduce((sum, e) => sum + e.actualCost, 0);
    const ongoingEvents = events.filter(e => e.status === 'ongoing').length;
    return {
      totalBudget,
      totalActual,
      totalVariance: totalBudget - totalActual,
      ongoingEvents,
      totalEvents: events.length
    };
  }, [events]);

  // Filtering
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           event.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  const handleExportCSV = () => {
    if (!filteredEvents || filteredEvents.length === 0) {
      alert('Tidak ada data event untuk diexport.');
      return;
    }

    const headers = [
      'ID Event',
      'Nama Event',
      'Jenis Event',
      'Tanggal',
      'Lokasi',
      'Status',
      'Kolaborasi',
      'Nama Komunitas',
      'Target Peserta',
      'Peserta Aktual',
      'Budget (Rp)',
      'Biaya Realisasi (Rp)',
      'Selisih/Variance (Rp)',
      'Banner URL',
      'Jumlah Sponsor'
    ];

    const rows = filteredEvents.map(e => [
      `"${e.id}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.jenisEvent || 'mandiri'}"`,
      `"${e.date || ''}"`,
      `"${(e.location || '').replace(/"/g, '""')}"`,
      `"${e.status || ''}"`,
      `"${e.isCollaboration ? 'Ya' : 'Tidak'}"`,
      `"${(e.communityName || '').replace(/"/g, '""')}"`,
      e.targetParticipants || 0,
      e.actualParticipants || 0,
      e.budget || 0,
      e.actualCost || 0,
      (e.budget || 0) - (e.actualCost || 0),
      `"${(e.bannerUrl || '').replace(/"/g, '""')}"`,
      e.sponsors?.length || 0
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Export_Event_Management_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openModal = (event?: ERPEvent) => {
    if (event) {
      setEditingId(event.id);
      setFormData({
        ...event,
        bannerUrl: event.bannerUrl || PRESET_BANNERS[0].url
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        activity: '',
        date: new Date().toISOString().split('T')[0],
        jenisEvent: 'mandiri',
        isCollaboration: false,
        communityName: '',
        location: '',
        status: 'planned',
        targetParticipants: 100,
        actualParticipants: 0,
        budget: 10000000,
        actualCost: 0,
        variance: 0,
        bannerUrl: PRESET_BANNERS[0].url,
        sponsors: []
      });
    }
    setImageTab('preset');
    setShowModal(true);
  };

  const openDetailModal = (event: ERPEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      variance: formData.budget - formData.actualCost
    };
    if (editingId) {
      updateEvent(editingId, eventData);
    } else {
      addEvent(eventData);
    }
    setShowModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('Ukuran foto banner maksimal 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, bannerUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addSponsor = () => {
    setFormData(prev => ({ ...prev, sponsors: [...prev.sponsors, { name: '', budget: 0, type: 'Nominal', productQty: 0 }] }));
  };

  const updateSponsor = (index: number, field: keyof Sponsor, value: any) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const removeSponsor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (status: ERPEvent['status']) => {
    const styles = {
      planned: 'bg-blue-500/90 text-white backdrop-blur-md shadow-sm',
      ongoing: 'bg-amber-500/90 text-white backdrop-blur-md shadow-sm',
      pending: 'bg-slate-500/90 text-white backdrop-blur-md shadow-sm',
      cancelled: 'bg-rose-500/90 text-white backdrop-blur-md shadow-sm'
    };
    const labels = {
      planned: 'PLANNED',
      ongoing: 'RUNNING',
      pending: 'PENDING',
      cancelled: 'CANCELLED'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Event Management
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full font-bold">
              {events.length} Event
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
            Kelola foto banner, alokasi anggaran, partisipan, dan sponsor event komunitas Jerjhon.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 text-xs md:text-sm"
            title="Export data event ke CSV"
          >
            <Download className="w-4 h-4" /> Export CSV ({filteredEvents.length})
          </button>
          <button
            onClick={() => openModal()}
            className="hidden md:flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5" /> Buat Event Baru
          </button>
        </div>
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={() => openModal()}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 dark:shadow-none active:scale-90 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 md:opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="w-12 h-12 md:w-16 md:h-16" />
          </div>
          <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1">Total Budget</p>
          <p className="text-base md:text-2xl font-black text-slate-900 dark:text-white">Rp{(stats.totalBudget / 1000000).toFixed(1)}M</p>
          <div className="hidden md:flex mt-4 items-center gap-2 text-xs text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 w-fit px-2 py-1 rounded-lg">
            <TrendingUp className="w-3 h-3" /> Dashboard Finansial
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 md:opacity-10 group-hover:scale-110 transition-transform">
            <PieChart className="w-12 h-12 md:w-16 md:h-16" />
          </div>
          <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1">Total Realisasi</p>
          <p className="text-base md:text-2xl font-black text-slate-900 dark:text-white">Rp{(stats.totalActual / 1000000).toFixed(1)}M</p>
          <p className="hidden md:block mt-4 text-xs text-slate-400">Pengeluaran riil terakumulasi</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 md:opacity-10 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-12 h-12 md:w-16 md:h-16" />
          </div>
          <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1">Total Variance</p>
          <p className={`text-base md:text-2xl font-black ${stats.totalVariance >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
            Rp{(stats.totalVariance / 1000000).toFixed(1)}M
          </p>
          <p className="hidden md:block mt-4 text-xs text-slate-400">Sisa / Selisih anggaran</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 md:opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-12 h-12 md:w-16 md:h-16" />
          </div>
          <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1">Event Running</p>
          <p className="text-base md:text-2xl font-black text-slate-900 dark:text-white">{stats.ongoingEvents} / {stats.totalEvents}</p>
          <p className="hidden md:block mt-4 text-xs text-slate-400">Status Running aktif saat ini</p>
        </div>
      </div>

      {/* Main Content Area (Filters, View Toggle & List) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden mb-24 md:mb-0">
        {/* Toolbar & Controls */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 bg-slate-50/50 dark:bg-slate-800/50 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari event, lokasi, atau aktivitas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 justify-between md:justify-end">
            {/* Status Chips */}
            <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 hide-scrollbar">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'planned', label: 'Planning' },
                { id: 'ongoing', label: 'Running' },
                { id: 'pending', label: 'Pending' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map(status => (
                <button
                  key={status.id}
                  onClick={() => setStatusFilter(status.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    statusFilter === status.id 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {/* Grid / Table View Mode Toggle */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Banner Grid"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid Banner</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Display Mode 1: GRID VIEW WITH BANNERS */}
        {viewMode === 'grid' ? (
          <div className="p-4 md:p-6">
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const bannerImage = event.bannerUrl || PRESET_BANNERS[0].url;
                  const participantPercent = Math.min(100, Math.round((event.actualParticipants / (event.targetParticipants || 1)) * 100));

                  return (
                    <div 
                      key={event.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                    >
                      {/* Banner Image Header */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                        <img 
                          src={bannerImage} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PRESET_BANNERS[0].url;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(event.status)}
                        </div>

                        {/* Event Category / Type Badge */}
                        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1">
                          {event.jenisEvent === 'kolaborasi' ? <Users className="w-3 h-3 text-blue-300" /> : <Building2 className="w-3 h-3 text-emerald-300" />}
                          {event.jenisEvent.toUpperCase()}
                        </div>

                        {/* Event Title on Banner */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">{event.activity || 'Event'}</p>
                          <h3 className="text-lg font-black leading-snug drop-shadow-md line-clamp-1">{event.title}</h3>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                          "{event.description}"
                        </p>

                        <div className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-bold text-slate-900 dark:text-white">{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          {event.isCollaboration && event.communityName && (
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700">
                              <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <span className="truncate font-bold text-purple-600 dark:text-purple-400">Partner: {event.communityName}</span>
                            </div>
                          )}
                        </div>

                        {/* Participants Progress Bar */}
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1 font-bold">
                            <span className="text-slate-500">Partisipan</span>
                            <span className="text-blue-600 dark:text-blue-400">{event.actualParticipants} / {event.targetParticipants} Orang ({participantPercent}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${participantPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Budget & Actions Footer */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Budget Event</p>
                            <p className="text-base font-black text-slate-900 dark:text-white">Rp{event.budget.toLocaleString()}</p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openDetailModal(event)}
                              className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                              title="Lihat Detail Event"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal(event)}
                              className="p-2.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all"
                              title="Edit Banner & Event"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus event "${event.title}"?`)) {
                                  deleteEvent(event.id);
                                }
                              }}
                              className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                              title="Hapus Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <Image className="w-16 h-16 opacity-20 mx-auto mb-3" />
                <p className="font-bold text-base text-slate-700 dark:text-slate-300">Tidak ada event ditemukan</p>
                <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau tambah event baru.</p>
              </div>
            )}
          </div>
        ) : (
          /* Display Mode 2: TABLE VIEW WITH THUMBNAILS */
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-5 font-bold">Banner & Title</th>
                  <th className="px-6 py-5 font-bold">Waktu & Lokasi</th>
                  <th className="px-6 py-5 font-bold">Status</th>
                  <th className="px-6 py-5 font-bold">Peserta</th>
                  <th className="px-6 py-5 font-bold">Anggaran (Rp)</th>
                  <th className="px-6 py-5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => {
                    const bannerImage = event.bannerUrl || PRESET_BANNERS[0].url;

                    return (
                      <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700 relative">
                              <img 
                                src={bannerImage} 
                                alt={event.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white leading-tight mb-1">{event.title}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                {event.jenisEvent === 'kolaborasi' ? <Users className="w-3 h-3 text-blue-500" /> : <Building2 className="w-3 h-3 text-emerald-500" />}
                                {event.jenisEvent.toUpperCase()} {event.communityName ? `• ${event.communityName}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Calendar className="w-3 h-3 text-blue-500" />
                              <span className="text-xs font-medium">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              <span className="text-xs">{event.location}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(event.status)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 dark:text-white">{event.actualParticipants} / {event.targetParticipants}</p>
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                            {Math.round((event.actualParticipants / (event.targetParticipants || 1)) * 100)}% Target
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 dark:text-white">Rp{event.budget.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">Var: Rp{(event.budget - event.actualCost).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button 
                              onClick={() => openDetailModal(event)}
                              title="Detail"
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openModal(event)}
                              title="Edit"
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteEvent(event.id)}
                              title="Hapus"
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-12 h-12 opacity-20" />
                        <p className="font-bold">Tidak ada event ditemukan</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal with Banner Header */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex md:items-center justify-center bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300 md:p-4">
          <div className="bg-white dark:bg-slate-900 w-full h-full md:h-auto md:max-h-[90vh] md:rounded-[2.5rem] md:max-w-4xl flex flex-col overflow-hidden md:border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Banner Header Image */}
            <div className="relative h-56 md:h-64 w-full bg-slate-950 shrink-0">
              <img 
                src={selectedEvent.bannerUrl || PRESET_BANNERS[0].url} 
                alt={selectedEvent.title}
                className="w-full h-full object-cover brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30"></div>

              {/* Close & Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    openModal(selectedEvent);
                  }}
                  className="p-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl transition-all"
                  title="Edit Event"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Hapus event ini?')) {
                      deleteEvent(selectedEvent.id);
                      setShowDetailModal(false);
                    }
                  }}
                  className="p-2.5 bg-rose-500/80 hover:bg-rose-600 text-white backdrop-blur-md rounded-xl transition-all"
                  title="Hapus Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2.5 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Header Info Overlay */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedEvent.status)}
                  <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                    {selectedEvent.jenisEvent.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black drop-shadow-md leading-tight">{selectedEvent.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-200">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-400" /> {selectedEvent.date}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-400" /> {selectedEvent.location}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                  <section>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Informasi Dasar</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Aktivitas</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedEvent.activity}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Progres</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{selectedEvent.status}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Lokasi</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedEvent.location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Pelaksanaan</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedEvent.date}</p>
                      </div>
                      {selectedEvent.jenisEvent === 'kolaborasi' && selectedEvent.communityName && (
                        <div className="md:col-span-2 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                          <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Partner Kolaborasi</p>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-black text-slate-900 dark:text-white">{selectedEvent.communityName}</p>
                          </div>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Deskripsi Event</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{selectedEvent.description}"</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Target & Realisasi Partisipan</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target</p>
                        <p className="text-xl font-black">{selectedEvent.targetParticipants}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Aktual</p>
                        <p className="text-xl font-black">{selectedEvent.actualParticipants}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pencapaian</p>
                        <p className="text-xl font-black text-blue-600">
                          {Math.round((selectedEvent.actualParticipants / (selectedEvent.targetParticipants || 1)) * 100)}%
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sisa Target</p>
                        <p className="text-xl font-black">
                          {Math.max(0, selectedEvent.targetParticipants - selectedEvent.actualParticipants)}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column: Finance & Sponsors */}
                <div className="space-y-8">
                  <section>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Analisis Keuangan</h4>
                    <div className="space-y-4 bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <span className="text-xs text-slate-400 font-bold uppercase">Budget</span>
                        <span className="font-bold">Rp{selectedEvent.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <span className="text-xs text-slate-400 font-bold uppercase">Actual Cost</span>
                        <span className="font-bold">Rp{selectedEvent.actualCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-blue-400 font-black uppercase">Variance</span>
                        <span className={`text-xl font-black ${selectedEvent.variance >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                          Rp{selectedEvent.variance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Sponsorship ({selectedEvent.sponsors.length})</h4>
                    <div className="space-y-3">
                      {selectedEvent.sponsors.length > 0 ? (
                        selectedEvent.sponsors.map((s, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                              <div>
                                <span className="text-sm font-bold block text-slate-900 dark:text-white">{s.name}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{s.type === 'Produk' ? 'Sponsor Produk' : 'Sponsor Finansial'}</span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {s.type === 'Produk' ? `${s.productQty || 0} Pcs` : `Rp${(s.budget || 0).toLocaleString()}`}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center p-4">Tidak ada sponsor terdaftar</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Add / Edit Event with Photo Banner Options) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex md:items-center justify-center bg-slate-900/70 backdrop-blur-md animate-in zoom-in duration-300 md:p-4">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 w-full h-full md:h-auto md:max-h-[92vh] md:rounded-[2.5rem] md:max-w-3xl flex flex-col overflow-hidden md:border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {editingId ? 'Edit Event & Banner' : 'Buat Event Komunitas Baru'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Lengkapi rincian event dan upload foto banner utama</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-8 flex-1 overflow-y-auto space-y-6">
              {/* SECTION: BANNER PHOTO SELECTOR */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" /> Foto Banner Event
                  </label>

                  {/* Banner Source Tabs */}
                  <div className="flex gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setImageTab('preset')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        imageTab === 'preset' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Preset Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        imageTab === 'upload' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        imageTab === 'url' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <Link className="w-3.5 h-3.5" /> URL Link
                    </button>
                  </div>
                </div>

                {/* Banner Preview Box */}
                {formData.bannerUrl && (
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 group">
                    <img 
                      src={formData.bannerUrl} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full border border-white/20">
                        Foto Banner Terpilih
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab Content 1: PRESET BANNERS */}
                {imageTab === 'preset' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {PRESET_BANNERS.map((preset, idx) => {
                      const isSelected = formData.bannerUrl === preset.url;
                      return (
                        <div 
                          key={idx}
                          onClick={() => setFormData(prev => ({ ...prev, bannerUrl: preset.url }))}
                          className={`relative h-24 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group ${
                            isSelected 
                              ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md scale-[1.02]' 
                              : 'border-transparent opacity-80 hover:opacity-100 hover:scale-[1.01]'
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end">
                            <p className="text-[11px] font-bold text-white leading-tight line-clamp-1">{preset.label}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab Content 2: UPLOAD FILE */}
                {imageTab === 'upload' && (
                  <div className="pt-2">
                    <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <Upload className="w-8 h-8 text-blue-500 mb-2" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Klik untuk Upload Foto Banner Event</p>
                      <p className="text-[10px] text-slate-400 mt-1">Format: JPG, PNG, WEBP (Maksimal 4MB)</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                )}

                {/* Tab Content 3: DIRECT URL */}
                {imageTab === 'url' && (
                  <div className="pt-2">
                    <input 
                      type="url" 
                      placeholder="Tempelkan URL foto banner (https://images.unsplash.com/...)" 
                      value={formData.bannerUrl || ''} 
                      onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })} 
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-medium"
                    />
                  </div>
                )}
              </div>

              {/* SECTION: BASIC EVENT DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Judul Event</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Gathering Komunitas Regional Jerjhon" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm" 
                    required 
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Deskripsi Event</label>
                  <textarea 
                    placeholder="Apa tujuan dan aktivitas utama event ini?" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium min-h-[80px] text-sm" 
                    required 
                  />
                </div>

                {/* Date & Location */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Tanggal Pelaksanaan</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Kota / Tempat Lokasi</label>
                  <input 
                    type="text" 
                    placeholder="Bandung, Hotel Trans, dll." 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" 
                    required 
                  />
                </div>

                {/* Type & Activity */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Jenis Event</label>
                  <select 
                    value={formData.jenisEvent} 
                    onChange={e => setFormData({
                      ...formData, 
                      jenisEvent: e.target.value as any, 
                      isCollaboration: e.target.value === 'kolaborasi'
                    })} 
                    className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                  >
                    <option value="mandiri">Mandiri (Jerjhon Only)</option>
                    <option value="kolaborasi">Kolaborasi Komunitas</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Kategori Aktivitas</label>
                  <input 
                    type="text" 
                    placeholder="Workshop, Gathering, Trunk Show, dll." 
                    value={formData.activity} 
                    onChange={e => setFormData({...formData, activity: e.target.value})} 
                    className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" 
                    required 
                  />
                </div>

                {/* Partner Community Name if Collaboration */}
                {formData.jenisEvent === 'kolaborasi' && (
                  <div className="md:col-span-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Nama Komunitas Partner</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama komunitas partner kolaborasi" 
                      value={formData.communityName} 
                      onChange={e => setFormData({...formData, communityName: e.target.value})} 
                      className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" 
                    />
                  </div>
                )}

                {/* Status & Participants */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Status Event</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as any})} 
                    className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                  >
                    <option value="planned">Planning</option>
                    <option value="ongoing">Running</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Target Pst.</label>
                    <input 
                      type="number" 
                      value={formData.targetParticipants || 0} 
                      onChange={e => setFormData({...formData, targetParticipants: parseInt(e.target.value) || 0})} 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none font-bold text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Aktual Pst.</label>
                    <input 
                      type="number" 
                      value={formData.actualParticipants || 0} 
                      onChange={e => setFormData({...formData, actualParticipants: parseInt(e.target.value) || 0})} 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none font-bold text-sm" 
                    />
                  </div>
                </div>

                {/* Finance */}
                <div className="md:col-span-2 pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Alokasi Anggaran Event</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Budget Direncanakan (Rp)</label>
                      <input 
                        type="number" 
                        value={formData.budget || 0} 
                        onChange={e => setFormData({...formData, budget: parseInt(e.target.value) || 0})} 
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none font-black text-blue-600 text-sm" 
                      />
                    </div>
                    {editingId && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Biaya Realisasi / Aktual (Rp)</label>
                        <input 
                          type="number" 
                          value={formData.actualCost || 0} 
                          onChange={e => setFormData({...formData, actualCost: parseInt(e.target.value) || 0})} 
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none font-black text-rose-600 text-sm" 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Sponsors */}
                <div className="md:col-span-2 pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-purple-500" />
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Daftar Sponsor Event</h4>
                    </div>
                    <button 
                      type="button" 
                      onClick={addSponsor} 
                      className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg"
                    >
                      <Plus className="w-3 h-3" /> Tambah Sponsor
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.sponsors.length > 0 ? (
                      formData.sponsors.map((s, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                          <input 
                            type="text" 
                            placeholder="Nama Sponsor" 
                            value={s.name} 
                            onChange={e => updateSponsor(i, 'name', e.target.value)} 
                            className="col-span-4 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-medium" 
                          />
                          <select
                            value={s.type || 'Nominal'}
                            onChange={e => updateSponsor(i, 'type', e.target.value)}
                            className="col-span-3 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-bold"
                          >
                            <option value="Nominal">Nominal (Rp)</option>
                            <option value="Produk">Produk (Pcs)</option>
                          </select>
                          {s.type === 'Produk' ? (
                            <input 
                              type="number" 
                              placeholder="Qty Pcs" 
                              value={s.productQty || 0} 
                              onChange={e => updateSponsor(i, 'productQty', parseInt(e.target.value) || 0)} 
                              className="col-span-4 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-bold" 
                            />
                          ) : (
                            <input 
                              type="number" 
                              placeholder="Nominal (Rp)" 
                              value={s.budget || 0} 
                              onChange={e => updateSponsor(i, 'budget', parseInt(e.target.value) || 0)} 
                              className="col-span-4 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-bold" 
                            />
                          )}
                          <button 
                            type="button" 
                            onClick={() => removeSponsor(i)}
                            className="col-span-1 flex items-center justify-center text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                        Belum ada sponsor ditambahkan
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all active:scale-95 order-last md:order-none"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> {editingId ? 'Update Event & Banner' : 'Simpan Event Baru'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
