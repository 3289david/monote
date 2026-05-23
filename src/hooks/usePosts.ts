"use client";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { PostCategory } from "@/types";

interface PostFilter {
  grade?: number;
  subject?: string;
  category?: PostCategory;
  sortBy?: "latest" | "popular" | "hot";
  examMode?: boolean;
  scope?: "school" | "all";
}

async function fetchPosts(params: PostFilter & { page: number }) {
  const qs = new URLSearchParams();
  if (params.grade) qs.set("grade", String(params.grade));
  if (params.subject) qs.set("subject", params.subject);
  if (params.category) qs.set("category", params.category);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.examMode) qs.set("examMode", "true");
  if (params.scope) qs.set("scope", params.scope);
  qs.set("page", String(params.page));

  const res = await fetch(`/api/posts?${qs}`);
  if (!res.ok) throw new Error("게시물을 불러오지 못했어요");
  return res.json();
}

export function usePosts(filter: PostFilter) {
  return useInfiniteQuery({
    queryKey: ["posts", filter],
    queryFn: ({ pageParam = 1 }) => fetchPosts({ ...filter, page: pageParam as number }),
    getNextPageParam: (last) => last.page < last.pages ? last.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) throw new Error("게시물을 찾을 수 없어요");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "게시물 등록에 실패했어요");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      toast.success("게시물이 등록되었어요!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제에 실패했어요");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      toast.success("게시물이 삭제되었어요");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useVote(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${postId}/vote`, { method: "POST" });
      if (!res.ok) throw new Error("추천에 실패했어요");
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      toast.success(data.voted ? "추천했어요!" : "추천을 취소했어요");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useBookmark(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" });
      if (!res.ok) throw new Error("북마크에 실패했어요");
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      toast.success(data.bookmarked ? "북마크에 저장했어요" : "북마크를 해제했어요");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error("댓글을 불러오지 못했어요");
      return res.json();
    },
    enabled: !!postId,
    refetchInterval: 10000, // Poll every 10s
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { content: string; anonymous: boolean; parentId?: string }) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("댓글 등록에 실패했어요");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
