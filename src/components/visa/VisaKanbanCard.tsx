import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MapPin, Radio } from 'lucide-react';
import type { VisaApplication } from '../../types';
import type { Client } from '../../types';

type Props = {
  visa: VisaApplication;
  client: Client | undefined;
  staffInitials: string;
};

export const VisaKanbanCard: React.FC<Props> = ({ visa, client, staffInitials }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: visa.id,
    data: { type: 'visa', visa },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const etaLabel = visa.expectedApprovalDate
    ? new Date(visa.expectedApprovalDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const hasTracking = Boolean(visa.externalTrackingId?.trim());

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass-panel rounded-2xl border-white/30 p-3 cursor-grab active:cursor-grabbing shadow-md hover:border-emerald-500/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate">{client?.name ?? 'Unknown client'}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-600 font-medium">
            <MapPin size={12} className="text-emerald-600 shrink-0" />
            <span className="truncate">{visa.destinationCountry}</span>
          </div>
        </div>
        <div
          className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center text-[10px] font-black shrink-0 border border-emerald-500/25"
          title="Assigned staff"
        >
          {staffInitials}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">ETA {etaLabel}</span>
        {hasTracking && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-tight">
            <Radio size={10} className="shrink-0" />
            Live
          </span>
        )}
      </div>
    </div>
  );
};
