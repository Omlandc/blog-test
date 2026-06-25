/**
 * 安全写入 localStorage —— 处理 QuotaExceededError
 *
 * 背景：
 * - localStorage 通常有 5-10MB 配额
 * - 单篇文章 + 配图 + analytics 事件很容易超
 * - 原代码 try { setItem } catch {} 静默失败，用户以为保存了但实际丢了
 *
 * 用法：
 *   const result = safeSetItem('blog-system:articles', JSON.stringify(data));
 *   if (!result.ok) toast.danger('存储空间不足', { description: result.message });
 */
export interface SafeWriteResult {
  ok: boolean;
  /** 写入前的字节数（成功时） */
  bytesWritten?: number;
  /** 失败时的错误信息 */
  message?: string;
  /** 失败时的错误类型 */
  errorKind?: 'quota' | 'unavailable' | 'unknown';
}

export function safeSetItem(key: string, value: string): SafeWriteResult {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ok: false, errorKind: 'unavailable', message: 'localStorage 不可用' };
  }
  try {
    window.localStorage.setItem(key, value);
    return { ok: true, bytesWritten: value.length };
  } catch (err) {
    const e = err as DOMException;
    if (
      e?.name === 'QuotaExceededError' ||
      e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e?.code === 22 ||
      e?.code === 1014
    ) {
      return {
        ok: false,
        errorKind: 'quota',
        message: `localStorage 空间不足（当前 key "${key}" 写不进去）。建议清理浏览器数据或减少内容。`,
      };
    }
    return {
      ok: false,
      errorKind: 'unknown',
      message: `写入失败: ${e?.message ?? String(err)}`,
    };
  }
}

/** 估算 localStorage 剩余空间（粗略） */
export function estimateRemainingBytes(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  let used = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k) {
      const v = window.localStorage.getItem(k) ?? '';
      used += k.length + v.length;
    }
  }
  // 多数浏览器上限是 5MB (5 * 1024 * 1024)
  return Math.max(0, 5 * 1024 * 1024 - used);
}
