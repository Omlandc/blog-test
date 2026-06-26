/**
 * 多站点控制台
 *
 * 主仓 = dispatcher，登录后展示子仓卡片。
 * 点子仓"管理" → 生成 HMAC token，跳转子仓 + ?admin_token=xxx
 * 子仓验证 token → 自动启用 admin 模式
 *
 * 安全说明：
 * - HMAC secret 是对称密钥，主仓和子仓共用
 * - token 时效 5 分钟，防重放
 * - secret 在生产环境应该从 env 注入；demo 场景可以 hardcode
 * - 主仓 secret 通过环境变量 VITE_ADMIN_TOKEN_SECRET 注入
 * - 子仓 secret 通过同样的环境变量（必须与主仓一致）注入
 */

// 注：sites-console.ts 独立于 sites-yaml（不需要 YAML 解析）
// sites-yaml 是 flush-queue.mjs 和 AdminSitesPage 用的 YAML 文本解析
// sites-console 是控制台 hardcoded 子仓列表
// 两个文件是平行不重叠的

export interface ConsoleSite {
  id: string;
  name: string;
  description?: string;
  /** 子仓前台 URL（用户访问的地址） */
  url: string;
  /** 子仓 GitHub Pages URL（备份地址） */
  githubUrl?: string;
  /** 子仓 GitHub repo URL（看代码用） */
  repoUrl: string;
  /** 自定义主题（可选） */
  look?: string;
}

/** 从 sites.yaml 提取给控制台用的子仓列表 */
export function getConsoleSites(): ConsoleSite[] {
  // 用动态 import 避开 SSR / build-time 评估
  // 实际数据来自 sites.yaml（在主仓根目录）
  // 子仓不需要这个文件，所以用 fetch 读 raw
  // 但控制台是运行时构建的，可以在打包时直接读
  // 这里用静态导入（仅主仓 build 时有效）
  return HARDCODED_SITES;
}

/**
 * 内置子仓列表（hardcoded，加新子仓改这里）
 *
 * 加新子仓时填：
 *  - id: 子仓 repo 名（必填）
 *  - name: 显示名
 *  - description: 描述
 *  - url: 子仓前台 URL（CF Pages / 自定义域名 / GitHub Pages）
 *  - githubUrl: GitHub Pages 备用 URL
 *  - repoUrl: GitHub repo URL
 */
const HARDCODED_SITES: ConsoleSite[] = [
  {
    id: 'blog-test',
    name: 'Blog Test 站点',
    description: '多站点架构验证仓，初始 demo',
    url: 'https://blog-test-df5.pages.dev/',
    githubUrl: 'https://Omlandc.github.io/blog-test/',
    repoUrl: 'https://github.com/Omlandc/blog-test',
  },
];

/** HMAC secret（demo 用，生产环境用 env） */
const ADMIN_TOKEN_SECRET =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_ADMIN_TOKEN_SECRET) ||
  'blog-system-admin-token-2026';

/**
 * 生成子仓 admin token
 *
 * token = base64url(payload) + '.' + base64url(HMAC-SHA256(secret, payload))
 * payload = JSON.stringify({ sub, exp })
 */
export async function generateAdminToken(subId: string): Promise<string> {
  const exp = Date.now() + 5 * 60 * 1000; // 5 分钟
  const payload = JSON.stringify({ sub: subId, exp });
  const payloadB64 = base64urlEncode(payload);
  const sig = await hmacSign(payload, ADMIN_TOKEN_SECRET);
  return `${payloadB64}.${sig}`;
}

/**
 * 验证 token（在子仓里用）
 *
 * 返回 true = 有效；false = 无效或过期
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return false;
    const payload = base64urlDecode(payloadB64);
    const expectedSig = await hmacSign(payload, ADMIN_TOKEN_SECRET);
    if (sig !== expectedSig) return false;
    const { exp } = JSON.parse(payload);
    if (typeof exp !== 'number') return false;
    return Date.now() < exp;
  } catch {
    return false;
  }
}

/** 从 token 里读出 subId（不验证，仅用于显示） */
export function peekAdminTokenSub(token: string): string | null {
  try {
    const [payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const payload = base64urlDecode(payloadB64);
    const { sub } = JSON.parse(payload);
    return typeof sub === 'string' ? sub : null;
  } catch {
    return null;
  }
}

// ────────────── helpers ──────────────

async function hmacSign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return base64urlEncodeBytes(new Uint8Array(sig));
}

function base64urlEncode(s: string): string {
  return base64urlEncodeBytes(new TextEncoder().encode(s));
}

function base64urlEncodeBytes(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (padded.length % 4)) % 4;
  const bin = atob(padded + '='.repeat(padding));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}