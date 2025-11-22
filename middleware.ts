import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 공개 라우트 정의
const isPublicRoute = createRouteMatcher([
  "/",                        // 랜딩 페이지
  "/sign-in(.*)",            // 로그인 페이지
  "/sign-up(.*)",            // 회원가입 페이지
  "/r(.*)",                  // 리포트 뷰 (수신자가 인증 없이 조회 가능)
  "/prospects/new",          // Vision Analysis 페이지 (공개)
  "/api/webhooks(.*)",       // 외부 웹훅 (n8n 등)
]);

export default clerkMiddleware(async (auth, req) => {
  // 공개 라우트는 인증 없이 접근 가능
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // /api/sync-user는 특별 처리: Edge Runtime 파일 시스템 접근 문제 방지
  // 이 API는 Node.js Runtime에서 실행되며, API 라우트 자체에서 인증을 처리함
  if (req.nextUrl.pathname === "/api/sync-user") {
    return NextResponse.next();
  }
  
  // 보호된 라우트는 인증 필요
  // Edge Runtime 호환성을 위해 auth()로 수동 체크 (auth.protect() 대신)
  const authResult = await auth();
  
  if (!authResult.userId) {
    // 인증되지 않은 사용자는 sign-in으로 리다이렉트
    // Edge Runtime 호환성을 위해 req.nextUrl 사용
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    // 현재 요청 URL을 redirect_url로 설정 (pathname + search)
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }
  
  // 인증된 사용자는 계속 진행
  return NextResponse.next();
});

export const config = {
  matcher: [
    // 정적 파일과 Next.js 내부 파일 제외
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API 라우트 포함
    "/(api|trpc)(.*)",
  ],
};
