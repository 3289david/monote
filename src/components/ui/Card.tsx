import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "soft" | "dark" | "cream";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  onClick,
  hover = false,
}: CardProps) {
  const variants = {
    default: "bg-white border border-[#e3e8ee]",
    soft: "bg-[#f6f9fc] border border-[#e3e8ee]",
    dark: "bg-[#1c1e54] border border-[#2a2d6b] text-white",
    cream: "bg-[#f5e9d4] border border-[#e8d5b0]",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl shadow-[0_1px_3px_rgba(0,55,112,0.08)]",
        variants[variant],
        paddings[padding],
        hover &&
          "cursor-pointer transition-all duration-150 hover:shadow-[0_8px_24px_rgba(0,55,112,0.08),0_2px_6px_rgba(0,55,112,0.04)] hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}
