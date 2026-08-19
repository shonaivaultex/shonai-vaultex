import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const { data: player } = await supabase.from("players").select("member_status").eq("user_id", userId).maybeSingle();
  if (player && player.member_status && player.member_status !== "active") {
    const inactiveUrl = request.nextUrl.clone(); inactiveUrl.pathname = "/account-inactive"; inactiveUrl.search = "";
    return NextResponse.redirect(inactiveUrl);
  }

  return response;
}

export const config = {
  matcher: ["/mypage/:path*", "/profile/:path*", "/performance/:path*", "/edit/:path*"],
};
