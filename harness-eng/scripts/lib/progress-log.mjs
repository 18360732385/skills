/**
 * stderr progress helper (0.2.15+). stdout stays machine-readable.
 */

export function createProgress({ quiet = false, label = "harness" } = {}) {
  let last = 0;
  return {
    quiet: !!quiet,
    log(msg) {
      if (quiet) return;
      const line = `[${label}] ${msg}`;
      process.stderr.write(line.endsWith("\n") ? line : line + "\n");
    },
    /**
     * @param {number} i 1-based or 0-based index
     * @param {number} total
     * @param {string} [detail]
     */
    step(i, total, detail = "") {
      if (quiet || !total) return;
      const n = Math.max(1, Number(i) || 0);
      const t = Math.max(1, Number(total) || 1);
      const pct = Math.min(100, Math.round((n / t) * 100));
      if (pct < last + 5 && n < t && pct !== 100) return;
      last = pct;
      const extra = detail ? ` ${detail}` : "";
      process.stderr.write(`[${label}] ${n}/${t} (${pct}%)${extra}\n`);
    },
    done(msg = "done") {
      if (quiet) return;
      process.stderr.write(`[${label}] ${msg}\n`);
    },
  };
}