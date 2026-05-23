"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCreatePost } from "@/hooks/usePosts";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const SUBJECTS = ["국어", "수학", "영어", "과학", "사회", "역사", "물리", "화학", "생명과학", "지구과학", "한국사", "음악", "미술", "체육", "기술가정", "정보", "기타"];

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("w-3.5 h-3.5", className)}>
      <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth={1.3}/>
      <path d="M1 7h14" stroke="currentColor" strokeWidth={1.3}/>
      <path d="M5 1v3M11 1v3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
    </svg>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("w-3.5 h-3.5", className)}>
      <rect x="2" y="3" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth={1.3}/>
      <path d="M5 3V2a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth={1.3}/>
      <path d="M4 8h8M4 11h5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
    </svg>
  );
}

function IconPaperclip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("w-3.5 h-3.5", className)}>
      <path d="M13.5 7.5L7 14a4 4 0 01-5.657-5.657L8 1.686A2.5 2.5 0 1111.536 5.22L5.05 11.707A1 1 0 013.636 10.29L10 3.929" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("w-3.5 h-3.5", className)}>
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth={1.3}/>
      <path d="M2 14v-.5a6 6 0 0112 0V14" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn("w-3.5 h-3.5", className)}>
      <path d="M8 3C6 2 4 2 2 3v10c2-1 4-1 6 0V3z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
      <path d="M8 3c2-1 4-1 6 0v10c-2-1-4-1-6 0V3z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
    </svg>
  );
}

function IconFileDoc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("w-6 h-6", className)}>
      <rect x="6" y="2" width="20" height="28" rx="3" stroke="currentColor" strokeWidth={1.5}/>
      <path d="M10 10h12M10 14h12M10 18h8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
    </svg>
  );
}

function IconFilePdf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("w-6 h-6", className)}>
      <rect x="6" y="2" width="20" height="28" rx="3" stroke="currentColor" strokeWidth={1.5}/>
      <path d="M10 18h4a2 2 0 000-4h-4v8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 14v8M20 14h2a2 2 0 010 4h-2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function NewPostPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const createPost = useCreatePost();
  const user = session?.user;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("수학");
  const [grade, setGrade] = useState<number>(user?.grade ?? 2);
  const [anonymous, setAnonymous] = useState(false);

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [examDate, setExamDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; type: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const growTextarea = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  };

  const addTag = useCallback((raw: string) => {
    const tag = raw.replace(/^#/, "").trim().toLowerCase().replace(/\s+/g, "");
    if (tag && !tags.includes(tag) && tags.length < 10 && tag.length <= 20) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  }, [tags]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", " ", ","].includes(e.key)) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setUploading(true);
    try {
      const results = await Promise.all(selected.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "업로드 실패");
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (ev) => setImagePreviews((p) => ({ ...p, [data.url]: ev.target?.result as string }));
          reader.readAsDataURL(file);
        }
        return { name: file.name, url: data.url, type: data.type, size: data.size };
      }));
      setUploadedFiles((prev) => [...prev, ...results]);
      toast.success(`${results.length}개 파일 업로드됨`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (url: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.url !== url));
    setImagePreviews((prev) => { const n = { ...prev }; delete n[url]; return n; });
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error("제목을 입력해주세요"); return; }
    if (!content.trim()) { toast.error("내용을 입력해주세요"); return; }
    if (tagInput.trim()) addTag(tagInput);

    await createPost.mutateAsync({
      title: title.trim(),
      content: content.trim(),
      subject,
      grade,
      category: "general",
      importance: "medium",
      anonymous,
      tags,
      files: uploadedFiles,
      examDate: examDate ? new Date(examDate).toISOString() : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });
    router.push("/feed");
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 h-12">
        <button onClick={() => router.back()} className="text-gray-500 p-1 -ml-1 mr-auto text-sm flex items-center gap-1">
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
            <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          취소
        </button>
        <button onClick={handleSubmit} disabled={!title.trim() || !content.trim() || createPost.isPending || uploading}
          className="px-5 py-1.5 bg-[#533afd] text-white text-sm font-medium rounded-full disabled:opacity-40 hover:bg-[#4434d4] transition-colors">
          {createPost.isPending ? "게시 중..." : "게시하기"}
        </button>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Title input */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          maxLength={100}
          className="w-full px-4 pt-5 pb-2 text-lg font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none"
        />

        {/* Content textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); growTextarea(); }}
          placeholder="내용을 입력하세요..."
          className="w-full px-4 py-2 text-[15px] text-gray-800 placeholder:text-gray-300 focus:outline-none resize-none leading-relaxed"
          style={{ minHeight: "180px" }}
        />

        {content.length > 500 && (
          <p className={cn("text-right text-xs px-4 pb-1", content.length > 9000 ? "text-red-400" : "text-gray-300")}>
            {content.length}/10000
          </p>
        )}

        {/* Tag input */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5 items-center">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 text-sm px-2.5 py-1 rounded-full bg-[#eeeaff] text-[#533afd]">
                #{t}
                <button onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors leading-none">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                  </svg>
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
              placeholder={tags.length === 0 ? "#해시태그 추가 (스페이스 또는 엔터)" : "+ 추가"}
              className="flex-1 min-w-[120px] text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none py-1"
            />
          </div>
        </div>

        {/* File previews */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((f) => (
              <div key={f.url} className="relative group">
                {imagePreviews[f.url] ? (
                  <img src={imagePreviews[f.url]} alt={f.name}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-200"/>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-1">
                    {f.type === "pdf"
                      ? <IconFilePdf className="text-rose-400" />
                      : <IconFileDoc className="text-blue-400" />}
                    <span className="text-[9px] text-gray-400 text-center truncate w-full px-1">{f.name}</span>
                  </div>
                )}
                <button onClick={() => removeFile(f.url)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Options toolbar */}
        <div className="px-4 py-3 border-t border-gray-100 space-y-3">
          {/* Subject + Grade row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <IconBook className="text-gray-400" />
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="text-sm text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer">
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {[1, 2, 3].map((g) => (
                <button key={g} onClick={() => setGrade(g)}
                  className={cn("w-8 h-7 rounded-lg text-xs font-medium transition-colors",
                    grade === g ? "bg-[#533afd] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}>
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          {/* Exam date */}
          <div className="flex items-center gap-2">
            <IconCalendar className="text-gray-400" />
            <span className="text-sm text-gray-400">시험 날짜</span>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} min={today}
              className="text-sm text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer ml-auto"
            />
            {examDate && (
              <button onClick={() => setExamDate("")} className="text-gray-300 hover:text-red-400 transition-colors">
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                  <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Due date */}
          <div className="flex items-center gap-2">
            <IconClipboard className="text-gray-400" />
            <span className="text-sm text-gray-400">제출 마감</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={today}
              className="text-sm text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer ml-auto"
            />
            {dueDate && (
              <button onClick={() => setDueDate("")} className="text-gray-300 hover:text-red-400 transition-colors">
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                  <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* File upload */}
          <div className="flex items-center gap-2">
            <IconPaperclip className="text-gray-400" />
            <span className="text-sm text-gray-400">파일</span>
            <label className={cn("ml-auto text-sm cursor-pointer transition-colors font-medium", uploading ? "text-gray-300" : "text-[#533afd] hover:text-[#4434d4]")}>
              {uploading ? "업로드 중..." : uploadedFiles.length > 0 ? `${uploadedFiles.length}개 첨부됨 · 추가` : "파일 첨부"}
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.ppt,.pptx"
                className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconUser className="text-gray-400" />
              <span className="text-sm text-gray-400">익명으로 게시</span>
            </div>
            <button onClick={() => setAnonymous(!anonymous)}
              className={cn("w-10 rounded-full transition-colors relative flex-shrink-0", anonymous ? "bg-[#533afd]" : "bg-gray-200")}
              style={{ height: "22px" }}>
              <div className={cn("absolute top-0.5 bg-white rounded-full shadow transition-transform", anonymous ? "translate-x-5" : "translate-x-0.5")}
                style={{ width: "18px", height: "18px" }} />
            </button>
          </div>
        </div>

        <p className="px-4 pb-6 text-xs text-gray-300 leading-relaxed">
          허위 정보, 타인 비방, 저작권 위반 게시물은 삭제될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
