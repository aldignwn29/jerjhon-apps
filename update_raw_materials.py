import re

with open('src/components/modules/inventory_purchasing/RawMaterialsView.tsx', 'r') as f:
    content = f.read()

# Add Hapus button next to Edit
edit_button_old = """                    <button
                      onClick={() => handleOpenEditModal(group)}
                      className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>"""

edit_button_new = """                    <button
                      onClick={() => handleOpenEditModal(group)}
                      className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Hapus seluruh data bahan baku untuk ${group.productName}?`)) {
                          deleteRawMaterialGroup(group.id);
                        }
                      }}
                      className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>"""

content = content.replace(edit_button_old, edit_button_new)

with open('src/components/modules/inventory_purchasing/RawMaterialsView.tsx', 'w') as f:
    f.write(content)
