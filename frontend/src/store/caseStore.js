import { create } from 'zustand'

export const useCaseStore = create((set, get) => ({
  currentCase: null,
  cases: [],
  subjects: [],
  parsedRecords: null,
  parseStats: null,
  setCurrentCase: (c) => set({ currentCase: c }),
  setCases: (cases) => set({ cases }),
  setSubjects: (subjects) => set({ subjects }),
  setParsedData: (records, stats) => set({ parsedRecords: records, parseStats: stats }),
}))
