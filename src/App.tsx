import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { useRoleGuard } from './hooks/useRoleGuard';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { RoleSwitcherModal } from './components/common/RoleSwitcherModal';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// Executive Domain
import { ExecutiveDashboardView } from './components/modules/executive/ExecutiveDashboardView';
import { ExecutiveReportsView } from './components/modules/executive/ExecutiveReportsView';

// Human Capital Domain
import { EmployeeDatabaseView } from './components/modules/human_capital/EmployeeDatabaseView';
import { AttendanceShiftsView } from './components/modules/human_capital/AttendanceShiftsView';
import { LeaveManagementView } from './components/modules/human_capital/LeaveManagementView';
import { PayrollEngineView } from './components/modules/human_capital/PayrollEngineView';
import { KPIOKRView } from './components/modules/human_capital/KPIOKRView';
import { RecruitmentTrainingView } from './components/modules/human_capital/RecruitmentTrainingView';
import { TaskNotificationsInboxView } from './components/modules/human_capital/TaskNotificationsInboxView';

// Sales & Marketplace Domain
import { MarketplaceHubView } from './components/modules/sales_marketplace/MarketplaceHubView';
import { POSRetailView } from './components/modules/sales_marketplace/POSRetailView';
import { CRMView } from './components/modules/sales_marketplace/CRMView';

// Inventory & Warehouse Domain
import { InventoryProductsView } from './components/modules/inventory_purchasing/InventoryProductsView';
import { RawMaterialsView } from './components/modules/inventory_purchasing/RawMaterialsView';
import { StockOpnameView } from './components/modules/inventory_purchasing/StockOpnameView';
import { PurchasingSupplierView } from './components/modules/inventory_purchasing/PurchasingSupplierView';

// Finance & Accounting Domain
import { ChartOfAccountsView } from './components/modules/finance_accounting/ChartOfAccountsView';
import { JournalEntriesView } from './components/modules/finance_accounting/JournalEntriesView';
import { FinancialReportsView } from './components/modules/finance_accounting/FinancialReportsView';
import { FixedAssetsView } from './components/modules/finance_accounting/FixedAssetsView';

// Production & R&D Domain
import { RNDDevelopmentView } from './components/modules/production_rd/RNDDevelopmentView';
import { BOMProductionView } from './components/modules/production_rd/BOMProductionView';
import { QualityControlView } from './components/modules/production_rd/QualityControlView';

// Marketing & Growth Domain
import { MarketingGrowthView } from './components/modules/marketing_growth/MarketingGrowthView';
import { EventManagementView } from './components/modules/event_management/EventManagementView';

// Project Management Domain
import { ProjectManagementView } from './components/modules/project_management/ProjectManagementView';

// Admin & Governance Domain
import { UserManagementView } from './components/modules/admin_system/UserManagementView';
import { ApprovalCenterView } from './components/modules/admin_system/ApprovalCenterView';
import { AuditTrailView } from './components/modules/admin_system/AuditTrailView';
import { AuditSyncLogView } from './components/modules/admin_system/AuditSyncLogView';
import { CompanyProfileView } from './components/modules/admin_system/CompanyProfileView';
import { GmailInboxView } from './components/modules/admin_system/GmailInboxView';
import { GoogleMeetView } from './components/modules/admin_system/GoogleMeetView';
import { FloatingChatWidget } from './components/modules/chat/FloatingChatWidget';
import { MobileHumanCapitalApp } from './components/modules/human_capital/MobileHumanCapitalApp';

// Dev & Code Exporter
import { DevCodeExporterView } from './components/modules/dev_export/DevCodeExporterView';
import { LoginView } from './components/auth/LoginView';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, isAuthenticated, currentUser, isStaff, isInitialSyncing } = useERP();
  
  // Call all hooks unconditionally
  const { guardResult } = useRoleGuard(activeTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  
  if (isInitialSyncing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="flex flex-col items-center gap-6 max-w-md w-full text-center">
          {/* Pulsing Red Logo */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-[#b90f0f]/20 animate-ping duration-1000" />
            <div className="w-16 h-16 rounded-2xl bg-[#b90f0f] flex items-center justify-center shadow-lg shadow-[#b90f0f]/30 relative z-10">
              <span className="font-black text-2xl tracking-wider text-white">JE</span>
            </div>
          </div>
          
          <div className="space-y-2 mt-2">
            <h2 className="text-lg font-extrabold text-slate-100">PT JERJHON ENTERPRISE</h2>
            <p className="text-xs text-slate-400 font-medium">Sinkronisasi Database ERP & Kepegawaian...</p>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px] bg-slate-950/40 px-3.5 py-1.5 rounded-full border border-slate-800/60 shadow-sm mt-2 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b90f0f]"></span>
            Menghubungkan ke Cloud Node
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated || !currentUser) {
    return <LoginView />;
  }

  // Mobile check
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('view') === 'mobile') {
      return <MobileHumanCapitalApp />;
  }

  const renderActiveModule = () => {
    if (!guardResult.allowed) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/50 text-[#b90f0f] rounded-3xl flex items-center justify-center mb-4 shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi (Role Guarded)</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
            {guardResult.restrictedReason || 'Anda tidak memiliki hak akses untuk membuka modul ini berdasarkan level role Anda.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(guardResult.redirectTab || 'dashboard_exec')}
              className="bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Saya
            </button>
            <button
              onClick={() => setIsRoleSwitcherOpen(true)}
              className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-5 py-3 rounded-2xl text-xs font-bold transition-all"
            >
              Ganti Akun Simulasi
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      // Executive
      case 'dashboard_exec':
      case 'dashboard-exec':
        return <ExecutiveDashboardView />;
      case 'reports_analytics':
      case 'reports-exec':
        return <ExecutiveReportsView />;

      // Human Capital
      case 'emp_list':
      case 'emp-database':
        return <EmployeeDatabaseView />;
      case 'attendance_shifts':
      case 'emp-attendance':
        return <AttendanceShiftsView />;
      case 'leave_management':
      case 'emp-leave':
        return <LeaveManagementView />;
      case 'payroll_engine':
      case 'emp-payroll':
        return <PayrollEngineView />;
      case 'kpi_okr':
      case 'emp-kpi':
        return <KPIOKRView />;
      case 'task_messages':
        return <TaskNotificationsInboxView />;
      case 'recruitment_training':
      case 'emp-recruitment':
        return <RecruitmentTrainingView />;

      // Sales & Marketplace
      case 'marketplace_hub':
      case 'mkt-orders':
        return <MarketplaceHubView />;
      case 'pos_retail':
      case 'mkt-pos':
        return <POSRetailView />;
      case 'crm_customers':
      case 'mkt-crm':
        return <CRMView />;

      // Inventory & Supply Chain
      case 'inventory_products':
      case 'inv-products':
        return <InventoryProductsView />;
      case 'raw_materials':
      case 'raw-materials':
      case 'bahan_baku':
        return <RawMaterialsView />;
      case 'stock_opname':
      case 'inv-stock-opname':
        return <StockOpnameView />;
      case 'purchasing_po':
      case 'inv-purchasing':
        return <PurchasingSupplierView />;

      // Finance & Accounting
      case 'chart_accounts':
      case 'fin-coa':
        return <ChartOfAccountsView />;
      case 'journal_entries':
      case 'fin-journals':
        return <JournalEntriesView />;
      case 'financial_reports':
      case 'fin-reports':
        return <FinancialReportsView />;
      case 'fixed_assets':
      case 'fin-assets':
        return <FixedAssetsView />;

      // Production & R&D
      case 'rnd_development':
        return <RNDDevelopmentView />;
      case 'production_bom':
      case 'prod-bom':
        return <BOMProductionView />;
      case 'prod_qc':
      case 'prod-qc':
        return <QualityControlView />;

      // Marketing & Growth
      case 'kol_campaigns':
        return <MarketingGrowthView defaultTab="kol" />;
      case 'affiliate_events':
        return <MarketingGrowthView defaultTab="affiliates" />;
      case 'event_management':
        return <EventManagementView />;
      case 'marketing_growth':
        return <MarketingGrowthView />;

      // Project Management
      case 'task_kanban':
      case 'gantt_timeline':
        return <ProjectManagementView />;

      // Administration & Governance
      case 'rbac_users':
      case 'admin-users':
        return <UserManagementView />;
      case 'approval_center':
        return <ApprovalCenterView />;
      case 'audit_trail':
      case 'admin-audit':
        return <AuditTrailView />;
      case 'audit_sync_log':
      case 'admin-sync-log':
        return <AuditSyncLogView />;
      case 'company_profile':
      case 'admin-company':
        return <CompanyProfileView />;
      case 'gmail_inbox':
        return <GmailInboxView />;
      case 'google_meet':
        return <GoogleMeetView />;

      // Developer Code Exporter
      case 'mysql_schema':
      case 'php_mvc_code':
        return <DevCodeExporterView />;

      default:
        return <ExecutiveDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-rose-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glass Orbs */}
      <div className="fixed top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-rose-100/20 dark:bg-rose-900/10 blur-[100px] pointer-events-none z-0" />
      <div className="fixed top-[20%] right-[-5%] w-[450px] h-[450px] rounded-full bg-indigo-100/20 dark:bg-indigo-900/10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[30%] w-[500px] h-[500px] rounded-full bg-emerald-100/20 dark:bg-emerald-900/10 blur-[130px] pointer-events-none z-0" />

      {/* Top Fixed Header */}
      <Header
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden z-10 relative">
        {/* Left Collapsible Sidebar */}
        <Sidebar
          activeMenu={activeTab}
          onSelectMenu={(menu) => setActiveTab(menu)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {renderActiveModule()}
        </main>
      </div>

      {/* Geometric Balance Bottom Status Bar */}
      <footer className="h-8 glass-header dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online (Frosted Glass UI Enabled)
          </span>
          <span className="hidden sm:inline border-l border-slate-200 dark:border-slate-800 pl-4">Server: Local Cluster A1</span>
        </div>
        <div>© 2026 JERJHON ENTERPRISE • All Nodes Synchronized</div>
      </footer>

      {/* Slide-over Drawers & Modals */}
      {!isStaff && (
        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}

      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
      />
      
      <FloatingChatWidget />
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <MainLayout />
    </ERPProvider>
  );
}
