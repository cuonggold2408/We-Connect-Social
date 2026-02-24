import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE_NAME = "refresh_token";

export const AUTH_ROUTES: string[] = ["/login", "/register", "/verify-email"];

const PUBLIC_ROUTES: string[] = [];

const HOME_ROUTE = "/";

const LOGIN_ROUTE = "/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const isAuthenticated = !!token;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // Nếu là public route => cho pass luôn
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Đã login nhưng cố tình vào link auth -> cho quay lại trang chủ
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL(HOME_ROUTE, request.url));
  }

  // Chưa login nhưng lại có tình vào protected route -> Cho về lại trang login
  if (!isAuthenticated && !isAuthRoute) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);

    // Lưu lại URL hiện tại để khi login xong thì quay lại URL đó
    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\..*).*)",
  ],
};
