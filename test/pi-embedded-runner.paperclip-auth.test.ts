import { afterEach, describe, expect, it } from "vitest";
import {
  buildPaperclipRuntimeEnv,
  installPaperclipRuntimeEnv,
} from "../src/agents/pi-embedded-runner/run.paperclip-auth-test-utils.js";

describe("buildPaperclipRuntimeEnv", () => {
  const envKeys = [
    "PAPERCLIP_API_URL",
    "PAPERCLIP_RUN_ID",
    "PAPERCLIP_AGENT_ID",
    "PAPERCLIP_COMPANY_ID",
    "PAPERCLIP_API_KEY",
    "PAPERCLIP_AUTH_HEADER",
  ] as const;

  const snapshotPaperclipEnv = (env: Record<string, string | undefined>) => ({
    apiUrl: env.PAPERCLIP_API_URL,
    runId: env.PAPERCLIP_RUN_ID,
    agentId: env.PAPERCLIP_AGENT_ID,
    companyId: env.PAPERCLIP_COMPANY_ID,
    apiKey: env.PAPERCLIP_API_KEY,
    authHeader: env.PAPERCLIP_AUTH_HEADER,
  });

  afterEach(() => {
    for (const key of envKeys) {
      delete process.env[key];
    }
  });

  it("builds a fresh Paperclip auth env for a run", () => {
    const env = buildPaperclipRuntimeEnv({
      paperclipRuntimeAuth: {
        apiUrl: "http://127.0.0.1:3100/",
        runId: "run-research",
        agentId: "agent-research",
        companyId: "company-1",
        authToken: "fresh-research-token",
        authScheme: "bearer",
      },
    });

    expect(snapshotPaperclipEnv(env)).toEqual({
      apiUrl: "http://127.0.0.1:3100/",
      runId: "run-research",
      agentId: "agent-research",
      companyId: "company-1",
      apiKey: "fresh-research-token",
      authHeader: "bearer fresh-research-token",
    });
  });

  it("returns independent env snapshots for different runs", () => {
    const contentEnv = buildPaperclipRuntimeEnv({
      paperclipRuntimeAuth: {
        apiUrl: "http://127.0.0.1:3100/content",
        runId: "run-content",
        agentId: "agent-content",
        companyId: "company-content",
        authToken: "token-content",
        authScheme: "bearer",
      },
    });

    const cmoEnv = buildPaperclipRuntimeEnv({
      paperclipRuntimeAuth: {
        apiUrl: "http://127.0.0.1:3100/cmo",
        runId: "run-cmo",
        agentId: "agent-cmo",
        companyId: "company-content",
        authToken: "token-cmo",
        authScheme: "bearer",
      },
    });

    expect(snapshotPaperclipEnv(contentEnv)).toEqual({
      apiUrl: "http://127.0.0.1:3100/content",
      runId: "run-content",
      agentId: "agent-content",
      companyId: "company-content",
      apiKey: "token-content",
      authHeader: "bearer token-content",
    });

    expect(snapshotPaperclipEnv(cmoEnv)).toEqual({
      apiUrl: "http://127.0.0.1:3100/cmo",
      runId: "run-cmo",
      agentId: "agent-cmo",
      companyId: "company-content",
      apiKey: "token-cmo",
      authHeader: "bearer token-cmo",
    });
  });

  it("does not mutate process.env when building per-run Paperclip auth env", () => {
    process.env.PAPERCLIP_AUTH_HEADER = "Bearer original-token";
    process.env.PAPERCLIP_API_KEY = "original-token";
    process.env.PAPERCLIP_AGENT_ID = "agent-original";

    const built = buildPaperclipRuntimeEnv({
      paperclipRuntimeAuth: {
        apiUrl: "http://127.0.0.1:3100/content",
        runId: "run-content",
        agentId: "agent-content",
        companyId: "company-content",
        authToken: "token-content",
        authScheme: "bearer",
      },
    });

    expect(snapshotPaperclipEnv(built)).toEqual({
      apiUrl: "http://127.0.0.1:3100/content",
      runId: "run-content",
      agentId: "agent-content",
      companyId: "company-content",
      apiKey: "token-content",
      authHeader: "bearer token-content",
    });

    expect(process.env.PAPERCLIP_API_KEY).toBe("original-token");
    expect(process.env.PAPERCLIP_AUTH_HEADER).toBe("Bearer original-token");
    expect(process.env.PAPERCLIP_AGENT_ID).toBe("agent-original");
  });

  it("installs and restores Paperclip runtime env for a single run scope", () => {
    process.env.PAPERCLIP_API_KEY = "outer-token";
    process.env.PAPERCLIP_AUTH_HEADER = "Bearer outer-token";
    process.env.PAPERCLIP_AGENT_ID = "agent-outer";

    const built = buildPaperclipRuntimeEnv({
      paperclipRuntimeAuth: {
        apiUrl: "http://127.0.0.1:3100/content",
        runId: "run-content",
        agentId: "agent-content",
        companyId: "company-content",
        authToken: "token-content",
        authScheme: "bearer",
      },
    });

    const restore = installPaperclipRuntimeEnv(built);
    expect(snapshotPaperclipEnv(process.env as Record<string, string | undefined>)).toEqual({
      apiUrl: "http://127.0.0.1:3100/content",
      runId: "run-content",
      agentId: "agent-content",
      companyId: "company-content",
      apiKey: "token-content",
      authHeader: "bearer token-content",
    });

    restore();

    expect(process.env.PAPERCLIP_API_KEY).toBe("outer-token");
    expect(process.env.PAPERCLIP_AUTH_HEADER).toBe("Bearer outer-token");
    expect(process.env.PAPERCLIP_AGENT_ID).toBe("agent-outer");
  });

  it("treats empty runtime env as a no-op and preserves existing process env", () => {
    process.env.PAPERCLIP_API_KEY = "outer-token";
    process.env.PAPERCLIP_AUTH_HEADER = "Bearer outer-token";
    process.env.PAPERCLIP_AGENT_ID = "agent-outer";

    const built = buildPaperclipRuntimeEnv({
      paperclipRuntimeAuth: undefined,
    });
    expect(built).toEqual({});

    const before = snapshotPaperclipEnv(process.env as Record<string, string | undefined>);
    const restore = installPaperclipRuntimeEnv(built);

    expect(snapshotPaperclipEnv(process.env as Record<string, string | undefined>)).toEqual(before);

    restore();

    expect(snapshotPaperclipEnv(process.env as Record<string, string | undefined>)).toEqual(before);
  });
});
