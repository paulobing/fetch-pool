export async function fetchPool(urls, maxConcurrency, fetchFn = fetch) {
  if (!Array.isArray(urls)) {
    throw new Error("urls must be an array");
  }
  if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
    throw new Error("maxConcurrency must be an integer >= 1");
  }

  const results = new Array(urls.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < urls.length) {
      const i = nextIndex++;
      results[i] = await fetchFn(urls[i]);
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrency, urls.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}
