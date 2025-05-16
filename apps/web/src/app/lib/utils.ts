import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a throttled function that only invokes func at most once per
 * specified wait period.
 *
 * @param func The function to throttle
 * @param wait The number of milliseconds to throttle invocations to
 * @returns A new, throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall < wait) return;
    lastCall = now;
    return func(...args);
  };
}
