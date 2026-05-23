"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";
import { cn, timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

const NOTE_COLORS = [
  { label: "흰색", value: "#ffffff" },
  { label: "노란색", value: "#fef9c3" },
  { label: "파란색", value: "#dbeafe" },
  { label: "초록색", value: "#dcfce7" },
  { label: "분홍색", value: "#fce7f3" },
  { label: "보라색", value: "#ede9fe" },
];

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, examMode }: {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  examMode: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 border transition-all group cursor-pointer hover:-translate-y-0.5",
        examMode ? "border-[#2a2d6b]" : "border-[#e3e8ee]",
        note.pinned && !examMode && "ring-1 ring-[#533afd]/30"
      )}
      style={{
        background: examMode ? "#1c1e54" : note.color,
        boxShadow: examMode ? "none" : "0 2px 8px rgba(0,55,112,0.06), 0 1px 2px rgba(0,55,112,0.04)"
      }}
      onClick={() => onEdit(note)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={cn("font-medium text-sm leading-snug flex-1 line-clamp-2", examMode ? "text-white" : "text-[#0d253d]")}>
          {note.title || "제목 없음"}
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePin(note.id, !note.pinned); }}
            className={cn("p-1 rounded-lg transition-colors", note.pinned ? "text-[#533afd]" : examMode ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-[#533afd]")}
          >
            <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
              <path d="M8.5 2L12 5.5l-3 1-2.5 4L5 9l-3 3M5 9l1.5-2.5M8.5 2L10 1M8.5 2L5.5 5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            className={cn("p-1 rounded-lg transition-colors", examMode ? "text-white/40 hover:text-rose-400" : "text-gray-400 hover:text-rose-500")}
          >
            <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
              <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v4.5M8.5 6v4.5M3 3.5l.5 8.5h7l.5-8.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      {note.content && (
        <p className={cn("text-xs leading-relaxed line-clamp-4 mb-3", examMode ? "text-white/60" : "text-[#64748d]")}>
          {note.content}
        </p>
      )}
      <p className={cn("text-[10px]", examMode ? "text-white/30" : "text-[#64748d]/60")}>
        {timeAgo(new Date(note.updatedAt))}
        {note.pinned && <span className="ml-2 text-[#533afd]">고정됨</span>}
      </p>
    </div>
  );
}

function NoteEditor({ note, onSave, onClose, examMode }: {
  note: Partial<Note> | null;
  onSave: (data: { title: string; content: string; color: string }) => void;
  onClose: () => void;
  examMode: boolean;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [color, setColor] = useState(note?.color ?? "#ffffff");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: examMode ? "#0f1138" : color }}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        examMode ? "border-[#2a2d6b]" : "border-black/5"
      )}>
        <button onClick={onClose} className={cn("p-1", examMode ? "text-white/60" : "text-[#64748d]")}>
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {/* Color picker */}
          {!examMode && (
            <div className="flex gap-1.5">
              {NOTE_COLORS.map((c) => (
                <button key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn("w-5 h-5 rounded-full border-2 transition-transform",
                    color === c.value ? "border-[#533afd] scale-110" : "border-transparent")}
                  style={{ background: c.value === "#ffffff" ? "#f6f9fc" : c.value }}
                />
              ))}
            </div>
          )}
          <button onClick={() => onSave({ title, content, color })}
            className="px-4 py-1.5 bg-[#533afd] text-white text-sm rounded-full hover:bg-[#4434d4] transition-colors">
            저장
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className={cn(
            "w-full text-xl font-medium bg-transparent border-none outline-none mb-3",
            examMode ? "text-white placeholder:text-white/30" : "text-[#0d253d] placeholder:text-[#a8c3de]"
          )}
          style={{ letterSpacing: "-0.3px" }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요..."
          className={cn(
            "w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed",
            examMode ? "text-white/80 placeholder:text-white/25" : "text-[#273951] placeholder:text-[#a8c3de]"
          )}
          style={{ minHeight: "60vh" }}
        />
      </div>
    </div>
  );
}

export default function NotesPage() {
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Note> | null | "new">(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => fetch("/api/notes").then((r) => r.json()),
    enabled: !!session?.user,
  });
  const notes: Note[] = data?.notes ?? [];

  const createMutation = useMutation({
    mutationFn: (d: any) => fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); setEditing(null); },
    onError: () => toast.error("저장에 실패했어요"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => fetch(`/api/notes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); setEditing(null); },
    onError: () => toast.error("저장에 실패했어요"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/notes/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("노트가 삭제되었어요"); },
  });

  const handleSave = (d: { title: string; content: string; color: string }) => {
    if (!d.title.trim() && !d.content.trim()) { setEditing(null); return; }
    if (editing === "new" || !(editing as Note)?.id) {
      createMutation.mutate(d);
    } else {
      updateMutation.mutate({ id: (editing as Note).id, ...d });
    }
  };

  const handleTogglePin = (id: string, pinned: boolean) => {
    updateMutation.mutate({ id, pinned });
  };

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";

  if (!session?.user) return (
    <div className="text-center py-16">
      <p className={cn("text-sm", mutedText)}>로그인 후 이용할 수 있어요</p>
    </div>
  );

  return (
    <>
      {editing !== null && (
        <NoteEditor
          note={editing === "new" ? null : editing as Note}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          examMode={examMode}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn("text-xl font-light", textColor)} style={{ letterSpacing: "-0.4px" }}>미니 노트</h1>
            <p className={cn("text-sm", mutedText)}>나만의 메모 공간</p>
          </div>
          <button onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4] transition-colors">
            <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
            </svg>
            새 노트
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={cn("rounded-2xl h-32 animate-pulse border", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-gray-50 border-[#e3e8ee]")} />
            ))}
          </div>
        )}

        {!isLoading && notes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#eeeaff] flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#533afd]">
                <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth={1.5}/>
                <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
              </svg>
            </div>
            <p className={cn("font-medium mb-1", textColor)}>노트가 없어요</p>
            <p className={cn("text-sm mb-4", mutedText)}>자유롭게 메모를 남겨보세요</p>
            <button onClick={() => setEditing("new")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4]">
              + 첫 노트 만들기
            </button>
          </div>
        )}

        {notes.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={setEditing}
                onDelete={(id) => { if (confirm("노트를 삭제할까요?")) deleteMutation.mutate(id); }}
                onTogglePin={handleTogglePin}
                examMode={examMode}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
