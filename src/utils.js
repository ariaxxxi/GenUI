const _appBase = window.location.pathname.match(/^(.*\/apps\/[^/]+\/)/)?.[1] ?? '/';

/**
 * Get the base URL path for the application.
 * Works with Serval's /apps/<instanceId>/ deployment pattern.
 * @returns {string} Base path (e.g., '/apps/abc123/' or '/')
 */
export function getAppBase() { return _appBase; }

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Build a full URL for an API endpoint.
 * Automatically handles Serval's subpath deployment.
 * @param {string} path - API path (e.g., 'api/tts')
 * @returns {string} Full URL path
 */
export function apiUrl(path) {
  return `${getAppBase()}${path}`;
}