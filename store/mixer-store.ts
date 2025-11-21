/**
 * @file mixer-store.ts
 * @description 인사이트 믹서 전역 상태 관리
 *
 * Zustand를 사용하여 Custom Context와 Drag State를 전역 관리합니다.
 * DEV_GUIDE.md의 인사이트 믹서 구현 가이드를 따릅니다.
 */

import { create } from 'zustand';

/**
 * Mixer 전역 상태 인터페이스
 */
interface MixerState {
  /** 나만의 무기 (Custom Context) 텍스트 */
  customContext: string;
  /** Custom Context 업데이트 함수 */
  setCustomContext: (text: string) => void;
  /** 드래그 중인지 여부 */
  isDragging: boolean;
  /** 드래그 상태 업데이트 함수 */
  setIsDragging: (value: boolean) => void;
}

/**
 * Mixer 전역 상태 스토어
 * 
 * 사용 예시:
 * ```tsx
 * const { customContext, setCustomContext, isDragging, setIsDragging } = useMixerStore();
 * ```
 */
export const useMixerStore = create<MixerState>((set) => ({
  customContext: '',
  setCustomContext: (text: string) => set({ customContext: text }),
  isDragging: false,
  setIsDragging: (value: boolean) => set({ isDragging: value }),
}));


