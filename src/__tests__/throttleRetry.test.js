import { describe, it, expect } from "vitest";
import { shortThrottleWaitMs } from "@/throttleRetry";

describe("shortThrottleWaitMs", () => {
    it("waits out the semantic search throttle (body retryAfter: 1)", () => {
        expect(shortThrottleWaitMs({ status: 429, data: { retryAfter: 1 }, headers: {} })).toBe(1000);
    });
    it("reads the Retry-After header when the body has none", () => {
        expect(shortThrottleWaitMs({ status: 429, data: {}, headers: { "retry-after": "1" } })).toBe(1000);
    });
    it("waits at least a quarter second", () => {
        expect(shortThrottleWaitMs({ status: 429, data: { retryAfter: 0 }, headers: {} })).toBe(250);
    });
    it("doesn't wait out the daily credit limit (Retry-After until midnight)", () => {
        expect(shortThrottleWaitMs({ status: 429, data: {}, headers: { "retry-after": "40000" } })).toBeNull();
    });
    it("doesn't retry a 429 that gives no Retry-After", () => {
        expect(shortThrottleWaitMs({ status: 429, data: {}, headers: {} })).toBeNull();
    });
    it("ignores everything but 429", () => {
        expect(shortThrottleWaitMs({ status: 400, data: { retryAfter: 1 }, headers: {} })).toBeNull();
        expect(shortThrottleWaitMs(undefined)).toBeNull();
    });
});
