import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveBundledSkillsDir(): string | undefined {
  const override = process.env.OPENCLAW_BUNDLED_SKILLS_DIR?.trim();
  if (override) {
    return override;
  }

  // bun --compile: ship a sibling `skills/` next to the executable.
  try {
    const execDir = path.dirname(process.execPath);
    const sibling = path.join(execDir, "skills");
    if (fs.existsSync(sibling)) {
      return sibling;
    }
  } catch {
    // ignore
  }

  // npm/dev/prod: resolve `<packageRoot>/skills` relative to this module.
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));

    // Check various distances from root to accommodate both src/ and dist/ structures
    const candidates = [
      path.resolve(moduleDir, "..", "skills"), // dist/
      path.resolve(moduleDir, "..", "..", "skills"), // dist/subfolder/
      path.resolve(moduleDir, "..", "..", "..", "skills"), // src/agents/skills/
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  } catch {
    // ignore
  }

  return undefined;
}
