import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Megaphone, Trash2, Paperclip, Image as ImageIcon, FileText, X, Eye, Download } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';

interface Attachment {
  name: string;
  type: 'image' | 'document';
  url: string;
  size?: string;
}

export const ChatView: React.FC = () => {
  const { currentUser, isAdmin, isManager } = useERP();
  if (!currentUser) return null;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatId = 'general'; // Default general chat

  useEffect(() => {
    if (!currentUser) return;
    try {
      const saved = localStorage.getItem('jerjhon_chatMessages');
      if (saved) {
        const items = JSON.parse(saved);
        setMessages(items.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0)));
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed fetching chat messages:", err);
      setMessages([]);
    }
  }, [currentUser]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    
    const messageId = `MSG-${Date.now()}`;
    const messageData: any = {
      id: messageId,
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: newMessage.trim(),
      type: isBroadcast && (isAdmin || isManager) ? 'broadcast' : 'chat',
      createdAt: Date.now()
    };

    if (attachment) {
      messageData.attachment = attachment;
    }

    try {
      const updated = [...messages, messageData];
      setMessages(updated);
      localStorage.setItem('jerjhon_chatMessages', JSON.stringify(updated));
      setNewMessage('');
      setAttachment(null);
      setIsBroadcast(false);
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
      alert('Gagal mengirim pesan. Silakan coba lagi.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;
    try {
      const updated = messages.filter(m => m.id !== messageId);
      setMessages(updated);
      localStorage.setItem('jerjhon_chatMessages', JSON.stringify(updated));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const canBroadcast = isAdmin || isManager;

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> Live Chat & Diskusi Tim
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Komunikasi langsung real-time, berbagi berkas & broadcast informasi
          </p>
        </div>
        {canBroadcast && (
          <span className="px-3 py-1 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800">
            Mode Akses Broadcast Aktif
          </span>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 mb-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-inner">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <MessageSquare className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">Belum ada percakapan</p>
            <p className="text-xs text-slate-400">Mulai diskusi pertama dengan mengirim pesan di bawah</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const canDelete = isMe || isAdmin || isManager;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
              >
                {/* Sender Name & Details */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {msg.senderName || 'Karyawan'}
                  </span>
                  {msg.type === 'broadcast' && (
                    <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                      <Megaphone className="w-3 h-3" /> BROADCAST
                    </span>
                  )}
                </div>

                {/* Message Bubble Container */}
                <div className="flex items-center gap-2 max-w-[80%]">
                  {/* Delete Button on Left if sent by Me */}
                  {isMe && canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                      title="Hapus Pesan Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs space-y-2 shadow-xs ${
                      msg.type === 'broadcast'
                        ? 'bg-rose-500/10 text-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800 font-medium'
                        : isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    {/* Text content */}
                    {msg.text && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}

                    {/* Attachment rendering */}
                    {msg.attachment && (
                      <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/40">
                        {msg.attachment.type === 'image' ? (
                          <div
                            className="relative group/img rounded-xl overflow-hidden max-w-xs cursor-pointer border border-slate-200/50"
                            onClick={() => setPreviewAttachment(msg.attachment)}
                          >
                            <img
                              src={msg.attachment.url}
                              alt={msg.attachment.name}
                              className="max-h-52 w-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setPreviewAttachment(msg.attachment)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isMe
                                ? 'bg-blue-700/60 border-blue-500/50 text-white hover:bg-blue-700'
                                : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-200'
                            }`}
                          >
                            <FileText className="w-5 h-5 shrink-0 text-amber-400" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate text-[11px]">{msg.attachment.name}</p>
                              <p className="text-[10px] opacity-75">{msg.attachment.size || 'Dokumen'} • Klik untuk Preview</p>
                            </div>
                            <Eye className="w-4 h-4 shrink-0 opacity-80" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delete Button on Right if sent by Other user (Admin/Manager power) */}
                  {!isMe && canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                      title="Hapus Pesan Ini (Akses Admin)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Broadcast Option */}
      {canBroadcast && (
        <div className="mb-2 flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={isBroadcast}
            onChange={(e) => setIsBroadcast(e.target.checked)}
            id="broadcast-check"
            className="accent-rose-600 rounded cursor-pointer"
          />
          <label
            htmlFor="broadcast-check"
            className="text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1"
          >
            <Megaphone className="w-3.5 h-3.5" /> Kirim sebagai Pesan Broadcast (Pengumuman Penting)
          </label>
        </div>
      )}

      {/* Attachment Preview Bar */}
      {attachment && (
        <div className="mb-2 p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {attachment.type === 'image' ? (
              <img src={attachment.url} alt="preview" className="w-10 h-10 object-cover rounded-lg shrink-0 border" />
            ) : (
              <FileText className="w-8 h-8 text-amber-500 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{attachment.name}</p>
              <p className="text-[10px] text-slate-500">{attachment.size}</p>
            </div>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-lg"
            title="Batal Lampiran"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
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
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          title="Lampirkan File / Foto"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          className="flex-1 bg-transparent px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
          placeholder="Ketik pesan diskusi..."
        />

        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() && !attachment}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" /> Kirim
        </button>
      </div>

      {/* Full Preview Attachment Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2.5 min-w-0">
                {previewAttachment.type === 'image' ? (
                  <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{previewAttachment.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{previewAttachment.size || 'Berkas Lampiran'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh
                </a>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950">
              {previewAttachment.type === 'image' ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-md"
                />
              ) : previewAttachment.url.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewAttachment.url}
                  title={previewAttachment.name}
                  className="w-full h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                />
              ) : (
                <div className="text-center py-12 space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-base mb-1">{previewAttachment.name}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      File dokumen siap diunduh dan dibuka di aplikasi pembaca dokumen perangkat Anda.
                    </p>
                  </div>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition shadow-md"
                  >
                    <Download className="w-4 h-4" /> Download Berkas ({previewAttachment.size || 'File'})
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

