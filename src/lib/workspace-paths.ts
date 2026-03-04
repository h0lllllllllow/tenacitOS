import path from 'path';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/root/.openclaw';

const WORKSPACE_MAP: Record<string, string> = {
  workspace: path.join(OPENCLAW_DIR, 'workspace'),
  'mission-control': path.join(OPENCLAW_DIR, 'workspace', 'mission-control'),
};

export function getWorkspaceBase(workspace?: string): string | null {
  const key = workspace || 'workspace';
  const base = WORKSPACE_MAP[key];
  return base ? path.resolve(base) : null;
}

export function resolveWorkspacePath(workspace: string | undefined, target: string): { base: string; fullPath: string } | null {
  const base = getWorkspaceBase(workspace);
  if (!base) return null;

  const fullPath = path.resolve(base, target || '.');
  if (fullPath !== base && !fullPath.startsWith(base + path.sep)) {
    return null;
  }

  return { base, fullPath };
}
