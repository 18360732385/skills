/**
 * feature-eng authorized_by helpers（共享：gate-evidence / selfcheck）
 */
const USER_TASK_PLACEHOLDER =
  /^user_task_(fixture|auto|todo|placeholder|test|dummy)$/i;

export function isFakeChatTranscriptPlaceholder(value) {
  if (value == null) return false;
  const s = String(value);
  if (/用户\s*[:：]/.test(s) && /(确认|同意|yes)/i.test(s)) return true;
  if (/^(User|Assistant|Human|AI)\s*[:：]/im.test(s)) return true;
  if (/\n/.test(s) && /确认/.test(s) && s.length > 40) return true;
  if (/\[chat[-_ ]?transcript\]/i.test(s)) return true;
  if (/伪造|假笔录|fake\s*transcript/i.test(s)) return true;
  return false;
}

export function isUserTaskPlaceholder(value) {
  if (value == null) return false;
  return USER_TASK_PLACEHOLDER.test(String(value).trim());
}

/**
 * @param {*} value
 * @param {{ allowEmpty?: boolean }} [opts] allowEmpty: template/empty「—」视为合法（selfcheck）
 */
export function isLegalAuthorizedBy(value, opts = {}) {
  if (value == null || value === "" || value === "—") {
    return opts.allowEmpty === true;
  }
  const s = String(value).trim();
  if (isFakeChatTranscriptPlaceholder(s)) return false;
  if (isUserTaskPlaceholder(s)) return false;
  if (s === "user_chat" || s === "policy_exception") return true;
  if (/^user_task_[A-Za-z0-9._-]+$/.test(s)) return true;
  return false;
}
