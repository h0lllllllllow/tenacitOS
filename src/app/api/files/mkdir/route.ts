import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getWorkspaceBase, resolveWorkspacePath } from '@/lib/workspace-paths';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace, path: dirPath, name } = body;

    if (!dirPath && !name) {
      return NextResponse.json({ error: 'Missing path or name' }, { status: 400 });
    }

    const base = getWorkspaceBase(workspace);
    if (!base) {
      return NextResponse.json({ error: 'Unknown workspace' }, { status: 400 });
    }

    const relativeTarget = name ? path.join(dirPath || '', name) : dirPath;
    const resolved = resolveWorkspacePath(workspace, relativeTarget);
    if (!resolved) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    await fs.mkdir(resolved.fullPath, { recursive: true });

    return NextResponse.json({ success: true, path: path.relative(base, resolved.fullPath) });
  } catch (error) {
    console.error('[mkdir] Error:', error);
    return NextResponse.json({ error: 'Failed to create directory' }, { status: 500 });
  }
}
