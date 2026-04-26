type User = { id: number; name?: string; email: string } | null;

const KEY = 'unmapped_user_v1';

export function getUser(): User {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setUser(user: User) {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
    // notify listeners
    window.dispatchEvent(new CustomEvent('auth.change'));
  } catch (e) {
    console.error('setUser failed', e);
  }
}

export function clearUser() {
  try {
    // also clear detected opportunities and detected skills on logout
    localStorage.removeItem('detectedOpportunities');
    localStorage.removeItem('detectedSkills');
  } catch (e) {
    // ignore
  }
  setUser(null);
}

export function onAuthChange(handler: () => void) {
  const listener = () => handler();
  window.addEventListener('auth.change', listener as EventListener);
  return () => window.removeEventListener('auth.change', listener as EventListener);
}

export default { getUser, setUser, clearUser, onAuthChange };
