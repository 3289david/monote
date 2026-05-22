import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "유효한 이메일을 입력해주세요" }, { status: 400 });

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent user enumeration
  if (!user) return NextResponse.json({ success: true });

  // Generate reset token (store as VerificationToken)
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.verificationToken.upsert({
    where: { identifier_token: { identifier: email, token } },
    create: { identifier: email, token, expires },
    update: { expires },
  });

  // TODO: Send email with reset link
  // In production, integrate with an email service (Nodemailer, Resend, etc.)
  // const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  console.log(`[Password Reset] Token for ${email}: ${token}`);

  return NextResponse.json({ success: true });
}
