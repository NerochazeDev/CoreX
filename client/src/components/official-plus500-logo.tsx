import { cn } from "@/lib/utils";

interface OfficialPlus500LogoProps {
  className?: string;
  showVIP?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "white";
}

export function OfficialPlus500Logo({ 
  className, 
  showVIP = true, 
  size = "md", 
  variant = "light" 
}: OfficialPlus500LogoProps) {
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

  const textColor = variant === 'white' ? 'text-white' : 'text-plus500';
  const bgColor = variant === 'white' ? 'bg-white' : 'bg-plus500';
  const iconTextColor = variant === 'white' ? 'text-plus500' : 'text-white';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Authentic Plus500 Logo Design */}
      <div className="flex items-center">
        <span className={cn("font-bold tracking-tight", sizeClasses[size], textColor)}>
          Plus
        </span>
        <div className={cn("rounded-sm flex items-center justify-center mx-1", iconSize[size], bgColor)}>
          <span className={cn("font-bold text-lg leading-none", iconTextColor)}>+</span>
        </div>
        <span className={cn("font-bold tracking-tight", sizeClasses[size], textColor)}>
          500
        </span>
      </div>
      
      {showVIP && (
        <span className="text-plus500-gold font-bold px-3 py-1 rounded-full text-sm bg-plus500-gold/10 border border-plus500-gold/20">
          VIP
        </span>
      )}
    </div>
  );
}

export function SimplePlus500Logo({ className, variant = "light" }: { className?: string; variant?: "light" | "dark" | "white" }) {
  const colorClass = variant === 'white' ? 'text-white' : 'text-plus500';
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className={cn("font-bold tracking-tight text-2xl", colorClass)}>Plus</span>
      <div className={cn("w-8 h-8 rounded-sm flex items-center justify-center", 
        variant === 'white' ? 'bg-white' : 'bg-plus500'
      )}>
        <span className={cn("font-bold text-xl leading-none", 
          variant === 'white' ? 'text-plus500' : 'text-white'
        )}>+</span>
      </div>
      <span className={cn("font-bold tracking-tight text-2xl", colorClass)}>500</span>
    </div>
  );
}