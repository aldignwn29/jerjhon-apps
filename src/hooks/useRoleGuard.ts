import { useERP } from '../context/ERPContext';

export interface GuardResult {
  allowed: boolean;
  restrictedReason?: string;
  redirectTab?: string;
}

export function useRoleGuard(activeTab: string) {
  const { currentUser, isStaff, isManager, isAdmin } = useERP();

  const checkAccess = (): GuardResult => {
    const tabLower = activeTab.toLowerCase();
    
    // Admin only modules
    const adminOnlyTabs = ['rbac_users', 'admin-users', 'audit_trail', 'admin-audit', 'mysql_schema', 'php_mvc_code'];
    if (adminOnlyTabs.includes(tabLower) && isStaff) {
      return {
        allowed: false,
        restrictedReason: 'Modul manajemen sistem & audit trail dikhususkan untuk Administrator.',
        redirectTab: 'dashboard_exec'
      };
    }

    // Sensitive Financial / Accounting modules for staff
    const sensitiveTabs = ['chart_accounts', 'fin-coa', 'journal_entries', 'fin-journals', 'financial_reports', 'fin-reports', 'fixed_assets', 'fin-assets'];
    if (sensitiveTabs.includes(tabLower) && isStaff) {
      return {
        allowed: false,
        restrictedReason: 'Akses ke Buku Besar dan Laporan Keuangan Perusahaan dibatasi untuk level Manager & Finance.',
        redirectTab: 'dashboard_exec'
      };
    }

    return { allowed: true };
  };

  return {
    isStaff,
    isManager,
    isAdmin,
    currentUser,
    guardResult: checkAccess()
  };
}
