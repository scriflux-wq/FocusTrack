"use client";

import { create } from "zustand";
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  finishTimer,
  discardActiveTimer,
} from "@/lib/actions/time-entries";

export type ActiveTimerEntry = {
  id: string;
  title: string;
  startTime: Date;
  pausedAt: Date | null;
  totalPausedSeconds: number;
  categoryId: string | null;
  projectId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  projectName: string | null;
};

type TimerStore = {
  activeEntry: ActiveTimerEntry | null;
  pending: boolean;
  setActiveEntry: (entry: ActiveTimerEntry | null) => void;
  start: (input: {
    title: string;
    categoryId?: string | null;
    projectId?: string | null;
    notes?: string | null;
    tagNames?: string[];
  }) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  finish: () => Promise<void>;
  discard: () => Promise<void>;
};

export const useTimerStore = create<TimerStore>((set, get) => ({
  activeEntry: null,
  pending: false,

  setActiveEntry: (entry) => set({ activeEntry: entry }),

  start: async (input) => {
    set({ pending: true });
    try {
      const entry = await startTimer(input);
      set({
        activeEntry: {
          id: entry.id,
          title: entry.title,
          startTime: entry.startTime,
          pausedAt: entry.pausedAt,
          totalPausedSeconds: entry.totalPausedSeconds,
          categoryId: entry.categoryId,
          projectId: entry.projectId,
          categoryName: null,
          categoryColor: null,
          projectName: null,
        },
      });
    } finally {
      set({ pending: false });
    }
  },

  pause: async () => {
    const entry = get().activeEntry;
    if (!entry) return;
    set({ activeEntry: { ...entry, pausedAt: new Date() } });
    await pauseTimer(entry.id);
  },

  resume: async () => {
    const entry = get().activeEntry;
    if (!entry || !entry.pausedAt) return;
    const pausedFor = Math.max(
      0,
      Math.floor((Date.now() - entry.pausedAt.getTime()) / 1000),
    );
    set({
      activeEntry: {
        ...entry,
        pausedAt: null,
        totalPausedSeconds: entry.totalPausedSeconds + pausedFor,
      },
    });
    await resumeTimer(entry.id);
  },

  finish: async () => {
    const entry = get().activeEntry;
    if (!entry) return;
    set({ pending: true });
    try {
      await finishTimer(entry.id);
      set({ activeEntry: null });
    } finally {
      set({ pending: false });
    }
  },

  discard: async () => {
    const entry = get().activeEntry;
    if (!entry) return;
    set({ pending: true });
    try {
      await discardActiveTimer(entry.id);
      set({ activeEntry: null });
    } finally {
      set({ pending: false });
    }
  },
}));
