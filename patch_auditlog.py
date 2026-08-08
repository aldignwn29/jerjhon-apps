import re

with open('src/context/ERPContext.tsx', 'r') as f:
    content = f.read()

# Add to type
type_old = "  addAuditLog: (action: string, module: string, details: string) => void;"
type_new = """  addAuditLog: (action: string, module: string, details: string) => void;
  updateAuditLog: (id: string, updated: Partial<AuditLog>) => void;
  deleteAuditLog: (id: string) => void;"""
content = content.replace(type_old, type_new)

# Add to functions
func_old = """  const addAuditLog = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'Guest',
      action,
      module,
      ipAddress: '127.0.0.1',
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveToFirestore('auditLogs', newLog);
  };"""

func_new = """  const addAuditLog = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'Guest',
      action,
      module,
      ipAddress: '127.0.0.1',
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveToFirestore('auditLogs', newLog);
  };

  const updateAuditLog = (id: string, updated: Partial<AuditLog>) => {
    setAuditLogs(prev => prev.map(log => {
      if (log.id === id) {
        const up = { ...log, ...updated };
        saveToFirestore('auditLogs', up);
        return up;
      }
      return log;
    }));
  };

  const deleteAuditLog = (id: string) => {
    setAuditLogs(prev => prev.filter(log => log.id !== id));
    removeFromFirestore('auditLogs', id);
  };"""

content = content.replace(func_old, func_new)

# Add to return statement
ret_old = "        addAuditLog,"
ret_new = """        addAuditLog,
        updateAuditLog,
        deleteAuditLog,"""
content = content.replace(ret_old, ret_new)

with open('src/context/ERPContext.tsx', 'w') as f:
    f.write(content)
