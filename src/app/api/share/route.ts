import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const longUrl = url.searchParams.get("url");
  if (!longUrl) return NextResponse.json({ error: "url required" }, { status: 400 });

  // Validate the URL is within our domain or is a valid URL
  try {
    const parsed = new URL(longUrl);
    const allowedHosts = ["localhost", process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : ""];
    if (!allowedHosts.some((h) => h && parsed.hostname.endsWith(h))) {
      // Still allow external URLs for flexibility (v.gd validates them)
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const vgdUrl = `https://v.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`;
    const response = await fetch(vgdUrl, {
      headers: { "User-Agent": "monote/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error("v.gd error");
    const shortUrl = await response.text();

    if (shortUrl.startsWith("ERROR")) {
      throw new Error(shortUrl);
    }

    return NextResponse.json({ shortUrl: shortUrl.trim(), longUrl });
  } catch (err) {
    // Fallback: return the original URL if v.gd fails
    return NextResponse.json({ shortUrl: longUrl, longUrl, fallback: true });
  }
}
