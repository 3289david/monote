"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Trending posts + hot tags + top contributors
export function useTrending(type: "today" | "week" | "month" = "week") {
  return useQuery({
    queryKey: ["trending", type],
    queryFn: async () => {
      const res = await fetch(`/api/community/trending?type=${type}`);
      if (!res.ok) throw new Error("트렌딩을 불러오지 못했어요");
      return res.json();
    },
    staleTime: 60_000, // 1 minute
  });
}

// Polls
export function usePolls() {
  return useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      const res = await fetch("/api/community/polls");
      if (!res.ok) throw new Error("투표를 불러오지 못했어요");
      return res.json();
    },
  });
}

export function useCreatePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { question: string; options: string[]; isAnonymous: boolean; endsAt?: string }) => {
      const res = await fetch("/api/community/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "투표 생성에 실패했어요");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["polls"] });
      toast.success("투표가 등록됐어요!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useVotePoll(pollId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (optionId: string) => {
      const res = await fetch(`/api/community/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "투표에 실패했어요");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["polls"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// Reactions
export function useReactions(postId: string) {
  return useQuery({
    queryKey: ["reactions", postId],
    queryFn: async () => {
      const res = await fetch(`/api/reactions?postId=${postId}`);
      if (!res.ok) throw new Error("반응을 불러오지 못했어요");
      return res.json();
    },
    enabled: !!postId,
  });
}

export function useToggleReaction(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emoji: string) => {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, emoji }),
      });
      if (!res.ok) throw new Error("반응에 실패했어요");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reactions", postId] });
      // Haptic feedback if available
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(30);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// Share (v.gd shortening)
export function useShare() {
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(`/api/share?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("공유 링크 생성 실패");
      return res.json() as Promise<{ shortUrl: string; longUrl: string; fallback?: boolean }>;
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
