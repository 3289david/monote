"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn, generateNickname } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";

async function createSchool(name: string, type: string, region: string) {
  const res = await fetch("/api/schools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type, region }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "학교 추가에 실패했어요");
  return data.school as { id: string; name: string };
}

const STEPS = ["학교 선택", "학년/반", "닉네임", "계정 정보"];

const passwordSchema = z.string()
  .min(8, "8자 이상")
  .regex(/[A-Za-z]/, "영문 포함")
  .regex(/[0-9]/, "숫자 포함");

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<{ id: string; name: string } | null>(null);
  const [grade, setGrade] = useState(1);
  const [classNum, setClassNum] = useState(1);
  const [nickname, setNickname] = useState(generateNickname());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addingSchool, setAddingSchool] = useState(false);
  const [newSchoolType, setNewSchoolType] = useState<"high" | "middle">("high");
  const [newSchoolRegion, setNewSchoolRegion] = useState("");

  const { data: schoolData } = useQuery({
    queryKey: ["schools", schoolQuery],
    queryFn: () => fetch(`/api/schools?q=${encodeURIComponent(schoolQuery)}`).then(r => r.json()),
    staleTime: 60000,
  });

  const schools = schoolData?.schools ?? [];

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 2) {
      if (nickname.trim().length < 2) newErrors.nickname = "닉네임은 2자 이상이어야 해요";
      if (nickname.trim().length > 15) newErrors.nickname = "닉네임은 15자 이하여야 해요";
      if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname)) newErrors.nickname = "특수문자는 사용할 수 없어요";
    }
    if (step === 3) {
      if (!email.includes("@")) newErrors.email = "유효한 이메일을 입력해주세요";
      try { passwordSchema.parse(password); }
      catch (e: any) { newErrors.password = e.errors[0]?.message; }
      if (password !== confirmPw) newErrors.confirmPw = "비밀번호가 일치하지 않아요";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canNext = [
    !!selectedSchool,
    grade > 0 && classNum > 0,
    nickname.trim().length >= 2,
    !!(email && password && confirmPw && agreed),
  ][step];

  const handleRegister = async () => {
    if (!validateStep()) return;
    if (!selectedSchool) return;
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          nickname: nickname.trim(),
          schoolId: selectedSchool.id,
          grade,
          classNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "회원가입에 실패했어요");

      // Auto login
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) throw new Error("로그인에 실패했어요");

      toast.success("환영해요! monote에 오신 걸 환영합니다!");
      router.push("/feed");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#e3e8ee] px-4 h-14 flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} className="text-[#64748d]">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={cn("h-1 rounded-full transition-all", i <= step ? "bg-[#533afd]" : "bg-[#e3e8ee]", i === step ? "flex-1" : "w-6")} />
          ))}
        </div>
        <span className="text-xs text-[#64748d]">{step + 1}/{STEPS.length}</span>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-5 py-5">
        {/* Step 0: School */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-light text-[#0d253d]" style={{ letterSpacing: "-0.4px" }}>학교를 선택하세요</h2>
              <p className="text-sm text-[#64748d] mt-1">학교별 정보를 공유하고 소통해요</p>
            </div>
            <Input placeholder="학교 이름 검색..." value={schoolQuery} onChange={(e) => setSchoolQuery(e.target.value)}
              leftIcon={<svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth={1.3}/><path d="M11 11l3 3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/></svg>}
            />
            <div className="space-y-2">
              {schools.map((s: any) => (
                <button key={s.id} onClick={() => setSelectedSchool(s)}
                  className={cn("w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all",
                    selectedSchool?.id === s.id ? "border-[#533afd] bg-[#eeeaff]" : "border-[#e3e8ee] bg-white hover:border-[#b9b9f9]"
                  )}>
                  <div>
                    <p className="font-medium text-[#0d253d]">{s.name}</p>
                    <p className="text-sm text-[#64748d]">{s.type === "high" ? "고등학교" : "중학교"} · {s.region} · {s.memberCount}명 참여</p>
                  </div>
                  {selectedSchool?.id === s.id && (
                    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 flex-shrink-0">
                      <circle cx="10" cy="10" r="9" fill="#533afd"/>
                      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
              {schools.length === 0 && schoolQuery && !addingSchool && (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-[#64748d]">"{schoolQuery}" 학교를 찾을 수 없어요</p>
                  <button onClick={() => setAddingSchool(true)}
                    className="text-sm text-[#533afd] font-medium hover:underline">
                    + 직접 학교 추가하기
                  </button>
                </div>
              )}
              {addingSchool && (
                <div className="border-2 border-[#533afd] rounded-xl p-4 space-y-3 bg-[#f8f7ff]">
                  <p className="font-medium text-[#0d253d] text-sm">학교 추가</p>
                  <p className="text-xs text-[#64748d]">학교명: <span className="font-medium text-[#273951]">{schoolQuery}</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["high", "middle"] as const).map((t) => (
                      <button key={t} onClick={() => setNewSchoolType(t)}
                        className={cn("py-2 rounded-lg border-2 text-sm transition-all",
                          newSchoolType === t ? "border-[#533afd] bg-[#eeeaff] text-[#533afd]" : "border-[#e3e8ee] bg-white text-[#273951]"
                        )}>
                        {t === "high" ? "고등학교" : "중학교"}
                      </button>
                    ))}
                  </div>
                  <Input placeholder="지역 (예: 서울, 부산)" value={newSchoolRegion}
                    onChange={(e) => setNewSchoolRegion(e.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setAddingSchool(false)} className="flex-1 !py-2 text-sm">취소</Button>
                    <Button disabled={!newSchoolRegion.trim()} className="flex-1 !py-2 text-sm"
                      onClick={async () => {
                        try {
                          const school = await createSchool(schoolQuery, newSchoolType, newSchoolRegion.trim());
                          setSelectedSchool(school);
                          setAddingSchool(false);
                          toast.success("학교가 추가되었어요!");
                        } catch (e: any) {
                          toast.error(e.message);
                        }
                      }}>
                      추가
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Grade + Class */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-light text-[#0d253d]" style={{ letterSpacing: "-0.4px" }}>학년과 반을 선택하세요</h2>
              <p className="text-sm text-[#64748d] mt-1">같은 학년/반 친구들과 정보를 공유해요</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#273951] mb-2">학년</p>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((g) => (
                  <button key={g} onClick={() => setGrade(g)}
                    className={cn("py-4 rounded-xl border-2 text-center font-medium transition-all",
                      grade === g ? "border-[#533afd] bg-[#eeeaff] text-[#533afd]" : "border-[#e3e8ee] bg-white text-[#273951] hover:border-[#b9b9f9]"
                    )}>
                    {g}학년
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#273951] mb-2">반</p>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 15 }, (_, i) => i + 1).map((c) => (
                  <button key={c} onClick={() => setClassNum(c)}
                    className={cn("py-3 rounded-xl border-2 text-sm text-center transition-all",
                      classNum === c ? "border-[#533afd] bg-[#eeeaff] text-[#533afd] font-medium" : "border-[#e3e8ee] bg-white text-[#273951] hover:border-[#b9b9f9]"
                    )}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Nickname */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-light text-[#0d253d]" style={{ letterSpacing: "-0.4px" }}>닉네임을 정하세요</h2>
              <p className="text-sm text-[#64748d] mt-1">실명 대신 닉네임을 사용해요. 나중에 변경 가능해요</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input placeholder="닉네임 (2~15자)" value={nickname} onChange={(e) => setNickname(e.target.value)}
                  maxLength={15} error={errors.nickname}
                />
              </div>
              <button onClick={() => setNickname(generateNickname())}
                className="px-3 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] text-[#64748d] hover:border-[#533afd] transition-colors flex-shrink-0">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M14 2v4h-4M2 14v-4h4M2 6A6 6 0 0114 10M14 10A6 6 0 012 6" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-[#64748d]">예시: 졸린수학신, 족보수집가, 수학포기자...<br/>실명, 학번, 학교명은 포함할 수 없어요</p>

            {/* Preview */}
            <div className="bg-white rounded-xl border border-[#e3e8ee] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#533afd] to-[#1c1e54] flex items-center justify-center text-white font-medium">
                {nickname[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="font-medium text-[#0d253d]">{nickname || "닉네임"}</p>
                <p className="text-xs text-[#64748d]">새싹 · 0P · {selectedSchool?.name} {grade}학년 {classNum}반</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Account */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-light text-[#0d253d]" style={{ letterSpacing: "-0.4px" }}>계정 정보 입력</h2>
              <p className="text-sm text-[#64748d] mt-1">이메일과 비밀번호를 설정해요</p>
            </div>
            <Input label="이메일" type="email" placeholder="이메일 입력" value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
              error={errors.email} autoComplete="email"
            />
            <Input label="비밀번호" type="password" placeholder="영문+숫자 8자 이상" value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
              error={errors.password} autoComplete="new-password"
            />
            <Input label="비밀번호 확인" type="password" placeholder="비밀번호 재입력" value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setErrors(p => ({ ...p, confirmPw: "" })); }}
              error={errors.confirmPw} autoComplete="new-password"
            />

            {/* Password strength */}
            {password && (
              <div className="space-y-1">
                {[
                  { label: "8자 이상", ok: password.length >= 8 },
                  { label: "영문 포함", ok: /[A-Za-z]/.test(password) },
                  { label: "숫자 포함", ok: /[0-9]/.test(password) },
                ].map((rule) => (
                  <div key={rule.label} className={cn("flex items-center gap-1.5 text-xs", rule.ok ? "text-emerald-600" : "text-[#64748d]")}>
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      {rule.ok ? <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/> : <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth={1}/>}
                    </svg>
                    {rule.label}
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#e3e8ee] cursor-pointer">
              <button type="button" onClick={() => setAgreed(!agreed)}
                className={cn("w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all",
                  agreed ? "bg-[#533afd] border-[#533afd]" : "border-[#a8c3de]"
                )}>
                {agreed && <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3"><path d="M2 5l2.5 2.5 4-5" stroke="white" strokeWidth={1.5} strokeLinecap="round"/></svg>}
              </button>
              <p className="text-sm text-[#273951]">
                <a href="/terms" target="_blank" className="text-[#533afd]">이용약관</a>과{" "}
                <a href="/privacy" target="_blank" className="text-[#533afd]">개인정보 처리방침</a>에 동의합니다.
                허위 정보 게시 시 계정이 정지될 수 있습니다.
              </p>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">이전</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext} disabled={!canNext} className="flex-1">다음</Button>
          ) : (
            <Button onClick={handleRegister} loading={loading} disabled={!canNext} className="flex-1">가입 완료</Button>
          )}
        </div>

        {step === 0 && (
          <p className="text-center text-sm text-[#64748d] mt-4">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-[#533afd] font-medium hover:underline">로그인</Link>
          </p>
        )}
      </div>
    </div>
  );
}
