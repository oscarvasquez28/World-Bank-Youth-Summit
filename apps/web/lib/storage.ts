import auth from "./auth";

function keyFor(base: string) {
  try {
    const user = auth.getUser();
    if (user && (user as any).id !== undefined && user !== null) return `${base}:user:${(user as any).id}`;
  } catch (e) {
    /* ignore */
  }
  return base;
}

export function getDetectedSkills(): string[] {
  try {
    const raw = localStorage.getItem(keyFor('detectedSkills')) || localStorage.getItem('detectedSkills');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map((v: any) => String(v || '')) : [];
  } catch (e) {
    return [];
  }
}

export function setDetectedSkills(arr: string[]) {
  try {
    localStorage.setItem(keyFor('detectedSkills'), JSON.stringify(arr));
  } catch (e) {
    console.warn('setDetectedSkills failed', e);
  }
}

export function appendDetectedSkills(newSkills: string[]) {
  try {
    const cur = getDetectedSkills();
    const merged = Array.from(new Set([...cur, ...newSkills]));
    localStorage.setItem(keyFor('detectedSkills'), JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('appendDetectedSkills failed', e);
    return newSkills;
  }
}

export function getDetectedOpportunities(): { role: string }[] {
  try {
    const raw = localStorage.getItem(keyFor('detectedOpportunities')) || localStorage.getItem('detectedOpportunities');
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.map((o: any) => ({ role: String((o && o.role) || '') }));
  } catch (e) {
    return [];
  }
}

export function setDetectedOpportunities(arr: { role: string }[]) {
  try {
    localStorage.setItem(keyFor('detectedOpportunities'), JSON.stringify(arr));
  } catch (e) {
    console.warn('setDetectedOpportunities failed', e);
  }
}

export function appendDetectedOpportunities(newOps: { role: string }[]) {
  try {
    const cur = getDetectedOpportunities();
    const normalized = (newOps || []).map((o) => ({ role: String((o && o.role) || '') }));

    // merge and dedupe by role
    const map = new Map<string, { role: string }>();
    cur.forEach((o) => map.set(o.role, o));
    normalized.forEach((o) => map.set(o.role, o));
    const merged = Array.from(map.values());
    localStorage.setItem(keyFor('detectedOpportunities'), JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('appendDetectedOpportunities failed', e);
    return newOps;
  }
}

export default { getDetectedSkills, setDetectedSkills, appendDetectedSkills, getDetectedOpportunities, setDetectedOpportunities, appendDetectedOpportunities };
