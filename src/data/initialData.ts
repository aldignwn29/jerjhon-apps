import {
  User, Employee, AttendanceRecord, LeaveRequest, OvertimeRequest, PayrollRecord, KPIRecord, KPITask, OKRRecord,
  MarketplaceOrder, ProductItem, StockMovement, PurchaseOrder, Supplier, ChartOfAccount,
  JournalEntry, ProductRND, ProductionOrder, KOLCampaign, AffiliatePartner, Customer,
  Project, ProjectTask, ContentCampaignItem, ApprovalRequest, AuditLog, SystemNotification, CompanyProfile, FixedAsset,
  ProductRawMaterialGroup, ERPEvent
} from '../types';

export const INITIAL_COMPANY: CompanyProfile = {
  companyName: "Jerjhon Creative Lab",
  legalName: "PT JERJHON ENTERPRISE INDONESIA",
  taxRegistrationNumber: "01.892.341.2-014.000",
  address: "Jl. Kristal V No.85, Sukamenak, Kec. Margahayu, Kabupaten Bandung, Jawa Barat 40227",
  city: "Bandung, Jawa Barat",
  phone: "+62 21 5558-8900",
  email: "corporate@jerjhon.co.id",
  website: "https://jerjhon-enterprise.com",
  bpjsKesehatanRate: 5.0,
  bpjsKetenagakerjaanRate: 4.24,
  vatTaxRate: 11.0,
  currency: "IDR",
  officeLat: -6.9644,
  officeLng: 107.5894
};

export const INITIAL_USERS: User[] = [
  {
    id: "USR-002",
    username: "admin",
    password: "admin123",
    name: "Ald Gunawan",
    email: "aldygunawan6@gmail.com",
    role: "Admin",
    department: "Finance",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "2026-07-26 08:45",
    permissions: ["all"]
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-1000",
    nik: "3171011212900001",
    name: "Ald Gunawan",
    email: "aldygunawan6@gmail.com",
    phone: "+62 811-1234-5678",
    gender: "L",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    department: "Executive",
    position: "System Administrator",
    supervisor: "CEO",
    joinDate: "2020-01-01",
    status: "Tetap",
    npwp: "11.222.333.4-555.000",
    bpjsKesehatan: "0001112223334",
    bpjsKetenagakerjaan: "11011122233",
    bankName: "BCA",
    bankAccountNumber: "1234567890",
    baseSalary: 25000000,
    fixedAllowance: 5000000,
    transportAllowance: 2000000,
    mealAllowance: 1500000,
    address: "Jl. Sudirman No. 1, Jakarta",
    kpiScore: 100,
    education: "S1 Ilmu Komputer"
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];
export const INITIAL_OVERTIME_REQUESTS: OvertimeRequest[] = [];
export const INITIAL_PAYROLL: PayrollRecord[] = [];
export const INITIAL_KPIS: KPIRecord[] = [];
export const INITIAL_KPI_TASKS: KPITask[] = [];
export const INITIAL_OKRS: OKRRecord[] = [];
export const INITIAL_MARKETPLACE_ORDERS: MarketplaceOrder[] = [];
export const INITIAL_PRODUCTS: ProductItem[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_COA: ChartOfAccount[] = [];
export const INITIAL_JOURNALS: JournalEntry[] = [];
export const INITIAL_FIXED_ASSETS: FixedAsset[] = [];
export const INITIAL_RND: ProductRND[] = [];
export const INITIAL_PRODUCTION_ORDERS: ProductionOrder[] = [];
export const INITIAL_KOL_CAMPAIGNS: KOLCampaign[] = [];
export const INITIAL_AFFILIATES: AffiliatePartner[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_CAMPAIGNS: ContentCampaignItem[] = [];
export const INITIAL_TASKS: ProjectTask[] = [];
export const INITIAL_APPROVALS: ApprovalRequest[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_NOTIFICATIONS: SystemNotification[] = [];
export const INITIAL_RAW_MATERIAL_GROUPS: ProductRawMaterialGroup[] = [];
export const INITIAL_EVENTS: ERPEvent[] = [];

export const INITIAL_SYSTEM_ROLES = [
  {
    name: "Admin (Otoritas Penuh)",
    description: "Akses penuh ke seluruh modul sistem ERP, pengelolaan kredensial pengguna, pengaturan perusahaan, audit trail, serta alat pengembang.",
    permissions: ["all"]
  },
  {
    name: "Manager (Otoritas Divisi)",
    description: "Mengawasi, menyetujui, dan mengelola aktivitas operasional di departemen masing-masing (Creative, Marketing, HR, Finance).",
    permissions: ["emp_list", "attendance_shifts", "leave_management", "payroll_engine", "kpi_okr", "task_messages", "recruitment_training", "event_management"]
  },
  {
    name: "Staff (Otoritas Operasional)",
    description: "Mengakses fitur-fitur operasional dasar, pengisian absensi harian, pengajuan cuti/izin, serta pengelolaan daftar tugas kerja harian.",
    permissions: ["attendance_shifts", "leave_management", "task_kanban", "task_messages", "event_management"]
  }
];
