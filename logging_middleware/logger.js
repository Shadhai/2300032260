const LOG_ENDPOINT = 'http://4.224.186.213/evaluation-service/logs';

let bearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMzAwMDMyMjYwY3NlQGdtYWlsLmNvbSIsImV4cCI6MTc4MDEyODIxOCwiaWF0IjoxNzgwMTI3MzE4LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiYzNiMWM0MmQtNzM2Zi00MzBiLThmNDctNjY3YmY3MjZmNTA3IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicCBqb3NlcGgiLCJzdWIiOiI2MDEzN2Y0NS0wZDE4LTQxZTEtYTRlOS1lM2UyOTlkYWIyYzUifSwiZW1haWwiOiIyMzAwMDMyMjYwY3NlQGdtYWlsLmNvbSIsIm5hbWUiOiJwIGpvc2VwaCIsInJvbGxObyI6IjIzMDAwMzIyNjAiLCJhY2Nlc3NDb2RlIjoiQXZyQUFLIiwiY2xpZW50SUQiOiI2MDEzN2Y0NS0wZDE4LTQxZTEtYTRlOS1lM2UyOTlkYWIyYzUiLCJjbGllbnRTZWNyZXQiOiJRSHJFV1ZFSGZiY1JDSFJ1In0.pVOVFgQaB3zb1UoninTPHGuDz8f8EMA-XD0t7wYNbP8";
export function configureToken(token) {
  bearerToken = token;
}

export async function log(stack, level, pkg, message) {
  if (!bearerToken) {
    console.error('Token missing');
    return;
  }

  const payload = {
    stack: stack,
    level: level,
    package: pkg,
    message: message
  };

  try {
    const res = await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();
    
    if (res.ok) {
      console.log(`Log OK: [${stack}][${level}][${pkg}] ${message}`);
    } else {
      console.error(`Log failed [${res.status}]: ${responseText}`);
    }
  } catch (err) {
    console.error(`Log error: ${err.message}`);
  }
}

export function buildLogger(stack, pkg) {
  return {
    debug: (msg) => log(stack, 'debug', pkg, msg),
    info: (msg) => log(stack, 'info', pkg, msg),
    warn: (msg) => log(stack, 'warn', pkg, msg),
    error: (msg) => log(stack, 'error', pkg, msg),
    fatal: (msg) => log(stack, 'fatal', pkg, msg)
  };
}