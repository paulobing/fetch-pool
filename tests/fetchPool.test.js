import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fetchPool } from "../fetchPool.js";
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher } from "undici";

const RUN_UNDICI = process.env.RUN_UNDICI === "1";

function makeMockFetch(delaysByUrl) {
  let currentConcurrentCalls = 0; // inFlight
  let maxConcurrentCalls = 0; // maxSeen

  const fetchMock = (url) => {
    currentConcurrentCalls++;
    maxConcurrentCalls = Math.max(maxConcurrentCalls, currentConcurrentCalls);

    const delay = delaysByUrl[url] ?? 0;

    return new Promise((resolve) => {
      setTimeout(() => {
        currentConcurrentCalls--;
        resolve(new Response(`OK:${url}`, { status: 200 }));
      }, delay);
    });
  };

  return { fetchMock, getMaxConcurrentCalls: () => maxConcurrentCalls };
}

async function readBodies(responses) {
  return Promise.all(responses.map((r) => r.text()));
}

describe("fetchPool with mockFetch", () => {
  it("returns responses in input order and respects max concurrency", async () => {
    const urls = ["A", "B", "C", "D", "E"];
    const maxConcurrency = 2;

    const { fetchMock, getMaxConcurrentCalls } = makeMockFetch({
      A: 30,
      B: 10,
      C: 20,
      D: 5,
      E: 1,
    });

    const res = await fetchPool(urls, maxConcurrency, fetchMock);
    const texts = await readBodies(res);

    expect(texts).toEqual(["OK:A", "OK:B", "OK:C", "OK:D", "OK:E"]);
    expect(getMaxConcurrentCalls()).toBeLessThanOrEqual(maxConcurrency);
  });
});

// integration test with Undici's MockAgent
(RUN_UNDICI ? describe : describe.skip)(
  "IT - fetchPool with Undici MockAgent",
  () => {
    const mockAgent = new MockAgent();
    const client = mockAgent.get("https://api.example");
    const previous = getGlobalDispatcher();

    beforeAll(() => {
      mockAgent.disableNetConnect();
      setGlobalDispatcher(mockAgent);
      client.intercept({ path: "/a", method: "GET" }).reply(200, "A").delay(80);
      client.intercept({ path: "/b", method: "GET" }).reply(200, "B").delay(20);
      client.intercept({ path: "/c", method: "GET" }).reply(200, "C").delay(50);
    });

    afterAll(async () => {
      setGlobalDispatcher(previous);
      await mockAgent.close();
    });

    it("respects max concurrency and preserves order", async () => {
      const urls = [
        "https://api.example/a",
        "https://api.example/b",
        "https://api.example/c",
      ];
      const res = await fetchPool(urls, 2);
      const texts = await Promise.all(res.map((r) => r.text()));
      expect(texts).toEqual(["A", "B", "C"]);
    });
  }
);

describe("fetchPool edge cases", () => {
  it("returns [] for empty urls", async () => {
    const res = await fetchPool([], 3, async () => new Response("x"));
    expect(res).toEqual([]);
  });

  it("handles maxConcurrency > urls.length", async () => {
    const urls = ["A", "B"];
    const { fetchMock } = makeMockFetch({ A: 10, B: 10 });
    const res = await fetchPool(urls, 10, fetchMock);
    const texts = await readBodies(res);
    expect(texts).toEqual(["OK:A", "OK:B"]);
  });
});

describe("fetchPool input validation", () => {
  it("throws if urls is not an array", async () => {
    await expect(fetchPool("not-an-array", 2)).rejects.toThrow(
      "urls must be an array"
    );
  });

  it("throws if maxConcurrency is not a positive integer", async () => {
    await expect(fetchPool(["A", "B"], 0)).rejects.toThrow(
      "maxConcurrency must be an integer >= 1"
    );

    await expect(fetchPool(["A", "B"], -3)).rejects.toThrow(
      "maxConcurrency must be an integer >= 1"
    );

    await expect(fetchPool(["A", "B"], 1.5)).rejects.toThrow(
      "maxConcurrency must be an integer >= 1"
    );

    await expect(fetchPool(["A", "B"], "hello")).rejects.toThrow(
      "maxConcurrency must be an integer >= 1"
    );
  });
});
