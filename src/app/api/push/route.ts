import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Store push subscriptions per user (in production, persist to DB)
// For now we demonstrate the API surface — actual web-push requires
// the `web-push` npm package and VAPID keys in env.

export async function GET() {
  // Return VAPID public key for the client to use with PushManager.subscribe()
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  return NextResponse.json({ publicKey });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription, action } = await req.json();

  if (action === "subscribe") {
    // In production: store subscription in DB linked to user
    // await prisma.pushSubscription.upsert({ where: { userId: session.user.id }, ... })
    console.log("[Push] Subscribed:", session.user.id, subscription?.endpoint?.slice(-20));
    return NextResponse.json({ ok: true });
  }

  if (action === "unsubscribe") {
    // In production: remove subscription from DB
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
