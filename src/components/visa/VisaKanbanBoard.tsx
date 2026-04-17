import React, { useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { VisaApplication, VisaStatus } from '../../types';
import type { Client } from '../../types';
import { VISA_PIPELINE_COLUMN_ORDER, VISA_PIPELINE_LABELS } from '../../lib/visaPipeline';
import { VisaKanbanCard } from './VisaKanbanCard';

type StaffLookup = Map<string, string>;

type Props = {
  visas: VisaApplication[];
  clients: Client[];
  staffByUserId: StaffLookup;
  updateVisa: (id: string, updates: Partial<VisaApplication>) => void | Promise<void>;
};

function staffInitialsFromName(name: string | undefined): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function KanbanColumn({
  status,
  visasInColumn,
  clients,
  staffByUserId,
}: {
  status: VisaStatus;
  visasInColumn: VisaApplication[];
  clients: Client[];
  staffByUserId: StaffLookup;
}) {
  const ids = useMemo(() => visasInColumn.map((v) => v.id), [visasInColumn]);
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[260px] max-w-[280px] flex-col rounded-3xl border border-white/25 bg-white/40 dark:bg-slate-900/30 backdrop-blur-md shadow-lg min-h-[200px] transition-[box-shadow] ${
        isOver ? 'ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-[var(--app-shell-bg,#f8fafc)]' : ''
      }`}
    >
      <div className="glass-panel rounded-t-3xl border-b border-white/25 px-4 py-3 rounded-b-none">
        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600">
          {VISA_PIPELINE_LABELS[status]}
        </h4>
        <p className="text-[10px] font-bold text-slate-500 mt-0.5">{visasInColumn.length} active</p>
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 p-3 flex-1">
          {visasInColumn.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-dashed border-white/35 py-8 px-3 text-center">
              <p className="text-[11px] font-medium text-slate-500">Drop applications here</p>
            </div>
          ) : (
            visasInColumn.map((visa) => {
              const client = clients.find((c) => c.id === visa.clientId);
              const staffName = visa.assignedStaffId ? staffByUserId.get(visa.assignedStaffId) : undefined;
              const initials = staffInitialsFromName(staffName);
              return (
                <VisaKanbanCard
                  key={visa.id}
                  visa={visa}
                  client={client}
                  staffInitials={initials}
                />
              );
            })
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export const VisaKanbanBoard: React.FC<Props> = ({ visas, clients, staffByUserId, updateVisa }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const byStatus = useMemo(() => {
    const map = new Map<VisaStatus, VisaApplication[]>();
    for (const s of VISA_PIPELINE_COLUMN_ORDER) {
      map.set(s, []);
    }
    for (const v of visas) {
      const list = map.get(v.status);
      if (list) list.push(v);
      else map.get('GATHERING_DOCS')!.push(v);
    }
    return map;
  }, [visas]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const visaId = String(active.id);
    const activeVisa = visas.find((v) => v.id === visaId);
    if (!activeVisa) return;

    let targetStatus: VisaStatus | undefined;
    if (VISA_PIPELINE_COLUMN_ORDER.includes(over.id as VisaStatus)) {
      targetStatus = over.id as VisaStatus;
    } else {
      const overVisa = visas.find((v) => v.id === String(over.id));
      targetStatus = overVisa?.status;
    }

    if (targetStatus && targetStatus !== activeVisa.status) {
      void updateVisa(visaId, { status: targetStatus });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin">
        {VISA_PIPELINE_COLUMN_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            visasInColumn={byStatus.get(status) ?? []}
            clients={clients}
            staffByUserId={staffByUserId}
          />
        ))}
      </div>
    </DndContext>
  );
};
