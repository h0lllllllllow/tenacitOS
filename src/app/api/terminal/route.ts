/**
 * Browser Terminal API (hardened)
 * POST /api/terminal
 * Body: { command }
 *
 * Security model:
 * - no shell execution
 * - no pipes/redirection/chaining
 * - strict command allowlist + argument validation
 */
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const BLOCKED_CHARS = /[|;&><`$\\]/;
const MAX_ARGS = 12;

const ALLOWED_COMMANDS = new Set([
  'df', 'free', 'uptime', 'ps', 'systemctl', 'pm2', 'ls', 'git', 'journalctl', 'docker', 'netstat', 'cat',
  'uname', 'hostname', 'whoami', 'id', 'date'
]);

function splitArgs(input: string): string[] {
  const matches = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return matches.map((t) => t.replace(/^"|"$/g, ''));
}

function isSafePath(value: string): boolean {
  if (!value) return false;
  if (value.includes('..')) return false;
  return /^[a-zA-Z0-9_./:-]+$/.test(value);
}

function validateCommand(base: string, args: string[]): boolean {
  if (!ALLOWED_COMMANDS.has(base)) return false;
  if (args.length > MAX_ARGS) return false;

  for (const arg of args) {
    if (arg.length > 200) return false;
    if (BLOCKED_CHARS.test(arg)) return false;
  }

  switch (base) {
    case 'cat':
      return args.length === 1 && isSafePath(args[0]);
    case 'git':
      return args.length >= 1 && args[0] === '-C' && args[1] ? isSafePath(args[1]) : ['status', 'log', 'branch'].includes(args[0]);
    case 'systemctl':
      return args.length >= 2 && ['status'].includes(args[0]) && /^[a-zA-Z0-9@._-]+$/.test(args[1]);
    case 'journalctl':
      return args.includes('--no-pager') && args.includes('-u');
    case 'docker':
      return args[0] === 'ps';
    case 'pm2':
      return args[0] === 'list';
    case 'ps':
      return args.length === 1 && args[0] === 'aux';
    case 'ls':
      return args.length <= 1 && (args.length === 0 || isSafePath(args[0]));
    default:
      return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawCommand = String(body.command || '').trim();

    if (!rawCommand) {
      return NextResponse.json({ error: 'No command provided' }, { status: 400 });
    }

    if (rawCommand.length > 300 || BLOCKED_CHARS.test(rawCommand)) {
      return NextResponse.json({ error: 'Command contains blocked characters/operators' }, { status: 403 });
    }

    const parts = splitArgs(rawCommand);
    if (parts.length === 0) {
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
    }

    const [base, ...args] = parts;
    if (!validateCommand(base, args)) {
      return NextResponse.json({ error: `Command not allowed: "${rawCommand}"` }, { status: 403 });
    }

    const start = Date.now();
    const { stdout, stderr } = await execFileAsync(base, args, {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });

    return NextResponse.json({
      output: stdout + (stderr ? `\nSTDERR: ${stderr}` : ''),
      duration: Date.now() - start,
      command: rawCommand,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg, output: msg }, { status: 200 });
  }
}
