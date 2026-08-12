export function validateAndParseUrl(url: string, serviceName: string): URL {
  if (!url || typeof url !== 'string' || url.trim() === '' || url.includes('undefined') || url.includes('null')) {
    throw new Error(`[${serviceName}] Invalid URL string: "${url}"`);
  }
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`[${serviceName}] Invalid protocol "${parsed.protocol}" in URL "${url}"`);
    }
    return parsed;
  } catch (err: any) {
    throw new Error(`[${serviceName}] URL Validation Error for "${url}": ${err.message}`);
  }
}

export async function loggedFetch(
  serviceName: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const parsedUrl = validateAndParseUrl(url, serviceName);
  const hostOnly = parsedUrl.hostname;
  const method = (options.method || 'GET').toUpperCase();
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();

  console.log(`[${serviceName}] REQUEST START`, {
    service: serviceName,
    host: hostOnly,
    method,
    startTime: startTimeIso,
  });

  try {
    const response = await fetch(url, options);
    const endTime = Date.now();
    const endTimeIso = new Date(endTime).toISOString();

    console.log(`[${serviceName}] REQUEST END`, {
      service: serviceName,
      host: hostOnly,
      method,
      startTime: startTimeIso,
      endTime: endTimeIso,
      durationMs: endTime - startTime,
      status: response.status,
      statusText: response.statusText,
      success: response.ok,
    });

    return response;
  } catch (error: any) {
    const endTime = Date.now();
    const endTimeIso = new Date(endTime).toISOString();

    console.error(`[${serviceName}] FETCH FAILED`, {
      service: serviceName,
      host: hostOnly,
      method,
      startTime: startTimeIso,
      endTime: endTimeIso,
      durationMs: endTime - startTime,
      success: false,
      name: error?.name,
      message: error?.message,
      code: error?.cause?.code,
      errno: error?.cause?.errno,
      syscall: error?.cause?.syscall,
      hostname: error?.cause?.hostname,
      address: error?.cause?.address,
      port: error?.cause?.port,
      cause: error?.cause,
      stack: error?.stack,
    });

    throw error;
  }
}
