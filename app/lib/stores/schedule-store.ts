/**
 * Schedule Store Module
 * Last Updated: 2024
 * 
 * Provides global state management for schedule-related data using Zustand.
 * This store manages the state of schedules, assignments, time requirements,
 * and requirement statuses, along with loading and error states.
 * 
 * Features:
 * - Centralized schedule data management
 * - Type-safe state updates
 * - Loading and error state handling
 * - Reset functionality
 */

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Schedule, TimeBasedRequirement } from '@/app/lib/types/scheduling';
import type { GroupedAssignments, RequirementStatus } from '@/app/lib/utils/schedule.types';

/**
 * Schedule State Interface
 * Defines the structure of the schedule store's state
 * 
 * @property schedule - Current active schedule or null
 * @property assignments - Grouped assignments by date and shift
 * @property timeRequirements - List of time-based staffing requirements
 * @property requirementStatuses - Current status of staffing requirements
 * @property isLoading - Loading state indicator
 * @property error - Error message if any
 */
export type ScheduleState = {
  schedule: Schedule | null;
  assignments: GroupedAssignments;
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Schedule Actions Interface
 * Defines the available actions to update the schedule store
 * 
 * @property setSchedule - Updates the current schedule
 * @property setAssignments - Updates the assignments
 * @property setTimeRequirements - Updates time requirements
 * @property setRequirementStatuses - Updates requirement statuses
 * @property setLoading - Updates loading state
 * @property setError - Updates error state
 * @property reset - Resets store to initial state
 */
export type ScheduleActions = {
  setSchedule: (schedule: Schedule | null) => void;
  setAssignments: (assignments: GroupedAssignments) => void;
  setTimeRequirements: (requirements: TimeBasedRequirement[]) => void;
  setRequirementStatuses: (statuses: RequirementStatus[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

/**
 * Combined Schedule Store Type
 * Merges state and actions into a single type
 */
export type ScheduleStore = ScheduleState & ScheduleActions;

/**
 * Default Initial State
 * Provides default values for all state properties
 */
export const defaultInitState: ScheduleState = {
  schedule: null,
  assignments: {},
  timeRequirements: [],
  requirementStatuses: [],
  isLoading: false,
  error: null,
};

/**
 * Schedule Store Creator
 * Creates a new Zustand store with schedule state and actions
 * 
 * @param initState - Optional partial initial state to override defaults
 * @returns A new schedule store instance
 */
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