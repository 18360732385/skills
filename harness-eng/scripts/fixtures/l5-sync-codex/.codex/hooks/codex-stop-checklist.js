#!/usr/bin/env node
/**
 * Codex Stop soft checklist — fail-open. Reads stdin (ignored on error) and exits 0.
 * Companion to templates/hooks/codex-hooks.json Stop event.
 */
function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        process.stdin.pause();
      } catch {
        /* ignore */
      }
      resolve(Buffer.concat(chunks).toString("utf8"));
    };
    const timer = setTimeout(done, 2000);
    process.stdin.on("data", (c) => chunks.push(Buffer.from(c, "utf8")));
    process.stdin.on("end", done);
    process.stdin.on("error", done);
  });
}

(async () => {
  try {
    await readStdin();
  } catch {
    /* fail-open */
  }
  process.stdout.write("{}");
  process.exit(0);
})();
