import type {
  Bootstrap,
  Measurement,
  Photo,
  PhysiqueRating,
  Profile,
  RestLog,
  WorkoutLog,
} from '../types';

const API = '/api';
const TOKEN_KEY = 'rrpt_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401) {
    // Token missing/expired/invalid → drop it and return to the login screen.
    tokenStore.clear();
    window.location.reload();
    throw new Error('401 Unauthorized');
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${msg}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface HealthInfo {
  ok: boolean;
  authRequired: boolean;
}

export const api = {
  // Public — used before login to decide whether to show the login screen.
  health: () => request<HealthInfo>('/health'),

  // Public — validates credentials and returns a bearer token. Uses its own
  // fetch so a wrong password surfaces an inline error instead of reloading.
  login: async (username: string, password: string) => {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.status === 401) throw new Error('Invalid username or password.');
    if (!res.ok) throw new Error(`Login failed (${res.status})`);
    return res.json() as Promise<{ token: string; user: string }>;
  },

  bootstrap: () => request<Bootstrap>('/bootstrap'),

  updateProfile: (patch: Partial<Profile>) =>
    request<Profile>('/profile', { method: 'PUT', body: JSON.stringify(patch) }),

  // workouts
  addWorkout: (w: Omit<WorkoutLog, 'id' | 'volume'>) =>
    request<WorkoutLog>('/workouts', { method: 'POST', body: JSON.stringify(w) }),
  updateWorkout: (id: string, w: Partial<WorkoutLog>) =>
    request<WorkoutLog>(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(w) }),
  deleteWorkout: (id: string) => request<void>(`/workouts/${id}`, { method: 'DELETE' }),

  // measurements
  addMeasurement: (m: Omit<Measurement, 'id'>) =>
    request<Measurement>('/measurements', { method: 'POST', body: JSON.stringify(m) }),
  updateMeasurement: (id: string, m: Partial<Measurement>) =>
    request<Measurement>(`/measurements/${id}`, { method: 'PUT', body: JSON.stringify(m) }),
  deleteMeasurement: (id: string) =>
    request<void>(`/measurements/${id}`, { method: 'DELETE' }),

  // physique
  addPhysique: (p: Omit<PhysiqueRating, 'id'>) =>
    request<PhysiqueRating>('/physique', { method: 'POST', body: JSON.stringify(p) }),
  updatePhysique: (id: string, p: Partial<PhysiqueRating>) =>
    request<PhysiqueRating>(`/physique/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deletePhysique: (id: string) => request<void>(`/physique/${id}`, { method: 'DELETE' }),

  // photos
  addPhoto: (p: Omit<Photo, 'id'>) =>
    request<Photo>('/photos', { method: 'POST', body: JSON.stringify(p) }),
  deletePhoto: (id: string) => request<void>(`/photos/${id}`, { method: 'DELETE' }),

  // rest-day logs
  addRest: (r: Omit<RestLog, 'id'>) =>
    request<RestLog>('/rest', { method: 'POST', body: JSON.stringify(r) }),
  updateRest: (id: string, r: Partial<RestLog>) =>
    request<RestLog>(`/rest/${id}`, { method: 'PUT', body: JSON.stringify(r) }),
  deleteRest: (id: string) => request<void>(`/rest/${id}`, { method: 'DELETE' }),

  // meta
  exportAll: () => request<Record<string, unknown>>('/export'),
  reset: () => request<{ ok: boolean }>('/reset', { method: 'POST' }),
};
