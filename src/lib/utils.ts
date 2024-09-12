import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(from: Date): string {
  const currentDate = new Date();
  const timeDifference = currentDate.getTime() - from.getTime();

  // 24時間以内の場合
  if (timeDifference < ONE_DAY_IN_MS) {
    return formatDistanceToNowStrict(from, { addSuffix: true, locale: ja });
  }

  // 同じ年の場合
  if (currentDate.getFullYear() === from.getFullYear()) {
    return format(from, "MM月dd日", { locale: ja });
  }

  // 異なる年の場合
  return format(from, "yyyy年MM月dd日", { locale: ja });
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
