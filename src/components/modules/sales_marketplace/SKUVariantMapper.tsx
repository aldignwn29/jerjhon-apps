import React, { useState } from 'react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProductItem } from '../../../types';

interface DraggableItemProps {
  id: string;
  label: string;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ id, label }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 mb-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded shadow-sm cursor-grab"
    >
      {label}
    </div>
  );
};

interface SKUVariantMapperProps {
  failedItems: { id: string; label: string }[];
  availableProducts: ProductItem[];
  onMap: (failedId: string, productId: string) => void;
}

const SKUVariantMapper = ({ failedItems, availableProducts, onMap }: SKUVariantMapperProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        // This is where the mapping logic would go
        onMap(active.id, over.id);
    }
    setActiveId(null);
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 gap-6 p-4">
        <div>
          <h3 className="font-bold mb-2">Failed Sync Items</h3>
          <SortableContext items={failedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {failedItems.map(item => (
              <DraggableItem key={item.id} id={item.id} label={item.label} />
            ))}
          </SortableContext>
        </div>
        <div>
          <h3 className="font-bold mb-2">Available POS Items</h3>
          <div className="space-y-2">
            {availableProducts.map(product => (
              <div
                key={product.id}
                className="p-3 bg-slate-100 dark:bg-slate-700 rounded border-2 border-dashed border-slate-300 dark:border-slate-600"
              >
                {product.name} (SKU: {product.sku})
              </div>
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="p-3 bg-white dark:bg-slate-800 border rounded shadow-lg cursor-grabbing">
            {failedItems.find(i => i.id === activeId)?.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SKUVariantMapper;
