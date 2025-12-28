/**
 * @file components/providers/auth-bridge.tsx
 * @description Chrome Extension과 웹앱 간 인증 정보 브릿지
 *
 * 확장프로그램이 DOM에서 사용자의 Supabase UUID를 읽어서
 * n8n webhook으로 전송할 수 있도록 숨겨진 데이터를 제공합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { getCurrentUserSupabaseId } from '@/actions/user';

/**
 * AuthBridge Component
 *
 * 역할:
 * - 현재 로그인한 사용자의 Supabase UUID를 DOM에 노출
 * - Chrome Extension이 document.querySelector로 접근 가능
 * - 보안: display:none으로 숨김, 읽기 전용 데이터
 */
export function AuthBridge() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserId() {
      try {
        const { userId: supabaseId, email, error } = await getCurrentUserSupabaseId();

        if (error) {
          // NOT_AUTHENTICATED is expected when user is not logged in (e.g., landing page)
          if (error !== 'NOT_AUTHENTICATED') {
            console.error('[AuthBridge] Failed to load user ID:', error);
          }
          setUserId(null);
          setUserEmail(null);
        } else {
          setUserId(supabaseId);
          setUserEmail(email);

          // Dev mode logging (production에서는 제거 권장)
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthBridge] User info loaded for extension bridge');
          }
        }
      } catch (err) {
        console.error('[AuthBridge] Unexpected error:', err);
        setUserId(null);
        setUserEmail(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserId();
  }, []);

  // 로딩 중이거나 userId가 없으면 렌더링하지 않음
  if (isLoading || !userId) {
    return null;
  }

  return (
    <>
      {/*
        확장프로그램 접근용 메인 브릿지
        사용법 (Extension):
        const bridge = document.getElementById('lp-auth-bridge');
        const userId = bridge?.dataset.userId;
      */}
      <div
        id="lp-auth-bridge"
        data-user-id={userId}
        data-user-email={userEmail}
        data-bridge-version="1.0"
        data-bridge-type="auth"
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/*
        백업용 메타 태그 (확장프로그램이 선호하는 방식에 따라 선택)
        사용법 (Extension):
        const meta = document.querySelector('meta[name="lp-user-id"]');
        const userId = meta?.content;
        const email = document.querySelector('meta[name="lp-user-email"]')?.content;
      */}
      <meta name="lp-user-id" content={userId} />
      {userEmail && <meta name="lp-user-email" content={userEmail} />}
      <meta name="lp-bridge-status" content="ready" />
    </>
  );
}

/**
 * Chrome Extension에서 사용할 수 있는 헬퍼 스크립트
 *
 * Extension의 content script에서 아래 코드를 사용하세요:
 *
 * ```javascript
 * // 방법 1: DOM Element로 접근
 * function getUserId() {
 *   const bridge = document.getElementById('lp-auth-bridge');
 *   return bridge?.dataset.userId || null;
 * }
 *
 * // 방법 2: Meta Tag로 접근
 * function getUserIdFromMeta() {
 *   const meta = document.querySelector('meta[name="lp-user-id"]');
 *   return meta?.content || null;
 * }
 *
 * // 방법 3: 브릿지 준비 상태 확인
 * function isBridgeReady() {
 *   const status = document.querySelector('meta[name="lp-bridge-status"]');
 *   return status?.content === 'ready';
 * }
 *
 * // 사용 예시
 * const userId = getUserId();
 * if (userId) {
 *   // n8n webhook으로 전송
 *   fetch('YOUR_N8N_WEBHOOK_URL', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       user_id: userId,
 *       url: window.location.href,
 *       // ... 기타 데이터
 *     })
 *   });
 * }
 * ```
 */
