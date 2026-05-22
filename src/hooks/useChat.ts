"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: string;
  fileUrl?: string;
  createdAt: string | Date;
  sender: {
    id: string;
    nickname: string;
    level: number;
    avatar?: string | null;
  };
}

export interface TypingUser {
  userId: string;
  nickname: string;
}

export function useChat(roomId: string) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.user || !roomId) return;

    const socket = io(window.location.origin, {
      auth: {
        userId: session.user.id,
        nickname: session.user.nickname,
      },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_room", roomId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("room_history", (msgs: ChatMessage[]) => {
      setMessages(msgs);
    });

    socket.on("new_message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user_typing", (user: TypingUser) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === user.userId)) return prev;
        return [...prev, user];
      });
    });

    socket.on("user_stop_typing", ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    socket.on("error", (msg: string) => toast.error(msg));

    return () => {
      socket.emit("leave_room", roomId);
      socket.disconnect();
    };
  }, [session, roomId]);

  const sendMessage = useCallback(
    (content: string, type = "text") => {
      if (!socketRef.current || !content.trim()) return;
      socketRef.current.emit("send_message", { roomId, content, type });
    },
    [roomId]
  );

  const emitTyping = useCallback(() => {
    socketRef.current?.emit("typing", roomId);
  }, [roomId]);

  const emitStopTyping = useCallback(() => {
    socketRef.current?.emit("stop_typing", roomId);
  }, [roomId]);

  return { messages, typingUsers, connected, sendMessage, emitTyping, emitStopTyping };
}

export function useChatRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => { setRooms(d.rooms ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { rooms, loading };
}
