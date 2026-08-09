// JERJHON ERP ENTERPRISE - TYPE DEFINITIONS

export type RoleType = 'Admin' | 'Manager' | 'Staff';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  username?: string;
  password?: string;
  name: string;
  email: string;
  role: RoleType;
  department: string;
  avatar: string;
  status: UserStatus;
  lastLogin: string;
  permissions: string[];
  fcmToken?: string;
}

// ----------------------------------------------------
// HUMAN CAPITAL (Employee, HR, Attendance, Payroll, KPI)
// ----------------------------------------------------

export type EmployeeStatus = 'Tetap' | 'Kontrak' | 'Probation' | 'Resigned' | 'Terminated';
export type Gender = 'L' | 'P';

export interface Employee {
  id: string;
  nik: string;
  name: string;
  email: string;
  phone: string;
  gender: Gender;
  avatar: string;
  department: string;
  position: string;
  supervisor: string;
  joinDate: string;
  contractEndDate?: string;
  status: EmployeeStatus;
  npwp: string;
  bpjsKesehatan: string;
  bpjsKetenagakerjaan: string;
  bankName: string;
  bankAccountNumber: string;
  baseSalary: number;
  fixedAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  address: string;
  kpiScore?: number; // 0 - 100
  education: string;
  role?: string;
  hireDate?: string;
  salary?: number;
  fcmToken?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:mm
  clockOut: string; // HH:mm
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Cuti' | 'Alpha' | 'Late';
  shift: 'Regular (08:00 - 17:00)' | 'Morning (07:00 - 15:00)' | 'Night (22:00 - 06:00)' | 'Non-Shift (Jam Bebas)';
  workHours: number;
  location: string;
  locationName?: string;
  gpsLat?: number;
  gpsLng?: number;
  clockOutGpsLat?: number;
  clockOutGpsLng?: number;
  notes?: string;
  photoUrl?: string;
  clockOutPhotoUrl?: string;
  attendanceType?: 'WFO' | 'WFH' | 'Dinas Luar';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Cuti Tahunan' | 'Izin Full Day' | 'Izin Setengah Hari' | 'Cuti Sakit' | 'Cuti Melahirkan' | 'Izin Khusus' | 'Izin Memotong Gaji' | 'Cuti Pengganti Libur';
  startDate: string;
  endDate: string;
  totalDays: number;
  cutiDeduction?: number; // 1 for Full Day Cuti/Izin, 0.333 for Setengah Hari, 0 for Sakit/Melahirkan
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  appliedDate: string;
  stage1Approved?: boolean;
  stage1ApprovedBy?: string;
  stage1Comment?: string;
  stage1Date?: string;
  stage2Approved?: boolean;
  stage2ApprovedBy?: string;
  stage2Comment?: string;
  stage2Date?: string;
  currentStage?: number; // 1 = Stage 1, 2 = Stage 2, 3 = Fully Approved
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  appliedDate: string;
  compensationType: 'Uang Makan Saja (< 2 Jam)' | 'Uang Lembur + Uang Makan (>= 2 Jam)';
  mealAllowance: number;
  overtimePay: number;
  totalPayout: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  period: string; // e.g., "Juli 2026"
  baseSalary: number;
  fixedAllowance: number;
  variableAllowance: number;
  overtimePay: number;
  bonusIncentive: number;
  kpiCommission: number;
  grossSalary: number;
  bpjsDeduction: number;
  taxPPh21: number;
  loanDeduction: number;
  totalDeduction: number;
  takeHomePay: number;
  paymentStatus: 'Paid' | 'Processing' | 'Pending Approval' | 'done' | 'pending' | 'cancelled';
  paidDate?: string;
}

export interface KPITaskSubmission {
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  proofLink?: string;
  notes?: string;
  submittedAt?: string;
}

export interface KPITask {
  id: string;
  title: string;
  description: string;
  department: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g. "Juli 2026"
  week: 'Minggu 1' | 'Minggu 2' | 'Minggu 3' | 'Minggu 4' | 'Minggu 5';
  weight: number; // e.g. 25 (%)
  dueDate: string; // YYYY-MM-DD
  status: 'Pending' | 'Submitted' | 'Approved' | 'Declined' | 'Overdue';
  submission?: KPITaskSubmission;
  score?: number; // 0 - 100
  scorePreset?: 100 | 85 | 70 | 50 | 0;
  scoreLabel?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface KPIRecord {
  id: string;
  code: string;
  title: string;
  department: string;
  assignedTo: string; // Employee ID or Name
  assignedToName: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  unit: string; // %, Order, Rp, Unit, Hours
  weight: number; // percentage e.g. 25
  score: number; // calculated 0-100
  period: string; // Q3 2026, July 2026
  status: 'In Progress' | 'Achieved' | 'Needs Improvement' | 'Pending Review';
  dueDate: string;
}

export interface OKRRecord {
  id: string;
  objective: string;
  owner: string;
  department: string;
  period: string;
  progress: number; // 0 - 100
  keyResults: {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
  }[];
}

export interface TrainingProgram {
  id: string;
  title: string;
  trainer: string;
  department: string;
  participantsCount: number;
  startDate: string;
  endDate: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  budget: number;
}

export interface RecruitmentCandidate {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  appliedDate: string;
  stage: 'Screening' | 'Technical Interview' | 'HR Interview' | 'Offering' | 'Hired' | 'Rejected';
  rating: number; // 1-5
}

// ----------------------------------------------------
// SALES & MARKETPLACE (Shopee, Tokopedia, TikTok, POS, CRM)
// ----------------------------------------------------

export type ChannelType = 'Shopee' | 'Tokopedia' | 'TikTok Shop' | 'Lazada' | 'Website' | 'POS Retail';

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  channel: ChannelType;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  skuCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  voucherDiscount: number;
  marketplaceAdminFee: number;
  adsCost: number;
  shippingFee: number;
  cogs: number;
  variant: string;
  netProfit: number;
  status: 'Selesai' | 'Dalam Pengiriman' | 'Proses Packing' | 'Dibatalkan';
  paymentMethod: 'ShopeePay' | 'GoPay' | 'TikTok Wallet' | 'Bank Transfer' | 'Cash / QRIS';
}

export interface POSCartItem {
  productId: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  stock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  segment: 'VIP' | 'Regular' | 'Wholesale' | 'New';
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastPurchase: string;
}

// ----------------------------------------------------
// INVENTORY, WAREHOUSE & PURCHASING
// ----------------------------------------------------

export interface ProductItem {
  id: string;
  sku: string;
  parentSku?: string;
  name: string;
  category: string;
  warehouse: string;
  stockQuantity: number;
  minimumStock: number;
  safetyStock: number;
  unitCostPrice: number; // COGS
  sellingPrice: number;
  unit: 'Pcs' | 'Box' | 'Kg' | 'Set';
  status: 'Ready' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  productSku: string;
  productName: string;
  type: 'Inbound Purchase' | 'Outbound Sales' | 'Warehouse Transfer' | 'Stock Opname Adjustment' | 'Production Consumption';
  quantity: number;
  sourceLocation: string;
  destinationLocation: string;
  date: string;
  operator: string;
  referenceNumber: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  orderDate: string;
  expectedDelivery: string;
  totalAmount: number;
  paymentStatus: 'Lunas' | 'Partial' | 'Belum Dibayar';
  approvalStatus: 'Approved' | 'Pending' | 'Rejected';
  itemsCount: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  rating: number; // 1-5
  totalPurchases: number;
}

// ----------------------------------------------------
// FINANCE & ACCOUNTING
// ----------------------------------------------------

export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'COGS' | 'Expense';

export interface ChartOfAccount {
  code: string;
  name: string;
  category: AccountCategory;
  subCategory: string;
  balance: number;
  isHeader: boolean;
}

export interface JournalEntry {
  id: string;
  voucherNo: string;
  date: string;
  description: string;
  debitAccountCode: string;
  debitAccountName: string;
  creditAccountCode: string;
  creditAccountName: string;
  amount: number;
  createdByName: string;
  moduleSource: 'Sales Marketplace' | 'Purchase' | 'Payroll' | 'Manual Adjustment' | 'Asset Depreciation';
}

export interface FixedAsset {
  id: string;
  code: string;
  assetName: string;
  purchaseDate: string;
  acquisitionCost: number;
  usefulLifeYears: number;
  accumulatedDepreciation: number;
  bookValue: number;
  location: string;
}

// ----------------------------------------------------
// PRODUCT DEVELOPMENT & MANUFACTURING
// ----------------------------------------------------

export interface ProductRND {
  id: string;
  code: string;
  ideaTitle: string;
  category: string;
  stage: string;
  targetLaunchDate: string;
  estimatedBOMCost: number;
  targetSellingPrice: number;
  leadResearcher: string;
  progress: number;
  stageData?: any; // To hold dynamic data per stage
}

export interface SizeBreakdown {
  xs?: number;
  s?: number;
  m?: number;
  l?: number;
  xl?: number;
  xxl?: number;
  '3xl'?: number;
  '4xl'?: number;
  '5xl'?: number;
  '6xl'?: number;
  allSize?: number;
  [key: string]: number | undefined;
}

export interface RawMaterialItem {
  id: string;
  name: string;
  penggunaan: number;
  satuan: string;
  biayaSatuan: number;
}

export interface ProductRawMaterialGroup {
  id: string;
  productName: string;
  materials: RawMaterialItem[];
}

export interface ProductionOrder {
  id: string;
  code?: string;
  batchNo?: string;
  productName: string;
  bahanBaku?: string;
  sizeBreakdown?: SizeBreakdown;
  quantityTarget?: number;
  quantityCompleted?: number;
  totalQty: number;
  startDate: string;
  dueDate: string;
  status: 'Planning' | 'Dalam Proses' | 'Selesai' | 'Dibatalkan' | 'In Production' | 'QC Inspection' | 'Completed' | 'Planned' | string;
  unitCost?: number;
  totalCost?: number;
  bomCostPerUnit?: number;
  qcPassRate?: number;
  sentToBUDP?: boolean;
}

// ----------------------------------------------------
// MARKETING & GROWTH
// ----------------------------------------------------

export interface KOLCampaign {
  id: string;
  kolName: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  followers: number;
  campaignTitle: string;
  campaignName?: string;
  tier?: 'Mega KOL (>1M)' | 'Macro KOL (100k-1M)' | 'Micro KOL (10k-100k)' | 'Nano KOL (<10k)' | string;
  contractFee: number;
  spentBudget: number;
  revenueGenerated: number;
  roi: number; // percentage
  roas: number; // multiplier e.g. 5.4
  deliverableStatus: 'Pending Content' | 'Draft Review' | 'Posted' | 'Completed';
  status: 'Active' | 'Completed' | 'Pending Review' | 'Planned' | string;
  postDate: string;
}

export interface AffiliatePartner {
  id: string;
  code: string;
  name: string;
  channel: string;
  platform: 'TikTok Shop' | 'Shopee Affiliate' | 'Tokopedia' | 'Instagram' | string;
  handle: string;
  totalOrdersGenerated: number;
  totalSalesGenerated: number;
  commissionRate: number; // percentage
  payoutEarned: number;
  totalCommissionEarned: number;
  status: 'Active' | 'Pending' | 'Inactive';
}

// ----------------------------------------------------
// PROJECT MANAGEMENT & TASKS
// ----------------------------------------------------

export type TaskPriority = 'High' | 'Medium' | 'Low' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  assignee: string;
  department: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  subtasks: { id: string; title: string; completed: boolean }[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  department: string;
  lead: string;
  startDate: string;
  deadline: string;
  progress: number;
  status: 'Active' | 'Planning' | 'Completed' | 'On Hold';
  budget: number;
}

export interface ContentCampaignItem {
  id: string;
  title: string;
  type: 'Konten Harian' | 'Seasonal Campaign' | 'Product Launch' | 'Brand Campaign';
  platform: 'TikTok' | 'Instagram' | 'Shopee' | 'YouTube' | 'Omnichannel';
  scheduleDate: string;
  deadline: string;
  assignee: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Published';
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  description: string;
  deliverables?: string;
}

// ----------------------------------------------------
// GOVERNANCE, WORKFLOW, AUDIT, NOTIFICATIONS & SYSTEM
// ----------------------------------------------------

export interface ApprovalRequest {
  id: string;
  requestType: 'Cuti Karyawan' | 'Purchase Order' | 'Pengeluaran Kas' | 'Lembur' | 'Penyesuaian Budget';
  requestedBy: string;
  department: string;
  amountOrDays?: string;
  description: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approver: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  ipAddress: string;
  details: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  linkModule?: string;
}

export interface CompanyProfile {
  companyName: string;
  legalName: string;
  brandName?: string;
  taxRegistrationNumber: string; // NPWP Perusahaan
  npwpCompany?: string;
  nibNumber?: string;
  halalCertificateNo?: string;
  bpomLicenseNo?: string;
  taxPpnRate?: number;
  taxPph21Rate?: number;
  taxCorporateRate?: number;
  directorName?: string;
  address: string;
  city: string;
  zipCode?: string;
  province?: string;
  phone: string;
  email: string;
  website: string;
  bpjsKesehatanRate: number; // e.g. 4% employer + 1% employee
  bpjsKetenagakerjaanRate: number; // e.g. 4.24%
  vatTaxRate: number; // e.g. 11% PPN
  currency: string;
  officeLat?: number;
  officeLng?: number;
}

export interface Sponsor {
  name: string;
  budget: number;
  type?: 'Nominal' | 'Produk';
  productQty?: number;
}

export interface StockOpnameRecord {
  id: string;
  referenceNumber: string;
  date: string;
  warehouse: string;
  productSku: string;
  productName: string;
  variantLabel?: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  reason: string;
  notes?: string;
  operator: string;
}

export interface ERPEvent {
  id: string;
  title: string;
  description: string;
  activity: string;
  date: string;
  jenisEvent: 'mandiri' | 'kolaborasi';
  isCollaboration: boolean;
  communityName?: string;
  location: string;
  status: 'planned' | 'ongoing' | 'pending' | 'cancelled';
  targetParticipants: number;
  actualParticipants: number;
  budget: number;
  actualCost: number;
  variance: number;
  sponsors: Sponsor[];
  bannerUrl?: string;
}

export interface DeletionQueueItem {
  id: string;
  collectionName: string;
  recordId: string;
  recordName?: string;
  deletedBy?: string;
  deletedAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  attempts: number;
  lastSyncError?: string;
  syncedAt?: string;
}

export interface SyncFieldDivergence {
  fieldName: string;
  fieldLabel: string;
  localValue: any;
  remoteValue: any;
  resolution?: 'local' | 'remote';
}

export interface SyncConflictItem {
  id: string;
  collectionName: string;
  recordId: string;
  recordName: string;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  fields: SyncFieldDivergence[];
  status: 'pending' | 'resolved';
  resolvedAt?: string;
  resolvedBy?: string;
}

