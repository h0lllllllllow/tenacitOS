/**
 * Service action API
 * POST /api/system/services
 * Body: { name, backend, action }  action: restart | stop | start | logs
 */
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const ALLOWED_SERVICES_PM2 = ['classvault', 'content-vault', 'postiz-simple', 'brain'] as const;
const ALLOWED_SERVICES_SYSTEMD = ['mission-control', 'openclaw-gateway', 'nginx'] as const;
const ALLOWED_DOCKER_IDS_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,63}$/;
const ALLOWED_ACTIONS = new Set(['restart', 'stop', 'start', 'logs']);

async function run(command: string, args: string[]): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, args, {
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
  return `${stdout || ''}${stderr ? `\n${stderr}` : ''}`.trim();
}

async function pm2Action(name: string, action: string): Promise<string> {
  if (!ALLOWED_SERVICES_PM2.includes(name as (typeof ALLOWED_SERVICES_PM2)[number])) {
    throw new Error(`Service "${name}" not in allowlist`);
  }
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error(`Invalid action "${action}"`);
  }

  if (action === 'logs') {
    try {
      const out = await run('pm2', ['logs', name, '--lines', '100', '--nostream', '--raw']);
      return out || 'No logs available';
    } catch {
      return 'Could not retrieve logs';
    }
  }

  const output = await run('pm2', [action, name]);
  return output || `${action} executed successfully`;
}

async function systemdAction(name: string, action: string): Promise<string> {
  if (!ALLOWED_SERVICES_SYSTEMD.includes(name as (typeof ALLOWED_SERVICES_SYSTEMD)[number])) {
    throw new Error(`Service "${name}" not in allowlist`);
  }
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error(`Invalid action "${action}"`);
  }

  // openclaw-gateway is typically a user-level service, not system-level.
  if (name === 'openclaw-gateway') {
    if (action === 'logs') {
      return run('journalctl', ['--user', '-u', name, '-n', '100', '--no-pager']);
    }

    const output = await run('systemctl', ['--user', action, name]);
    return output || `${action} executed successfully`;
  }

  if (action === 'logs') {
    return run('journalctl', ['-u', name, '-n', '100', '--no-pager']);
  }

  const output = await run('systemctl', [action, name]);
  return output || `${action} executed successfully`;
}

async function dockerAction(id: string, action: string): Promise<string> {
  if (!ALLOWED_DOCKER_IDS_PATTERN.test(id)) {
    throw new Error(`Invalid container ID "${id}"`);
  }
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error(`Invalid action "${action}"`);
  }

  if (action === 'logs') {
    return run('docker', ['logs', '--tail', '100', id]);
  }

  const output = await run('docker', [action, id]);
  return output || `${action} executed successfully`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name : '';
    const backend = typeof body?.backend === 'string' ? body.backend : '';
    const action = typeof body?.action === 'string' ? body.action : '';

    if (!name || !backend || !action) {
      return NextResponse.json({ error: 'Missing name, backend or action' }, { status: 400 });
    }

    let output = '';

    switch (backend) {
      case 'pm2':
        output = await pm2Action(name, action);
        break;
      case 'systemd':
        output = await systemdAction(name, action);
        break;
      case 'docker':
        output = await dockerAction(name, action);
        break;
      default:
        return NextResponse.json({ error: `Unknown backend "${backend}"` }, { status: 400 });
    }

    return NextResponse.json({ success: true, output, action, name, backend });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[services API] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
