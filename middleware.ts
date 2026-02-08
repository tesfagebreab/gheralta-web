import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get host from headers (Railway passes x-forwarded-host for custom domains)
  let host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'gheraltatours.com';
  host = host.replace('www.', '').toLowerCase();

  const response = NextResponse.next();
  response.cookies.set('site_domain', host, {
    path: '/',
    sameSite: 'lax',
    secure: true, // HTTPS in production
  });

  return response;
}

export const config = {
  matcher: '/:path*', // Run on all paths
};