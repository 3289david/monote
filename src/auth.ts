import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { calculateLevel } from "@/lib/utils";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { school: true },
        });

        if (!user || !user.password) return null;
        if (user.isBanned) throw new Error("계정이 정지되었습니다.");

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date(), level: calculateLevel(user.points) },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          image: user.avatar,
          nickname: user.nickname,
          schoolId: user.schoolId,
          schoolName: user.school.name,
          grade: user.grade,
          classNum: user.classNum,
          points: user.points,
          level: calculateLevel(user.points),
          badges: user.badges,
          streakDays: user.streakDays,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: newSession }) {
      if (user) {
        token.id = user.id;
        token.nickname = (user as any).nickname;
        token.schoolId = (user as any).schoolId;
        token.schoolName = (user as any).schoolName;
        token.grade = (user as any).grade;
        token.classNum = (user as any).classNum;
        token.points = (user as any).points;
        token.level = (user as any).level;
        token.badges = (user as any).badges;
        token.streakDays = (user as any).streakDays ?? 0;
        token.isAdmin = (user as any).isAdmin;
      }
      // Allow session update from client (e.g., nickname change)
      if (trigger === "update" && newSession) {
        if (newSession.nickname) token.nickname = newSession.nickname;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.nickname = token.nickname as string;
        session.user.schoolId = token.schoolId as string;
        session.user.schoolName = token.schoolName as string;
        session.user.grade = token.grade as number;
        session.user.classNum = token.classNum as number;
        session.user.points = token.points as number;
        session.user.level = token.level as number;
        session.user.badges = token.badges as string[];
        session.user.streakDays = (token.streakDays as number) ?? 0;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
});
