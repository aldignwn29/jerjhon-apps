import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Users, 
  DollarSign, 
  Target, 
  Plus, 
  Radio, 
  Award, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  TrendingUp, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Eye, 
  ExternalLink,
  Percent
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { KOLCampaign, AffiliatePartner } from '../../../types';

interface MarketingGrowthViewProps {
  defaultTab?: 'kol' | 'affiliates';
}

export const MarketingGrowthView: React.FC<MarketingGrowthViewProps> = ({ defaultTab = 'kol' }) => {
  const { 
    kolCampaigns, 
    addKOLCampaign, 
    updateKOLCampaign, 
    deleteKOLCampaign, 
    affiliates, 
    addAffiliatePartner, 
    updateAffiliatePartner, 
    deleteAffiliatePartner, 
    formatIDR 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'kol' | 'affiliates'>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('All');

  // KOL Modal State
  const [showKOLModal, setShowKOLModal] = useState(false);
  const [editingKOLId, setEditingKOLId] = useState<string | null>(null);
  const [kolForm, setKolForm] = useState<Omit<KOLCampaign, 'id'>>({
    kolName: '',
    platform: 'TikTok',
    followers: 100000,
    campaignTitle: '',
    campaignName: '',
    tier: 'Macro KOL (100k-1M)',
    contractFee: 10000000,
    spentBudget: 10000000,
    revenueGenerated: 45000000,
    roi: 350,
    roas: 4.5,
    deliverableStatus: 'Pending Content',
    status: 'Active',
    postDate: new Date().toISOString().split('T')[0]
  });

  // Affiliate Modal State
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [editingAffiliateId, setEditingAffiliateId] = useState<string | null>(null);
  const [affiliateForm, setAffiliateForm] = useState<Omit<AffiliatePartner, 'id'>>({
    code: '',
    name: '',
    channel: 'TikTok Affiliate',
    platform: 'TikTok Shop',
    handle: '',
    totalOrdersGenerated: 0,
    totalSalesGenerated: 0,
    commissionRate: 10,
    payoutEarned: 0,
    totalCommissionEarned: 0,
    status: 'Active'
  });

  // Top Level Statistics
  const totalSpent = kolCampaigns.reduce((sum, c) => sum + (c.spentBudget || c.contractFee || 0), 0);
  const totalRevenueGenerated = kolCampaigns.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
  const avgRoas = totalSpent > 0 ? (totalRevenueGenerated / totalSpent).toFixed(2) : '0.00';
  const totalAffiliateSales = affiliates.reduce((sum, a) => sum + (a.totalSalesGenerated || 0), 0);
  const totalAffiliateCommission = affiliates.reduce((sum, a) => sum + (a.totalCommissionEarned || a.payoutEarned || 0), 0);

  // Filtered KOL List
  const filteredKOLs = kolCampaigns.filter(c => {
    const nameMatch = (c.kolName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (c.campaignTitle || c.campaignName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const platformMatch = platformFilter === 'All' || c.platform === platformFilter;
    return nameMatch && platformMatch;
  });

  // Filtered Affiliate List
  const filteredAffiliates = affiliates.filter(a => {
    const nameMatch = (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (a.handle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (a.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const platformMatch = platformFilter === 'All' || a.platform === platformFilter || a.channel === platformFilter;
    return nameMatch && platformMatch;
  });

  // Handlers for KOL
  const handleOpenKOLModal = (campaign?: KOLCampaign) => {
    if (campaign) {
      setEditingKOLId(campaign.id);
      setKolForm({
        kolName: campaign.kolName,
        platform: campaign.platform,
        followers: campaign.followers,
        campaignTitle: campaign.campaignTitle || campaign.campaignName || '',
        campaignName: campaign.campaignName || campaign.campaignTitle || '',
        tier: campaign.tier || 'Macro KOL (100k-1M)',
        contractFee: campaign.contractFee,
        spentBudget: campaign.spentBudget || campaign.contractFee,
        revenueGenerated: campaign.revenueGenerated,
        roi: campaign.roi || 0,
        roas: campaign.roas || 0,
        deliverableStatus: campaign.deliverableStatus,
        status: campaign.status || 'Active',
        postDate: campaign.postDate || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingKOLId(null);
      setKolForm({
        kolName: '',
        platform: 'TikTok',
        followers: 250000,
        campaignTitle: '',
        campaignName: '',
        tier: 'Macro KOL (100k-1M)',
        contractFee: 15000000,
        spentBudget: 15000000,
        revenueGenerated: 60000000,
        roi: 300,
        roas: 4.0,
        deliverableStatus: 'Draft Review',
        status: 'Active',
        postDate: new Date().toISOString().split('T')[0]
      });
    }
    setShowKOLModal(true);
  };

  const handleSaveKOL = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kolForm.kolName || !kolForm.campaignTitle) {
      alert('Silakan isi nama KOL dan judul campaign!');
      return;
    }

    const spent = Number(kolForm.spentBudget) || Number(kolForm.contractFee) || 0;
    const rev = Number(kolForm.revenueGenerated) || 0;
    const computedRoas = spent > 0 ? Number((rev / spent).toFixed(2)) : 0;
    const computedRoi = spent > 0 ? Math.round(((rev - spent) / spent) * 100) : 0;

    const payload = {
      ...kolForm,
      campaignName: kolForm.campaignTitle,
      spentBudget: spent,
      contractFee: spent,
      revenueGenerated: rev,
      roas: computedRoas,
      roi: computedRoi
    };

    if (editingKOLId) {
      updateKOLCampaign(editingKOLId, payload);
    } else {
      addKOLCampaign(payload);
    }

    setShowKOLModal(false);
  };

  // Handlers for Affiliate
  const handleOpenAffiliateModal = (affiliate?: AffiliatePartner) => {
    if (affiliate) {
      setEditingAffiliateId(affiliate.id);
      setAffiliateForm({
        code: affiliate.code,
        name: affiliate.name,
        channel: affiliate.channel,
        platform: affiliate.platform || affiliate.channel,
        handle: affiliate.handle || '',
        totalOrdersGenerated: affiliate.totalOrdersGenerated || 0,
        totalSalesGenerated: affiliate.totalSalesGenerated || 0,
        commissionRate: affiliate.commissionRate || 10,
        payoutEarned: affiliate.payoutEarned || 0,
        totalCommissionEarned: affiliate.totalCommissionEarned || affiliate.payoutEarned || 0,
        status: affiliate.status || 'Active'
      });
    } else {
      setEditingAffiliateId(null);
      setAffiliateForm({
        code: `AFF-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        channel: 'TikTok Affiliate',
        platform: 'TikTok Shop',
        handle: '@',
        totalOrdersGenerated: 0,
        totalSalesGenerated: 0,
        commissionRate: 10,
        payoutEarned: 0,
        totalCommissionEarned: 0,
        status: 'Active'
      });
    }
    setShowAffiliateModal(true);
  };

  const handleSaveAffiliate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliateForm.name) {
      alert('Silakan isi nama partner affiliate!');
      return;
    }

    const sales = Number(affiliateForm.totalSalesGenerated) || 0;
    const rate = Number(affiliateForm.commissionRate) || 0;
    const computedCommission = Math.round(sales * (rate / 100));

    const payload = {
      ...affiliateForm,
      totalSalesGenerated: sales,
      commissionRate: rate,
      payoutEarned: computedCommission,
      totalCommissionEarned: computedCommission
    };

    if (editingAffiliateId) {
      updateAffiliatePartner(editingAffiliateId, payload);
    } else {
      addAffiliatePartner(payload);
    }

    setShowAffiliateModal(false);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-[#b90f0f] dark:text-rose-400 flex items-center justify-center font-bold text-xl shrink-0 mt-0.5">
            📣
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Marketing & Growth Engine
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manajemen Campaign Endorsement Influencer, TikTok Affiliate, ROAS Tracking & Komisi Penjualan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('kol')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              activeTab === 'kol'
                ? 'bg-[#b90f0f] text-white shadow-rose-900/20'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Radio className="w-4 h-4" />
            KOL & Influencer ({kolCampaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              activeTab === 'affiliates'
                ? 'bg-[#b90f0f] text-white shadow-rose-900/20'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Award className="w-4 h-4" />
            Affiliate Partners ({affiliates.length})
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-rose-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Marketing Spent</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatIDR(totalSpent)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Influencer & Content Investment</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales Generated</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatIDR(totalRevenueGenerated)}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Attributed Revenue from KOLs</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-purple-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average ROAS</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{avgRoas}x Return</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Return on Ad Spend Ratio</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-blue-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Affiliate Revenue</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{formatIDR(totalAffiliateSales)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Commission: {formatIDR(totalAffiliateCommission)}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            {activeTab === 'kol' ? <Radio className="w-4 h-4 text-[#b90f0f]" /> : <Award className="w-4 h-4 text-[#b90f0f]" />}
            {activeTab === 'kol' ? 'Daftar Campaign KOL & Endorsement' : 'Daftar Partner Affiliate & Komisi'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#b90f0f]"
          >
            <option value="All">Semua Platform</option>
            <option value="TikTok">TikTok</option>
            <option value="TikTok Shop">TikTok Shop</option>
            <option value="Instagram">Instagram</option>
            <option value="Shopee Affiliate">Shopee Affiliate</option>
            <option value="YouTube">YouTube</option>
          </select>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, handle, campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-[#b90f0f]"
            />
          </div>

          {activeTab === 'kol' ? (
            <button
              onClick={() => handleOpenKOLModal()}
              className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#960c0c] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" /> Tambah Campaign
            </button>
          ) : (
            <button
              onClick={() => handleOpenAffiliateModal()}
              className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#960c0c] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" /> Undang Partner
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'kol' ? (
        /* KOL Campaigns Table */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">CAMPAIGN & KOL</th>
                  <th className="p-3">PLATFORM & TIER</th>
                  <th className="p-3 text-right">BUDGET SPENT</th>
                  <th className="p-3 text-right">GENERATED REVENUE</th>
                  <th className="p-3 text-center">ROAS / ROI</th>
                  <th className="p-3 text-center">STATUS DELIVERABLE</th>
                  <th className="p-3 text-center">POST DATE</th>
                  <th className="p-3 text-center w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredKOLs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Tidak ada campaign KOL ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredKOLs.map((c) => {
                    const spent = c.spentBudget || c.contractFee || 0;
                    const rev = c.revenueGenerated || 0;
                    const roas = c.roas || (spent > 0 ? (rev / spent).toFixed(2) : 0);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {c.campaignTitle || c.campaignName}
                          </div>
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                            {c.kolName} <span className="text-slate-400">• {(c.followers || 0).toLocaleString('id-ID')} followers</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md font-semibold text-[10px] ${
                            c.platform === 'TikTok' ? 'bg-black text-white dark:bg-slate-700' :
                            c.platform === 'Instagram' ? 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300' :
                            'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}>
                            {c.platform}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1">{c.tier || 'Macro KOL'}</div>
                        </td>

                        <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {formatIDR(spent)}
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatIDR(rev)}
                        </td>

                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold rounded-lg text-xs">
                            {roas}x ROAS
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">ROI: {c.roi || 0}%</div>
                        </td>

                        <td className="p-3 text-center">
                          <select
                            value={c.deliverableStatus}
                            onChange={(e) => updateKOLCampaign(c.id, { deliverableStatus: e.target.value as any })}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-0 focus:ring-2 focus:ring-[#b90f0f] cursor-pointer ${
                              c.deliverableStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' :
                              c.deliverableStatus === 'Posted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300' :
                              c.deliverableStatus === 'Draft Review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <option value="Pending Content">Pending Content</option>
                            <option value="Draft Review">Draft Review</option>
                            <option value="Posted">Posted</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>

                        <td className="p-3 text-center font-mono text-slate-500 text-[11px]">
                          {c.postDate}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenKOLModal(c)}
                              title="Edit Campaign"
                              className="p-1 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus campaign ${c.campaignTitle || c.campaignName}?`)) {
                                  deleteKOLCampaign(c.id);
                                }
                              }}
                              title="Hapus Campaign"
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      ) : (
        /* Affiliates Table */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">PARTNER & HANDLE</th>
                  <th className="p-3">KODE REFERRAL</th>
                  <th className="p-3">CHANNEL / PLATFORM</th>
                  <th className="p-3 text-center">KOMISI (%)</th>
                  <th className="p-3 text-right">TOTAL ORDERS</th>
                  <th className="p-3 text-right">SALES GENERATED</th>
                  <th className="p-3 text-right">TOTAL KOMISI DIBAYAR</th>
                  <th className="p-3 text-center">STATUS</th>
                  <th className="p-3 text-center w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredAffiliates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Tidak ada partner affiliate ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredAffiliates.map((a) => {
                    const sales = a.totalSalesGenerated || 0;
                    const commission = a.totalCommissionEarned || a.payoutEarned || Math.round(sales * ((a.commissionRate || 10) / 100));

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                          <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                            {a.handle || '@partner'}
                          </div>
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                            {a.code}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 rounded-md font-semibold text-[10px]">
                            {a.platform || a.channel}
                          </span>
                        </td>

                        <td className="p-3 text-center font-bold text-[#b90f0f]">
                          {a.commissionRate}%
                        </td>

                        <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200">
                          {(a.totalOrdersGenerated || 0).toLocaleString('id-ID')} order
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatIDR(sales)}
                        </td>

                        <td className="p-3 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {formatIDR(commission)}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => updateAffiliatePartner(a.id, { status: a.status === 'Active' ? 'Pending' : 'Active' })}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              a.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {a.status}
                          </button>
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenAffiliateModal(a)}
                              title="Edit Partner"
                              className="p-1 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus affiliate ${a.name}?`)) {
                                  deleteAffiliatePartner(a.id);
                                }
                              }}
                              title="Hapus Partner"
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* Modal: Tambah / Edit Campaign KOL */}
      {showKOLModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#b90f0f]" />
                {editingKOLId ? 'Edit Campaign KOL' : 'Tambah Campaign KOL Baru'}
              </h2>
              <button
                onClick={() => setShowKOLModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKOL} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Judul Campaign <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Launching Sunscreen SPF50 Mega Campaign"
                  value={kolForm.campaignTitle}
                  onChange={(e) => setKolForm({ ...kolForm, campaignTitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#b90f0f]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama KOL / Handle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@tasya_farasya"
                    value={kolForm.kolName}
                    onChange={(e) => setKolForm({ ...kolForm, kolName: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={kolForm.platform}
                    onChange={(e) => setKolForm({ ...kolForm, platform: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#b90f0f]"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tier KOL
                  </label>
                  <select
                    value={kolForm.tier}
                    onChange={(e) => setKolForm({ ...kolForm, tier: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#b90f0f]"
                  >
                    <option value="Mega KOL (>1M)">Mega KOL (&gt;1M followers)</option>
                    <option value="Macro KOL (100k-1M)">Macro KOL (100k-1M followers)</option>
                    <option value="Micro KOL (10k-100k)">Micro KOL (10k-100k followers)</option>
                    <option value="Nano KOL (<10k)">Nano KOL (&lt;10k followers)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Followers
                  </label>
                  <input
                    type="number"
                    value={kolForm.followers}
                    onChange={(e) => setKolForm({ ...kolForm, followers: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-mono focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Budget Spent / Fee (Rp)
                  </label>
                  <input
                    type="number"
                    value={kolForm.spentBudget}
                    onChange={(e) => setKolForm({ ...kolForm, spentBudget: parseFloat(e.target.value) || 0, contractFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-mono focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Generated Sales (Rp)
                  </label>
                  <input
                    type="number"
                    value={kolForm.revenueGenerated}
                    onChange={(e) => setKolForm({ ...kolForm, revenueGenerated: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-mono focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Deliverable
                  </label>
                  <select
                    value={kolForm.deliverableStatus}
                    onChange={(e) => setKolForm({ ...kolForm, deliverableStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#b90f0f]"
                  >
                    <option value="Pending Content">Pending Content</option>
                    <option value="Draft Review">Draft Review</option>
                    <option value="Posted">Posted</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Post
                  </label>
                  <input
                    type="date"
                    value={kolForm.postDate}
                    onChange={(e) => setKolForm({ ...kolForm, postDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-rose-900 dark:text-rose-200">Kalkulasi ROAS Otomatis:</span>
                <span className="font-extrabold font-mono text-[#b90f0f] text-sm">
                  {kolForm.spentBudget > 0 ? (kolForm.revenueGenerated / kolForm.spentBudget).toFixed(2) : '0'}x ROAS
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowKOLModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b90f0f] hover:bg-[#960c0c] text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Simpan Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit Affiliate Partner */}
      {showAffiliateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#b90f0f]" />
                {editingAffiliateId ? 'Edit Partner Affiliate' : 'Undang Partner Affiliate Baru'}
              </h2>
              <button
                onClick={() => setShowAffiliateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAffiliate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nama Partner / Komunitas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: GlowBeauty Community"
                  value={affiliateForm.name}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#b90f0f]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Referral <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AFF-BEAUTY88"
                    value={affiliateForm.code}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-mono focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform / Channel
                  </label>
                  <select
                    value={affiliateForm.platform}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, platform: e.target.value, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#b90f0f]"
                  >
                    <option value="TikTok Shop">TikTok Shop</option>
                    <option value="Shopee Affiliate">Shopee Affiliate</option>
                    <option value="Tokopedia">Tokopedia</option>
                    <option value="Instagram">Instagram</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Handle Akun
                  </label>
                  <input
                    type="text"
                    placeholder="@glowbeauty88"
                    value={affiliateForm.handle}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, handle: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Komisi (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={affiliateForm.commissionRate}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-mono focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Orders Generated
                  </label>
                  <input
                    type="number"
                    value={affiliateForm.totalOrdersGenerated}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, totalOrdersGenerated: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-mono focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Sales Generated (Rp)
                  </label>
                  <input
                    type="number"
                    value={affiliateForm.totalSalesGenerated}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, totalSalesGenerated: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-mono focus:ring-2 focus:ring-[#b90f0f]"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-blue-900 dark:text-blue-200">Estimasi Komisi Dibayar:</span>
                <span className="font-extrabold font-mono text-blue-600 text-sm">
                  {formatIDR(Math.round((affiliateForm.totalSalesGenerated || 0) * ((affiliateForm.commissionRate || 0) / 100)))}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAffiliateModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b90f0f] hover:bg-[#960c0c] text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Simpan Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
