import { describe, expect, it } from "vitest";
import { createOpenClawCodingTools } from "./pi-tools.js";

describe("createOpenClawCodingTools paperclipRuntimeEnv wiring", () => {
  it("passes exec.paperclipRuntimeEnv through to the exec tool defaults", async () => {
    const tools = createOpenClawCodingTools({
      workspaceDir: process.cwd(),
      exec: {
        host: "gateway",
        security: "full",
        ask: "off",
        paperclipRuntimeEnv: {
          PAPERCLIP_AUTH_HEADER: "Bearer test-header",
          PAPERCLIP_API_KEY: "pcp_test_key",
        },
      },
      sessionKey: "agent:test:paperclip",
    });

    const execTool = tools.find((tool) => tool.name === "exec");
    expect(execTool).toBeTruthy();

    const result = await execTool!.execute(
      "toolcall-test",
      {
        command:
          'node -e "console.log(JSON.stringify({auth:process.env.PAPERCLIP_AUTH_HEADER||null,key:process.env.PAPERCLIP_API_KEY||null}))"',
        host: "gateway",
        security: "full",
        ask: "off",
      },
      new AbortController().signal,
      async () => {},
    );

    const text = JSON.stringify(result);
    expect(text).toContain("Bearer test-header");
    expect(text).toContain("pcp_test_key");
  });

  it("falls back to top-level paperclipRuntimeEnv when exec.paperclipRuntimeEnv is absent", async () => {
    const tools = createOpenClawCodingTools({
      workspaceDir: process.cwd(),
      exec: {
        host: "gateway",
        security: "full",
        ask: "off",
      },
      paperclipRuntimeEnv: {
        PAPERCLIP_AUTH_HEADER: "Bearer top-level-header",
        PAPERCLIP_API_KEY: "pcp_top_level_key",
      },
      sessionKey: "agent:test:paperclip",
    });

    const execTool = tools.find((tool) => tool.name === "exec");
    expect(execTool).toBeTruthy();

    const result = await execTool!.execute(
      "toolcall-test",
      {
        command:
          'node -e "console.log(JSON.stringify({auth:process.env.PAPERCLIP_AUTH_HEADER||null,key:process.env.PAPERCLIP_API_KEY||null}))"',
        host: "gateway",
        security: "full",
        ask: "off",
      },
      new AbortController().signal,
      async () => {},
    );

    const text = JSON.stringify(result);
    expect(text).toContain("Bearer top-level-header");
    expect(text).toContain("pcp_top_level_key");
  });
});
