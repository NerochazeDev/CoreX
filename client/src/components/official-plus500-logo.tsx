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
  const containerSize = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg", 
    xl: "px-8 py-4 text-xl"
  };

  const plusSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  };

  // Authentic Plus500 colors
  const bgColor = variant === 'white' ? 'bg-white' : 'bg-[#003399]'; // Royal blue
  const textColor = variant === 'white' ? 'text-[#003399]' : 'text-white';
  const borderColor = variant === 'white' ? 'border-[#003399]' : 'border-transparent';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Authentic Plus500 Logo - Royal Blue Background */}
      <div className={cn(
        "relative rounded-lg font-bold tracking-wide uppercase leading-tight border-2",
        containerSize[size],
        bgColor,
        textColor,
        borderColor
      )}>
        {/* Plus symbol positioned above the 's' in Plus */}
        <div className={cn(
          "absolute -top-1 left-[2.2em] font-bold",
          plusSize[size]
        )}>
          +
        </div>
        {/* Plus500 text */}
        <div className="font-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          PLUS500
        </div>
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