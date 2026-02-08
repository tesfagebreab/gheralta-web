import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  let host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'gheraltatours.com';
  host = host.replace('www.', '').toLowerCase();

  console.log(`Middleware detected host: ${host}`); // Log to confirm

  const response = NextResponse.next();
  response.cookies.set('site_domain', host, { path: '/', sameSite: 'lax', secure: true });
  return response;
}

export const config = {
  matcher: '/:path*',
};