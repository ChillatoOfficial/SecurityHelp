import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "groups.json");

/* =========================
   Types
========================= */

export type ModAction = "WARN" | "UNWARN" | "KICK";

export type ModLogEntry = {
  at: number;        
  action: ModAction;
  target: string;    
  by: string;        
  reason?: string;
};

export type GroupSettings = {
  antilink: boolean;
  antispam: boolean;
  whitelist: string[];
  vip: string[];
  parole_bandite: string[];
  welcome_enabled: boolean;
  welcome_text: string;
  welcome_image: string;
  regole: string;
  messaggi: number;

  warns: Record<string, number>;
  modlog: ModLogEntry[];

  lastSeen: Record<string, number>;
  inactive_exempt: string[];

  log: string;

  daily_messages: Record<string, number> 
};

type DB = {
  groups: Record<string, GroupSettings>;
  meta: Record<string, { name?: string; added_at?: number }>;
};


const defaultGroup: GroupSettings = {
  antilink: false,
  antispam: false,
  whitelist: [],
  vip: [],
  parole_bandite: [],
  welcome_enabled: false,
  welcome_text: "👋 Benvenuto/a {mention} in {group}!",
  welcome_image: "no",
  regole: "NON SETTATO",
  messaggi: 0,
  warns: {},
  modlog: [],
  lastSeen: {},
  inactive_exempt: [],
  log: "",
  daily_messages: {}
};

const defaultDB: DB = { groups: {}, meta: {} };


function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeGroup(g: Partial<GroupSettings> | undefined): GroupSettings {
  const merged: GroupSettings = {
    ...defaultGroup,
    ...(g || {}),
    warns: { ...(defaultGroup.warns || {}), ...((g as any)?.warns || {}) },
    whitelist: Array.isArray((g as any)?.whitelist) ? (g as any).whitelist : [...defaultGroup.whitelist],
    vip: Array.isArray((g as any)?.vip) ? (g as any).vip : [...defaultGroup.vip],
    parole_bandite: Array.isArray((g as any)?.parole_bandite) ? (g as any).parole_bandite : [...defaultGroup.parole_bandite],
    modlog: Array.isArray((g as any)?.modlog) ? (g as any).modlog : [...defaultGroup.modlog],
    lastSeen: { ...(defaultGroup.lastSeen || {}), ...((g as any)?.lastSeen || {}) },
    inactive_exempt: Array.isArray((g as any)?.inactive_exempt)
      ? (g as any).inactive_exempt
      : [],
    log: typeof (g as any)?.log === "string" ? (g as any).log : "",
    daily_messages: { ...(defaultGroup.daily_messages || {}), ...((g as any)?.daily_messages || {}) },
  };  
  if (typeof merged.messaggi !== "number" || Number.isNaN(merged.messaggi)) merged.messaggi = 0;

  return merged;
}

function readFromDisk(): DB {
  try {
    if (!fs.existsSync(DATA_PATH)) return { ...defaultDB };
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    if (!raw) return { ...defaultDB };

    const parsed = safeParseJSON<Partial<DB>>(raw, {});
    const groups = (parsed.groups && typeof parsed.groups === "object") ? parsed.groups : {};
    const meta = (parsed.meta && typeof parsed.meta === "object") ? parsed.meta : {};

    const out: DB = { groups: {}, meta: { ...meta } };

    for (const jid of Object.keys(groups as any)) {
      out.groups[jid] = normalizeGroup((groups as any)[jid]);
    }

    return out;
  } catch {
    return { ...defaultDB };
  }
}

function writeToDisk(next: DB) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });

  const tmp = DATA_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf-8");
  fs.renameSync(tmp, DATA_PATH);
}


let db: DB = readFromDisk();

const SAVE_DEBOUNCE_MS = 2500;
let saveTimer: NodeJS.Timeout | null = null;

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeToDisk(db);
  }, SAVE_DEBOUNCE_MS);
}

export function flush() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  writeToDisk(db);
}

function ensureGroup(groupJid: string): GroupSettings {
  const current = db.groups[groupJid];
  const normalized = normalizeGroup(current);

  if (!current) {
    db.groups[groupJid] = normalized;
    scheduleSave();
  } else {
    db.groups[groupJid] = normalized;
  }

  return db.groups[groupJid];
}

export function getGroup(groupJid: string): GroupSettings {
  return ensureGroup(groupJid);
}

export function setGroup(groupJid: string, data: Partial<GroupSettings>) {
  const g = ensureGroup(groupJid);
  const next: GroupSettings = {
    ...g,
    ...data,
    // preserva merge profondo su warns / modlog se arrivano parziali
    warns: { ...g.warns, ...(data.warns || {}) },
    modlog: Array.isArray(data.modlog) ? data.modlog : g.modlog,
    whitelist: Array.isArray(data.whitelist) ? data.whitelist : g.whitelist,
    vip: Array.isArray(data.vip) ? data.vip : g.vip,
    parole_bandite: Array.isArray(data.parole_bandite) ? data.parole_bandite : g.parole_bandite,
  };

  db.groups[groupJid] = next;
  scheduleSave();
}

export function registerGroup(groupJid: string, groupName?: string) {
  ensureGroup(groupJid);

  db.meta[groupJid] = {
    name: groupName || db.meta[groupJid]?.name,
    added_at: db.meta[groupJid]?.added_at || Date.now(),
  };

  scheduleSave();
}

export function removeGroup(groupJid: string) {
  delete db.groups[groupJid];
  delete db.meta[groupJid];
  scheduleSave();
}

export function listGroups(): Array<{ jid: string; name?: string; added_at?: number }> {
  return Object.keys(db.groups).map((jid) => ({
    jid,
    name: db.meta[jid]?.name,
    added_at: db.meta[jid]?.added_at,
  }));
}

export function addWarn(groupJid: string, userJid: string): number {
  const g = ensureGroup(groupJid);
  g.warns[userJid] = (g.warns[userJid] || 0) + 1;
  scheduleSave();
  return g.warns[userJid];
}

export function getWarns(groupJid: string, userJid: string): number {
  const g = ensureGroup(groupJid);
  return g.warns?.[userJid] || 0;
}

export function clearWarns(groupJid: string, userJid: string) {
  const g = ensureGroup(groupJid);
  delete g.warns[userJid];
  scheduleSave();
}

export function removeWarn(groupJid: string, userJid: string): number {
  const g = ensureGroup(groupJid);

  const current = g.warns[userJid] || 0;
  const next = Math.max(0, current - 1);

  if (next === 0) delete g.warns[userJid];
  else g.warns[userJid] = next;

  scheduleSave();
  return next;
}

const MODLOG_LIMIT = 200;

export function addModLog(groupJid: string, entry: Omit<ModLogEntry, "at">) {
  const g = ensureGroup(groupJid);

  g.modlog.push({ ...entry, at: Date.now() });

  if (g.modlog.length > MODLOG_LIMIT) {
    g.modlog = g.modlog.slice(-MODLOG_LIMIT);
  }

  scheduleSave();
}

export function getUserLogs(groupJid: string, targetJid: string, limit = 10): ModLogEntry[] {
  const g = ensureGroup(groupJid);
  return (g.modlog || [])
    .filter((e) => e.target === targetJid)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}

export function touchUser(groupJid: string, userJid: string) {
  const g = getGroup(groupJid)
  if (!g.lastSeen) g.lastSeen = {}
  g.lastSeen[userJid] = Date.now()
  scheduleSave()
}

export function getLastSeen(groupJid: string, userJid: string): number {
  const g = getGroup(groupJid)
  return g.lastSeen?.[userJid] ?? 0
}

export function setLastSeen(groupJid: string, userJid: string, ts: number) {
  const g = getGroup(groupJid)
  if (!g.lastSeen) g.lastSeen = {}
  g.lastSeen[userJid] = ts
  scheduleSave()
}

export function clearLastSeen(groupJid: string, userJid?: string) {
  const g = getGroup(groupJid)
  if (!g.lastSeen) g.lastSeen = {}

  if (userJid) delete g.lastSeen[userJid]
  else g.lastSeen = {}

  scheduleSave()
}

export function addInactiveExempt(groupJid: string, userJid: string) {
  const g = getGroup(groupJid)
  if (!Array.isArray(g.inactive_exempt)) g.inactive_exempt = []
  if (!g.inactive_exempt.includes(userJid)) g.inactive_exempt.push(userJid)
  scheduleSave()
}

export function removeInactiveExempt(groupJid: string, userJid: string) {
  const g = getGroup(groupJid)
  if (!Array.isArray(g.inactive_exempt)) g.inactive_exempt = []
  g.inactive_exempt = g.inactive_exempt.filter((x) => x !== userJid)
  scheduleSave()
}

export function listInactiveExempt(groupJid: string): string[] {
  const g = getGroup(groupJid)
  return Array.isArray(g.inactive_exempt) ? g.inactive_exempt : []
}

export function computeInactiveUsers(
  groupJid: string,
  participants: string[],
  olderThanMs: number,
  opts?: { includeNeverSeen?: boolean; exempt?: string[] }
): { inactive: string[]; cutoff: number } {
  const g = getGroup(groupJid)
  const now = Date.now()
  const cutoff = now - olderThanMs

  const storeExempt = new Set(listInactiveExempt(groupJid))
  const extraExempt = new Set(opts?.exempt ?? [])

  const includeNeverSeen = opts?.includeNeverSeen ?? true

  const inactive: string[] = []

  for (const jid of participants) {
    if (!jid) continue
    if (storeExempt.has(jid)) continue
    if (extraExempt.has(jid)) continue

    const last = g.lastSeen?.[jid] ?? 0

    if (last === 0) {
      if (includeNeverSeen) inactive.push(jid)
      continue
    }

    if (last < cutoff) inactive.push(jid)
  }

  return { inactive, cutoff }
}


export function pruneLastSeen(groupJid: string, keepForMs: number) {
  const g = getGroup(groupJid)
  const now = Date.now()
  const minTs = now - keepForMs

  const lastSeen = g.lastSeen || {}
  let changed = false

  for (const [jid, ts] of Object.entries(lastSeen)) {
    if (!ts || ts < minTs) {
      delete lastSeen[jid]
      changed = true
    }
  }

  if (changed) {
    g.lastSeen = lastSeen
    scheduleSave()
  }
}

export function setLogGroup(originGroupJid: string, logGroupJid: string) {
  setGroup(originGroupJid, { log: logGroupJid })
}

export function clearLogGroup(originGroupJid: string) {
  setGroup(originGroupJid, { log: "" })
}

export function getLogGroup(originGroupJid: string): string {
  const g = getGroup(originGroupJid)
  return g.log || ""
}


// usa sempre chiave "YYYY-MM-DD" (UTC). Se vuoi locale Italia, sotto ti metto variante.
export function dayKeyUTC(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function bumpDailyMessage(groupJid: string, at = Date.now()) {
  const g = getGroup(groupJid)
  if (!g.daily_messages) g.daily_messages = {}

  const key = dayKeyUTC(new Date(at))
  g.daily_messages[key] = (g.daily_messages[key] || 0) + 1

  scheduleSave()
}

export function getDailyCount(groupJid: string, keyYYYYMMDD: string): number {
  const g = getGroup(groupJid)
  return g.daily_messages?.[keyYYYYMMDD] ?? 0
}

export function getLastNDaysSeries(groupJid: string, days: number, now = new Date()) {
  const g = getGroup(groupJid)
  const daily = g.daily_messages || {}

  const labels: string[] = []
  const values: number[] = []
  const keys: string[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = dayKeyUTC(d)

    keys.push(key)
    labels.push(key.slice(5))
    values.push(daily[key] || 0)
  }

  return { keys, labels, values }
}

export function pruneDailyMessages(groupJid: string, keepDays = 90) {
  const g = getGroup(groupJid)
  const daily = g.daily_messages || {}
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - keepDays)
  const cutoffKey = dayKeyUTC(cutoff)

  let changed = false
  for (const key of Object.keys(daily)) {
    if (key < cutoffKey) {
      delete daily[key]
      changed = true
    }
  }

  if (changed) {
    g.daily_messages = daily
    scheduleSave()
  }
}

export function calcAvg(values: number[]): number {
  if (!values.length) return 0
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

export type Trend = "growth" | "decline" | "stable" | "insufficient"

export function analyzeTrend(values: number[]): { trend: Trend; deltaPct: number } {
  if (values.length < 6) return { trend: "insufficient", deltaPct: 0 }

  const mid = Math.floor(values.length / 2)
  const a = values.slice(0, mid)
  const b = values.slice(mid)

  const avgA = calcAvg(a)
  const avgB = calcAvg(b)

  if (avgA === 0 && avgB === 0) return { trend: "stable", deltaPct: 0 }
  if (avgA === 0 && avgB > 0) return { trend: "growth", deltaPct: 999 }

  const deltaPct = ((avgB - avgA) / Math.max(1, avgA)) * 100

  if (deltaPct > 20) return { trend: "growth", deltaPct }
  if (deltaPct < -20) return { trend: "decline", deltaPct }
  return { trend: "stable", deltaPct }
}

export function adviceForTrend(trend: Trend): string {
  switch (trend) {
    case "growth":
      return "📈 Attività in crescita: valuta antispam/antilink + controlla nuovi ingressi."
    case "decline":
      return "📉 Attività in calo: prova eventi/sondaggi e contenuti per riattivare la chat."
    case "stable":
      return "➖ Attività stabile: buon equilibrio. Mantieni le impostazioni attuali."
    default:
      return "ℹ️ Dati insufficienti: serve più storico per consigli affidabili."
  }
}

// QuickChart url (grafico leggero senza server)
export function quickChartUrl(labels: string[], values: number[]): string {
  const chart = {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Messaggi", data: values }]
    },
    options: {
      legend: { display: false },
      scales: { yAxes: [{ ticks: { beginAtZero: true } }] }
    }
  }
  return "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(chart))
}


