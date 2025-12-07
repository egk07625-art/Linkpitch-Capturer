"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * Clerk 사용자를 Supabase DB에 자동으로 동기화하는 훅
 *
 * 사용자가 로그인한 상태에서 이 훅을 사용하면
 * 자동으로 /api/sync-user를 호출하여 Supabase users 테이블에 사용자 정보를 저장합니다.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useSyncUser } from '@/hooks/use-sync-user';
 *
 * export default function Layout({ children }) {
 *   useSyncUser();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useSyncUser() {
  const { isLoaded, userId } = useAuth();
  const syncedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryDelay = 1000; // 1초

  useEffect(() => {
    // 이미 동기화했거나, 로딩 중이거나, 로그인하지 않은 경우 무시
    if (syncedRef.current || !isLoaded || !userId) {
      return;
    }

    // 동기화 실행 (재시도 로직 포함)
    const syncUser = async (attempt: number = 1): Promise<void> => {
      try {
        const response = await fetch("/api/sync-user", {
          method: "POST",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Failed to sync user (attempt ${attempt}/${maxRetries}):`,
            {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
              userId,
            },
          );

          // 재시도 가능한 경우 재시도
          if (attempt < maxRetries && response.status >= 500) {
            retryCountRef.current = attempt;
            setTimeout(() => {
              syncUser(attempt + 1);
            }, retryDelay * attempt); // 지수 백오프
            return;
          }

          return;
        }

        const result = await response.json();
        console.log("User synced successfully:", {
          userId,
          supabaseUserId: result.user?.id,
        });
        syncedRef.current = true;
        retryCountRef.current = 0;
      } catch (error) {
        console.error(
          `Error syncing user (attempt ${attempt}/${maxRetries}):`,
          {
            error,
            userId,
          },
        );

        // 네트워크 에러 등 재시도 가능한 경우 재시도
        if (attempt < maxRetries) {
          retryCountRef.current = attempt;
          setTimeout(() => {
            syncUser(attempt + 1);
          }, retryDelay * attempt);
        }
      }
    };

    syncUser();
  }, [isLoaded, userId]);
}
