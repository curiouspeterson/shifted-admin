import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Schedule } from '@/app/types/scheduling';
import type { GroupedAssignments, RequirementStatus } from '@/app/lib/utils/schedule.types';
import type { TimeBasedRequirement } from '@/app/types/scheduling';

export type ScheduleState = {
  schedule: Schedule | null;
  assignments: GroupedAssignments;
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
  isLoading: boolean;
  error: string | null;
};

export type ScheduleActions = {
  setSchedule: (schedule: Schedule | null) => void;
  setAssignments: (assignments: GroupedAssignments) => void;
  setTimeRequirements: (requirements: TimeBasedRequirement[]) => void;
  setRequirementStatuses: (statuses: RequirementStatus[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export type ScheduleStore = ScheduleState & ScheduleActions;

export const defaultInitState: ScheduleState = {
  schedule: null,
  assignments: {},
  timeRequirements: [],
  requirementStatuses: [],
  isLoading: false,
  error: null,
};

export const createScheduleStore = (initState: Partial<ScheduleState> = {}) => {
  return createStore<ScheduleStore>()((set: StoreApi<ScheduleStore>['setState']) => ({
    ...defaultInitState,
    ...initState,
    setSchedule: (schedule: Schedule | null) => set({ schedule }),
    setAssignments: (assignments: GroupedAssignments) => set({ assignments }),
    setTimeRequirements: (timeRequirements: TimeBasedRequirement[]) => set({ timeRequirements }),
    setRequirementStatuses: (requirementStatuses: RequirementStatus[]) => set({ requirementStatuses }),
    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),
    reset: () => set(defaultInitState),
  }));
}; 