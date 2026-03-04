/**
 * Real-time log streaming via SSE
 * GET /api/logs/stream?service=<name>&backend=<pm2|systemd>
 */
import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

const ALLOWED_BACKENDS = new Set(['pm2', 'systemd']);
const ALLOWED_SERVICES = ['mission-control', 'classvault', 'content-vault', 'postiz-simple', 'brain', 'openclaw-gateway'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') || 'mission-control';
  const backend = searchParams.get('backend') || 'systemd';

  if (!ALLOWED_BACKENDS.has(backend)) {
    return new Response('Backend not allowed', { status: 400 });
  }

  if (!ALLOWED_SERVICES.includes(service)) {
    return new Response('Service not allowed', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ line: data, ts: new Date().toISOString() })}\n\n`));
        } catch {
          // stream may already be closed
        }
      };

      send(`[stream] Connected to ${service} (${backend})`);

      const cmd = backend === 'pm2'
        ? { command: 'pm2', args: ['logs', service, '--lines', '50', '--nostream', '--raw'] }
        : { command: 'journalctl', args: ['-u', service, '-n', '50', '--no-pager', '-f'] };

      const proc = spawn(cmd.command, cmd.args, { stdio: ['ignore', 'pipe', 'pipe'] });

      proc.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) send(line.slice(0, 2000));
      });

      proc.stderr.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) send(line.slice(0, 2000));
      });

      proc.on('error', (err) => {
        send(`[error] ${err.message}`);
        try { controller.close(); } catch {}
      });

      proc.on('close', () => {
        send('[stream] Process ended');
        try { controller.close(); } catch {}
      });

      request.signal?.addEventListener('abort', () => {
        proc.kill('SIGTERM');
        setTimeout(() => {
          try { proc.kill('SIGKILL'); } catch {}
        }, 1000);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
