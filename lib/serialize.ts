import type { LeaseFieldRow, LeaseRow } from "./db";

export interface FieldDTO {
  id: string;
  key: string;
  label: string;
  section: string;
  type: string;
  options: string[] | null;
  helpText: string | null;
  assignedTo: "admin" | "client" | "non_applicable";
  required: boolean;
  value: string | null;
  isCustom: boolean;
}

export function serializeField(row: LeaseFieldRow): FieldDTO {
  return {
    id: row.id,
    key: row.field_key,
    label: row.label,
    section: row.section,
    type: row.type,
    options: row.options ? JSON.parse(row.options) : null,
    helpText: row.help_text,
    assignedTo: row.assigned_to,
    required: row.required === 1,
    value: row.value,
    isCustom: row.is_custom === 1,
  };
}

export interface LeaseDTO {
  id: string;
  clientName: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export function serializeLease(row: LeaseRow): LeaseDTO {
  return {
    id: row.id,
    clientName: row.client_name,
    token: row.token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
  };
}
