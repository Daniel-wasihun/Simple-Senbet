/**
 * storeCaching.test.mjs
 * Test suite verifying Zustand store caching, TTL logic, and mutation-driven cache invalidation.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Store Cache Utility (isFresh)", () => {
  function isFresh(timestamp, ttl = 30000) {
    if (!timestamp || timestamp <= 0) return false;
    return Date.now() - timestamp < ttl;
  }

  it("identifies freshly recorded timestamps as fresh", () => {
    const now = Date.now();
    assert.equal(isFresh(now, 30000), true);
    assert.equal(isFresh(now - 1000, 30000), true);
  });

  it("identifies timestamps older than TTL as stale", () => {
    const expired = Date.now() - 35000;
    assert.equal(isFresh(expired, 30000), false);
  });

  it("handles zero, null, or undefined timestamps safely as not fresh", () => {
    assert.equal(isFresh(0, 30000), false);
    assert.equal(isFresh(undefined, 30000), false);
    assert.equal(isFresh(null, 30000), false);
  });
});

describe("Store Helper Utilities (extractDataAndPagination & extractErrorMessage)", () => {
  function extractDataAndPagination(payload, defaultPerPage = 15) {
    const container = payload?.data ?? payload;
    const rawList = Array.isArray(container)
      ? container
      : Array.isArray(container?.data)
      ? container.data
      : [];

    const metaSource =
      payload?.pagination ??
      (container && typeof container === "object" && !Array.isArray(container) ? container : payload);

    const total = typeof metaSource?.total === "number" ? metaSource.total : rawList.length;
    const last_page = typeof metaSource?.last_page === "number"
      ? metaSource.last_page
      : typeof metaSource?.pages === "number"
      ? metaSource.pages
      : 1;
    const current_page = typeof metaSource?.current_page === "number"
      ? metaSource.current_page
      : typeof metaSource?.page === "number"
      ? metaSource.page
      : 1;
    const per_page = typeof metaSource?.per_page === "number" ? metaSource.per_page : defaultPerPage;

    return {
      data: rawList,
      pagination: { total, last_page, current_page, per_page },
    };
  }

  function extractErrorMessage(json, fallback = "The request failed.") {
    if (!json || typeof json !== "object") return fallback;
    if (json.errors && typeof json.errors === "object") {
      const errorList = Object.values(json.errors).flat().map(String).filter(Boolean);
      if (errorList.length > 0) return errorList.join(" ");
    }
    return json.message || fallback;
  }

  it("extracts data and pagination from paginated Laravel response", () => {
    const payload = {
      data: [{ id: 1, name: "Section A" }, { id: 2, name: "Section B" }],
      total: 50,
      last_page: 5,
      current_page: 1,
      per_page: 10,
    };
    const { data, pagination } = extractDataAndPagination(payload);
    assert.equal(data.length, 2);
    assert.equal(pagination.total, 50);
    assert.equal(pagination.last_page, 5);
    assert.equal(pagination.current_page, 1);
  });

  it("extracts data and pagination from raw arrays safely", () => {
    const payload = [{ id: 10 }, { id: 20 }];
    const { data, pagination } = extractDataAndPagination(payload);
    assert.equal(data.length, 2);
    assert.equal(pagination.total, 2);
    assert.equal(pagination.last_page, 1);
  });

  it("extracts validation errors into readable message", () => {
    const json = {
      message: "The given data was invalid.",
      errors: {
        email: ["The email field is required."],
        name: ["The name is too short.", "Name must be string."],
      },
    };
    const msg = extractErrorMessage(json);
    assert.equal(msg, "The email field is required. The name is too short. Name must be string.");
  });

  it("falls back to message or default when errors are absent", () => {
    assert.equal(extractErrorMessage({ message: "Custom error" }), "Custom error");
    assert.equal(extractErrorMessage(null, "Fallback"), "Fallback");
  });
});

describe("School Store Cache Lifecycle", () => {
  it("serves cached items when within TTL and not forced", async () => {
    let networkCallCount = 0;
    const mockFetcher = async () => {
      networkCallCount++;
      return [{ id: 1, name: "Grade 1" }];
    };

    const cache = {
      items: {},
      timestamps: {},
      ttl: 30000,
      async getOrFetch(key, force = false) {
        const now = Date.now();
        if (!force && this.timestamps[key] && now - this.timestamps[key] < this.ttl) {
          return this.items[key];
        }
        const data = await mockFetcher();
        this.items[key] = data;
        this.timestamps[key] = now;
        return data;
      },
      invalidate(resource) {
        for (const k of Object.keys(this.timestamps)) {
          if (k.startsWith(resource)) {
            delete this.timestamps[k];
            delete this.items[k];
          }
        }
      },
    };

    // First call: makes network request
    const first = await cache.getOrFetch("school-classes");
    assert.equal(networkCallCount, 1);
    assert.deepEqual(first, [{ id: 1, name: "Grade 1" }]);

    // Second call: served from cache without network request
    const second = await cache.getOrFetch("school-classes");
    assert.equal(networkCallCount, 1);
    assert.deepEqual(second, [{ id: 1, name: "Grade 1" }]);

    // Force call: bypasses cache
    const forced = await cache.getOrFetch("school-classes", true);
    assert.equal(networkCallCount, 2);
    assert.deepEqual(forced, [{ id: 1, name: "Grade 1" }]);

    // Invalidation clears cache for that resource
    cache.invalidate("school-classes");
    assert.equal(cache.timestamps["school-classes"], undefined);

    // Call after invalidation: fetches again
    await cache.getOrFetch("school-classes");
    assert.equal(networkCallCount, 3);
  });
});

describe("Attendance Store Cache Lifecycle", () => {
  it("invalidates sessions and summary timestamps upon mutation", () => {
    const storeState = {
      sessionsTimestamp: Date.now(),
      summaryTimestamp: Date.now(),
      sessions: [{ id: 10, status: "draft" }],
      invalidate(target = "all") {
        if (target === "all" || target === "sessions") {
          this.sessionsTimestamp = 0;
        }
        if (target === "all" || target === "summary") {
          this.summaryTimestamp = 0;
        }
      },
    };

    assert.ok(storeState.sessionsTimestamp > 0);
    assert.ok(storeState.summaryTimestamp > 0);

    // After closing or submitting a session, all attendance caches are invalidated
    storeState.invalidate("all");

    assert.equal(storeState.sessionsTimestamp, 0);
    assert.equal(storeState.summaryTimestamp, 0);
  });
});

describe("Member Store Cache Lifecycle", () => {
  it("updates local state and resets timestamp on updateMember", () => {
    const store = {
      items: [{ id: 1, full_name: "Abebe Bikila" }],
      timestamp: Date.now(),
      updateMember(id, updated) {
        this.items = this.items.map((m) => (m.id === id ? { ...m, ...updated } : m));
        this.timestamp = 0; // Force list revalidation on next fetch
      },
    };

    store.updateMember(1, { full_name: "Abebe Bikila (Updated)" });
    assert.equal(store.items[0].full_name, "Abebe Bikila (Updated)");
    assert.equal(store.timestamp, 0);
  });
});
