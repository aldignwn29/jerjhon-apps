import re

with open('src/components/modules/inventory_purchasing/RawMaterialsView.tsx', 'r') as f:
    content = f.read()

# Add state for confirm modal
state_old = "  const [searchTerm, setSearchTerm] = useState('');"
state_new = """  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'group' | 'item', groupId: string, itemId?: string, name: string } | null>(null);"""
content = content.replace(state_old, state_new)

# Replace group delete confirm
group_delete_old = """                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Hapus seluruh data bahan baku untuk ${group.productName}?`)) {
                          deleteRawMaterialGroup(group.id);
                        }
                      }}"""
group_delete_new = """                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ type: 'group', groupId: group.id, name: group.productName });
                      }}"""
content = content.replace(group_delete_old, group_delete_new)

# Replace item delete confirm
item_delete_old = """                                    <button
                                      onClick={() => {
                                        if (confirm(`Hapus bahan ${mat.name}?`)) {
                                          deleteRawMaterialItem(group.id, mat.id);
                                        }
                                      }}"""
item_delete_new = """                                    <button
                                      onClick={() => {
                                        setConfirmDelete({ type: 'item', groupId: group.id, itemId: mat.id, name: mat.name });
                                      }}"""
content = content.replace(item_delete_old, item_delete_new)

# Add confirm modal JSX right before the end of return statement
modal_jsx = """
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Konfirmasi Hapus</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Apakah Anda yakin ingin menghapus <strong>{confirmDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete.type === 'group') {
                      deleteRawMaterialGroup(confirmDelete.groupId);
                    } else if (confirmDelete.type === 'item' && confirmDelete.itemId) {
                      deleteRawMaterialItem(confirmDelete.groupId, confirmDelete.itemId);
                    }
                    setConfirmDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
"""

content = content.replace("    </div>\n  );\n};\n", modal_jsx)

with open('src/components/modules/inventory_purchasing/RawMaterialsView.tsx', 'w') as f:
    f.write(content)

