/**
 * @file hooks/use-report-tracking.ts
 * @description 리포트 조회 추적 React Hook (Performance Optimized)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { trackReportViewAction } from "@/actions/track-report-view";
import type { UseReportTrackingOptions } from "@/types/report-viewer";

/**
 * 세션 ID 생성 및 관리
 */
function getOrCreateSessionId(): string | null {
  if (typeof window === "undefined") return null;

  const STORAGE_KEY = "linkpitch_report_session_id";
  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID(); // 최신 브라우저 표준 UUID 생성
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export function useReportTracking(options: UseReportTrackingOptions) {
  const { prospectId, enabled = true } = options;
  // SSR 시 null로 시작하고, 클라이언트 사이드에서만 session ID 생성
  const [sessionId, setSessionId] = useState<string | null>(null);

  // 클라이언트 사이드 hydration 후 session ID 생성
  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = getOrCreateSessionId();
      if (id) {
        setSessionId(id);
      }
    }
  }, []);

  // Refs: 렌더링을 유발하지 않고 값만 추적하기 위해 사용
  const scrollDepthRef = useRef(0);
  const durationRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());

  // 저장 여부 플래그 (중복 저장 방지)
  const milestonesReached = useRef({
    scroll50: false,
    scroll80: false,
    time10: false,
    time30: false,
  });

  // prospectId가 변경될 때마다 추적 상태 리셋
  // 각 리포트는 독립적으로 추적되어야 하므로, 리포트 변경 시 모든 상태를 초기화
  useEffect(() => {
    if (!enabled || !prospectId) return;

    // 추적 상태 초기화
    startTimeRef.current = Date.now();
    scrollDepthRef.current = 0;
    durationRef.current = 0;
    milestonesReached.current = {
      scroll50: false,
      scroll80: false,
      time10: false,
      time30: false,
    };
  }, [prospectId, enabled]);

  // API 호출 함수 (내부 로직용)
  // sessionId ref를 사용하여 최신 값을 항상 참조하도록 함
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const saveLog = async (finalSave: boolean = false) => {
    // sessionId가 아직 생성되지 않았거나 prospectId가 없으면 스킵
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId || !prospectId) return;

    try {
      await trackReportViewAction({
        prospect_id: prospectId,
        session_id: currentSessionId,
        user_agent: navigator.userAgent,
        scroll_depth: scrollDepthRef.current,
        duration_seconds: durationRef.current,
      });
      // console.log(`[Tracking] Saved: Scroll ${scrollDepthRef.current}%, Time ${durationRef.current}s`);
    } catch (error) {
      console.error("Tracking Error:", error);
    }
  };

  // 1. 스크롤 추적 (Throttling 적용 - 성능 최적화)
  useEffect(() => {
    if (!enabled) return;

    let ticking = false; // 스크롤 이벤트 제어용 플래그

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const scrollTop =
            window.scrollY || document.documentElement.scrollTop;

          // 스크롤 깊이 계산 (0~100)
          const currentDepth = Math.round(
            ((scrollTop + windowHeight) / documentHeight) * 100,
          );
          scrollDepthRef.current = Math.min(currentDepth, 100);

          // 마일스톤 체크 (50%, 80%)
          if (
            scrollDepthRef.current >= 50 &&
            !milestonesReached.current.scroll50
          ) {
            milestonesReached.current.scroll50 = true;
            saveLog();
          }
          if (
            scrollDepthRef.current >= 80 &&
            !milestonesReached.current.scroll80
          ) {
            milestonesReached.current.scroll80 = true;
            saveLog();
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled, prospectId]);

  // 2. 체류 시간 추적 (렌더링 유발 X)
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      // 현재 시간 계산
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      durationRef.current = elapsed;

      // 마일스톤 체크 (10초, 30초)
      if (elapsed >= 10 && !milestonesReached.current.time10) {
        milestonesReached.current.time10 = true;
        saveLog();
      }
      if (elapsed >= 30 && !milestonesReached.current.time30) {
        milestonesReached.current.time30 = true;
        saveLog();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled, prospectId]);

  // 3. 페이지 이탈 시 최종 저장
  useEffect(() => {
    if (!enabled) return;

    // 최종 저장 함수 (중복 호출 방지)
    const performFinalSave = () => {
      // sessionId가 아직 생성되지 않았으면 스킵
      if (!sessionIdRef.current || !prospectId) return;

      const finalDuration = Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      );
      durationRef.current = finalDuration;

      // 비동기 호출이지만 완료를 보장할 수 없음
      // React cleanup 함수는 동기 함수여야 하므로 Promise를 반환할 수 없음
      // 하지만 최선의 노력을 다함
      saveLog(true).catch(() => {
        // 실패해도 조용히 처리 (사용자 경험에 영향 없음)
      });
    };

    // 페이지 가시성 변경 감지 (탭 전환, 브라우저 최소화 등)
    // 이 시점에는 아직 JavaScript가 실행 중이므로 비동기 요청이 완료될 가능성이 높음
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        performFinalSave();
      }
    };

    // beforeunload 이벤트 처리 (브라우저 종료 시)
    // 이 시점에는 sendBeacon을 사용하는 것이 더 안전하지만,
    // 현재 구조에서는 Server Action을 직접 호출할 수 없으므로
    // 최선의 노력을 다함
    const handleBeforeUnload = () => {
      performFinalSave();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // cleanup 함수: 컴포넌트가 언마운트될 때 실행
    // 주의: React cleanup 함수는 동기 함수여야 하므로 Promise를 반환할 수 없음
    // 따라서 비동기 작업의 완료를 보장할 수 없지만, 최선의 노력을 다함
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // 마지막 순간의 데이터로 저장 시도
      // cleanup에서는 await를 사용할 수 없으므로,
      // 내부에서 처리하되 완료를 보장할 수 없음
      performFinalSave();
    };
  }, [enabled, prospectId]);

  // UI에서 값을 보여줘야 한다면 state를 추가해야 하지만,
  // 백그라운드 트래킹 용도라면 아무것도 반환하지 않거나 ref만 반환해도 됩니다.
  return { sessionId };
}
