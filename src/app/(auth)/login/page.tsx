"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/feed";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const error = searchParams.get("error");

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      if (res.error === "계정이 정지되었습니다.") {
        toast.error("계정이 정지되었습니다. 관리자에게 문의해주세요.");
      } else {
        toast.error("이메일 또는 비밀번호가 올바르지 않아요");
      }
      return;
    }

    toast.success("로그인되었어요!");
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Gradient mesh hero */}
      <div className="gradient-mesh h-56 flex items-end pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="max-w-md mx-auto w-full px-6 relative">
          <svg viewBox="0 0 32 32" fill="none" className="w-12 h-12 mb-3">
            <rect width="32" height="32" rx="8" fill="white" fillOpacity={0.9}/>
            <path d="M5 25V7h4.5l6.5 11 6.5-11H27v18h-4.5V14.5l-6 9-6-9V25H5z" fill="#533afd"/>
          </svg>
          <h1 className="text-3xl font-light text-white" style={{ letterSpacing: "-0.8px" }}>monote</h1>
          <p className="text-white/80 text-sm mt-1">학생들을 위한 스터디 커뮤니티</p>
        </div>
      </div>

      <div className="flex-1 bg-[#f6f9fc] px-6 py-8">
        <div className="max-w-md mx-auto space-y-5">
          <div className="bg-white rounded-2xl border border-[#e3e8ee] p-6 shadow-[0_8px_24px_rgba(0,55,112,0.08)]">
            <h2 className="text-xl font-light text-[#0d253d] mb-5" style={{ letterSpacing: "-0.4px" }}>로그인</h2>

            {error === "OAuthAccountNotLinked" && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                이미 다른 방식으로 가입된 이메일이에요.
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="이메일"
                type="email"
                placeholder="student@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                leftIcon={<svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={1.3}/><path d="M1 6l7 4 7-4" stroke="currentColor" strokeWidth={1.3}/></svg>}
              />
              <Input
                label="비밀번호"
                type={showPw ? "text" : "password"}
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                leftIcon={<svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth={1.3}/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/></svg>}
                rightIcon={
                  <button type="button" onClick={() => setShowPw(!showPw)}>
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                      {showPw ? <path d="M8 3C4 3 1 8 1 8s3 5 7 5 7-5 7-5-3-5-7-5zm0 7a2 2 0 110-4 2 2 0 010 4z" stroke="currentColor" strokeWidth={1.2}/> : <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10M8 3C4 3 1 8 1 8s.8 1.2 2.2 2.4M13 5.5C14.3 6.8 15 8 15 8s-3 5-7 5a6 6 0 01-2.5-.6" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"/>}
                    </svg>
                  </button>
                }
              />
            </div>

            <Button onClick={handleLogin} loading={loading} fullWidth className="mt-5">로그인</Button>
            <Link href="/forgot-password" className="block text-center text-sm text-[#533afd] mt-3 hover:underline">비밀번호를 잊으셨나요?</Link>
          </div>

          <div className="text-center">
            <span className="text-sm text-[#64748d]">아직 계정이 없으신가요? </span>
            <Link href="/register" className="text-sm text-[#533afd] font-medium hover:underline">회원가입</Link>
          </div>

          <p className="text-xs text-center text-[#64748d] leading-relaxed px-4">
            로그인 시 <a href="/terms" className="text-[#533afd]">이용약관</a> 및{" "}
            <a href="/privacy" className="text-[#533afd]">개인정보 처리방침</a>에 동의하게 됩니다.
            본 서비스는 학생 전용입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
