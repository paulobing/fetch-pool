# 🚦 Fetch Pool — Concurrency-Limited URL Fetching

This project implements a function that fetches a list of URLs while limiting how many requests run at the same time (**concurrency control**).

---

**Given**

- An array of URLs
- A `MAX_CONCURRENCY` integer

**Implement**

- A function that asynchronously fetches each URL
- **Never exceed** `MAX_CONCURRENCY` simultaneous requests
- Start new requests **as soon as possible**
- Return results **in the same order** as the input URLs

---

## 🎯 Objective

- **Input**
  - `MAX_CONCURRENCY` (integer)
  - Array of URLs
- **Behavior**
  - Run up to N requests at once (where N = max concurrency)
  - When a request finishes, immediately start the next one
- **Output**
  - Array of raw **Response** objects, **order preserved**

---

## 🛠 Requirements

- Node.js **18+** (global `fetch` included)

---

## ▶️ Usage (CLI)

Run the program directly with your own arguments:

```bash
npm start -- <maxConcurrency> '<urls>'
```

Or use the included demo scripts:

```bash
npm run demo:1     # same URLs, concurrency = 1
npm run demo:10    # same URLs, concurrency = 10
```

**Example (manual):**

```bash
npm start -- 3 '["https://example.com","https://httpbin.org/get"]'
```

_The demo scripts are defined in `package.json` under `"scripts"`._

---

## 🧪 Example Output (trimmed to first 3 responses)

```
[0] https://api.agify.io/?name=paulo -> {"count":61049,"name":"paulo","age":55}
[1] https://dog.ceo/api/breeds/image/random -> {"message":"https://images.dog.ceo/breeds/spitz-indian/Indian_Spitz.jpg","status":"success"}
[2] https://official-joke-api.appspot.com/jokes/random -> {"type":"programming","setup":"['hip', 'hip']","punchline":"(hip hip array)","id":26}

⏱️  Done in 754.75 ms (concurrency = 10)
```

---

## 🗂 Project Structure

```
fetchPool.js        ← primary implementation (simple / pure assignment version)
index.js            ← CLI runner
tests/              ← test suite (Vitest)

advanced/
  fetchAllDetails.js ← extended version (timeouts, metadata, etc.)
  index.js           ← CLI runner for the advanced version
```

---

## 🧪 Running Tests

Unit tests (mocked fetch, no network):

```bash
npm test
```

### Optional: Undici-based integration test

The Undici test simulates network responses **without hitting the real internet**.
It is **disabled by default** to keep test runs fast and isolated.

Run it explicitly **via npm script** (recommended):

```bash
npm run test:undici
```

Or with an environment variable:

```bash
RUN_UNDICI=1 npm test
```

If `RUN_UNDICI` is **not** set, the integration suite is skipped.

---

## ✨ Notes

- The main solution keeps things simple and returns raw `Response` objects (just like real `fetch`).
- The `advanced/` version adds optional robustness features like timeouts and body parsing.

---

## 👤 Author

**Paulo Bing**  
📧 paulo.bing@gmail.com  
🔗 https://linkedin.com/in/paulobing
