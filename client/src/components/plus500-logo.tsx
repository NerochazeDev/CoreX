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

  const iconSize = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10"
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center">
        <span className={cn("font-bold tracking-tight text-plus500", sizeClasses[size])}>
          Plus
        </span>
        <div className={cn("bg-plus500 rounded-sm flex items-center justify-center mx-1", iconSize[size])}>
          <span className="text-white font-bold text-lg leading-none">+</span>
        </div>
        <span className={cn("font-bold tracking-tight text-plus500", sizeClasses[size])}>
          500
        </span>
      </div>
      {showText && (
        <span className="text-vip-gold font-bold px-3 py-1 rounded-full text-sm bg-plus500-gold/10 border border-plus500-gold/20">
          VIP
        </span>
      )}
    </div>
  );
}

export function Plus500VIPBrand({ className }: { className?: string }) {
  return (
    <div className={cn("text-center space-y-4", className)}>
      <Plus500Logo size="xl" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Professional Bitcoin
        </h1>
        <h1 className="text-4xl font-bold text-plus500">
          Investment Platform
        </h1>
        <h1 className="text-2xl font-bold text-vip-gold">
          VIP EDITION
        </h1>
      </div>
      <p className="text-lg text-muted-foreground font-medium">
        Secure • Professional • Exclusive
      </p>
    </div>
  );
}