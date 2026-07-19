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

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

// Public auth calls use their own fetch so validation errors surface inline
// (instead of the generic 401 → reload behaviour used for the data API).
async function authPost(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as { token: string; user: AuthUser };
}

export const api = {
  register: (name: string, email: string, password: string) =>
    authPost('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    authPost('/auth/login', { email, password }),
  me: () => request<{ user: AuthUser }>('/auth/me'),

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
};
