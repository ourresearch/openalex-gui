import { describe, it, expect } from "vitest";
import { oauthReturnUrlIsAllowed } from "@/oauthConsent";

describe("oauthReturnUrlIsAllowed (oxjob #1266)", () => {
    it("accepts our MCP deployments", () => {
        expect(oauthReturnUrlIsAllowed("https://mcp.openalex.org/oauth/callback")).toBe(true);
        expect(oauthReturnUrlIsAllowed("https://openalex-mcp-server.our-research.workers.dev/oauth/callback")).toBe(true);
        expect(oauthReturnUrlIsAllowed("https://openalex-mcp-server-production.our-research.workers.dev/oauth/callback")).toBe(true);
        expect(oauthReturnUrlIsAllowed("http://localhost:8788/oauth/callback")).toBe(true);
    });

    it("rejects anything else", () => {
        expect(oauthReturnUrlIsAllowed("https://evil.example/oauth/callback")).toBe(false);
        expect(oauthReturnUrlIsAllowed("https://mcp.openalex.org.evil.example/oauth/callback")).toBe(false);
        expect(oauthReturnUrlIsAllowed("https://mcp.openalex.org/somewhere-else")).toBe(false);
        expect(oauthReturnUrlIsAllowed("http://mcp.openalex.org/oauth/callback")).toBe(false);
        expect(oauthReturnUrlIsAllowed("https://user:pw@mcp.openalex.org/oauth/callback")).toBe(false);
        expect(oauthReturnUrlIsAllowed("javascript:alert(1)")).toBe(false);
        expect(oauthReturnUrlIsAllowed("/oauth/callback")).toBe(false);
        expect(oauthReturnUrlIsAllowed("")).toBe(false);
        expect(oauthReturnUrlIsAllowed(null)).toBe(false);
    });
});
