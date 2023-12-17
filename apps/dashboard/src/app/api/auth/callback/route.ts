import { Cookies } from "@/utils/constants";
import { createClient } from "@midday/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const preferredRegion = "fra1";

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const returnTo = requestUrl.searchParams.get("return_to");
  const provider = requestUrl.searchParams.get("provider");
  const mfaSetupVisited = cookieStore.has(Cookies.MfaSetupVisited);
  const onboardingVisited = cookieStore.has(Cookies.OnboardingVisited);

  if (provider) {
    cookieStore.set(Cookies.PrefferedSignInProvider, provider);
  }

  if (code) {
    const supabase = createClient(cookieStore);
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (!mfaSetupVisited && onboardingVisited) {
    cookieStore.set(Cookies.MfaSetupVisited, "true");
    return NextResponse.redirect(`${requestUrl.origin}/mfa/setup`);
  }

  if (returnTo) {
    return NextResponse.redirect(`${requestUrl.origin}/${returnTo}`);
  }

  return NextResponse.redirect(requestUrl.origin);
}
