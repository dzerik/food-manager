import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
                     req.nextUrl.pathname.startsWith("/register");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");
  const isPublicRoute = req.nextUrl.pathname === "/" ||
                        req.nextUrl.pathname.startsWith("/recipes");

  // Allow API routes and public routes
  if (isApiRoute || isPublicRoute) {
    return;
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl));
  }

  // Redirect non-logged-in users to login for protected routes
  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
