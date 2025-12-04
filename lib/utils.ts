import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 시간 포맷 헬퍼 (초 → "Xm Ys" 형식)
 */
export function formatDuration(seconds: number): { minutes: number; seconds: number } {
  return {
    minutes: Math.floor(seconds / 60),
    seconds: seconds % 60,
  };
}
