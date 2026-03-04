/**
 * Quick Actions API
 * POST /api/actions  body: { action }
 */
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { logActivity } from '@/lib/activities-db';

const execFileAsync = promisify(execFile);
const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/root/.openclaw';
const WORKSPACE = path.join(OPENCLAW_DIR, 'workspace');

interface ActionResult {
  action: string;
  status: 'success' | 'error';
  output: string;
  duration_ms: number;
  timestamp: string;
}

async function run(command: string, args: string[], cwd?: string): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd,
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
  return `${stdout || ''}${stderr ? `\n${stderr}` : ''}`.trim();
}

async function listRepos(): Promise<string[]> {
  const repos: string[] = [];
  const entries = await fs.readdir(WORKSPACE, { withFileTypes: true }).catch(() => []);

  if (await fs.stat(path.join(WORKSPACE, '.git')).then((s) => s.isDirectory()).catch(() => false)) {
    repos.push(WORKSPACE);
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const repoPath = path.join(WORKSPACE, entry.name);
    const gitPath = path.join(repoPath, '.git');
    const isRepo = await fs.stat(gitPath).then((s) => s.isDirectory()).catch(() => false);
    if (isRepo) repos.push(repoPath);
  }

  return repos.slice(0, 10);
}

async function cleanTempFiles(): Promise<string> {
  const tmpDir = '/tmp';
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  let removed = 0;

  const entries = await fs.readdir(tmpDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = path.join(tmpDir, entry.name);
    try {
      const stat = await fs.stat(fullPath);
      if (now - stat.mtimeMs > oneDayMs) {
        await fs.unlink(fullPath);
        removed += 1;
      }
    } catch {
      // skip
    }
  }

  return `Removed ${removed} old file(s) from /tmp`;
}

async function runAction(action: string): Promise<ActionResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  try {
    let output = '';

    switch (action) {
      case 'git-status': {
        const repoPaths = await listRepos();
        const results: string[] = [];

        for (const repoPath of repoPaths) {
          const name = path.basename(repoPath);
          try {
            const status = await run('git', ['status', '--short'], repoPath);
            const log = await run('git', ['log', '--oneline', '-3'], repoPath);
            results.push(`📁 ${name}:\n${status || '(clean)'}\n${log}`);
          } catch {
            results.push(`📁 ${name}: (error reading git status)`);
          }
        }

        output = results.length ? results.join('\n\n') : 'No git repos found in workspace';
        break;
      }

      case 'restart-gateway': {
        try {
          await run('systemctl', ['restart', 'openclaw-gateway']);
          const status = await run('systemctl', ['is-active', 'openclaw-gateway']);
          output = `Restart command executed\nStatus: ${status.trim()}`;
        } catch {
          output = 'Service not found or restart failed';
        }
        break;
      }

      case 'clear-temp': {
        output = await cleanTempFiles();
        break;
      }

      case 'usage-stats': {
        const du = await run('du', ['-sh', WORKSPACE]).catch(() => 'N/A');
        const df = await run('df', ['-h', '/']).catch(() => 'N/A');
        const mem = await run('free', ['-h']).catch(() => 'N/A');
        const uptime = await run('uptime', ['-p']).catch(() => 'N/A');
        output = `Workspace: ${du}\n\nDisk:\n${df}\n\nMemory:\n${mem}\n\nUptime: ${uptime}`;
        break;
      }

      case 'heartbeat': {
        const results: string[] = [];
        const services = ['mission-control'];

        for (const svc of services) {
          const status = await run('systemctl', ['is-active', svc]).catch(() => 'inactive');
          const s = status.trim();
          results.push(`${s === 'active' ? '✅' : '❌'} ${svc}: ${s}`);
        }

        try {
          const pm2 = await run('pm2', ['jlist']);
          const pm2list = JSON.parse(pm2);
          for (const svc of ['classvault', 'content-vault', 'brain']) {
            const proc = pm2list.find((p: { name: string; pm2_env?: { status?: string } }) => p.name === svc);
            const status = proc?.pm2_env?.status || 'not found';
            results.push(`${status === 'online' ? '✅' : '❌'} ${svc} (pm2): ${status}`);
          }
        } catch {
          results.push('⚠️ PM2: could not connect');
        }

        try {
          const response = await fetch('https://tenacitas.cazaustre.dev', { method: 'HEAD' });
          results.push(`\n🌐 tenacitas.cazaustre.dev: HTTP ${response.status}`);
        } catch {
          results.push('\n🌐 tenacitas.cazaustre.dev: unreachable');
        }

        output = results.join('\n');
        break;
      }

      case 'npm-audit': {
        const missionControlPath = path.join(WORKSPACE, 'mission-control');
        const auditOutput = await run('npm', ['audit', '--json'], missionControlPath).catch((e) => String(e));

        try {
          const parsed = JSON.parse(auditOutput);
          output = `Vulnerabilities: ${JSON.stringify(parsed.metadata?.vulnerabilities || {})}`;
        } catch {
          output = auditOutput;
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const duration_ms = Date.now() - start;
    logActivity('command', `Quick action: ${action}`, 'success', { duration_ms, metadata: { action } });

    return { action, status: 'success', output, duration_ms, timestamp };
  } catch (err) {
    const duration_ms = Date.now() - start;
    const errMsg = err instanceof Error ? err.message : String(err);
    logActivity('command', `Quick action failed: ${action}`, 'error', { duration_ms, metadata: { action, error: errMsg } });
    return { action, status: 'error', output: errMsg, duration_ms, timestamp };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = typeof body?.action === 'string' ? body.action : '';

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    const validActions = ['git-status', 'restart-gateway', 'clear-temp', 'usage-stats', 'heartbeat', 'npm-audit'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Unknown action. Valid: ${validActions.join(', ')}` }, { status: 400 });
    }

    const result = await runAction(action);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[actions] Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
