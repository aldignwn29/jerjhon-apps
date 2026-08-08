import React, { useState } from 'react';
import {
  LayoutDashboard, Users, ShoppingCart, Package, Landmark,
  FlaskConical, Megaphone, FolderGit2, Shield, Code2, Mail, Video, MessageSquare,
  ChevronRight, ChevronDown, Building2, Layers, FileText, CheckCircle2,
  Sliders, UserPlus, Calendar, Award, Receipt, BarChart3, Store, Truck,
  Database, RefreshCw, Layers3, Target, Radio, GanttChart, Boxes, Terminal, HardDrive
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeMenu?: string;
  onSelectMenu?: (menu: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed: propsCollapsed,
  setCollapsed: propsSetCollapsed,
  isCollapsed,
  onToggleCollapse,
  activeMenu,
  onSelectMenu,
  mobileOpen = false,
  onCloseMobile
}) => {
  const isCurrentlyCollapsed = isCollapsed ?? propsCollapsed ?? false;
  const toggleCollapse = onToggleCollapse ?? (() => propsSetCollapsed && propsSetCollapsed(!isCurrentlyCollapsed));
  const { activeDomain, setActiveDomain, activeTab, setActiveTab, companyProfile, currentUser } = useERP();

  if (!currentUser) return null;

  const domains = [
    {
      id: 'executive',
      label: 'Executive & Analytics',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard_exec', label: 'Executive Dashboard', icon: BarChart3 },
        { id: 'reports_analytics', label: 'Executive Reports & BI', icon: FileText }
      ]
    },
    {
      id: 'human_capital',
      label: 'Human Capital (HCM)',
      icon: Users,
      items: [
        { id: 'emp_list', label: 'Employee Database', icon: Users },
        { id: 'attendance_shifts', label: 'Absensi & Shift Kerja', icon: Calendar },
        { id: 'leave_management', label: 'Cuti, Izin & Lembur', icon: CheckCircle2 },
        { id: 'payroll_engine', label: 'Payroll & Slip Gaji', icon: Receipt },
        { id: 'kpi_okr', label: 'KPI & OKR Management', icon: Award },
        { id: 'task_messages', label: 'Notifikasi Tugas & KPI', icon: Mail },
        { id: 'recruitment_training', label: 'Recruitment & Training', icon: UserPlus }
      ]
    },
    {
      id: 'sales_marketplace',
      label: 'Sales & Marketplace',
      icon: ShoppingCart,
      items: [
        { id: 'marketplace_hub', label: 'Marketplace Channel Hub', icon: Store },
        { id: 'pos_retail', label: 'POS Kasir Retail', icon: Receipt },
        { id: 'crm_customers', label: 'CRM & Data Pelanggan', icon: Users }
      ]
    },
    {
      id: 'inventory_purchasing',
      label: 'Inventory & Supply Chain',
      icon: Package,
      items: [
        { id: 'inventory_products', label: 'Katalog Produk & Stok', icon: Package },
        { id: 'raw_materials', label: 'Manajemen Bahan Baku', icon: Boxes },
        { id: 'stock_opname', label: 'Stock Opname & Mutasi', icon: RefreshCw },
        { id: 'purchasing_po', label: 'Purchase Orders & Supplier', icon: Truck }
      ]
    },
    {
      id: 'finance_accounting',
      label: 'Finance & Accounting',
      icon: Landmark,
      items: [
        { id: 'chart_accounts', label: 'Chart of Accounts (COA)', icon: Layers },
        { id: 'journal_entries', label: 'Jurnal Umum & Buku Besar', icon: FileText },
        { id: 'financial_reports', label: 'Laba Rugi & Neraca', icon: BarChart3 },
        { id: 'fixed_assets', label: 'Aset Tetap & Depresiasi', icon: Building2 }
      ]
    },
    {
      id: 'product_manufacturing',
      label: 'R&D & Production',
      icon: FlaskConical,
      items: [
        { id: 'raw_materials', label: 'Manajemen Bahan Baku', icon: Boxes },
        { id: 'rnd_development', label: 'Product R&D Development', icon: FlaskConical },
        { id: 'production_bom', label: 'Perencanaan Produksi & BOM', icon: Layers3 }
      ]
    },
    {
      id: 'event_management',
      label: 'Event Management',
      icon: Calendar,
      items: [
        { id: 'event_management', label: 'Manage Events', icon: Calendar }
      ]
    },
    {
      id: 'marketing_growth',
      label: 'Marketing & Growth',
      icon: Megaphone,
      items: [
        { id: 'kol_campaigns', label: 'KOL & Influencer Campaign', icon: Radio },
        { id: 'affiliate_events', label: 'Affiliate & Event Program', icon: Target }
      ]
    },
    {
      id: 'project_management',
      label: 'Project Management',
      icon: FolderGit2,
      items: [
        { id: 'task_kanban', label: 'Task Kanban & Workload', icon: FolderGit2 },
        { id: 'gantt_timeline', label: 'Gantt Chart & Timeline', icon: GanttChart }
      ]
    },
    {
      id: 'governance_core',
      label: 'Governance & Core System',
      icon: Shield,
      items: [
        { id: 'rbac_users', label: 'User Management & Kredensial', icon: Users },
        { id: 'approval_center', label: 'Persetujuan (Approval)', icon: CheckCircle2 },
        { id: 'audit_trail', label: 'Audit Trail Activity Log', icon: FileText },
        { id: 'audit_sync_log', label: 'Audit Sync Log (Deletion Queue)', icon: HardDrive },
        { id: 'company_profile', label: 'Profil Perusahaan & Tax', icon: Building2 },
        { id: 'gmail_inbox', label: 'Google Gmail Integration', icon: Mail },
        { id: 'google_meet', label: 'Google Meet Integration', icon: Video }
      ]
    },
    {
      id: 'dev_export',
      label: 'PHP & MySQL Code Exporter',
      icon: Code2,
      items: [
        { id: 'mysql_schema', label: 'MySQL 8+ DDL Schema & Seeds', icon: Database },
        { id: 'php_mvc_code', label: 'PHP Native 8+ MVC Generator', icon: Code2 }
      ]
    }
  ];

  const userPermissions = currentUser?.permissions || [];
  const hasAllAccess = userPermissions.includes('all') || currentUser?.role === 'Admin';

  const filteredDomains = domains.map(domain => {
    if (hasAllAccess) {
      return domain;
    }
    const allowedItems = domain.items.filter(item => userPermissions.includes(item.id) || item.id === 'event_management');
    return {
      ...domain,
      items: allowedItems
    };
  }).filter(domain => domain.items.length > 0);

  const handleSubItemClick = (domainId: string, itemId: string) => {
    setActiveDomain(domainId);
    setActiveTab(itemId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`glass-sidebar text-slate-800 flex flex-col transition-all duration-300 border-r border-slate-200/80 ${
          mobileOpen
            ? 'fixed inset-y-0 left-0 z-50 w-72 shadow-2xl flex'
            : 'hidden md:flex'
        } ${isCurrentlyCollapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center font-black text-slate-900 text-xl shrink-0 overflow-hidden backdrop-blur-md">
              {companyProfile.logoUrl ? (
                <img src={companyProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                'J'
              )}
            </div>
            {(!isCurrentlyCollapsed || mobileOpen) && (
              <div className="overflow-hidden">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-tight truncate">
                  JERJHON ERP
                </h1>
                <p className="text-[10px] text-rose-600 uppercase tracking-widest font-bold truncate">
                  Enterprise Suite
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleCollapse}
              className="hidden md:block p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={isCurrentlyCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCurrentlyCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {/* Mobile close button */}
            {mobileOpen && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Close Navigation"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Menu List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
          {filteredDomains.map((domain) => {
            const Icon = domain.icon;
            const isDomainActive = activeDomain === domain.id;

            return (
              <div key={domain.id} className="space-y-1">
                {/* Domain Category Header */}
                <button
                  onClick={() => {
                    setActiveDomain(domain.id);
                    setActiveTab(domain.items[0].id);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                    isDomainActive
                      ? 'bg-rose-50 text-rose-700 border border-rose-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Icon className={`w-4 h-4 shrink-0 ${isDomainActive ? 'text-rose-600' : 'text-slate-400'}`} />
                    {(!isCurrentlyCollapsed || mobileOpen) && <span className="truncate">{domain.label}</span>}
                  </div>
                  {(!isCurrentlyCollapsed || mobileOpen) && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isDomainActive ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                      {domain.items.length}
                    </span>
                  )}
                </button>

                {/* Sub items */}
                {(!isCurrentlyCollapsed || mobileOpen) && isDomainActive && (
                  <div className="ml-4 pl-3 border-l border-slate-200 space-y-1 my-1">
                    {domain.items.map((item) => {
                      const SubIcon = item.icon;
                      const isTabActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSubItemClick(domain.id, item.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                            isTabActive
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-200 font-semibold'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Info */}
        {(!isCurrentlyCollapsed || mobileOpen) && (
          <div className="p-3 m-3 bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-2xl text-[11px] text-slate-600 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-slate-900 font-bold">
              <span>{companyProfile.companyName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">{companyProfile.legalName}</p>
          </div>
        )}
      </aside>
    </>
  );
};
