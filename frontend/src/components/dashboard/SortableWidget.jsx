import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function SortableWidget({ id, children, className = "" }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${className}`}>
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        title="Drag to rearrange"
        className="absolute top-4 right-14 z-20 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-grab active:cursor-grabbing transition-opacity"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {children}
    </div>
  );
}
