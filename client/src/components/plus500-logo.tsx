import { cn } from "@/lib/utils";

interface Plus500LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Plus500Logo({ className, showText = true, size = "md" }: Plus500LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl", 
    xl: "text-4xl"
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn(
        "rounded-lg plus500-gradient flex items-center justify-center font-bold text-white shadow-lg",
        sizeClasses[size]
      )}>
        <span className="text-white font-bold text-sm">500</span>
        <span className="text-white text-xs">+</span>
      </div>
      {showText && (
        <span className={cn(
          "font-bold text-plus500",
          textSizeClasses[size]
        )}>
          Plus500
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