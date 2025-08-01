import { cn } from "@/lib/utils";

interface Plus500LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Plus500Logo({ className, showText = true, size = "md" }: Plus500LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl", 
    xl: "text-4xl"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        <span className={cn("font-black tracking-tight text-plus500-blue", sizeClasses[size])}>
          Plus
        </span>
        <div className="w-6 h-6 bg-plus500-blue rounded-sm flex items-center justify-center mx-1">
          <span className="text-white font-black text-lg leading-none">+</span>
        </div>
        <span className={cn("font-black tracking-tight text-plus500-blue", sizeClasses[size])}>
          500
        </span>
      </div>
      {showText && (
        <span className="font-bold text-plus500-blue bg-plus500-blue/10 px-2 py-1 rounded-md text-sm">
          VIP
        </span>
      )}
    </div>
  );
}

export function Plus500VIPBrand({ className }: { className?: string }) {
  return (
    <div className={cn("text-center space-y-2", className)}>
      <Plus500Logo size="xl" />
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-white">
          IT'S FUTURES
        </h1>
        <h1 className="text-4xl font-bold text-white">
          TRADING
        </h1>
        <h1 className="text-4xl font-bold text-plus500-light">
          WITH A PLUS
        </h1>
      </div>
      <p className="text-lg text-white/80 font-medium">
        VIP INVESTORS
      </p>
    </div>
  );
}