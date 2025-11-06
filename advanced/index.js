import { fetchAllDetails } from "./fetchAllDetails.js";

function parseUrls(arg) {
  try {
    const parsed = JSON.parse(arg);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed;
    }
  } catch {}
  return arg
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const [concurrencyArg, urlsArg] = process.argv.slice(2);

  if (!concurrencyArg || !urlsArg) {
    console.error("Usage: node index.js <maxConcurrency> '<urls>'");
    console.error("  <maxConcurrency>: integer >= 1");
    console.error("  <urls>: JSON array OR comma-separated list");
    console.error("");
    console.error("Examples:");
    console.error("  node index.js 2 https://example.com,https://google.com");
    console.error(
      '  node index.js 3 \'["https://example.com","https://google.com"]\''
    );
    console.error("");
    process.exit(1);
  }

  const maxConcurrency = Number(concurrencyArg);
  const urls = parseUrls(urlsArg);

  if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
    console.error("Error: <maxConcurrency> must be an integer >= 1.");
    process.exit(1);
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    console.error("Error: <urls> must be a non-empty list of URLs.");
    process.exit(1);
  }

  try {
    const results = await fetchAllDetails(urls, {
      maxConcurrency,
      timeoutMs: 10_000,
    });

    results.forEach((r, i) => {
      const url = urls[i];

      if (!r.ok) {
        console.log(`[${i}] ❌  ${url}  ->  ERROR: ${r.error || r.statusCode}`);
        return;
      }

      const preview =
        typeof r.response === "string"
          ? r.response
          : JSON.stringify(r.response);

      console.log(
        `[${i}] ✅  ${url}  (status: ${r.statusCode}, ${r.elapsedMs}ms) -> ${preview}`
      );
    });
  } catch (err) {
    console.error("Error running fetchAllDetails:", err?.message || err);
    console.error("");
    process.exit(1);
  }
}

main();
