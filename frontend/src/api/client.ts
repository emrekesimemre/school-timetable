import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ?? err.message ?? 'Beklenmedik bir hata oluştu';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  }
);

// ─── Generic Types ────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

// ─── Domain Types ─────────────────────────────────────────────

export interface AssignmentDetail {
  id: string;
  gradeId: string;
  subjectId: string;
  hoursPerWeek: number;
  grade: Grade;
  subject: Subject;
  createdAt: string;
}

export interface AssignmentRow {
  id: string;
  teacherId: string;
  gradeId: string;
  subjectId: string;
  hoursPerWeek: number;
  teacher: Teacher;
  grade: Grade;
  subject: Subject;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolSettings {
  id: string;
  daysPerWeek: number;
  hoursPerDay: number;
  maxConsecutiveSameSubject: boolean;
  maxConsecutiveHours: number;
  updatedAt: string;
}

export interface TimetableCell {
  slotKey: string;
  day: string;
  period: number;
  assignmentId: string;
  teacherId: string;
  teacherName: string;
  gradeId: string;
  gradeName: string;
  subjectId: string;
  subjectName: string;
  subjectColor?: string | null;
}

export interface GenerateResult {
  timetableId: string;
  generatedAt: string;
  daysPerWeek: number;
  hoursPerDay: number;
  stats: {
    placedLessons: number;
    assignments?: number;
    classes: number;
    teachers: number;
  };
  slots: TimetableCell[];
  byClass: Record<string, { gradeId: string; gradeName: string; slots: Record<string, TimetableCell> }>;
  byTeacher: Record<string, { teacherId: string; teacherName: string; slots: Record<string, TimetableCell> }>;
}

export interface AssignmentInput {
  gradeId: string;
  subjectId: string;
  hoursPerWeek: number;
}

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  available_hours: Record<string, number[]>;
  unavailable_slots: string[];
  assignments?: AssignmentDetail[];
  _count?: { assignments: number };
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  name: string;
  year?: number;
  studentCount?: number;
  _count?: { assignments: number };
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  color?: string;
  _count?: { assignments: number; constraints: number };
  createdAt: string;
  updatedAt: string;
}

export type ClassroomType = 'STANDARD' | 'LAB' | 'GYM' | 'AUDITORIUM' | 'WORKSHOP';

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  type: ClassroomType;
  building?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── DTO Types ────────────────────────────────────────────────

export type CreateTeacherDto = {
  name: string;
  email?: string;
  available_hours?: Record<string, number[]>;
  unavailable_slots?: string[];
  assignments?: AssignmentInput[];
};

export type CreateGradeDto = Pick<Grade, 'name' | 'year' | 'studentCount'>;
export type CreateSubjectDto = Pick<Subject, 'name' | 'code' | 'color'>;
export type CreateClassroomDto = Pick<Classroom, 'name' | 'capacity' | 'type' | 'building'>;

// ─── API Modules ──────────────────────────────────────────────

export const teachersApi = {
  getAll:   ()                                       => api.get<ApiResponse<Teacher[]>>('/teachers'),
  getById:  (id: string)                             => api.get<ApiResponse<Teacher>>(`/teachers/${id}`),
  create:   (data: CreateTeacherDto)                 => api.post<ApiResponse<Teacher>>('/teachers', data),
  update:   (id: string, data: Partial<CreateTeacherDto>) => api.put<ApiResponse<Teacher>>(`/teachers/${id}`, data),
  remove:   (id: string)                             => api.delete<ApiResponse<null>>(`/teachers/${id}`),
};

export const gradesApi = {
  getAll:   ()                                       => api.get<ApiResponse<Grade[]>>('/grades'),
  getById:  (id: string)                             => api.get<ApiResponse<Grade>>(`/grades/${id}`),
  create:   (data: CreateGradeDto)                   => api.post<ApiResponse<Grade>>('/grades', data),
  update:   (id: string, data: Partial<CreateGradeDto>) => api.put<ApiResponse<Grade>>(`/grades/${id}`, data),
  remove:   (id: string)                             => api.delete<ApiResponse<null>>(`/grades/${id}`),
};

export const subjectsApi = {
  getAll:   ()                                       => api.get<ApiResponse<Subject[]>>('/subjects'),
  getById:  (id: string)                             => api.get<ApiResponse<Subject>>(`/subjects/${id}`),
  create:   (data: CreateSubjectDto)                 => api.post<ApiResponse<Subject>>('/subjects', data),
  update:   (id: string, data: Partial<CreateSubjectDto>) => api.put<ApiResponse<Subject>>(`/subjects/${id}`, data),
  remove:   (id: string)                             => api.delete<ApiResponse<null>>(`/subjects/${id}`),
};

export const classroomsApi = {
  getAll:   ()                                       => api.get<ApiResponse<Classroom[]>>('/classrooms'),
  getById:  (id: string)                             => api.get<ApiResponse<Classroom>>(`/classrooms/${id}`),
  create:   (data: CreateClassroomDto)               => api.post<ApiResponse<Classroom>>('/classrooms', data),
  update:   (id: string, data: Partial<CreateClassroomDto>) => api.put<ApiResponse<Classroom>>(`/classrooms/${id}`, data),
  remove:   (id: string)                             => api.delete<ApiResponse<null>>(`/classrooms/${id}`),
};

export const assignmentsApi = {
  getAll: () => api.get<ApiResponse<AssignmentRow[]>>('/assignments'),
};

export const settingsApi = {
  get: () => api.get<ApiResponse<SchoolSettings>>('/settings'),
  update: (data: Partial<SchoolSettings>) =>
    api.put<ApiResponse<SchoolSettings>>('/settings', data),
};

export const timetableApi = {
  generate: () =>
    api.post<ApiResponse<GenerateResult>>('/generate-timetable', {}, { timeout: 60_000 }),
  latest: () => api.get<ApiResponse<GenerateResult>>('/generate-timetable'),
};
