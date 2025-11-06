import { fetchPool } from "./fetchPool.js";

function parseUrls(arg) {
  try {
    const parsed = JSON.parse(arg);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return arg
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const [concurrencyArg, urlsArg] = process.argv.slice(2);

  if (!concurrencyArg || !urlsArg) {
    console.error("😵‍💫 Usage: node index.js <maxConcurrency> '<urls>'");
    process.exit(1);
  }

  const maxConcurrency = Number(concurrencyArg);
  const urls = parseUrls(urlsArg);

  // ✅ Start timer
  const start = process.hrtime.bigint();

  const responses = await fetchPool(urls, maxConcurrency);

  // CLI only: preview bodies (not part of the core solution)
  const bodies = await Promise.all(responses.map((r) => r.text()));

  bodies.forEach((body, i) => {
    const preview = body;
    console.log(`[${i}] ${urls[i]} -> ${preview}`);
  });

  // ✅ End timer
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1_000_000;

  console.log(
    `\n⏱️  Done in ${ms.toFixed(2)} ms (concurrency = ${maxConcurrency})`
  );
}

main();
