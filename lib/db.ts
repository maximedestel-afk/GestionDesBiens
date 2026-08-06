import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { FIELD_CATALOG, type AssignedTo, type FieldType } from "./fields";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

declare global {
  // eslint-disable-next-line no-var
  var __bailDb: Database.Database | undefined;
}

function init(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS leases (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      submitted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS lease_fields (
      id TEXT PRIMARY KEY,
      lease_id TEXT NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
      field_key TEXT NOT NULL,
      label TEXT NOT NULL,
      section TEXT NOT NULL,
      type TEXT NOT NULL,
      options TEXT,
      help_text TEXT,
      assigned_to TEXT NOT NULL DEFAULT 'admin',
      required INTEGER NOT NULL DEFAULT 0,
      value TEXT,
      is_custom INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      UNIQUE(lease_id, field_key)
    );

    CREATE INDEX IF NOT EXISTS idx_lease_fields_lease_id ON lease_fields(lease_id);
  `);

  return db;
}

export function getDb(): Database.Database {
  if (!global.__bailDb) {
    global.__bailDb = init();
  }
  return global.__bailDb;
}

export interface LeaseRow {
  id: string;
  client_name: string;
  token: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface LeaseFieldRow {
  id: string;
  lease_id: string;
  field_key: string;
  label: string;
  section: string;
  type: FieldType;
  options: string | null;
  help_text: string | null;
  assigned_to: AssignedTo;
  required: number;
  value: string | null;
  is_custom: number;
  position: number;
}

function now(): string {
  return new Date().toISOString();
}

export function createLease(clientName: string): LeaseRow {
  const db = getDb();
  const id = crypto.randomUUID();
  const token = crypto.randomUUID().replace(/-/g, "");
  const timestamp = now();

  const insertLease = db.prepare(
    `INSERT INTO leases (id, client_name, token, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
  );
  const insertField = db.prepare(
    `INSERT INTO lease_fields (id, lease_id, field_key, label, section, type, options, help_text, assigned_to, required, value, is_custom, position)
     VALUES (@id, @lease_id, @field_key, @label, @section, @type, @options, @help_text, @assigned_to, @required, @value, 0, @position)`
  );

  const tx = db.transaction(() => {
    insertLease.run(id, clientName, token, timestamp, timestamp);
    FIELD_CATALOG.forEach((field, index) => {
      insertField.run({
        id: crypto.randomUUID(),
        lease_id: id,
        field_key: field.key,
        label: field.label,
        section: field.section,
        type: field.type,
        options: field.options ? JSON.stringify(field.options) : null,
        help_text: field.helpText ?? null,
        assigned_to: field.defaultAssignedTo,
        required: field.required ? 1 : 0,
        value: field.defaultValue ?? null,
        position: index,
      });
    });
  });
  tx();

  return getLeaseRow(id)!;
}

export function getLeaseRow(id: string): LeaseRow | undefined {
  return getDb().prepare(`SELECT * FROM leases WHERE id = ?`).get(id) as LeaseRow | undefined;
}

export function getLeaseByToken(token: string): LeaseRow | undefined {
  return getDb().prepare(`SELECT * FROM leases WHERE token = ?`).get(token) as LeaseRow | undefined;
}

export function listLeases(): LeaseRow[] {
  return getDb().prepare(`SELECT * FROM leases ORDER BY created_at DESC`).all() as LeaseRow[];
}

export function getLeaseFields(leaseId: string): LeaseFieldRow[] {
  return getDb()
    .prepare(`SELECT * FROM lease_fields WHERE lease_id = ? ORDER BY position ASC`)
    .all(leaseId) as LeaseFieldRow[];
}

export function touchLease(leaseId: string) {
  getDb().prepare(`UPDATE leases SET updated_at = ? WHERE id = ?`).run(now(), leaseId);
}

export function updateLeaseClientName(leaseId: string, clientName: string) {
  getDb()
    .prepare(`UPDATE leases SET client_name = ?, updated_at = ? WHERE id = ?`)
    .run(clientName, now(), leaseId);
}

export function reopenLease(leaseId: string) {
  getDb().prepare(`UPDATE leases SET submitted_at = NULL, updated_at = ? WHERE id = ?`).run(now(), leaseId);
}

export function updateLeaseField(
  leaseId: string,
  fieldId: string,
  patch: Partial<{
    assignedTo: AssignedTo;
    value: string | null;
    required: boolean;
    label: string;
  }>
) {
  const db = getDb();
  const current = db
    .prepare(`SELECT * FROM lease_fields WHERE id = ? AND lease_id = ?`)
    .get(fieldId, leaseId) as LeaseFieldRow | undefined;
  if (!current) return undefined;

  const next = {
    assigned_to: patch.assignedTo ?? current.assigned_to,
    value: patch.value !== undefined ? patch.value : current.value,
    required: patch.required !== undefined ? (patch.required ? 1 : 0) : current.required,
    label: patch.label ?? current.label,
  };

  db.prepare(
    `UPDATE lease_fields SET assigned_to = ?, value = ?, required = ?, label = ? WHERE id = ? AND lease_id = ?`
  ).run(next.assigned_to, next.value, next.required, next.label, fieldId, leaseId);
  touchLease(leaseId);

  return db.prepare(`SELECT * FROM lease_fields WHERE id = ?`).get(fieldId) as LeaseFieldRow;
}

export function addCustomField(
  leaseId: string,
  input: { label: string; section: string; type: FieldType; assignedTo: AssignedTo }
): LeaseFieldRow {
  const db = getDb();
  const maxPos = db
    .prepare(`SELECT COALESCE(MAX(position), -1) AS m FROM lease_fields WHERE lease_id = ?`)
    .get(leaseId) as { m: number };
  const id = crypto.randomUUID();
  const fieldKey = `custom_${id}`;

  db.prepare(
    `INSERT INTO lease_fields (id, lease_id, field_key, label, section, type, options, help_text, assigned_to, required, value, is_custom, position)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, 0, NULL, 1, ?)`
  ).run(id, leaseId, fieldKey, input.label, input.section, input.type, input.assignedTo, maxPos.m + 1);
  touchLease(leaseId);

  return db.prepare(`SELECT * FROM lease_fields WHERE id = ?`).get(id) as LeaseFieldRow;
}

export function deleteCustomField(leaseId: string, fieldId: string): boolean {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM lease_fields WHERE id = ? AND lease_id = ? AND is_custom = 1`)
    .run(fieldId, leaseId);
  if (result.changes > 0) touchLease(leaseId);
  return result.changes > 0;
}

export function saveClientValues(
  token: string,
  values: Record<string, string>,
  submit: boolean
): { lease: LeaseRow; fields: LeaseFieldRow[] } | undefined {
  const db = getDb();
  const lease = getLeaseByToken(token);
  if (!lease) return undefined;
  if (lease.submitted_at) {
    // Already submitted: reject silent overwrite, caller should check first.
    return { lease, fields: getLeaseFields(lease.id) };
  }

  const updateStmt = db.prepare(
    `UPDATE lease_fields SET value = ? WHERE id = ? AND lease_id = ? AND assigned_to = 'client'`
  );
  const tx = db.transaction(() => {
    for (const [fieldId, value] of Object.entries(values)) {
      updateStmt.run(value, fieldId, lease.id);
    }
    if (submit) {
      db.prepare(`UPDATE leases SET submitted_at = ?, updated_at = ? WHERE id = ?`).run(
        now(),
        now(),
        lease.id
      );
    } else {
      touchLease(lease.id);
    }
  });
  tx();

  return { lease: getLeaseRow(lease.id)!, fields: getLeaseFields(lease.id) };
}
