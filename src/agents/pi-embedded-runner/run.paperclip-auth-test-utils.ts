import type { RunEmbeddedPiAgentParams } from "./run/params.js";

const PAPERCLIP_RUNTIME_ENV_KEYS = [
  "PAPERCLIP_API_URL",
  "PAPERCLIP_RUN_ID",
  "PAPERCLIP_AGENT_ID",
  "PAPERCLIP_COMPANY_ID",
  "PAPERCLIP_API_KEY",
  "PAPERCLIP_AUTH_HEADER",
] as const;

function installPaperclipRuntimeEnv(env: Record<string, string>): () => void {
  const entries = Object.entries(env).filter(([, value]) => typeof value === "string");
  if (entries.length === 0) {
    return () => {};
  }

  const previous = new Map<string, string | undefined>();
  for (const key of PAPERCLIP_RUNTIME_ENV_KEYS) {
    previous.set(key, process.env[key]);
  }
  for (const key of PAPERCLIP_RUNTIME_ENV_KEYS) {
    delete process.env[key];
  }
  for (const [key, value] of entries) {
    process.env[key] = value;
  }
  return () => {
    for (const key of PAPERCLIP_RUNTIME_ENV_KEYS) {
      const value = previous.get(key);
      if (typeof value === "string") {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    }
  };
}

function buildPaperclipRuntimeEnv(
  params: Pick<RunEmbeddedPiAgentParams, "paperclipRuntimeAuth">,
): Record<string, string> {
  const auth = params.paperclipRuntimeAuth;
  const env: Record<string, string> = {};
  if (!auth) {
    return env;
  }
  const authToken = auth.authToken?.trim();
  const authScheme = auth.authScheme?.trim().toLowerCase();
  const apiUrl = auth.apiUrl?.trim();
  const runId = auth.runId?.trim();
  const agentId = auth.agentId?.trim();
  const companyId = auth.companyId?.trim();

  if (apiUrl) {
    env.PAPERCLIP_API_URL = apiUrl;
  }
  if (runId) {
    env.PAPERCLIP_RUN_ID = runId;
  }
  if (agentId) {
    env.PAPERCLIP_AGENT_ID = agentId;
  }
  if (companyId) {
    env.PAPERCLIP_COMPANY_ID = companyId;
  }
  if (authToken) {
    env.PAPERCLIP_API_KEY = authToken;
    const scheme = authScheme && authScheme.length > 0 ? authScheme : "bearer";
    env.PAPERCLIP_AUTH_HEADER = `${scheme} ${authToken}`;
  }
  return env;
}

export { PAPERCLIP_RUNTIME_ENV_KEYS, buildPaperclipRuntimeEnv, installPaperclipRuntimeEnv };
