import type { VisaStatus } from '../types';

/** Kanban column order (left → right). */
export const VISA_PIPELINE_COLUMN_ORDER: VisaStatus[] = [
  'GATHERING_DOCS',
  'READY_TO_SUBMIT',
  'IN_PROCESSING',
  'ACTION_REQUIRED',
  'APPROVED',
  'REJECTED',
];

export const VISA_PIPELINE_LABELS: Record<VisaStatus, string> = {
  GATHERING_DOCS: 'Gathering Docs',
  READY_TO_SUBMIT: 'Ready to Submit',
  IN_PROCESSING: 'In Processing',
  ACTION_REQUIRED: 'Action Required',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};
