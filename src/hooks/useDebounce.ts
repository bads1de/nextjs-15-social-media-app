import { useEffect, useState } from "react";

/**
 * useDebounceフックを使用すると、値をデバウンスできます。
 * これは、値が最後に更新されるようにスケジュールされてから指定された遅延が経過するまで、値の更新を遅らせます。
 * これは、テキストフィールドに入力する場合など、ユーザーが値の変更を停止するまで値の更新を遅らせるのに役立ちます。
 *
 * @param value デバウンスする値。
 * @param delay 遅延させるミリ秒数。デフォルトは250ミリ秒です。
 * @returns デバウンスされた値。
 */

export default function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
