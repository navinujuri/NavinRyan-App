import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';
import type {
  AppConfig,
  Bootstrap,
  Measurement,
  Photo,
  PhysiqueRating,
  Profile,
  ProgramMeta,
  RestLog,
  WorkoutLog,
} from '../types';

interface DataState {
  loading: boolean;
  error: string | null;
  config: AppConfig | null;
  profile: Profile | null;
  workouts: WorkoutLog[];
  measurements: Measurement[];
  physique: PhysiqueRating[];
  photos: Photo[];
  restLogs: RestLog[];
  programs: ProgramMeta[];
  activeProgramId: string | null;

  reload: () => Promise<void>;

  saveProfile: (patch: Partial<Profile>) => Promise<void>;

  addWorkout: (w: Omit<WorkoutLog, 'id' | 'volume'>) => Promise<void>;
  updateWorkout: (id: string, w: Partial<WorkoutLog>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;

  addMeasurement: (m: Omit<Measurement, 'id'>) => Promise<void>;
  updateMeasurement: (id: string, m: Partial<Measurement>) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;

  savePhysique: (p: Omit<PhysiqueRating, 'id'>, id?: string) => Promise<void>;
  deletePhysique: (id: string) => Promise<void>;

  addPhoto: (p: Omit<Photo, 'id'>) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;

  saveRest: (r: Omit<RestLog, 'id'>, id?: string) => Promise<void>;
  deleteRest: (id: string) => Promise<void>;
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boot, setBoot] = useState<Bootstrap | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.bootstrap();
      setBoot(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const patch = (p: Partial<Bootstrap>) =>
    setBoot((prev) => (prev ? { ...prev, ...p } : prev));

  const value = useMemo<DataState>(() => {
    return {
      loading,
      error,
      config: boot?.config ?? null,
      profile: boot?.profile ?? null,
      workouts: boot?.workouts ?? [],
      measurements: boot?.measurements ?? [],
      physique: boot?.physiqueRatings ?? [],
      photos: boot?.photos ?? [],
      restLogs: boot?.restLogs ?? [],
      programs: boot?.programs ?? [],
      activeProgramId: boot?.activeProgramId ?? null,

      reload,

      saveProfile: async (p) => {
        const updated = await api.updateProfile(p);
        patch({ profile: updated });
      },

      addWorkout: async (w) => {
        const created = await api.addWorkout(w);
        setBoot((prev) => (prev ? { ...prev, workouts: [...prev.workouts, created] } : prev));
      },
      updateWorkout: async (id, w) => {
        const updated = await api.updateWorkout(id, w);
        setBoot((prev) =>
          prev ? { ...prev, workouts: prev.workouts.map((x) => (x.id === id ? updated : x)) } : prev,
        );
      },
      deleteWorkout: async (id) => {
        await api.deleteWorkout(id);
        setBoot((prev) => (prev ? { ...prev, workouts: prev.workouts.filter((x) => x.id !== id) } : prev));
      },

      addMeasurement: async (m) => {
        const created = await api.addMeasurement(m);
        setBoot((prev) =>
          prev ? { ...prev, measurements: [...prev.measurements, created] } : prev,
        );
      },
      updateMeasurement: async (id, m) => {
        const updated = await api.updateMeasurement(id, m);
        setBoot((prev) =>
          prev
            ? { ...prev, measurements: prev.measurements.map((x) => (x.id === id ? updated : x)) }
            : prev,
        );
      },
      deleteMeasurement: async (id) => {
        await api.deleteMeasurement(id);
        setBoot((prev) =>
          prev ? { ...prev, measurements: prev.measurements.filter((x) => x.id !== id) } : prev,
        );
      },

      savePhysique: async (p, id) => {
        if (id) {
          const updated = await api.updatePhysique(id, p);
          setBoot((prev) =>
            prev
              ? { ...prev, physiqueRatings: prev.physiqueRatings.map((x) => (x.id === id ? updated : x)) }
              : prev,
          );
        } else {
          const created = await api.addPhysique(p);
          setBoot((prev) =>
            prev ? { ...prev, physiqueRatings: [...prev.physiqueRatings, created] } : prev,
          );
        }
      },
      deletePhysique: async (id) => {
        await api.deletePhysique(id);
        setBoot((prev) =>
          prev ? { ...prev, physiqueRatings: prev.physiqueRatings.filter((x) => x.id !== id) } : prev,
        );
      },

      addPhoto: async (p) => {
        const created = await api.addPhoto(p);
        setBoot((prev) => (prev ? { ...prev, photos: [...prev.photos, created] } : prev));
      },
      deletePhoto: async (id) => {
        await api.deletePhoto(id);
        setBoot((prev) => (prev ? { ...prev, photos: prev.photos.filter((x) => x.id !== id) } : prev));
      },

      saveRest: async (r, id) => {
        if (id) {
          const updated = await api.updateRest(id, r);
          setBoot((prev) =>
            prev ? { ...prev, restLogs: prev.restLogs.map((x) => (x.id === id ? updated : x)) } : prev,
          );
        } else {
          const created = await api.addRest(r);
          setBoot((prev) => (prev ? { ...prev, restLogs: [...prev.restLogs, created] } : prev));
        }
      },
      deleteRest: async (id) => {
        await api.deleteRest(id);
        setBoot((prev) => (prev ? { ...prev, restLogs: prev.restLogs.filter((x) => x.id !== id) } : prev));
      },
    };
  }, [loading, error, boot, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}
