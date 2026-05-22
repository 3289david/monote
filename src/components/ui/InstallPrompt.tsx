"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    const wasDismissed = sessionStorage.getItem("install-prompt-dismissed");
    if (wasDismissed) return;

    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    // iOS detection
    const ua = navigator.userAgent;
    const iosDevice = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    if (iosDevice) {
      // iOS doesn't support beforeinstallprompt — show manual instructions after delay
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("install-prompt-dismissed", "1");
  };

  if (!show || dismissed) return null;

  return (
    <div className={cn(
      "fixed bottom-20 md:bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80",
      "animate-in slide-in-from-bottom-4 duration-300"
    )}>
      <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#e3e8ee] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#533afd] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
              <path d="M5 25V7h4.5l6.5 11 6.5-11H27v18h-4.5V14.5l-6 9-6-9V25H5z" fill="white"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0d253d]">monote 앱 설치</p>
            <p className="text-xs text-[#64748d] mt-0.5 leading-relaxed">
              {isIOS
                ? "Safari 공유 버튼을 누르고 '홈 화면에 추가'를 선택하세요"
                : "홈 화면에 추가하면 더 빠르게 이용할 수 있어요"}
            </p>
          </div>
          <button onClick={handleDismiss} className="p-1 text-[#b0b7c3] hover:text-[#64748d] shrink-0">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {isIOS ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#64748d] bg-[#f6f9fc] rounded-xl p-2.5">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-[#533afd] shrink-0">
              <path d="M10 3v9M7 9l3 3 3-3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 14v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
            <span>공유 <strong>→</strong> 홈 화면에 추가</span>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 rounded-full border border-[#e3e8ee] text-[#64748d] text-xs hover:bg-[#f6f9fc] transition-colors"
            >
              나중에
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2 rounded-full bg-[#533afd] text-white text-xs hover:bg-[#4434d4] transition-colors"
            >
              설치하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
