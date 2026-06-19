import { create } from 'zustand'
import { startOfWeek } from 'date-fns'

interface ScheduleStore {
  selectedWeekStart: Date
  setWeekStart: (d: Date) => void
  selectedDate: Date | null
  setSelectedDate: (d: Date | null) => void
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  selectedWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }), // 월요일 시작
  setWeekStart: (d) => set({ selectedWeekStart: d }),
  selectedDate: null,
  setSelectedDate: (d) => set({ selectedDate: d }),
}))
