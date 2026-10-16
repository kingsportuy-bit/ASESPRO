import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_HOSTS = new Set(["inmobiliaria.asespro.kodebix.com", "asespro.codexa.uy"]);
const PANEL_HOSTS = new Set(["panel.inmobiliaria.asespro.kodebix.com", "panelasespro.codexa.uy"]);

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith("/_next/") || /\.(?:avif|css|gif|ico|jpe?g|js|map|png|svg|webp|woff2?)$/i.test(pathname);
}

export function middleware(request: NextRequest): NextResponse {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;

  if (PANEL_HOSTS.has(host)) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    const isPanelRoute = isUnder(pathname, "/admin") || isUnder(pathname, "/api/admin");
    const isPanelConfigRoute = pathname === "/api/public/supabase-config";
    const isPanelAsset = isStaticAsset(pathname) || pathname === "/favicon.ico";

    if (!isPanelRoute && !isPanelConfigRoute && !isPanelAsset) {
      return new NextResponse("Not found", { status: 404 });
    }

    return NextResponse.next();
  }

  if (PUBLIC_HOSTS.has(host) && (isUnder(pathname, "/admin") || isUnder(pathname, "/api/admin") || pathname === "/api/public/supabase-config")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Preserve the local development workflow and unknown hosts used by tests.
  if (!PUBLIC_HOSTS.has(host) && !PANEL_HOSTS.has(host)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
