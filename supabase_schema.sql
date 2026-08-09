-- ==============================================================================
-- SUPABASE COMPLETE ERP & MODULE DATABASE SCHEMA
-- Compatible with PostgreSQL / Supabase
-- Covers ALL 12 Enterprise Modules comprehensively
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. USERS & PROFILES MODULE (USER MANAGEMENT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT,
    password TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin',
    department TEXT DEFAULT 'Management',
    avatar TEXT,
    status TEXT DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    department TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. HUMAN CAPITAL MODULE (HR, Payroll, Attendance, Leave, Performance)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    phone TEXT,
    hire_date DATE,
    salary NUMERIC(12, 2) DEFAULT 0,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    status TEXT NOT NULL DEFAULT 'Present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payroll_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- e.g. '2026-08'
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    allowances NUMERIC(12, 2) DEFAULT 0,
    deductions NUMERIC(12, 2) DEFAULT 0,
    net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Approved', 'Paid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL, -- 'Annual', 'Sick', 'Unpaid'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. INVENTORY & PURCHASING MODULE (Products, Stock, Suppliers, POs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    supplier TEXT,
    barcode TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT'
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference TEXT,
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY,
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    order_date DATE NOT NULL,
    expected_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. SALES & MARKETPLACE MODULE (Orders, POS, Customers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    channel TEXT NOT NULL, -- 'POS', 'Tokopedia', 'Shopee', 'Direct'
    status TEXT NOT NULL DEFAULT 'Completed',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    payment_method TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.crm_customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Lead', -- 'Lead', 'Active', 'Inactive'
    deal_value NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. FINANCE & ACCOUNTING MODULE (Accounts, Transactions, Budgets)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.finance_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Bank', 'Cash', 'Credit'
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    account_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'Income', 'Expense', 'Transfer'
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    reference TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    allocated_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    period TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. PROJECT MANAGEMENT MODULE (Projects, Tasks, Milestones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'In Progress', -- 'Planning', 'In Progress', 'Completed'
    progress INTEGER NOT NULL DEFAULT 0,
    budget NUMERIC(12, 2) DEFAULT 0,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    assignee TEXT,
    status TEXT NOT NULL DEFAULT 'To Do', -- 'To Do', 'In Progress', 'Done'
    priority TEXT NOT NULL DEFAULT 'Medium',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. PRODUCTION & R&D MODULE (Batches, BOM, Quality Checks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.production_batches (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Scheduled', -- 'Scheduled', 'In Production', 'Quality Check', 'Completed'
    start_date DATE,
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quality_checks (
    id TEXT PRIMARY KEY,
    batch_id TEXT REFERENCES public.production_batches(id) ON DELETE CASCADE,
    inspector TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Passed', -- 'Passed', 'Failed', 'Pending'
    defects_found INTEGER DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. MARKETING & GROWTH MODULE (Campaigns, Leads, Social Posts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'Instagram', 'Google Ads', 'Email', 'TikTok'
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Paused', 'Completed'
    budget NUMERIC(12, 2) DEFAULT 0,
    spent NUMERIC(12, 2) DEFAULT 0,
    roi NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 9. EVENT MANAGEMENT MODULE (Events, Attendees, Venues)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    venue TEXT NOT NULL,
    date DATE NOT NULL,
    capacity INTEGER DEFAULT 100,
    registered_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 10. EXECUTIVE DASHBOARD MODULE (KPIs & Business Metrics)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.executive_kpis (
    id TEXT PRIMARY KEY,
    metric_name TEXT NOT NULL,
    current_value NUMERIC(12, 2) NOT NULL,
    target_value NUMERIC(12, 2) NOT NULL,
    unit TEXT, -- 'IDR', '%', 'Count'
    trend TEXT, -- 'up', 'down', 'stable'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 11. CHAT & COLLABORATION MODULE (Messages, Channels)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 12. ADMIN SYSTEM & DEV EXPORT MODULE (Audit Logs, Settings, Diagnostics)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- DISABLE ROW LEVEL SECURITY (RLS) & GRANT PERMISSIONS FOR ALL TABLES
-- ==============================================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_kpis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

