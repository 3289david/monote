import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 해요"),
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 해요")
    .max(15, "닉네임은 15자 이하여야 해요")
    .regex(/^[가-힣a-zA-Z0-9_]+$/, "닉네임에 특수문자는 사용할 수 없어요"),
  schoolId: z.string(),
  grade: z.number().int().min(1).max(3),
  classNum: z.number().int().min(1).max(20),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일이에요" },
        { status: 409 }
      );
    }

    // Check duplicate nickname
    const existingNick = await prisma.user.findUnique({
      where: { nickname: data.nickname },
    });
    if (existingNick) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임이에요" },
        { status: 409 }
      );
    }

    // Verify school exists
    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) {
      return NextResponse.json({ error: "학교를 찾을 수 없어요" }, { status: 404 });
    }

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        nickname: data.nickname,
        schoolId: data.schoolId,
        grade: data.grade,
        classNum: data.classNum,
      },
    });

    // Increment school member count
    await prisma.school.update({
      where: { id: data.schoolId },
      data: { memberCount: { increment: 1 } },
    });

    // Auto-join default chat rooms for this school
    const defaultRooms = await prisma.chatRoom.findMany({
      where: { schoolId: data.schoolId, isDefault: true },
    });
    if (defaultRooms.length > 0) {
      await prisma.chatMember.createMany({
        data: defaultRooms.map((r) => ({ roomId: r.id, userId: user.id })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? "입력값을 확인해주세요" },
        { status: 400 }
      );
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했어요" }, { status: 500 });
  }
}
