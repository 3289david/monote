"use client";
import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "done">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.includes("@")) {
      toast.error("유효한 이메일을 입력해주세요");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "오류가 발생했어요");
      setStep("done");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <svg viewBox="0 0 32 32" fill="none" className="w-10 h-10 mx-auto mb-3">
            <rect width="32" height="32" rx="8" fill="#533afd" />
            <path d="M5 25V7h4.5l6.5 11 6.5-11H27v18h-4.5V14.5l-6 9-6-9V25H5z" fill="white" />
          </svg>
          <h1 className="text-2xl font-light text-[#0d253d]" style={{ letterSpacing: "-0.5px" }}>비밀번호 찾기</h1>
        </div>

        <div className="bg-white rounded-2xl border border-[#e3e8ee] p-6 shadow-[0_8px_24px_rgba(0,55,112,0.08)]">
          {step === "email" ? (
            <>
              <p className="text-sm text-[#64748d] mb-5">
                가입 시 사용한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드려요.
              </p>
              <div className="space-y-4">
                <Input
                  label="이메일"
                  type="email"
                  placeholder="student@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSubmit()}
                  leftIcon={
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={1.3} />
                      <path d="M1 6l7 4 7-4" stroke="currentColor" strokeWidth={1.3} />
                    </svg>
                  }
                />
                <Button onClick={handleSubmit} loading={loading} fullWidth>재설정 링크 전송</Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-emerald-600">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-[#0d253d] mb-2">이메일을 확인해주세요</h2>
              <p className="text-sm text-[#64748d]">
                <strong>{email}</strong> 으로<br />비밀번호 재설정 링크를 전송했어요.
              </p>
              <p className="text-xs text-[#64748d] mt-3">이메일이 오지 않으면 스팸 폴더를 확인해보세요.</p>
              <Button variant="ghost" onClick={() => router.push("/login")} className="mt-5">로그인으로 돌아가기</Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-[#64748d]">
          비밀번호를 기억하셨나요?{" "}
          <Link href="/login" className="text-[#533afd] font-medium hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
