/** Per-category Telegram community links (e.g. COMMUNITY_LINK_CAR). */
export function communityLinkForCategory(cat) {
  const key = `COMMUNITY_LINK_${String(cat || "").toUpperCase()}`;
  const v = process.env[key];
  if (v && typeof v === "string" && v.trim()) return v.trim();
  const d = process.env.COMMUNITY_LINK_DEFAULT;
  return d && typeof d === "string" ? d.trim() : "";
}
