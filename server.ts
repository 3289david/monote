import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
const PORT = parseInt(process.env.PORT ?? "3000");

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL ?? `http://localhost:${PORT}`,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Socket.io chat handlers
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId as string;
    const nickname = socket.handshake.auth.nickname as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`[WS] connected: ${nickname} (${userId})`);

    // Join room
    socket.on("join_room", async (roomId: string) => {
      socket.join(roomId);

      // Mark as read
      await prisma.chatMember.updateMany({
        where: { roomId, userId },
        data: { lastReadAt: new Date() },
      });

      // Load recent messages
      const messages = await prisma.chatMessage.findMany({
        where: { roomId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          sender: { select: { id: true, nickname: true, level: true, avatar: true } },
        },
      });

      socket.emit("room_history", messages.reverse());
    });

    // Leave room
    socket.on("leave_room", (roomId: string) => {
      socket.leave(roomId);
    });

    // Send message
    socket.on("send_message", async (data: { roomId: string; content: string; type?: string }) => {
      try {
        const msg = await prisma.chatMessage.create({
          data: {
            roomId: data.roomId,
            senderId: userId,
            content: data.content,
            type: data.type ?? "text",
          },
          include: {
            sender: { select: { id: true, nickname: true, level: true, avatar: true } },
          },
        });

        // Update room last message
        await prisma.chatRoom.update({
          where: { id: data.roomId },
          data: {
            lastMessage: data.content.slice(0, 100),
            lastMessageAt: new Date(),
          },
        });

        io.to(data.roomId).emit("new_message", msg);
      } catch (err) {
        console.error("[WS] send_message error:", err);
        socket.emit("error", "메시지 전송에 실패했어요");
      }
    });

    // Typing indicator
    socket.on("typing", (roomId: string) => {
      socket.to(roomId).emit("user_typing", { userId, nickname });
    });

    socket.on("stop_typing", (roomId: string) => {
      socket.to(roomId).emit("user_stop_typing", { userId });
    });

    socket.on("disconnect", () => {
      console.log(`[WS] disconnected: ${nickname}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT} [${dev ? "dev" : "prod"}]`);
  });
});
