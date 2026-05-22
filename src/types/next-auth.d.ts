import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nickname: string;
      schoolId: string;
      schoolName: string;
      grade: number;
      classNum: number;
      points: number;
      level: number;
      badges: string[];
      streakDays: number;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}
