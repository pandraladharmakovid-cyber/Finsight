const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

const DEFAULT_TIMEOUT = 15000;

export class ApiError extends Error {
  constructor(
    message,
    status = 0,
    data = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path) {
  if (!path) {
    return API_BASE_URL;
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  const base = API_BASE_URL.replace(
    /\/+$/,
    '',
  );

  const endpoint = path.replace(
    /^\/+/,
    '',
  );

  return `${base}/${endpoint}`;
}

async function parseResponse(response) {
  const contentType =
    response.headers.get(
      'content-type',
    ) || '';

  if (
    contentType.includes(
      'application/json',
    )
  ) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text =
      await response.text();

    return text || null;
  } catch {
    return null;
  }
}

function extractMessage(
  data,
  fallback,
) {
  if (
    typeof data === 'string' &&
    data.trim()
  ) {
    return data;
  }

  if (
    data?.message &&
    typeof data.message ===
      'string'
  ) {
    return data.message;
  }

  if (
    data?.error &&
    typeof data.error ===
      'string'
  ) {
    return data.error;
  }

  if (
    data?.errors &&
    Array.isArray(data.errors) &&
    data.errors.length
  ) {
    return data.errors
      .map((error) =>
        typeof error === 'string'
          ? error
          : error?.message,
      )
      .filter(Boolean)
      .join(', ');
  }

  return fallback;
}

export async function request(
  path,
  options = {},
) {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = DEFAULT_TIMEOUT,
    signal,
  } = options;

  const controller =
    new AbortController();

  let timeoutId;

  const handleAbort = () => {
    controller.abort();
  };

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener(
        'abort',
        handleAbort,
        { once: true },
      );
    }
  }

  timeoutId = setTimeout(
    () => controller.abort(),
    timeout,
  );

  const requestHeaders = {
    Accept:
      'application/json',
    ...headers,
  };

  let requestBody = body;

  if (
    body !== undefined &&
    body !== null &&
    typeof body !== 'string' &&
    !(body instanceof FormData)
  ) {
    requestBody =
      JSON.stringify(body);

    requestHeaders[
      'Content-Type'
    ] = 'application/json';
  }

  if (body instanceof FormData) {
    requestBody = body;
  }

  try {
    const response =
      await fetch(
        buildUrl(path),
        {
          method,
          headers:
            requestHeaders,
          body:
            method === 'GET' ||
            method === 'HEAD'
              ? undefined
              : requestBody,
          signal:
            controller.signal,
          credentials:
            'same-origin',
        },
      );

    const data =
      await parseResponse(
        response,
      );

    if (!response.ok) {
      throw new ApiError(
        extractMessage(
          data,
          `Request failed with status ${response.status}`,
        ),
        response.status,
        data,
      );
    }

    return data;
  } catch (error) {
    if (
      error instanceof ApiError
    ) {
      throw error;
    }

    if (
      error?.name ===
      'AbortError'
    ) {
      throw new ApiError(
        'The request timed out or was cancelled.',
        408,
      );
    }

    throw new ApiError(
      error?.message ||
        'Unable to connect to the FinSight API.',
      0,
      null,
    );
  } finally {
    clearTimeout(timeoutId);

    if (signal) {
      signal.removeEventListener(
        'abort',
        handleAbort,
      );
    }
  }
}

export function get(
  path,
  options = {},
) {
  return request(path, {
    ...options,
    method: 'GET',
  });
}

export function post(
  path,
  body,
  options = {},
) {
  return request(path, {
    ...options,
    method: 'POST',
    body,
  });
}

export function put(
  path,
  body,
  options = {},
) {
  return request(path, {
    ...options,
    method: 'PUT',
    body,
  });
}

export function patch(
  path,
  body,
  options = {},
) {
  return request(path, {
    ...options,
    method: 'PATCH',
    body,
  });
}

export function del(
  path,
  options = {},
) {
  return request(path, {
    ...options,
    method: 'DELETE',
  });
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export default {
  request,
  get,
  post,
  put,
  patch,
  del,
  getApiBaseUrl,
};