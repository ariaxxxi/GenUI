/**
 * Get the base URL path for the application.
 * Works with Serval's /apps/<instanceId>/ deployment pattern.
 * @returns {string} Base path (e.g., '/apps/abc123/' or '/')
 */
export function getAppBase() {
  const m = window.location.pathname.match(/^(.*\/apps\/[^/]+\/)/);
  return m ? m[1] : '/';
}

/**
 * Build a full URL for an API endpoint.
 * Automatically handles Serval's subpath deployment.
 * @param {string} path - API path (e.g., 'api/tts')
 * @returns {string} Full URL path
 */
export function apiUrl(path) {
  return `${getAppBase()}${path}`;
}