export type Grade = 1 | 2 | 3;

export type Subject =
  | "국어" | "수학" | "영어" | "과학" | "사회" | "역사"
  | "물리" | "화학" | "생명과학" | "지구과학" | "한국사"
  | "음악" | "미술" | "체육" | "기술가정" | "정보"
  | "도덕" | "경제" | "법과정치" | "한문" | "생활과윤리" | "기타";

export type PostCategory =
  | "exam_range" | "performance" | "materials"
  | "teacher_info" | "question" | "general";

export type ImportanceLevel = "critical" | "high" | "medium" | "low";

export type BadgeType =
  | "exam_master" | "performance_helper" | "giver"
  | "popular" | "early_bird" | "streak";

export interface User {
  id: string;
  uid: string;
  nickname: string;
  email: string;
  school: string;
  schoolId: string;
  grade: Grade;
  classNum: number;
  avatar?: string;
  image?: string;
  points: number;
  level: number;
  badges: BadgeType[];
  streakDays?: number;
  createdAt: Date;
  postCount: number;
  helpfulCount: number;
}

export interface School {
  id: string;
  name: string;
  type: "middle" | "high";
  region: string;
  memberCount: number;
}

export interface Post {
  id: string;
  schoolId: string;
  grade: Grade | number;
  subject: Subject | string;
  category: PostCategory;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  authorLevel: number;
  authorImage?: string | null;
  anonymous: boolean;
  importance: ImportanceLevel;
  files: PostFile[] | any[];
  tags: string[];
  voteCount: number;
  viewCount: number;
  commentCount: number;
  bookmarkCount: number;
  verified: boolean;
  reportCount?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  examDate?: Date | string | null;
  dueDate?: Date | string | null;
  isPinned: boolean;
  // Client-side state from API
  userVoted?: boolean;
  userBookmarked?: boolean;
}

export interface PostFile {
  id?: string;
  name: string;
  url: string;
  type?: "image" | "pdf" | "document" | string;
  size?: number;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorNickname: string;
  authorLevel: number;
  anonymous: boolean;
  likes: number;
  createdAt: Date;
  isAnswer: boolean;
  author?: {
    id: string;
    nickname: string;
    level: number;
    image?: string | null;
  };
}

export interface ChatRoom {
  id: string;
  schoolId: string;
  name: string;
  type: "school" | "grade" | "subject" | "open";
  grade?: Grade;
  subject?: Subject;
  memberCount: number;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  content: string;
  senderId: string;
  senderNickname: string;
  senderLevel: number;
  type: "text" | "image" | "file";
  fileUrl?: string;
  createdAt: Date;
}

export interface Vote {
  postId: string;
  userId: string;
  importanceLevel: ImportanceLevel;
  createdAt: Date;
}

export type NotificationType =
  | "comment" | "vote" | "mention" | "badge" | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Date;
  postId?: string | null;
}
