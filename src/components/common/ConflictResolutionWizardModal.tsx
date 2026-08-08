import React, { useState, useEffect } from 'react';
import { 
  GitMerge, 
  CheckCircle2, 
  X, 
  Smartphone, 
  Cloud, 
  ArrowRight, 
  Check, 
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RotateCw,
  SlidersHorizontal
} from 'lucide-react';
import { SyncConflictItem, SyncFieldDivergence } from '../../types';

interface ConflictResolutionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: SyncConflictItem[];
  onResolveConflict: (
    conflictId: string, 
    resolvedRecord: Record<string, any>, 
    fieldResolutions: Record<string, 'local' | 'remote'>
  ) => Promise<void>;
  onTriggerConflictSimulation?: () => void;
}

export const ConflictResolutionWizardModal: React.FC<ConflictResolutionWizardModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolveConflict,
  onTriggerConflictSimulation
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fieldChoices, setFieldChoices] = useState<Record<string, 'local' | 'remote'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentConflict = conflicts[currentIndex];

  // Initialize field choices whenever current conflict changes
  useEffect(() => {
    if (currentConflict) {
      const initialChoices: Record<string, 'local' | 'remote'> = {};
      currentConflict.fields.forEach((field) => {
        // Default to field's resolution or 'local'
        initialChoices[field.fieldName] = field.resolution || 'local';
      });
      setFieldChoices(initialChoices);
      setSuccessMsg(null);
    }
  }, [currentIndex, currentConflict]);

  if (!isOpen) return null;

  if (!currentConflict || conflicts.length === 0) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Tidak Ada Konflik Sinkronisasi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Semua data lokal telah cocok dengan data cloud Firestore. Tidak ada perbedaan nilai record yang memerlukan tindakan manual.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            {onTriggerConflictSimulation && (
              <button
                onClick={onTriggerConflictSimulation}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <GitMerge className="w-4 h-4 text-[#00a96e]" /> Simulasi Konflik Sync Data
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 bg-[#00a96e] hover:bg-[#00925f] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup Wizard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectFieldChoice = (fieldName: string, choice: 'local' | 'remote') => {
    setFieldChoices((prev) => ({
      ...prev,
      [fieldName]: choice
    }));
  };

  const handleSetAllChoices = (choice: 'local' | 'remote') => {
    const updated: Record<string, 'local' | 'remote'> = {};
    currentConflict.fields.forEach((f) => {
      updated[f.fieldName] = choice;
    });
    setFieldChoices(updated);
  };

  const handleApplyResolution = async () => {
    if (!currentConflict) return;

    setIsSubmitting(true);
    try {
      // Build merged record
      const resolvedRecord: Record<string, any> = {
        id: currentConflict.recordId
      };

      currentConflict.fields.forEach((f) => {
        const choice = fieldChoices[f.fieldName] || 'local';
        resolvedRecord[f.fieldName] = choice === 'local' ? f.localValue : f.remoteValue;
      });

      await onResolveConflict(currentConflict.id, resolvedRecord, fieldChoices);

      setSuccessMsg(`Konflik untuk "${currentConflict.recordName}" berhasil diselesaikan!`);

      setTimeout(() => {
        if (currentIndex < conflicts.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      }, 800);
    } catch (err: any) {
      console.error('[ConflictWizard] Error resolving conflict:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic">(Kosong)</span>;
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const totalConflicts = conflicts.length;
  const isAllLocalSelected = currentConflict.fields.every((f) => fieldChoices[f.fieldName] === 'local');
  const isAllRemoteSelected = currentConflict.fields.every((f) => fieldChoices[f.fieldName] === 'remote');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00a96e]/20 text-[#00a96e] rounded-xl border border-[#00a96e]/30">
              <GitMerge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-wide text-white">
                  Conflict Resolution Wizard
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Konflik {currentIndex + 1} dari {totalConflicts}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Perbedaan nilai terdeteksi antara cache lokal perangkat dan Firestore Cloud.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="bg-emerald-500 text-white p-3.5 text-center text-xs font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {/* Conflict Overview Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Record Target</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {currentConflict.recordName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                {currentConflict.collectionName}:{currentConflict.recordId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleSetAllChoices('local')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isAllLocalSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Keep All Local
            </button>

            <button
              onClick={() => handleSetAllChoices('remote')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isAllRemoteSelected
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" /> Keep All Remote
            </button>
          </div>
        </div>

        {/* Divergence Fields List */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-[#00a96e]" />
            Pilih sumber kebenaran (Source of Truth) per field berikut:
          </div>

          {currentConflict.fields.map((field, idx) => {
            const currentChoice = fieldChoices[field.fieldName] || 'local';

            return (
              <div
                key={field.fieldName}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {field.fieldLabel}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ({field.fieldName})
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                    Nilai Berbeda
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Local Option Card */}
                  <div
                    onClick={() => handleSelectFieldChoice(field.fieldName, 'local')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      currentChoice === 'local'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
                        <Smartphone className="w-3.5 h-3.5" /> Local Version (Client)
                      </div>
                      {currentChoice === 'local' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      )}
                    </div>

                    <div className="font-mono font-bold text-slate-900 dark:text-white text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 break-all">
                      {formatValue(field.localValue)}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                      <span>Waktu Edit: {currentConflict.localUpdatedAt || 'Terbaru (Lokal)'}</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Keep Local</span>
                    </div>
                  </div>

                  {/* Remote Option Card */}
                  <div
                    onClick={() => handleSelectFieldChoice(field.fieldName, 'remote')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      currentChoice === 'remote'
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        <Cloud className="w-3.5 h-3.5" /> Remote Version (Firestore)
                      </div>
                      {currentChoice === 'remote' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      )}
                    </div>

                    <div className="font-mono font-bold text-slate-900 dark:text-white text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 break-all">
                      {formatValue(field.remoteValue)}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                      <span>Waktu Cloud: {currentConflict.remoteUpdatedAt || 'Firestore Data'}</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Keep Remote</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wizard Navigation & Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0 || isSubmitting}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-all cursor-pointer"
              title="Konflik Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {currentIndex + 1} / {totalConflicts}
            </span>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(totalConflicts - 1, prev + 1))}
              disabled={currentIndex === totalConflicts - 1 || isSubmitting}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-all cursor-pointer"
              title="Konflik Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              Tutup / Lewati
            </button>

            <button
              onClick={handleApplyResolution}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-[#00a96e] hover:bg-[#00925f] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#00a96e]/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Menyimpan Resolusi...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Terapkan Resolusi ({currentConflict.fields.length} Field)
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
