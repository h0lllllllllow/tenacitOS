/**
 * Git Dashboard API
 * GET /api/git - List all repos with status
 * POST /api/git - { repo, action } actions: status, pull, log, diff
 */
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);
const WORKSPACE = process.env.OPENCLAW_DIR ? `${process.env.OPENCLAW_DIR}/workspace` : '/root/.openclaw/workspace';

interface RepoStatus {
  name: string;
  path: string;
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  lastCommit: { hash: string; message: string; author: string; date: string } | null;
  remoteUrl: string;
  isDirty: boolean;
}

async function git(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd, timeout: 10000, maxBuffer: 1024 * 1024 });
  return stdout.trim();
}

function resolveRepoPath(repo: string): string | null {
  if (!repo || typeof repo !== 'string') return null;
  const resolvedWorkspace = path.resolve(WORKSPACE);
  const resolvedRepo = path.resolve(repo);

  if (!resolvedRepo.startsWith(resolvedWorkspace + path.sep) && resolvedRepo !== resolvedWorkspace) {
    return null;
  }

  return resolvedRepo;
}

async function getRepos(): Promise<string[]> {
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

  return repos;
}

async function getRepoStatus(repoPath: string): Promise<RepoStatus> {
  const name = path.basename(repoPath);

  try {
    const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD'], repoPath).catch(() => 'unknown');

    let ahead = 0;
    let behind = 0;
    try {
      const abStr = await git(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], repoPath);
      const parts = abStr.split('\t');
      ahead = parseInt(parts[0] || '0', 10) || 0;
      behind = parseInt(parts[1] || '0', 10) || 0;
    } catch {}

    const statusOut = await git(['status', '--porcelain'], repoPath).catch(() => '');
    const lines = statusOut.split('\n').filter(Boolean);

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    for (const line of lines) {
      const xy = line.slice(0, 2);
      const file = line.slice(3);
      const x = xy[0];
      const y = xy[1];

      if (x !== ' ' && x !== '?') staged.push(file);
      if (y !== ' ' && y !== '?') unstaged.push(file);
      if (xy === '??') untracked.push(file);
    }

    let lastCommit: RepoStatus['lastCommit'] = null;
    try {
      const commitOut = await git(['log', '-1', '--format=%H|%s|%an|%ar'], repoPath);
      const parts = commitOut.split('|');
      if (parts.length >= 4) {
        lastCommit = {
          hash: parts[0].slice(0, 8),
          message: parts[1],
          author: parts[2],
          date: parts[3],
        };
      }
    } catch {}

    const remoteUrl = await git(['remote', 'get-url', 'origin'], repoPath).catch(() => '');

    return {
      name,
      path: repoPath,
      branch,
      ahead,
      behind,
      staged,
      unstaged,
      untracked,
      lastCommit,
      remoteUrl,
      isDirty: staged.length > 0 || unstaged.length > 0 || untracked.length > 0,
    };
  } catch {
    return {
      name,
      path: repoPath,
      branch: 'unknown',
      ahead: 0,
      behind: 0,
      staged: [],
      unstaged: [],
      untracked: [],
      lastCommit: null,
      remoteUrl: '',
      isDirty: false,
    };
  }
}

export async function GET() {
  try {
    const repos = await getRepos();
    const statuses = await Promise.all(repos.map(getRepoStatus));
    return NextResponse.json({ repos: statuses, total: statuses.length });
  } catch (error) {
    console.error('[git] Error:', error);
    return NextResponse.json({ error: 'Failed to get repos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repoPath = resolveRepoPath(body.repo);
    const action = body.action;

    if (!repoPath) {
      return NextResponse.json({ error: 'Invalid repo path' }, { status: 400 });
    }

    let output = '';

    switch (action) {
      case 'status':
        output = await git(['status'], repoPath);
        break;
      case 'pull':
        output = await git(['pull'], repoPath);
        break;
      case 'log':
        output = await git(['log', '--oneline', '-20'], repoPath);
        break;
      case 'diff':
        output = await git(['diff', '--stat'], repoPath);
        if (!output) output = 'No changes';
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, output, repo: repoPath, action });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
