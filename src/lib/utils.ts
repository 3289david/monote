import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { ImportanceLevel, PostCategory, Grade, BadgeType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ko });
}

export function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function getLevelName(level: number): string {
  const levels: Record<number, string> = {
    1: "새싹",
    2: "씨앗",
    3: "새잎",
    4: "자라남",
    5: "줄기",
    6: "꽃봉오리",
    7: "꽃",
    8: "열매",
    9: "거목",
    10: "전설",
  };
  return levels[Math.min(level, 10)] ?? "새싹";
}

export function getLevelColor(level: number): string {
  if (level >= 9) return "text-amber-500";
  if (level >= 7) return "text-violet-500";
  if (level >= 5) return "text-blue-500";
  if (level >= 3) return "text-emerald-500";
  return "text-gray-500";
}

export function getImportanceLabel(level: ImportanceLevel): string {
  const labels: Record<ImportanceLevel, string> = {
    critical: "무조건 외우기",
    high: "시험 가능성 높음",
    medium: "중요",
    low: "참고",
  };
  return labels[level];
}

export function getImportanceColor(level: ImportanceLevel): string {
  const colors: Record<ImportanceLevel, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-amber-100 text-amber-700 border-amber-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    low: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return colors[level];
}

export function getCategoryLabel(cat: PostCategory): string {
  const labels: Record<PostCategory, string> = {
    exam_range: "시험 범위",
    performance: "수행평가",
    materials: "자료실",
    teacher_info: "선생님 정보",
    question: "질문 게시판",
    general: "일반",
  };
  return labels[cat];
}

export function getCategoryColor(cat: PostCategory): string {
  const colors: Record<PostCategory, string> = {
    exam_range: "bg-violet-100 text-violet-700",
    performance: "bg-rose-100 text-rose-700",
    materials: "bg-sky-100 text-sky-700",
    teacher_info: "bg-amber-100 text-amber-700",
    question: "bg-emerald-100 text-emerald-700",
    general: "bg-gray-100 text-gray-600",
  };
  return colors[cat];
}

export function getBadgeLabel(badge: BadgeType): string {
  const labels: Record<BadgeType, string> = {
    exam_master: "범위 마스터",
    performance_helper: "수행 도우미",
    giver: "족보왕",
    popular: "인기쟁이",
    early_bird: "부지런한 새",
    streak: "연속 활동",
  };
  return labels[badge];
}

export function getGradeLabel(grade: Grade): string {
  return `${grade}학년`;
}

export function generateNickname(): string {
  const adj = [
    "행복한",
    "졸린",
    "배고픈",
    "신난",
    "힘든",
    "열심인",
    "게으른",
    "웃긴",
    "진지한",
    "귀여운",
  ];
  const noun = [
    "수학신",
    "국어왕",
    "영어고수",
    "시험마왕",
    "족보수집가",
    "공부벌레",
    "야자요정",
    "급식러버",
    "방과후달인",
    "도서관유령",
  ];
  return (
    adj[Math.floor(Math.random() * adj.length)] +
    noun[Math.floor(Math.random() * noun.length)]
  );
}

export function calculateLevel(points: number): number {
  if (points >= 50000) return 10;
  if (points >= 20000) return 9;
  if (points >= 10000) return 8;
  if (points >= 5000) return 7;
  if (points >= 2000) return 6;
  if (points >= 1000) return 5;
  if (points >= 500) return 4;
  if (points >= 200) return 3;
  if (points >= 50) return 2;
  return 1;
}

export function getNextLevelPoints(level: number): number {
  const thresholds = [0, 50, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  return thresholds[level] ?? Infinity;
}
