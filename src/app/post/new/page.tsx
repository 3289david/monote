"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";
import { useCreatePost } from "@/hooks/usePosts";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import type { PostCategory, ImportanceLevel } from "@/types";

const SUBJECTS = ["국어", "수학", "영어", "과학", "사회", "역사", "물리", "화학", "생명과학", "지구과학", "한국사", "음악", "미술", "체육", "기술가정", "정보", "기타"];

const CATEGORIES: { value: PostCategory; label: string; desc: string; color: string }[] = [
  { value: "exam_range", label: "시험 범위", desc: "시험 범위, 출제 유형 공유", color: "bg-violet-100 border-violet-300 text-violet-700" },
  { value: "performance", label: "수행평가", desc: "준비물, 제출 날짜, 주제", color: "bg-rose-100 border-rose-300 text-rose-700" },
  { value: "materials", label: "자료 공유", desc: "필기, 정리노트, 프린트", color: "bg-sky-100 border-sky-300 text-sky-700" },
  { value: "teacher_info", label: "선생님 정보", desc: "시험 스타일, 출제 경향", color: "bg-amber-100 border-amber-300 text-amber-700" },
  { value: "question", label: "질문", desc: "모르는 것 물어보기", color: "bg-emerald-100 border-emerald-300 text-emerald-700" },
  { value: "general", label: "일반", desc: "기타 자유로운 글", color: "bg-gray-100 border-gray-300 text-gray-600" },
];

const IMPORTANCE_OPTIONS: { value: ImportanceLevel; label: string; desc: string; icon: string }[] = [
  { value: "critical", label: "무조건 외우기", desc: "시험에 반드시 나오는 내용", icon: "🔥" },
  { value: "high", label: "시험 가능성 높음", desc: "출제될 가능성이 높음", icon: "⚠" },
  { value: "medium", label: "중요", desc: "알아두면 좋은 내용", icon: "★" },
  { value: "low", label: "참고", desc: "기타 정보", icon: "•" },
];

export default function NewPostPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const createPost = useCreatePost();

  const user = session?.user;
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<PostCategory>("exam_range");
  const [subject, setSubject] = useState("수학");
  const [grade, setGrade] = useState<number>(user?.grade ?? 2);
  const [importance, setImportance] = useState<ImportanceLevel>("high");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setUploading(true);
    try {
      const results = await Promise.all(selected.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "업로드 실패");
        return { name: file.name, url: data.url, type: file.type };
      }));
      setUploadedFiles(results);
      toast.success(`${results.length}개 파일이 업로드되었어요`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    await createPost.mutateAsync({
      category,
      subject,
      grade,
      importance,
      title: title.trim(),
      content: content.trim(),
      anonymous,
      tags: tagList,
      files: uploadedFiles,
    });
    router.push("/feed");
  };

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";

  return (
    <div className={cn("min-h-screen pb-32", examMode ? "bg-[#0f1138]" : "bg-[#f6f9fc]")}>
      <header className={cn("sticky top-0 z-40 border-b flex items-center px-4 h-14", examMode ? "bg-[#1c1e54]/90 backdrop-blur-xl border-[#2a2d6b]" : "bg-white/90 backdrop-blur-xl border-[#e3e8ee]")}>
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className={cn("p-1 -ml-1 rounded-lg mr-3", examMode ? "text-white/70" : "text-[#64748d]")}>
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={cn("flex-1 text-base font-light", textColor)}>글 작성하기</h1>
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("w-2 h-2 rounded-full transition-all",
              step === s ? "bg-[#533afd] w-5" : step > s ? "bg-[#533afd]/50" : examMode ? "bg-white/20" : "bg-[#e3e8ee]")} />
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Step 1: Category & Subject & Grade */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className={cn("text-lg font-light mb-1", textColor)}>어떤 내용인가요?</h2>
              <p className={cn("text-sm", mutedText)}>카테고리와 과목을 선택하세요</p>
            </div>
            <div className="space-y-2">
              <p className={cn("text-xs font-medium uppercase tracking-wider", mutedText)}>카테고리</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat.value} onClick={() => setCategory(cat.value)}
                    className={cn("p-3 rounded-xl border-2 text-left transition-all",
                      category === cat.value ? cat.color + " border-2"
                        : examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white/70 hover:border-[#533afd]"
                        : "bg-white border-[#e3e8ee] hover:border-[#b9b9f9]")}>
                    <p className="font-medium text-sm">{cat.label}</p>
                    <p className={cn("text-xs mt-0.5", category === cat.value ? "opacity-70" : mutedText)}>{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className={cn("text-xs font-medium uppercase tracking-wider", mutedText)}>학년</p>
              <div className="flex gap-2">
                {[1, 2, 3].map((g) => (
                  <button key={g} onClick={() => setGrade(g)}
                    className={cn("flex-1 py-2 rounded-xl font-medium text-sm transition-all",
                      grade === g ? "bg-[#533afd] text-white"
                        : examMode ? "bg-[#1c1e54] text-white/60 border border-[#2a2d6b] hover:border-[#533afd]"
                        : "bg-white text-[#273951] border border-[#e3e8ee] hover:border-[#533afd]")}>
                    {g}학년
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className={cn("text-xs font-medium uppercase tracking-wider", mutedText)}>과목</p>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((subj) => (
                  <button key={subj} onClick={() => setSubject(subj)}
                    className={cn("px-3 py-1.5 rounded-full text-sm border transition-all",
                      subject === subj ? "bg-[#533afd] text-white border-[#533afd]"
                        : examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white/60 hover:border-[#533afd]"
                        : "bg-white border-[#e3e8ee] text-[#273951] hover:border-[#533afd]")}>
                    {subj}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => setStep(2)} fullWidth>다음 단계</Button>
          </div>
        )}

        {/* Step 2: Content */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className={cn("text-lg font-light mb-1", textColor)}>내용을 작성하세요</h2>
              <p className={cn("text-sm", mutedText)}>정확하고 도움이 되는 정보를 공유해주세요</p>
            </div>
            <div className="space-y-2">
              <p className={cn("text-xs font-medium uppercase tracking-wider", mutedText)}>중요도</p>
              <div className="grid grid-cols-2 gap-2">
                {IMPORTANCE_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setImportance(opt.value)}
                    className={cn("p-3 rounded-xl border-2 text-left transition-all",
                      importance === opt.value ? "border-[#533afd] bg-[#eeeaff]"
                        : examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white/70 hover:border-[#533afd]"
                        : "bg-white border-[#e3e8ee] hover:border-[#b9b9f9]")}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{opt.icon}</span>
                      <div>
                        <p className={cn("font-medium text-sm", importance === opt.value ? "text-[#533afd]" : textColor)}>{opt.label}</p>
                        <p className={cn("text-[11px] mt-0.5", mutedText)}>{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={cn("text-xs font-medium uppercase tracking-wider mb-2", mutedText)}>제목</p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" maxLength={100}
                className={cn("w-full rounded-xl px-4 py-3 text-base border transition-colors focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white placeholder:text-white/30" : "bg-white border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")} />
              <p className={cn("text-xs mt-1 text-right", mutedText)}>{title.length}/100</p>
            </div>
            <div>
              <p className={cn("text-xs font-medium uppercase tracking-wider mb-2", mutedText)}>내용</p>
              <textarea value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 자세히 입력해주세요." rows={8}
                className={cn("w-full rounded-xl px-4 py-3 text-sm leading-relaxed border resize-none transition-colors focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white placeholder:text-white/30" : "bg-white border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")} />
            </div>
            <div className={cn("flex items-center justify-between p-3 rounded-xl", examMode ? "bg-[#1c1e54]" : "bg-white border border-[#e3e8ee]")}>
              <div>
                <p className={cn("text-sm font-medium", textColor)}>익명으로 작성</p>
                <p className={cn("text-xs", mutedText)}>닉네임 대신 "익명"으로 표시됩니다</p>
              </div>
              <button onClick={() => setAnonymous(!anonymous)}
                className={cn("w-11 h-6 rounded-full transition-all relative", anonymous ? "bg-[#533afd]" : examMode ? "bg-[#2a2d6b]" : "bg-[#e3e8ee]")}>
                <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", anonymous ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">이전</Button>
              <Button onClick={() => setStep(3)} className="flex-1" disabled={!title.trim() || !content.trim()}>다음</Button>
            </div>
          </div>
        )}

        {/* Step 3: Tags & Files & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className={cn("text-lg font-light mb-1", textColor)}>마지막 단계</h2>
              <p className={cn("text-sm", mutedText)}>태그와 파일을 추가하고 게시해주세요</p>
            </div>
            <div>
              <p className={cn("text-xs font-medium uppercase tracking-wider mb-2", mutedText)}>태그 (쉼표로 구분)</p>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="예: 중간고사, 삼각함수, 3단원"
                className={cn("w-full rounded-xl px-4 py-3 text-sm border transition-colors focus:outline-none focus:border-[#533afd]",
                  examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white placeholder:text-white/30" : "bg-white border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]")} />
            </div>
            <div>
              <p className={cn("text-xs font-medium uppercase tracking-wider mb-2", mutedText)}>파일 첨부 (선택)</p>
              <label className={cn("flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                examMode ? "border-[#2a2d6b] hover:border-[#533afd] bg-[#1c1e54]" : "border-[#e3e8ee] hover:border-[#533afd] bg-white")}>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx" className="hidden" onChange={handleFileChange} />
                <svg viewBox="0 0 24 24" fill="none" className={cn("w-6 h-6 mb-1", mutedText)}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth={1.5} />
                  <path d="M12 18v-6M9 15l3-3 3 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                </svg>
                <p className={cn("text-sm", mutedText)}>
                  {uploading ? "업로드 중..." : uploadedFiles.length > 0 ? `${uploadedFiles.length}개 파일 업로드됨` : "PDF, 이미지, 문서 파일 첨부"}
                </p>
                <p className={cn("text-xs mt-0.5 opacity-60", mutedText)}>교과서 전체 PDF는 저작권 위반입니다</p>
              </label>
            </div>
            <div className={cn("rounded-xl border p-4 space-y-2", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")}>
              <p className={cn("text-xs font-medium uppercase tracking-wider", mutedText)}>미리보기</p>
              <p className={cn("font-light text-base", textColor)}>{title}</p>
              <p className={cn("text-sm leading-relaxed line-clamp-3", mutedText)}>{content}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#eeeaff] text-[#533afd]">{subject}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#f6f9fc] text-[#64748d]">{grade}학년</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#f6f9fc] text-[#64748d]">{anonymous ? "익명" : user?.nickname}</span>
              </div>
            </div>
            <div className={cn("text-xs leading-relaxed p-3 rounded-xl", examMode ? "bg-[#1c1e54] text-white/40" : "bg-[#f6f9fc] text-[#64748d]")}>
              허위 정보 게시, 타인 비방, 저작권 위반 게시물은 삭제될 수 있습니다. 개인정보는 포함하지 마세요.
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">이전</Button>
              <Button onClick={handleSubmit} loading={createPost.isPending || uploading} className="flex-1">게시하기</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
