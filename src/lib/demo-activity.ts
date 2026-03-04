import fs from "fs";
import path from "path";
import { logActivity } from "@/lib/activities-db";

const STATE_PATH = path.join(process.cwd(), "data", "demo-activity.json");
const INTERVAL_MS = 15000;

const DEMO_MESSAGES = [
  "DEMO: Telemetry sync completed",
  "DEMO: Queue scan finished (no anomalies)",
  "DEMO: Synthetic health check passed",
  "DEMO: Report pipeline heartbeat OK",
  "DEMO: Permission audit reviewed",
];

interface DemoState {
  enabled: boolean;
  lastGeneratedAt: number;
}

function readState(): DemoState {
  try {
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      enabled: !!parsed.enabled,
      lastGeneratedAt: parsed.lastGeneratedAt || 0,
    };
  } catch {
    return { enabled: false, lastGeneratedAt: 0 };
  }
}

function writeState(next: DemoState): void {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(next, null, 2));
}

export function getDemoActivityState(): DemoState {
  return readState();
}

export function setDemoActivityEnabled(enabled: boolean): DemoState {
  const curr = readState();
  const next = {
    enabled,
    lastGeneratedAt: enabled ? curr.lastGeneratedAt : 0,
  };
  writeState(next);
  return next;
}

export function maybeGenerateDemoActivity(): void {
  const state = readState();
  if (!state.enabled) return;

  const now = Date.now();
  if (now - state.lastGeneratedAt < INTERVAL_MS) return;

  const message = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
  logActivity("task", message, "success", {
    duration_ms: Math.floor(Math.random() * 900) + 100,
    agent: "main",
    metadata: { demo: true, serverGenerated: true },
  });

  writeState({ ...state, lastGeneratedAt: now });
}
