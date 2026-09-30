import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Pages that need login. API routes are NOT handled here — each API route
// checks the user itself (and the Razorpay webhook must never be redirected).
const PROTECTED = ['/dashboard', '/resume', '/admin'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + '/'));

  // Never crash the whole site (MIDDLEWARE_INVOCATION_FAILED) because of
  // missing config or a Supabase network hiccup — fail open to the page,
  // which does its own server-side auth check.
  if (!url || !key) return response;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getUser();

    if (!data.user && isProtected) {
      const login = request.nextUrl.clone();
      login.pathname = '/login';
      login.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
      return NextResponse.redirect(login);
    }
  } catch (e) {
    console.error('middleware auth refresh failed');
  }
  return response;
}

export const config = {
  // Skip: all API routes, auth callback/signout routes, Next internals, static files.
  matcher: ['/((?!api/|auth/|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|woff2?)$).*)'],
};
