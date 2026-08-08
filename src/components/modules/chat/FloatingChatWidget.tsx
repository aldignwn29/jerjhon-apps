import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Megaphone, X, Trash2, Paperclip, FileText, Download, Eye, Image as ImageIcon, Move, LayoutGrid } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';

const DIVISIONS = ['HR', 'Finance', 'Marketing', 'Creative', 'General'];

interface Attachment {
  name: string;
  type: 'image' | 'document';
  url: string;
  size?: string;
}

export const FloatingChatWidget: React.FC = () => {
  const { currentUser, isAdmin, isManager } = useERP();
  if (!currentUser) return null;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  // Flexible / Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dockPosition, setDockPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    const targetEl = (e.currentTarget as HTMLElement).closest('.floating-chat-container') || (e.currentTarget.parentElement as HTMLElement);
    const rect = targetEl.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setPosition({ x: rect.left, y: rect.top });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 380, e.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 540, e.clientY - dragOffsetRef.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    try {
      const saved = localStorage.getItem('jerjhon_widgetChatMessages');
      if (saved) {
        const items = JSON.parse(saved);
        setMessages(items.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0)));
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed fetching widget chat:", err);
      setMessages([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const isImg = file.type.startsWith('image/');
      setAttachment({
        name: file.name,
        type: isImg ? 'image' : 'document',
        url: result,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendMessage = async () => {
    if (!currentUser || (!newMessage.trim() && !attachment)) return;
    
    const messageData: any = {
      id: `MSG-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: newMessage.trim(),
      type: isBroadcast && (isAdmin || isManager) ? 'broadcast' : 'chat',
      createdAt: Date.now()
    };

    if (attachment) {
      messageData.attachment = attachment;
    }

    if (isBroadcast && (isAdmin || isManager)) {
      messageData.targetDivisions = selectedDivisions;
    }

    try {
      const updated = [...messages, messageData];
      setMessages(updated);
      localStorage.setItem('jerjhon_widgetChatMessages', JSON.stringify(updated));
      setNewMessage('');
      setAttachment(null);
      setIsBroadcast(false);
      setSelectedDivisions([]);
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
      alert('Gagal mengirim pesan.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;
    try {
      const updated = messages.filter(m => m.id !== messageId);
      setMessages(updated);
      localStorage.setItem('jerjhon_widgetChatMessages', JSON.stringify(updated));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const canBroadcast = isAdmin || isManager;
  
  const isMessageVisible = (msg: any) => {
    if (msg.type !== 'broadcast') return true;
    if (isAdmin || isManager) return true;
    if (!msg.targetDivisions || msg.targetDivisions.length === 0) return true;
    return msg.targetDivisions.includes(currentUser?.department);
  };

  if (!isOpen) {
    const dockClasses = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
    }[dockPosition];

    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed ${dockClasses} bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl z-50 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white/25 backdrop-blur-md cursor-pointer`}
        title="Buka Live Chat & Broadcast Tim (Geser & Fleksibel)"
      >
        <MessageSquare size={24} className="fill-white/10" />
      </button>
    );
  }

  const visibleMessages = messages.filter(isMessageVisible);

  const getDockClassName = () => {
    if (position) return '';
    switch (dockPosition) {
      case 'bottom-left': return 'bottom-6 left-6';
      case 'top-right': return 'top-6 right-6';
      case 'top-left': return 'top-6 left-6';
      default: return 'bottom-6 right-6';
    }
  };

  return (
    <div
      style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
      className={`floating-chat-container fixed ${getDockClassName()} w-96 h-[540px] glass-card dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5`}
    >
      {/* Header (Draggable) */}
      <div 
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3.5 flex justify-between items-center shadow-xs cursor-grab active:cursor-grabbing select-none"
        title="Geser jendela chat ke mana saja secara fleksibel"
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-white/80 shrink-0" />
          <h3 className="font-extrabold text-sm flex items-center gap-1.5">
            <MessageSquare size={16} /> Live Chat
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Dock Presets */}
          <button 
            onClick={(e) => { e.stopPropagation(); setPosition(null); setDockPosition('bottom-right'); }}
            className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${dockPosition === 'bottom-right' && !position ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30 text-white'}`}
            title="Dock Kanan Bawah"
          >
            ↘
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setPosition(null); setDockPosition('bottom-left'); }}
            className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${dockPosition === 'bottom-left' && !position ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30 text-white'}`}
            title="Dock Kiri Bawah"
          >
            ↙
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setPosition(null); setDockPosition('top-right'); }}
            className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${dockPosition === 'top-right' && !position ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30 text-white'}`}
            title="Dock Kanan Atas"
          >
            ↗
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setPosition(null); setDockPosition('top-left'); }}
            className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${dockPosition === 'top-left' && !position ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30 text-white'}`}
            title="Dock Kiri Atas"
          >
            ↖
          </button>

          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors ml-1">
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
            Belum ada pesan. Mulai obrolan sekarang...
          </div>
        ) : (
          visibleMessages.map(msg => {
            const isMe = msg.senderId === currentUser?.id;
            const canDelete = isMe || isAdmin || isManager;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}>
                <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium flex items-center gap-1">
                  {msg.senderName} {msg.targetDivisions && msg.targetDivisions.length > 0 && `(Ke: ${msg.targetDivisions.join(', ')})`}
                </span>

                <div className="flex items-center gap-1.5 max-w-[90%]">
                  {isMe && canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Hapus Pesan"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  <div className={`p-3 rounded-2xl text-xs shadow-xs space-y-1.5 ${
                    msg.type === 'broadcast' 
                      ? 'bg-rose-500/10 text-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800 font-medium' 
                      : isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80'
                  }`}>
                    {msg.type === 'broadcast' && <Megaphone className="inline w-3.5 h-3.5 mr-1 text-rose-600 dark:text-rose-400" />}
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {/* Attachment */}
                    {msg.attachment && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/40 dark:border-slate-700/40">
                        {msg.attachment.type === 'image' ? (
                          <div
                            className="relative group/img rounded-lg overflow-hidden max-w-[200px] cursor-pointer"
                            onClick={() => setPreviewAttachment(msg.attachment)}
                          >
                            <img
                              src={msg.attachment.url}
                              alt={msg.attachment.name}
                              className="max-h-36 w-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setPreviewAttachment(msg.attachment)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-[11px] border cursor-pointer ${
                              isMe
                                ? 'bg-blue-700/60 border-blue-500/50 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="truncate flex-1 font-bold">{msg.attachment.name}</span>
                            <Eye className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isMe && canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Hapus Pesan"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>
      
      {/* Broadcast controls */}
      {canBroadcast && (
        <div className="px-4 py-2 border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2 mb-1">
            <input 
              type="checkbox" 
              checked={isBroadcast} 
              onChange={(e) => setIsBroadcast(e.target.checked)}
              id="broadcast-check-floating"
              className="accent-rose-600 rounded"
            />
            <label htmlFor="broadcast-check-floating" className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <Megaphone className="w-3 h-3" /> Broadcast Mode
            </label>
          </div>
          
          {isBroadcast && (
            <div className="flex flex-wrap gap-1.5 p-2 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs bg-rose-50/50 dark:bg-rose-950/20">
              {DIVISIONS.map(div => (
                <label key={div} className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <input 
                    type="checkbox"
                    checked={selectedDivisions.includes(div)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedDivisions(prev => [...prev, div]);
                      else setSelectedDivisions(prev => prev.filter(d => d !== div));
                    }}
                    className="accent-rose-600 rounded"
                  />
                  {div}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attachment Preview */}
      {attachment && (
        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {attachment.type === 'image' ? (
              <img src={attachment.url} alt="prev" className="w-7 h-7 object-cover rounded" />
            ) : (
              <FileText className="w-6 h-6 text-amber-500 shrink-0" />
            )}
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{attachment.name}</span>
          </div>
          <button onClick={() => setAttachment(null)} className="p-1 text-slate-400 hover:text-rose-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shrink-0"
          title="Lampirkan File / Foto"
        >
          <Paperclip size={16} />
        </button>

        <input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 glass-input dark:bg-slate-800 px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30"
          placeholder="Ketik pesan..."
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
        />

        <button 
          onClick={sendMessage} 
          disabled={!newMessage.trim() && !attachment}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-xs shrink-0"
        >
          <Send size={15} />
        </button>
      </div>

      {/* Full Preview Attachment Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2 min-w-0">
                {previewAttachment.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{previewAttachment.name}</h4>
                  <p className="text-[10px] text-slate-500">{previewAttachment.size || 'Berkas Lampiran'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.name}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition shadow-xs"
                >
                  <Download className="w-3 h-3" /> Unduh
                </a>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950">
              {previewAttachment.type === 'image' ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-md"
                />
              ) : previewAttachment.url.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewAttachment.url}
                  title={previewAttachment.name}
                  className="w-full h-[55vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                />
              ) : (
                <div className="text-center py-8 space-y-3 max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{previewAttachment.name}</h5>
                    <p className="text-[11px] text-slate-500">
                      File dokumen siap diunduh dan dibuka di perangkat Anda.
                    </p>
                  </div>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-[11px] transition shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Berkas
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

