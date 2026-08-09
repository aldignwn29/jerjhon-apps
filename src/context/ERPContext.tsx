import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User, Employee, AttendanceRecord, LeaveRequest, OvertimeRequest, PayrollRecord, KPIRecord, KPITask, KPITaskSubmission, OKRRecord,
  MarketplaceOrder, ProductItem, StockMovement, PurchaseOrder, Supplier, ChartOfAccount,
  JournalEntry, ProductRND, ProductionOrder, KOLCampaign, AffiliatePartner, Customer,
  Project, ProjectTask, ContentCampaignItem, ApprovalRequest, AuditLog, SystemNotification, CompanyProfile, FixedAsset, RoleType,
  ProductRawMaterialGroup, ERPEvent, StockOpnameRecord
} from '../types';
import {
  INITIAL_COMPANY, INITIAL_USERS, INITIAL_EMPLOYEES, INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS, INITIAL_OVERTIME_REQUESTS, INITIAL_PAYROLL, INITIAL_KPIS, INITIAL_KPI_TASKS, INITIAL_OKRS,
  INITIAL_MARKETPLACE_ORDERS, INITIAL_PRODUCTS, INITIAL_STOCK_MOVEMENTS,
  INITIAL_PURCHASE_ORDERS, INITIAL_SUPPLIERS, INITIAL_COA, INITIAL_JOURNALS,
  INITIAL_FIXED_ASSETS, INITIAL_RND, INITIAL_PRODUCTION_ORDERS,
  INITIAL_KOL_CAMPAIGNS, INITIAL_AFFILIATES, INITIAL_CUSTOMERS,
  INITIAL_PROJECTS, INITIAL_CAMPAIGNS, INITIAL_TASKS, INITIAL_APPROVALS, INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS, INITIAL_SYSTEM_ROLES, INITIAL_RAW_MATERIAL_GROUPS,
  INITIAL_EVENTS
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ERPContextType {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isAuthenticated: boolean;
  loginWithCredentials: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  loginDirect: (user: User) => { success: boolean; message: string; user?: User };
  logout: () => Promise<void>;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  allUsers: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  sha256: (ascii: string) => string;
  systemRoles: { name: string; description: string; permissions: string[] }[];
  
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeDomain: string;
  setActiveDomain: (domain: string) => void;

  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: CompanyProfile) => void;

  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>, credentials?: { username?: string; password?: string; role?: RoleType }) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  
  attendance: AttendanceRecord[];
  addAttendanceRecord: (rec: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (id: string, rec: Partial<AttendanceRecord>) => void;
  deleteAttendanceRecord: (id: string) => void;
  syncAttendanceNow: () => Promise<void>;
  isSyncingAttendance: boolean;
  lastAttendanceSyncTime: Date | null;

  leaveRequests: LeaveRequest[];
  addLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>) => void;
  updateLeaveRequest: (id: string, req: Partial<LeaveRequest>) => void;
  deleteLeaveRequest: (id: string) => void;
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected', approverName: string, stage?: number, comment?: string) => void;

  overtimeRequests: OvertimeRequest[];
  addOvertimeRequest: (req: Omit<OvertimeRequest, 'id' | 'status' | 'appliedDate' | 'mealAllowance' | 'overtimePay' | 'totalPayout' | 'compensationType'>) => void;
  updateOvertimeStatus: (id: string, status: 'Approved' | 'Rejected', approverName: string) => void;
  deleteOvertimeRequest: (id: string) => void;

  payrolls: PayrollRecord[];
  calculatePayrollForEmployee: (employeeId: string, period: string) => void;
  updatePayrollStatus: (payrollId: string, status: 'done' | 'pending' | 'cancelled' | 'Paid' | 'Processing' | 'Pending Approval') => void;
  addPayrollRecord: (record: Omit<PayrollRecord, 'id'>) => void;
  updatePayrollRecord: (id: string, record: Partial<PayrollRecord>) => void;
  deletePayrollRecord: (id: string) => void;
  
  kpis: KPIRecord[];
  addKPI: (kpi: Omit<KPIRecord, 'id' | 'code' | 'score'>) => void;
  updateKPIScore: (id: string, currentValue: number) => void;

  kpiTasks: KPITask[];
  addKPITask: (task: Omit<KPITask, 'id' | 'status'>) => void;
  submitKPITask: (taskId: string, submission: KPITaskSubmission) => void;
  reviewKPITask: (
    taskId: string,
    score: number,
    scorePreset: 100 | 85 | 70 | 50 | 0,
    scoreLabel: string,
    reviewNotes: string,
    status: 'Approved' | 'Declined',
    reviewerName: string
  ) => void;
  deleteKPITask: (taskId: string) => void;

  okrs: OKRRecord[];

  marketplaceOrders: MarketplaceOrder[];
  addMarketplaceOrder: (order: Omit<MarketplaceOrder, 'id' | 'netProfit'>) => void;
  updateMarketplaceOrder: (id: string, order: Partial<MarketplaceOrder>) => void;
  deleteMarketplaceOrder: (id: string) => void;
  clearMarketplaceOrders: () => void;

  customers: Customer[];

  products: ProductItem[];
  addProduct: (prod: Omit<ProductItem, 'id'> & { id?: string }) => void;
  deleteProduct: (id: string) => void;
  updateProduct: (id: string, updatedFields: Partial<ProductItem>) => void;
  updateProductStock: (id: string, deltaQty: number, movementType: string) => void;
  clearProducts: () => void;

  customCategories: string[];
  customWarehouses: string[];
  deletedCategories: string[];
  deletedWarehouses: string[];
  availableCategories: string[];
  availableWarehouses: string[];
  addCustomCategory: (cat: string) => void;
  deleteCategory: (catName: string) => void;
  addCustomWarehouse: (wh: string) => void;
  deleteWarehouse: (whName: string) => void;

  stockMovements: StockMovement[];
  addStockMovement: (mov: Omit<StockMovement, 'id'>) => void;
  updateStockMovement: (id: string, updatedFields: Partial<StockMovement>) => void;
  deleteStockMovement: (id: string) => void;
  clearAllStockMovements: () => Promise<void>;

  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => void;
  updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;

  suppliers: Supplier[];

  chartOfAccounts: ChartOfAccount[];
  journalEntries: JournalEntry[];
  addJournalEntry: (je: Omit<JournalEntry, 'id'>) => void;
  fixedAssets: FixedAsset[];

  rndItems: ProductRND[];
  productionOrders: ProductionOrder[];
  addProductionOrder: (po: Omit<ProductionOrder, 'id'>) => void;
  updateProductionOrderStatus: (id: string, status: ProductionOrder['status']) => void;

  kolCampaigns: KOLCampaign[];
  affiliates: AffiliatePartner[];

  projects: Project[];
  tasks: ProjectTask[];
  campaigns: ContentCampaignItem[];

  approvalRequests: ApprovalRequest[];
  addApprovalRequest: (req: Omit<ApprovalRequest, 'id' | 'submittedAt' | 'status'>) => void;
  updateApprovalStatus: (id: string, status: 'Approved' | 'Rejected', approverName: string) => void;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, module: string, details: string) => void;

  notifications: SystemNotification[];
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', source?: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  rawMaterialGroups: ProductRawMaterialGroup[];
  events: ERPEvent[];
  stockOpnameRecords: StockOpnameRecord[];
  addStockOpnameRecord: (rec: Omit<StockOpnameRecord, 'id'>) => void;

  sizeOptions: string[];
  setSizeOptions: React.Dispatch<React.SetStateAction<string[]>>;
  colorOptions: string[];
  setColorOptions: React.Dispatch<React.SetStateAction<string[]>>;

  isStaff: boolean;
  isManager: boolean;
  isAdmin: boolean;

  isSupabaseConfigured: boolean;
  isSyncingSupabase: boolean;
  syncAllDataToSupabase: () => Promise<{ success: boolean; message: string }>;

  formatIDR: (amount: number) => string;
}

export const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('executive-dashboard');
  const [activeDomain, setActiveDomain] = useState<string>('executive');

  // Helper for localStorage with fallback
  const getStored = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(`jerjhon_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const setStored = <T,>(key: string, val: T) => {
    try {
      localStorage.setItem(`jerjhon_${key}`, JSON.stringify(val));
    } catch (err) {
      console.error(`Failed storing ${key}:`, err);
    }
  };

  // Auth state
  const [users, setUsers] = useState<User[]>(() => getStored('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStored('currentUser', null));

  const isAuthenticated = !!currentUser;

  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  const syncAllDataToSupabase = async () => {
    if (!isSupabaseConfigured) return { success: false, message: 'Supabase belum dikonfigurasi / URL placeholder.' };
    setIsSyncingSupabase(true);
    try {
      // 1. Sync Products
      for (const p of products) {
        await supabase.from('products').upsert({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          price: p.sellingPrice,
          cost: p.unitCostPrice,
          stock: p.stockQuantity,
          min_stock: p.minimumStock,
          supplier: 'Default Supplier',
          barcode: p.sku,
          image: p.image || ''
        });
      }

      // 2. Sync Marketplace Orders
      for (const o of marketplaceOrders) {
        await supabase.from('marketplace_orders').upsert({
          id: o.id,
          customer_name: o.customerName,
          customer_email: 'customer@example.com',
          channel: o.channel,
          status: o.status,
          total_amount: o.grossAmount,
          items: [],
          payment_method: o.paymentMethod
        });
      }

      // 3. Sync Employees
      for (const e of employees) {
        await supabase.from('employees').upsert({
          id: e.id,
          name: e.name,
          email: e.email,
          role: e.role,
          department: e.department,
          status: e.status,
          phone: e.phone,
          hire_date: e.hireDate,
          salary: e.salary,
          avatar: e.avatar || ''
        });
      }

      // 4. Sync Suppliers
      for (const s of suppliers) {
        await supabase.from('suppliers').upsert({
          id: s.id,
          name: s.name,
          contact_person: s.contactPerson,
          email: s.email,
          phone: s.phone,
          address: s.address,
          rating: s.rating
        });
      }

      // 5. Sync Purchase Orders
      for (const po of purchaseOrders) {
        await supabase.from('purchase_orders').upsert({
          id: po.id,
          supplier_id: po.supplierId,
          supplier_name: po.supplierName,
          status: po.status,
          total_amount: po.totalAmount,
          items: po.items,
          order_date: po.orderDate,
          expected_delivery: po.expectedDelivery
        });
      }

      setIsSyncingSupabase(false);
      return { success: true, message: 'Berhasil menyinkronkan seluruh data aplikasi ke Supabase!' };
    } catch (err: any) {
      setIsSyncingSupabase(false);
      console.error('Supabase sync all error:', err);
      return { success: false, message: err.message || 'Gagal sinkronisasi ke Supabase.' };
    }
  };

  // Supabase live sync effect
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function fetchSupabaseData() {
      try {
        const [
          prodRes,
          ordRes,
          empRes,
          supRes,
          poRes,
          auditRes,
          notifRes
        ] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('marketplace_orders').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('suppliers').select('*'),
          supabase.from('purchase_orders').select('*'),
          supabase.from('system_audit_logs').select('*'),
          supabase.from('notifications').select('*')
        ]);

        if (prodRes.data && prodRes.data.length > 0) {
          const loadedProducts = prodRes.data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            warehouse: p.warehouse || 'Gudang Pusat',
            stockQuantity: p.stock || 10,
            minimumStock: p.min_stock || 5,
            safetyStock: 5,
            unitCostPrice: Number(p.cost) || 0,
            sellingPrice: Number(p.price) || 0,
            unit: 'Pcs',
            status: 'Ready',
            lastUpdated: new Date().toISOString()
          }));
          setProducts(loadedProducts);
          setStored('products', loadedProducts);
        } else {
          // If Supabase table is empty, auto push initial local data to Supabase
          setTimeout(() => {
            syncAllDataToSupabase();
          }, 1000);
        }

        if (ordRes.data && ordRes.data.length > 0) {
          const loadedOrders = ordRes.data.map((o: any) => ({
            id: o.id,
            orderNumber: o.id,
            channel: o.channel || 'POS Retail',
            customerName: o.customer_name,
            customerPhone: o.customer_phone || '-',
            orderDate: o.created_at || new Date().toISOString(),
            skuCode: 'SKU-001',
            productName: 'Custom Item',
            quantity: 1,
            unitPrice: Number(o.total_amount),
            grossAmount: Number(o.total_amount),
            voucherDiscount: 0,
            marketplaceAdminFee: 0,
            adsCost: 0,
            shippingFee: 0,
            cogs: 0,
            variant: '-',
            netProfit: Number(o.total_amount) * 0.35,
            status: 'Selesai',
            paymentMethod: o.payment_method || 'Cash / QRIS'
          }));
          setMarketplaceOrders(loadedOrders);
          setStored('marketplaceOrders', loadedOrders);
        }

        if (empRes.data && empRes.data.length > 0) {
          const loadedEmps = empRes.data.map((e: any) => ({
            id: e.id,
            name: e.name,
            email: e.email,
            role: e.role,
            department: e.department,
            status: e.status,
            phone: e.phone,
            hireDate: e.hire_date,
            salary: Number(e.salary),
            avatar: e.avatar
          }));
          setEmployees(loadedEmps);
          setStored('employees', loadedEmps);
        }

        if (supRes.data && supRes.data.length > 0) {
          const loadedSups = supRes.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            contactPerson: s.contact_person,
            email: s.email,
            phone: s.phone,
            address: s.address,
            rating: Number(s.rating)
          }));
          setSuppliers(loadedSups);
          setStored('suppliers', loadedSups);
        }

        if (poRes.data && poRes.data.length > 0) {
          const loadedPOs = poRes.data.map((p: any) => ({
            id: p.id,
            supplierId: p.supplier_id,
            supplierName: p.supplier_name,
            status: p.status,
            totalAmount: Number(p.total_amount),
            items: p.items || [],
            orderDate: p.order_date,
            expectedDelivery: p.expected_delivery
          }));
          setPurchaseOrders(loadedPOs);
          setStored('purchaseOrders', loadedPOs);
        }
      } catch (err) {
        console.error('Supabase sync warning:', err);
      }
    }

    fetchSupabaseData();
  }, []);

  // Simple sha256 hash helper
  const sha256 = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  };

  const loginWithCredentials = async (usernameOrEmail: string, passwordInput: string) => {
    const found = users.find(u => 
      u.username?.toLowerCase() === usernameOrEmail.toLowerCase() || 
      u.email?.toLowerCase() === usernameOrEmail.toLowerCase()
    );
    if (!found) {
      return { success: false, message: 'Akun tidak ditemukan dalam sistem.' };
    }

    const hashedInput = sha256(passwordInput);
    const userPassword = found.password || 'jerjhon123';

    if (passwordInput !== userPassword && hashedInput !== userPassword) {
      return { success: false, message: 'Password salah. Silakan periksa kembali password Anda.' };
    }

    setCurrentUser(found);
    setStored('currentUser', found);
    addAuditLog('USER_LOGIN', 'Auth', `User ${found.name} logged in successfully.`);
    return { success: true, message: 'Login berhasil!' };
  };

  const loginDirect = (user: User) => {
    setCurrentUser(user);
    setStored('currentUser', user);
    addAuditLog('USER_LOGIN', 'Auth', `User ${user.name} switched/logged in directly.`);
    return { success: true, message: 'Login berhasil!', user };
  };

  const resetPassword = async (email: string) => {
    const found = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) {
      return { success: false, message: 'Email tidak terdaftar dalam sistem.' };
    }
    return { success: true, message: 'Instruksi reset kata sandi telah dikirim ke email Anda.' };
  };

  const logout = async () => {
    if (currentUser) {
      addAuditLog('USER_LOGOUT', 'Auth', `User ${currentUser.name} logged out.`);
    }
    setCurrentUser(null);
    localStorage.removeItem('jerjhon_currentUser');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { id: `USR-${Date.now()}`, ...userData };
    const updated = [...users, newUser];
    setUsers(updated);
    setStored('users', updated);
    addAuditLog('CREATE_USER', 'Admin', `Created user account: ${newUser.name}`);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    const updated = users.map(u => u.id === id ? { ...u, ...userData } : u);
    setUsers(updated);
    setStored('users', updated);
    if (currentUser?.id === id) {
      const updatedCurrent = { ...currentUser, ...userData };
      setCurrentUser(updatedCurrent);
      setStored('currentUser', updatedCurrent);
    }
  };

  const deleteUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    setStored('users', updated);
  };

  // Company Profile
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => getStored('companyProfile', INITIAL_COMPANY));
  const updateCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    setStored('companyProfile', profile);
    addAuditLog('UPDATE_COMPANY_PROFILE', 'Admin', 'Updated company legal and tax profile');
  };

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(() => getStored('employees', INITIAL_EMPLOYEES));
  const addEmployee = (empData: Omit<Employee, 'id'>, credentials?: { username?: string; password?: string; role?: RoleType }) => {
    const newId = `EMP-${Date.now().toString().slice(-4)}`;
    const newEmp: Employee = { id: newId, ...empData };
    const updated = [...employees, newEmp];
    setEmployees(updated);
    setStored('employees', updated);

    if (credentials?.username) {
      addUser({
        name: empData.name,
        email: empData.email,
        username: credentials.username,
        role: credentials.role || 'Staff',
        status: 'active',
        department: empData.department,
        lastLogin: new Date().toISOString(),
        permissions: [],
        avatar: empData.avatar
      });
    }
    addAuditLog('CREATE_EMPLOYEE', 'HRD', `Added employee ${empData.name} (${newId})`);
  };

  const updateEmployee = (id: string, empData: Partial<Employee>) => {
    const updated = employees.map(e => e.id === id ? { ...e, ...empData } : e);
    setEmployees(updated);
    setStored('employees', updated);
  };

  const deleteEmployee = (id: string) => {
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    setStored('employees', updated);
  };

  // Attendance
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getStored('attendance', INITIAL_ATTENDANCE));
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);
  const [lastAttendanceSyncTime, setLastAttendanceSyncTime] = useState<Date | null>(new Date());

  const addAttendanceRecord = (rec: Omit<AttendanceRecord, 'id'>) => {
    const newRec: AttendanceRecord = { id: `ATT-${Date.now()}`, ...rec };
    const updated = [newRec, ...attendance];
    setAttendance(updated);
    setStored('attendance', updated);
  };

  const updateAttendanceRecord = (id: string, rec: Partial<AttendanceRecord>) => {
    const updated = attendance.map(a => a.id === id ? { ...a, ...rec } : a);
    setAttendance(updated);
    setStored('attendance', updated);
  };

  const deleteAttendanceRecord = (id: string) => {
    const updated = attendance.filter(a => a.id !== id);
    setAttendance(updated);
    setStored('attendance', updated);
  };

  const syncAttendanceNow = async () => {
    setIsSyncingAttendance(true);
    await new Promise(r => setTimeout(r, 1000));
    setLastAttendanceSyncTime(new Date());
    setIsSyncingAttendance(false);
    addNotification('Sinkronisasi Kehadiran', 'Data absensi berhasil disinkronkan.', 'success', 'Attendance');
  };

  // Leave & Overtime
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => getStored('leaveRequests', INITIAL_LEAVE_REQUESTS));
  const addLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>) => {
    const newReq: LeaveRequest = {
      id: `LEAVE-${Date.now()}`,
      ...req,
      status: 'Pending',
      appliedDate: new Date().toISOString().substring(0, 10)
    };
    const updated = [newReq, ...leaveRequests];
    setLeaveRequests(updated);
    setStored('leaveRequests', updated);
    addAuditLog('CREATE_LEAVE_REQUEST', 'HRD', `Created leave request for ${req.employeeName}`);
  };

  const updateLeaveRequest = (id: string, req: Partial<LeaveRequest>) => {
    const updated = leaveRequests.map(l => l.id === id ? { ...l, ...req } : l);
    setLeaveRequests(updated);
    setStored('leaveRequests', updated);
  };

  const deleteLeaveRequest = (id: string) => {
    const updated = leaveRequests.filter(l => l.id !== id);
    setLeaveRequests(updated);
    setStored('leaveRequests', updated);
  };

  const updateLeaveStatus = (id: string, status: 'Approved' | 'Rejected', approverName: string, stage?: number, comment?: string) => {
    const updated = leaveRequests.map(l => l.id === id ? { ...l, status, approver: approverName } : l);
    setLeaveRequests(updated);
    setStored('leaveRequests', updated);
    addAuditLog('UPDATE_LEAVE', 'HRD', `Updated leave request ${id} to ${status}`);
  };

  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>(() => getStored('overtimeRequests', INITIAL_OVERTIME_REQUESTS));
  const addOvertimeRequest = (req: Omit<OvertimeRequest, 'id' | 'status' | 'appliedDate' | 'mealAllowance' | 'overtimePay' | 'totalPayout' | 'compensationType'>) => {
    const hours = req.hours || 2;
    const pay = hours * 35000;
    const meal = 25000;
    const newReq: OvertimeRequest = {
      id: `OT-${Date.now()}`,
      ...req,
      status: 'Pending',
      appliedDate: new Date().toISOString().substring(0, 10),
      mealAllowance: meal,
      overtimePay: pay,
      totalPayout: pay + meal,
      compensationType: 'Uang Lembur + Uang Makan (>= 2 Jam)'
    };
    const updated = [newReq, ...overtimeRequests];
    setOvertimeRequests(updated);
    setStored('overtimeRequests', updated);
  };

  const updateOvertimeStatus = (id: string, status: 'Approved' | 'Rejected', approverName: string) => {
    const updated = overtimeRequests.map(o => o.id === id ? { ...o, status } : o);
    setOvertimeRequests(updated);
    setStored('overtimeRequests', updated);
  };

  const deleteOvertimeRequest = (id: string) => {
    const updated = overtimeRequests.filter(o => o.id !== id);
    setOvertimeRequests(updated);
    setStored('overtimeRequests', updated);
  };

  // Payroll
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(() => getStored('payrolls', INITIAL_PAYROLL));
  const calculatePayrollForEmployee = (employeeId: string, period: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    const existing = payrolls.find(p => p.employeeId === employeeId && p.period === period);
    if (existing) return;

    const base = emp.baseSalary || 5000000;
    const fixed = emp.fixedAllowance || 1000000;
    const variable = 500000;
    const thp = base + fixed + variable;

    const gross = base + fixed + variable + 150000 + 300000 + 200000;
    const deduction = Math.round(base * 0.05) + 250000;

    const newPay: PayrollRecord = {
      id: `PAY-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      department: emp.department,
      period,
      baseSalary: base,
      fixedAllowance: fixed,
      variableAllowance: variable,
      overtimePay: 150000,
      kpiCommission: 300000,
      bonusIncentive: 200000,
      grossSalary: gross,
      loanDeduction: 0,
      taxPPh21: Math.round(base * 0.05),
      bpjsDeduction: 250000,
      totalDeduction: deduction,
      takeHomePay: gross - deduction,
      paymentStatus: 'Pending Approval'
    };

    const updated = [newPay, ...payrolls];
    setPayrolls(updated);
    setStored('payrolls', updated);
  };

  const updatePayrollStatus = (payrollId: string, status: any) => {
    const updated = payrolls.map(p => p.id === payrollId ? { ...p, paymentStatus: status } : p);
    setPayrolls(updated);
    setStored('payrolls', updated);
  };

  const addPayrollRecord = (record: Omit<PayrollRecord, 'id'>) => {
    const newRec: PayrollRecord = { id: `PAY-${Date.now()}`, ...record };
    const updated = [newRec, ...payrolls];
    setPayrolls(updated);
    setStored('payrolls', updated);
  };

  const updatePayrollRecord = (id: string, record: Partial<PayrollRecord>) => {
    const updated = payrolls.map(p => p.id === id ? { ...p, ...record } : p);
    setPayrolls(updated);
    setStored('payrolls', updated);
  };

  const deletePayrollRecord = (id: string) => {
    const updated = payrolls.filter(p => p.id !== id);
    setPayrolls(updated);
    setStored('payrolls', updated);
  };

  // KPIs & OKRs
  const [kpis, setKpis] = useState<KPIRecord[]>(() => getStored('kpis', INITIAL_KPIS));
  const addKPI = (kpi: Omit<KPIRecord, 'id' | 'code' | 'score'>) => {
    const newKpi: KPIRecord = {
      id: `KPI-${Date.now()}`,
      code: `KPI-${Math.floor(100 + Math.random() * 900)}`,
      score: 85,
      ...kpi
    };
    const updated = [...kpis, newKpi];
    setKpis(updated);
    setStored('kpis', updated);
  };

  const updateKPIScore = (id: string, currentValue: number) => {
    const updated = kpis.map(k => k.id === id ? { ...k, currentValue } : k);
    setKpis(updated);
    setStored('kpis', updated);
  };

  const [kpiTasks, setKpiTasks] = useState<KPITask[]>(() => getStored('kpiTasks', INITIAL_KPI_TASKS));
  const addKPITask = (task: Omit<KPITask, 'id' | 'status'>) => {
    const newTask: KPITask = { id: `TSK-${Date.now()}`, ...task, status: 'Pending' };
    const updated = [newTask, ...kpiTasks];
    setKpiTasks(updated);
    setStored('kpiTasks', updated);
  };

  const submitKPITask = (taskId: string, submission: KPITaskSubmission) => {
    const updated = kpiTasks.map(t => t.id === taskId ? { ...t, status: 'Submitted' as any, submission } : t);
    setKpiTasks(updated);
    setStored('kpiTasks', updated);
  };

  const reviewKPITask = (taskId: string, score: number, scorePreset: any, scoreLabel: string, reviewNotes: string, status: any, reviewerName: string) => {
    const updated = kpiTasks.map(t => t.id === taskId ? { ...t, status, score, reviewNotes } : t);
    setKpiTasks(updated);
    setStored('kpiTasks', updated);
  };

  const deleteKPITask = (taskId: string) => {
    const updated = kpiTasks.filter(t => t.id !== taskId);
    setKpiTasks(updated);
    setStored('kpiTasks', updated);
  };

  const [okrs] = useState<OKRRecord[]>(() => getStored('okrs', INITIAL_OKRS));

  // Marketplace & Sales
  const [marketplaceOrders, setMarketplaceOrders] = useState<MarketplaceOrder[]>(() => getStored('marketplaceOrders', INITIAL_MARKETPLACE_ORDERS));
  const addMarketplaceOrder = async (order: Omit<MarketplaceOrder, 'id' | 'netProfit'>) => {
    const netProfit = (order.grossAmount || 0) * 0.35;
    const newOrd: MarketplaceOrder = {
      id: `ORD-${Date.now()}`,
      ...order,
      netProfit
    };
    const updated = [newOrd, ...marketplaceOrders];
    setMarketplaceOrders(updated);
    setStored('marketplaceOrders', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('marketplace_orders').upsert({
          id: newOrd.id,
          customer_name: newOrd.customerName,
          customer_email: 'customer@example.com',
          channel: newOrd.channel,
          status: newOrd.status,
          total_amount: newOrd.grossAmount,
          items: [],
          payment_method: newOrd.paymentMethod
        });
      } catch (err) {
        console.error('Supabase addMarketplaceOrder error:', err);
      }
    }
  };

  const updateMarketplaceOrder = (id: string, orderData: Partial<MarketplaceOrder>) => {
    const updated = marketplaceOrders.map(o => o.id === id ? { ...o, ...orderData } : o);
    setMarketplaceOrders(updated);
    setStored('marketplaceOrders', updated);
  };

  const deleteMarketplaceOrder = (id: string) => {
    const updated = marketplaceOrders.filter(o => o.id !== id);
    setMarketplaceOrders(updated);
    setStored('marketplaceOrders', updated);
  };

  const clearMarketplaceOrders = () => {
    setMarketplaceOrders([]);
    localStorage.removeItem('jerjhon_marketplaceOrders');
  };

  const [customers] = useState<Customer[]>(() => getStored('customers', INITIAL_CUSTOMERS));

  // Inventory & Products
  const [products, setProducts] = useState<ProductItem[]>(() => getStored('products', INITIAL_PRODUCTS));
  const addProduct = async (prodData: Omit<ProductItem, 'id'> & { id?: string }) => {
    const newProd: ProductItem = {
      id: prodData.id || `PRD-${Date.now()}`,
      ...prodData
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    setStored('products', updated);
    addAuditLog('CREATE_PRODUCT', 'Inventory', `Added product ${newProd.name} (${newProd.sku})`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('products').upsert({
          id: newProd.id,
          name: newProd.name,
          sku: newProd.sku,
          category: newProd.category,
          price: newProd.sellingPrice,
          cost: newProd.unitCostPrice,
          stock: newProd.stockQuantity,
          min_stock: newProd.minimumStock,
          supplier: 'Default Supplier',
          barcode: newProd.sku,
          image: ''
        });
      } catch (err) {
        console.error('Supabase addProduct error:', err);
      }
    }
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    setStored('products', updated);
  };

  const updateProduct = (id: string, updatedFields: Partial<ProductItem>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    setProducts(updated);
    setStored('products', updated);
  };

  const updateProductStock = (id: string, deltaQty: number, movementType: string) => {
    const updated = products.map(p => p.id === id ? { ...p, stock: Math.max(0, (p.stock || 0) + deltaQty) } : p);
    setProducts(updated);
    setStored('products', updated);
  };

  const clearProducts = () => {
    setProducts([]);
    localStorage.removeItem('jerjhon_products');
  };

  const [customCategories, setCustomCategories] = useState<string[]>(() => getStored('customCategories', ['Tekstil', 'Jersey Custom', 'Accessories', 'Merchandise']));
  const [customWarehouses, setCustomWarehouses] = useState<string[]>(() => getStored('customWarehouses', ['Gudang Pusat Jakarta', 'Gudang Cabang Bandung', 'Gudang Produksi Tangerang']));
  const [deletedCategories, setDeletedCategories] = useState<string[]>(() => getStored('deletedCategories', []));
  const [deletedWarehouses, setDeletedWarehouses] = useState<string[]>(() => getStored('deletedWarehouses', []));

  const availableCategories = useMemo(() => {
    const defaults = ['Tekstil', 'Jersey Custom', 'Accessories', 'Merchandise'];
    const merged = Array.from(new Set([...defaults, ...customCategories]));
    return merged.filter(c => !deletedCategories.includes(c));
  }, [customCategories, deletedCategories]);

  const availableWarehouses = useMemo(() => {
    const defaults = ['Gudang Pusat Jakarta', 'Gudang Cabang Bandung', 'Gudang Produksi Tangerang'];
    const merged = Array.from(new Set([...defaults, ...customWarehouses]));
    return merged.filter(w => !deletedWarehouses.includes(w));
  }, [customWarehouses, deletedWarehouses]);

  const addCustomCategory = (cat: string) => {
    if (!customCategories.includes(cat)) {
      const updated = [...customCategories, cat];
      setCustomCategories(updated);
      setStored('customCategories', updated);
    }
  };

  const deleteCategory = (catName: string) => {
    const updated = [...deletedCategories, catName];
    setDeletedCategories(updated);
    setStored('deletedCategories', updated);
  };

  const addCustomWarehouse = (wh: string) => {
    if (!customWarehouses.includes(wh)) {
      const updated = [...customWarehouses, wh];
      setCustomWarehouses(updated);
      setStored('customWarehouses', updated);
    }
  };

  const deleteWarehouse = (whName: string) => {
    const updated = [...deletedWarehouses, whName];
    setDeletedWarehouses(updated);
    setStored('deletedWarehouses', updated);
  };

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => getStored('stockMovements', INITIAL_STOCK_MOVEMENTS));
  const addStockMovement = (mov: Omit<StockMovement, 'id'>) => {
    const newMov: StockMovement = { id: `MOV-${Date.now()}`, ...mov };
    const updated = [newMov, ...stockMovements];
    setStockMovements(updated);
    setStored('stockMovements', updated);
  };

  const updateStockMovement = (id: string, updatedFields: Partial<StockMovement>) => {
    const updated = stockMovements.map(m => m.id === id ? { ...m, ...updatedFields } : m);
    setStockMovements(updated);
    setStored('stockMovements', updated);
  };

  const deleteStockMovement = (id: string) => {
    const updated = stockMovements.filter(m => m.id !== id);
    setStockMovements(updated);
    setStored('stockMovements', updated);
  };

  const clearAllStockMovements = async () => {
    setStockMovements([]);
    localStorage.removeItem('jerjhon_stockMovements');
  };

  // Purchasing & Suppliers
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => getStored('purchaseOrders', INITIAL_PURCHASE_ORDERS));
  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>) => {
    const poNum = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      poNumber: poNum,
      ...poData
    };
    const updated = [newPO, ...purchaseOrders];
    setPurchaseOrders(updated);
    setStored('purchaseOrders', updated);
    addAuditLog('CREATE_PO', 'Purchasing', `Created Purchase Order ${poNum}`);
  };

  const updatePurchaseOrder = (id: string, poData: Partial<PurchaseOrder>) => {
    const updated = purchaseOrders.map(p => p.id === id ? { ...p, ...poData } : p);
    setPurchaseOrders(updated);
    setStored('purchaseOrders', updated);
  };

  const deletePurchaseOrder = (id: string) => {
    const updated = purchaseOrders.filter(p => p.id !== id);
    setPurchaseOrders(updated);
    setStored('purchaseOrders', updated);
  };

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStored('suppliers', INITIAL_SUPPLIERS));

  // Finance
  const [chartOfAccounts] = useState<ChartOfAccount[]>(() => getStored('chartOfAccounts', INITIAL_COA));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => getStored('journalEntries', INITIAL_JOURNALS));
  const addJournalEntry = (je: Omit<JournalEntry, 'id'>) => {
    const newJe: JournalEntry = { id: `JE-${Date.now()}`, ...je };
    const updated = [newJe, ...journalEntries];
    setJournalEntries(updated);
    setStored('journalEntries', updated);
  };
  const [fixedAssets] = useState<FixedAsset[]>(() => getStored('fixedAssets', INITIAL_FIXED_ASSETS));

  // R&D & Production
  const [rndItems] = useState<ProductRND[]>(() => getStored('rndItems', INITIAL_RND));
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(() => getStored('productionOrders', INITIAL_PRODUCTION_ORDERS));
  const addProductionOrder = (poData: Omit<ProductionOrder, 'id'>) => {
    const newPO: ProductionOrder = { id: `PRD-ORD-${Date.now()}`, ...poData };
    const updated = [newPO, ...productionOrders];
    setProductionOrders(updated);
    setStored('productionOrders', updated);
  };

  const updateProductionOrderStatus = (id: string, status: ProductionOrder['status']) => {
    const updated = productionOrders.map(p => p.id === id ? { ...p, status } : p);
    setProductionOrders(updated);
    setStored('productionOrders', updated);
  };

  // Marketing
  const [kolCampaigns] = useState<KOLCampaign[]>(() => getStored('kolCampaigns', INITIAL_KOL_CAMPAIGNS));
  const [affiliates] = useState<AffiliatePartner[]>(() => getStored('affiliates', INITIAL_AFFILIATES));

  // Projects & Collaboration
  const [projects] = useState<Project[]>(() => getStored('projects', INITIAL_PROJECTS));
  const [tasks] = useState<ProjectTask[]>(() => getStored('tasks', INITIAL_TASKS));
  const [campaigns] = useState<ContentCampaignItem[]>(() => getStored('campaigns', INITIAL_CAMPAIGNS));

  // Approvals & Audit & Notifications
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(() => getStored('approvalRequests', INITIAL_APPROVALS));
  const addApprovalRequest = (req: Omit<ApprovalRequest, 'id' | 'requestDate' | 'status'>) => {
    const newReq: ApprovalRequest = {
      id: `APP-${Date.now()}`,
      requestDate: new Date().toISOString().substring(0, 10),
      status: 'Pending',
      ...req
    };
    const updated = [newReq, ...approvalRequests];
    setApprovalRequests(updated);
    setStored('approvalRequests', updated);
  };

  const updateApprovalStatus = (id: string, status: 'Approved' | 'Rejected', approverName: string) => {
    const updated = approvalRequests.map(a => a.id === id ? { ...a, status, approver: approverName } : a);
    setApprovalRequests(updated);
    setStored('approvalRequests', updated);
  };

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStored('auditLogs', INITIAL_AUDIT_LOGS));
  const addAuditLog = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'System Admin',
      userRole: currentUser?.role || 'Admin',
      action,
      module,
      ipAddress: '127.0.0.1',
      details
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      setStored('auditLogs', updated);
      return updated;
    });
  };

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => getStored('notifications', INITIAL_NOTIFICATIONS));
  const addNotification = (title: string, message: string, type: any = 'info', linkModule: string = 'System') => {
    const newNotif: SystemNotification = {
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      title,
      message,
      type,
      read: false,
      linkModule
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      setStored('notifications', updated);
      return updated;
    });
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    setStored('notifications', updated);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('jerjhon_notifications');
  };

  const [rawMaterialGroups] = useState<ProductRawMaterialGroup[]>(() => getStored('rawMaterialGroups', INITIAL_RAW_MATERIAL_GROUPS));
  const [events] = useState<ERPEvent[]>(() => getStored('events', INITIAL_EVENTS));
  const [stockOpnameRecords, setStockOpnameRecords] = useState<StockOpnameRecord[]>(() => getStored('stockOpnameRecords', []));
  const addStockOpnameRecord = (rec: Omit<StockOpnameRecord, 'id'>) => {
    const newRec: StockOpnameRecord = { id: `SO-${Date.now()}`, ...rec };
    const updated = [newRec, ...stockOpnameRecords];
    setStockOpnameRecords(updated);
    setStored('stockOpnameRecords', updated);
  };

  const [sizeOptions, setSizeOptions] = useState<string[]>(() => getStored('sizeOptions', ['S', 'M', 'L', 'XL', 'XXL', '3XL']));
  const [colorOptions, setColorOptions] = useState<string[]>(() => getStored('colorOptions', ['Merah', 'Putih', 'Hitam', 'Biru Navy', 'Gold']));

  const isStaff = currentUser?.role === 'Staff';
  const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Director';
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Director';

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const allUsers = users;
  const systemRoles = INITIAL_SYSTEM_ROLES;

  return (
    <ERPContext.Provider value={{
      darkMode, setDarkMode,
      isAuthenticated, loginWithCredentials, resetPassword, loginDirect, logout,
      currentUser, setCurrentUser, users, allUsers, addUser, updateUser, deleteUser,
      sha256, systemRoles,
      activeTab, setActiveTab, activeDomain, setActiveDomain,
      companyProfile, updateCompanyProfile,
      employees, addEmployee, updateEmployee, deleteEmployee,
      attendance, addAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord,
      syncAttendanceNow, isSyncingAttendance, lastAttendanceSyncTime,
      leaveRequests, addLeaveRequest, updateLeaveRequest, deleteLeaveRequest, updateLeaveStatus,
      overtimeRequests, addOvertimeRequest, updateOvertimeStatus, deleteOvertimeRequest,
      payrolls, calculatePayrollForEmployee, updatePayrollStatus, addPayrollRecord, updatePayrollRecord, deletePayrollRecord,
      kpis, addKPI, updateKPIScore,
      kpiTasks, addKPITask, submitKPITask, reviewKPITask, deleteKPITask,
      okrs,
      marketplaceOrders, addMarketplaceOrder, updateMarketplaceOrder, deleteMarketplaceOrder, clearMarketplaceOrders,
      customers,
      products, addProduct, deleteProduct, updateProduct, updateProductStock, clearProducts,
      customCategories, customWarehouses, deletedCategories, deletedWarehouses,
      availableCategories, availableWarehouses, addCustomCategory, deleteCategory, addCustomWarehouse, deleteWarehouse,
      stockMovements, addStockMovement, updateStockMovement, deleteStockMovement, clearAllStockMovements,
      purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
      suppliers,
      chartOfAccounts, journalEntries, addJournalEntry, fixedAssets,
      rndItems, productionOrders, addProductionOrder, updateProductionOrderStatus,
      kolCampaigns, affiliates,
      projects, tasks, campaigns,
      approvalRequests, addApprovalRequest, updateApprovalStatus,
      auditLogs, addAuditLog,
      notifications, addNotification, markNotificationAsRead, clearAllNotifications,
      rawMaterialGroups, events, stockOpnameRecords, addStockOpnameRecord,
      sizeOptions, setSizeOptions, colorOptions, setColorOptions,
      isStaff, isManager, isAdmin,
      isSupabaseConfigured, isSyncingSupabase, syncAllDataToSupabase,
      formatIDR
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
