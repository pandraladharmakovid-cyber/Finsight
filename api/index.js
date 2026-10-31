import app from '../backend/src/app.js';

// Vercel can invoke the function with either the original URL or the rewrite
// destination. In the latter case, recover the API path without losing the
// caller's query parameters. Do not interpret this parameter on other paths.
export function restoreApiUrl(requestUrl) {
  const url = new URL(requestUrl || '/', 'http://localhost');
  const isFunctionPath = ['/api', '/api/index', '/api/index.js'].includes(url.pathname);
  const rewrittenPath = url.searchParams.get('__finsight_path');

  if (!isFunctionPath || rewrittenPath === null) return requestUrl;

  url.searchParams.delete('__finsight_path');
  const path = rewrittenPath.replace(/^\/+/, '');
  return `/api/${path}${url.search}`;
}

export default function handler(req, res) {
  req.url = restoreApiUrl(req.url);
  return app(req, res);
}
