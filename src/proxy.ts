import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth-session';

const PUBLIC_ROUTES = new Set(['/login']);
const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/health'];

function hasValidSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const expected = request.nextUrl.origin;
  const fetchSite = request.headers.get('sec-fetch-site');

  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
    return false;
  }

  if (!origin) return true;
  return origin === expected;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('mc_auth')?.value;
  const authenticated = await verifySessionToken(authCookie, process.env.AUTH_SECRET);

  if (!authenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute && isMutatingMethod && !hasValidSameOrigin(request)) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Cross-site request blocked' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
