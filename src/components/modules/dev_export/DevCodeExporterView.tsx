import React, { useState } from 'react';
import { Code2, Database, Copy, Check, Download, Server, FileCode, Layers } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';

export const DevCodeExporterView: React.FC = () => {
  const { companyProfile } = useERP();
  const [activeTab, setActiveTab] = useState<'mysql' | 'php'>('mysql');
  const [copied, setCopied] = useState(false);

  const mysqlSchemaDDL = `-- ====================================================================
-- JERJHON ENTERPRISE ERP - MYSQL 8.0+ FULL DDL SCHEMA & DUMMY SEEDS
-- Generated for: ${companyProfile.legalName}
-- Date: ${new Date().toISOString().substring(0, 10)}
-- Engine: InnoDB | Charset: utf8mb4_unicode_ci
-- ====================================================================

CREATE DATABASE IF NOT EXISTS \`jerjhon_erp\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`jerjhon_erp\`;

-- 1. Table: users (RBAC & Auth)
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('Super Admin', 'HR Manager', 'Finance Manager', 'Warehouse Lead', 'Sales Manager') DEFAULT 'Super Admin',
  \`department\` VARCHAR(100) NOT NULL,
  \`status\` ENUM('active', 'inactive') DEFAULT 'active',
  \`last_login\` DATETIME NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table: employees (Human Capital HCM)
CREATE TABLE IF NOT EXISTS \`employees\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`nik\` VARCHAR(20) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL,
  \`phone\` VARCHAR(30) NULL,
  \`gender\` ENUM('L', 'P') NOT NULL,
  \`department\` VARCHAR(100) NOT NULL,
  \`position\` VARCHAR(100) NOT NULL,
  \`join_date\` DATE NOT NULL,
  \`status\` ENUM('Tetap', 'Kontrak', 'Probation') DEFAULT 'Tetap',
  \`npwp\` VARCHAR(30) NULL,
  \`bpjs_kesehatan\` VARCHAR(30) NULL,
  \`bpjs_ketenagakerjaan\` VARCHAR(30) NULL,
  \`base_salary\` DECIMAL(15,2) DEFAULT 0.00,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table: products (Inventory & Catalog)
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`sku\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(150) NOT NULL,
  \`category\` VARCHAR(80) NOT NULL,
  \`stock_qty\` INT NOT NULL DEFAULT 0,
  \`unit\` VARCHAR(20) NOT NULL DEFAULT 'Pcs',
  \`cost_price\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`selling_price\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`reorder_level\` INT NOT NULL DEFAULT 10,
  \`bpom_number\` VARCHAR(50) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table: journal_entries (Finance Accounting GL)
CREATE TABLE IF NOT EXISTS \`journal_entries\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`voucher_no\` VARCHAR(50) NOT NULL UNIQUE,
  \`date\` DATE NOT NULL,
  \`description\` TEXT NOT NULL,
  \`debit_total\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`credit_total\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`status\` ENUM('Posted', 'Draft', 'Approved') DEFAULT 'Posted',
  \`created_by\` VARCHAR(100) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dummy Seed Data
INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`password_hash\`, \`role\`, \`department\`) VALUES
('USR-001', 'Ald Gunawan', 'aldygunawan6@gmail.com', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', 'Executive');
`;

  const phpMvcCode = `<?php
/**
 * JERJHON ENTERPRISE ERP - NATIVE PHP 8.3 MVC CORE CONTROLLER
 * Framework-free Architecture (OOP + PDO + MySQL 8+)
 */

namespace Jerjhon\\ERP\\Controllers;

use PDO;
use Exception;

class EmployeeController 
{
    private PDO $db;

    public function __construct(PDO $dbConnection) 
    {
        $this->db = $dbConnection;
    }

    /**
     * Get list of employees with search & pagination
     */
    public function index(): void 
    {
        $search = $_GET['q'] ?? '';
        $query = "SELECT * FROM employees WHERE name LIKE :q OR nik LIKE :q ORDER BY created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':q' => "%$search%"]);
        $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => 'success',
            'data' => $employees,
            'meta' => ['total' => count($employees)]
        ], JSON_PRETTY_PRINT);
    }

    /**
     * Store new employee record
     */
    public function store(): void 
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['nik']) || empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'NIK and Name are required']);
            return;
        }

        $sql = "INSERT INTO employees (id, nik, name, email, department, position, base_salary) 
                VALUES (:id, :nik, :name, :email, :dept, :pos, :salary)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id' => 'EMP-' . time(),
            ':nik' => $input['nik'],
            ':name' => $input['name'],
            ':email' => $input['email'] ?? '',
            ':dept' => $input['department'] ?? 'General',
            ':pos' => $input['position'] ?? 'Staff',
            ':salary' => $input['baseSalary'] ?? 0
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Karyawan berhasil dibuat']);
    }
}
`;

  const currentCode = activeTab === 'mysql' ? mysqlSchemaDDL : phpMvcCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#b90f0f]" />
            PHP Native 8.3 & MySQL 8+ Full Code Exporter
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ekspor DDL Database MySQL, Schema Relasional Tables, & Controller Architecture Native PHP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('mysql')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
              activeTab === 'mysql'
                ? 'bg-[#b90f0f] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" /> MySQL 8+ DDL Schema
          </button>
          <button
            onClick={() => setActiveTab('php')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
              activeTab === 'php'
                ? 'bg-[#b90f0f] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <FileCode className="w-4 h-4" /> Native PHP Controller
          </button>
        </div>
      </div>

      {/* Code Editor Box */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-mono text-slate-400 ml-2">
              {activeTab === 'mysql' ? 'jerjhon_erp_schema.sql' : 'EmployeeController.php'}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
          </button>
        </div>

        <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto font-mono text-xs text-emerald-400 leading-relaxed">
          <pre>{currentCode}</pre>
        </div>
      </div>
    </div>
  );
};
