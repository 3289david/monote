"use client";
import { create } from "zustand";

interface UIState {
  examMode: boolean;
  sidebarOpen: boolean;
  selectedSchoolId: string;
  selectedGrade: number;
  selectedSubject: string | null;
  toggleExamMode: () => void;
  toggleSidebar: () => void;
  setSchool: (schoolId: string) => void;
  setGrade: (grade: number) => void;
  setSubject: (subject: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  examMode: false,
  sidebarOpen: false,
  selectedSchoolId: "school-001",
  selectedGrade: 2,
  selectedSubject: null,
  toggleExamMode: () => set((s) => ({ examMode: !s.examMode })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSchool: (selectedSchoolId) => set({ selectedSchoolId }),
  setGrade: (selectedGrade) => set({ selectedGrade }),
  setSubject: (selectedSubject) => set({ selectedSubject }),
}));
