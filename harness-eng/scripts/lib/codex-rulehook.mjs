/**
 * Merge optional rulehook command hooks into Codex hooks.json (0.7.9+).
 * Shape matches upstream rulehook adapters/codex.py install().
 * Strips prior `rulehook … hook` commands, then appends one group per event.
 */

const RULEHOOK_EVENTS = ["PreToolUse", "PostToolUse", "UserPromptSubmit", "Stop"];

/** @param {string} command */
export function isRulehookCommand(command) {
  return /rulehook['"]?\s+hook\b/.test(String(command || ""));
}

/**
 * @param {object} doc Codex hooks.json document (mutated)
 * @param {{ command?: string, timeout?: number, statusMessage?: string }} [opts]
 * @returns {object} doc
 */
export function mergeRulehookCodexHooks(doc, opts = {}) {
  if (!doc || typeof doc !== "object") return doc;
  const hooks = (doc.hooks = doc.hooks || {});
  const command = opts.command || "rulehook hook --target codex";
  const timeout = opts.timeout != null ? opts.timeout : 60;
  const statusMessage = opts.statusMessage || "rulehook: checking rules";

  for (const event of RULEHOOK_EVENTS) {
    const groups = Array.isArray(hooks[event]) ? hooks[event] : [];
    for (const group of groups) {
      if (!group || typeof group !== "object") continue;
      const list = Array.isArray(group.hooks) ? group.hooks : [];
      group.hooks = list.filter((h) => !isRulehookCommand(h && h.command));
    }
    const kept = groups.filter((g) => g && Array.isArray(g.hooks) && g.hooks.length > 0);
    kept.push({
      hooks: [
        {
          type: "command",
          command,
          timeout,
          statusMessage,
        },
      ],
    });
    hooks[event] = kept;
  }
  return doc;
}

export { RULEHOOK_EVENTS };
