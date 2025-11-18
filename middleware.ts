import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 공개 라우트 정의
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 공개 라우트는 인증 없이 접근 가능
  if (isPublicRoute(req)) {
    return;
  }
  
  // 보호된 라우트는 인증 필요
  // Clerk가 내부적으로 환경 변수를 체크하고 처리합니다
  await auth.protect();
});

export const config = {
  matcher: [
    // 정적 파일과 Next.js 내부 파일 제외
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API 라우트 포함
    "/(api|trpc)(.*)",
  ],
};