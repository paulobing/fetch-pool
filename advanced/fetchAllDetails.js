function withTimeout(ms, parentSignal) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new Error("timeout")), ms);

  const onParentAbort = () => controller.abort(parentSignal.reason);
  parentSignal?.addEventListener?.("abort", onParentAbort, { once: true });

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(id);
      parentSignal?.removeEventListener?.("abort", onParentAbort);
    },
  };
}

async function fetchOne(url, { timeoutMs, fetchOptions }) {
  const startedAt = Date.now();
  const { signal, cleanup } = withTimeout(timeoutMs, fetchOptions?.signal);

  try {
    const res = await fetch(url, { ...fetchOptions, signal });
    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json")
      ? await res.json()
      : await res.text();

    return {
      ok: res.ok,
      url,
      statusCode: res.status,
      response: body,
      headers: Object.fromEntries(res.headers.entries()),
      elapsedMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      ok: false,
      url,
      statusCode: null,
      error: err?.message || String(err),
      elapsedMs: Date.now() - startedAt,
    };
  } finally {
    cleanup();
  }
}

/**
 * Concurrency-limited batch fetch with per-request timeout.
 *
 * @param {string[]} urls
 * @param {object}   opts
 * @param {number}   opts.maxConcurrency  how many requests in flight (>=1)
 * @param {number}   opts.timeoutMs       per-request timeout in ms
 * @param {object}   opts.fetchOptions    passed through to fetch()
 * @returns {Promise<Array<{url:string, ok:boolean, statusCode:number|null, response?:any, error?:string, headers?:Record<string,string>, elapsedMs:number}>>}
 */
export async function fetchAllDetails(
  urls,
  { maxConcurrency = 6, timeoutMs = 10_000, fetchOptions = {} } = {}
) {
  if (!Array.isArray(urls) || urls.length === 0)
    throw new Error("urls must be a non-empty array");
  if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1)
    throw new Error("maxConcurrency must be >= 1");

  const results = new Array(urls.length);
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= urls.length) break;
      results[i] = await fetchOne(urls[i], { timeoutMs, fetchOptions });
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrency, urls.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
