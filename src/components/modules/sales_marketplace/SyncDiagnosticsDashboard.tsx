import React, { useState, useEffect, useContext } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { ERPContext } from '../../../context/ERPContext';
import SKUVariantMapper from './SKUVariantMapper';

interface SyncLog {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
  productId?: string;
  sku?: string;
}

const SyncDiagnosticsDashboard = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { products } = useContext(ERPContext);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jerjhon_syncDiagnosticLogs');
      if (saved) {
        setLogs(JSON.parse(saved));
      } else {
        setLogs([]);
      }
    } catch (e) {
      setLogs([]);
    }
  }, []);

  const failedSyncItems = logs
    .filter(log => log.errorType.includes('Sync') || log.errorType.includes('Failed'))
    .map(log => ({ id: log.id, label: `${log.sku || 'Unknown'} - ${log.message}` }));

  if (loading) return <div>Loading diagnostics...</div>;

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <RefreshCw className="w-5 h-5" />
        Inventory-to-POS Sync Diagnostics
      </h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Manual Re-mapping</h3>
        <SKUVariantMapper 
          failedItems={failedSyncItems} 
          availableProducts={products} 
          onMap={(failedId, productId) => {
            console.log(`Mapping ${failedId} to ${productId}`);
            // TODO: Implement actual mapping logic here
          }}
        />
      </div>

      <div className="overflow-auto max-h-[500px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Error Type</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Product ID</th>
              <th className="px-4 py-3">SKU</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3 text-red-500 font-semibold">{log.errorType}</td>
                <td className="px-4 py-3">{log.message}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.productId}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.sku}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SyncDiagnosticsDashboard;
