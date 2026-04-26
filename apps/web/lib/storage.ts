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
    return raw ? JSON.parse(raw) : [];
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

export function getDetectedOpportunities(): { role: string; salary: string }[] {
  try {
    const raw = localStorage.getItem(keyFor('detectedOpportunities')) || localStorage.getItem('detectedOpportunities');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function setDetectedOpportunities(arr: { role: string; salary: string }[]) {
  try {
    localStorage.setItem(keyFor('detectedOpportunities'), JSON.stringify(arr));
  } catch (e) {
    console.warn('setDetectedOpportunities failed', e);
  }
}

export function appendDetectedOpportunities(newOps: { role: string; salary: string }[]) {
  try {
    const cur = getDetectedOpportunities();
    const merged = [...cur];
    newOps.forEach((o) => {
      if (!merged.find((m) => m.role === o.role && m.salary === o.salary)) merged.push(o);
    });
    localStorage.setItem(keyFor('detectedOpportunities'), JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('appendDetectedOpportunities failed', e);
    return newOps;
  }
}

export default { getDetectedSkills, setDetectedSkills, appendDetectedSkills, getDetectedOpportunities, setDetectedOpportunities, appendDetectedOpportunities };
