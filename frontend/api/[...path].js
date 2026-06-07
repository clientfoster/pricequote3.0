export default async function handler(req, res) {
  const backendBaseUrl = process.env.BACKEND_API_URL;

  if (!backendBaseUrl) {
    res.status(500).json({
      message: 'BACKEND_API_URL is not configured for the frontend deployment.',
    });
    return;
  }

  const pathValue = req.query?.path;
  const routePath = Array.isArray(pathValue) ? pathValue.join('/') : String(pathValue || '');
  const targetUrl = new URL(routePath, backendBaseUrl.endsWith('/') ? backendBaseUrl : `${backendBaseUrl}/`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (!value) continue;
    const lowerKey = key.toLowerCase();
    if (['host', 'content-length'].includes(lowerKey)) continue;
    if (Array.isArray(value)) {
      headers.set(key, value.join(','));
    } else {
      headers.set(key, value);
    }
  }

  const method = req.method || 'GET';
  const bodyMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  const rawBody = bodyMethods.has(method) ? (req.body ?? await readRequestBody(req)) : undefined;
  const body =
    rawBody && typeof rawBody === 'object' && !(rawBody instanceof Buffer) ? JSON.stringify(rawBody) : rawBody;

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
  });

  res.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return;
    res.setHeader(key, value);
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await response.json();
    res.json(json);
    return;
  }

  const text = await response.text();
  res.send(text);
}

async function readRequestBody(req) {
  if (req.body && typeof req.body === 'string') {
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
