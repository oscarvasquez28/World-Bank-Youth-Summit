import type { OccupationsMap, OccupationInfo } from './storage';

/**
 * The ML /occupations endpoint returns a flat map: { [occupationName]: info }.
 * To persist per-skill lookups we redistribute each occupation under every
 * skill listed in its `matching_skills` (falling back to every queried skill
 * if the info lacks that array).
 */
export function indexOccupationsBySkill(
  flat: Record<string, OccupationInfo> | null | undefined,
  queriedSkills: string[],
): OccupationsMap {
  const out: OccupationsMap = {};
  if (!flat || typeof flat !== 'object') return out;

  const queried = queriedSkills.map((s) => s.trim()).filter(Boolean);
  const queriedLower = new Map(queried.map((s) => [s.toLowerCase(), s]));

  Object.entries(flat).forEach(([name, info]) => {
    if (!info || typeof info !== 'object') return;
    const matchingSkills = Array.isArray((info as any).matching_skills)
      ? ((info as any).matching_skills as string[])
      : [];

    // Map matching_skills back to the original casing from queriedSkills
    const normalized = matchingSkills
      .map((m) => queriedLower.get(String(m || '').toLowerCase()))
      .filter((v): v is string => Boolean(v));

    const buckets = normalized.length > 0 ? normalized : queried;
    buckets.forEach((skill) => {
      if (!out[skill]) out[skill] = {};
      out[skill][name] = info as OccupationInfo;
    });
  });

  return out;
}
