/**
 * @file app/sign-up/[[...sign-up]]/page.tsx
 * @description Clerk 회원가입 페이지
 *
 * Clerk의 SignUp 컴포넌트를 사용하여 회원가입 페이지를 제공합니다.
 * [[...sign-up]] 동적 라우팅을 사용하여 Clerk의 모든 인증 경로를 처리합니다.
 */

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <SignUp />
    </div>
  );
}



