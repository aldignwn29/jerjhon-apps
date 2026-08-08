const fs = require('fs');
const content = fs.readFileSync('src/data/initialData.ts', 'utf-8');

const updatedUsers = `export const INITIAL_USERS: User[] = [
  {
    id: "USR-001",
    username: "jerseyjhony",
    password: "password123",
    name: "Jersey Jhony",
    email: "jerseyjhony@gmail.com",
    role: "Admin",
    department: "Executive",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "2026-07-31 00:00",
    permissions: ["all"]
  },
  {
    id: "USR-002",
    username: "admin",
    password: "admin123",
    name: "Ald Gunawan",
    email: "aldygunawan6@gmail.com",
    role: "Admin",
    department: "Executive",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "2026-07-26 08:45",
    permissions: ["all"]
  },
  {
    id: "USR-003",
    username: "budi.santoso",
    password: "password123",
    name: "Budi Santoso",
    email: "budi.santoso@jerjhon.co.id",
    role: "Manager",
    department: "HR",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "Belum Pernah",
    permissions: ["standard_access", "approve_leave", "approve_overtime"]
  },
  {
    id: "USR-004",
    username: "siti.rahmawati",
    password: "password123",
    name: "Siti Rahmawati",
    email: "siti.rahmawati@jerjhon.co.id",
    role: "Manager",
    department: "Finance",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "Belum Pernah",
    permissions: ["standard_access", "view_finance", "edit_finance"]
  },
  {
    id: "USR-005",
    username: "agus.setiawan",
    password: "password123",
    name: "Agus Setiawan",
    email: "agus.setiawan@jerjhon.co.id",
    role: "Manager",
    department: "Finance",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "Belum Pernah",
    permissions: ["standard_access", "view_inventory"]
  },
  {
    id: "USR-006",
    username: "rina.wijaya",
    password: "password123",
    name: "Rina Wijaya",
    email: "rina.wijaya@jerjhon.co.id",
    role: "Manager",
    department: "Marketing",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "Belum Pernah",
    permissions: ["standard_access"]
  },
  {
    id: "USR-007",
    username: "hendra.pratama",
    password: "password123",
    name: "Hendra Pratama",
    email: "hendra.pratama@jerjhon.co.id",
    role: "Staff",
    department: "Creative",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "Belum Pernah",
    permissions: ["standard_access"]
  },
  {
    id: "USR-008",
    username: "eka.pratama",
    password: "password123",
    name: "Eka Pratama",
    email: "eka.pratama@jerjhon.co.id",
    role: "Staff",
    department: "HR",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "Belum Pernah",
    permissions: ["standard_access"]
  },
  {
    id: "USR-009",
    username: "anisa.putri",
    password: "password123",
    name: "Anisa Putri",
    email: "anisa.putri@jerjhon.co.id",
    role: "Staff",
    department: "Finance",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "Belum Pernah",
    permissions: ["standard_access"]
  }
];`;

const startIdx = content.indexOf('export const INITIAL_USERS: User[] = [');
const endIdx = content.indexOf('export const INITIAL_EMPLOYEES: Employee[] = [');

const newContent = content.slice(0, startIdx) + updatedUsers + '\n\n' + content.slice(endIdx);
fs.writeFileSync('src/data/initialData.ts', newContent);
console.log('Updated initialData.ts');
