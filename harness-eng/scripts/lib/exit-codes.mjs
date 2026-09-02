/**
 * Inventory / fill script exit semantics (0.2.9+):
 *   0 = success, no warnings/skips
 *   2 = success with warnings/skips (warnings[] in JSON)
 *   1 = hard error
 */
export function exitFromReport(report) {
  if (!report || report.ok === false) process.exit(1);
  const warnings = report.warnings || [];
  if (warnings.length) process.exit(2);
  process.exit(0);
}

export function pushWarning(report, warning) {
  if (!report.warnings) report.warnings = [];
  report.warnings.push(warning);
}