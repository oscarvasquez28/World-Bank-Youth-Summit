type User = { id: string | number; name?: string; email: string } | null;
type UserProfile = { id: string; name?: string; email?: string };

const KEY = 'unmapped_user_v1';
const DIRECTORY_KEY = 'unmapped_user_directory_v1';

function normalizeUserId(id: unknown): string | null {
  if (id === undefined || id === null) return null;
  const out = String(id).trim();
  return out.length > 0 ? out : null;
}

function getDirectory(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(DIRECTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveDirectory(dir: Record<string, UserProfile>) {
  try {
    localStorage.setItem(DIRECTORY_KEY, JSON.stringify(dir));
  } catch (e) {
    // ignore
  }
}

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
    if (user) {
      localStorage.setItem(KEY, JSON.stringify(user));

      const id = normalizeUserId((user as any).id);
      if (id) {
        const dir = getDirectory();
        dir[id] = {
          id,
          name: (user as any).name,
          email: (user as any).email,
        };
        saveDirectory(dir);
      }
    } else {
      localStorage.removeItem(KEY);
    }
    // notify listeners
    window.dispatchEvent(new CustomEvent('auth.change'));
  } catch (e) {
    console.error('setUser failed', e);
  }
}

export function getKnownUserById(id: string): UserProfile | null {
  try {
    const dir = getDirectory();
    return dir[id] || null;
  } catch (e) {
    return null;
  }
}

export function clearUser() {
  try {
    // previously we cleared detected skills/opportunities on logout
    // keep per-user storage intact so returning users keep their data
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

export default { getUser, setUser, clearUser, onAuthChange, getKnownUserById };
