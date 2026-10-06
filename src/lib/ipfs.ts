export const IPFS_GATEWAY = 'https://cdn.kleros.link';

const GATEWAY_IPFS_PREFIX = `${IPFS_GATEWAY}/ipfs/`;

/**
 * Normalize the IPFS URI formats found in Kleros metaEvidence, evidence and API responses into a
 * Kleros gateway URL:
 * - `/ipfs/<cid>/...`, `ipfs/<cid>/...` and bare `<cid>/...` paths
 * - `ipfs://<cid>/...` (also the non-standard `ipfs://ipfs/<cid>/...`)
 * - `http(s)://<any gateway>/ipfs/<cid>/...`, rewritten to the Kleros gateway
 * Other http(s) URLs are returned unchanged. Any other scheme (e.g. `javascript:`) returns null.
 */
export function toIpfsGatewayUrl(uri: string | null | undefined): string | null {
  const value = uri?.trim();
  if (!value) return null;

  if (value.startsWith('ipfs://')) {
    return GATEWAY_IPFS_PREFIX + value.slice('ipfs://'.length).replace(/^ipfs\//, '');
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const match = url.pathname.match(/^\/ipfs\/(.+)$/);
      return match ? GATEWAY_IPFS_PREFIX + match[1] + url.search : value;
    } catch {
      return null;
    }
  }

  // Any other scheme is rejected.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;

  return GATEWAY_IPFS_PREFIX + value.replace(/^\/?(ipfs\/)?/, '');
}

/**
 * True when the URL points to content-addressed data on the Kleros IPFS gateway. Checks the parsed
 * origin and canonical path, so dot segments cannot resolve outside `/ipfs/<cid>`.
 */
export function isIpfsGatewayUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.origin === IPFS_GATEWAY && /^\/ipfs\/[^/]+/.test(parsed.pathname);
  } catch {
    return false;
  }
}
