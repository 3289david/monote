import { cn } from "@/lib/utils";
import { getLevelColor } from "@/lib/utils";

interface AvatarProps {
  nickname: string;
  level?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  imageUrl?: string;
  className?: string;
}

const LEVEL_GRADIENTS = [
  "from-gray-400 to-gray-500",
  "from-emerald-400 to-teal-500",
  "from-blue-400 to-indigo-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-indigo-500 to-violet-600",
  "from-amber-500 to-red-500",
  "from-violet-600 to-indigo-700",
  "from-amber-400 via-orange-500 to-red-500",
];

export default function Avatar({
  nickname,
  level = 1,
  size = "md",
  imageUrl,
  className,
}: AvatarProps) {
  const initial = nickname[0]?.toUpperCase() ?? "?";
  const gradient = LEVEL_GRADIENTS[Math.min(level - 1, LEVEL_GRADIENTS.length - 1)];

  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={nickname}
        className={cn("rounded-full object-cover flex-shrink-0", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium text-white flex-shrink-0 bg-gradient-to-br",
        gradient,
        sizes[size],
        className
      )}
    >
      {initial}
    </div>
  );
}
