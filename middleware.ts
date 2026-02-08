import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  let host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'gheraltatours.com';
  host = host.replace('www.', '').toLowerCase();

  console.log(`Middleware detected host: ${host}`); // Log to confirm

  const response = NextResponse.next();
  response.cookies.set('site_domain', host, { 
    path: '/', 
    sameSite: 'lax', 
    secure: true,
    httpOnly: true 
  });
  return response;
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - All image extensions (.png, .jpg, etc)
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};