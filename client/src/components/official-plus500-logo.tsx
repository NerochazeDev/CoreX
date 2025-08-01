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
  const sizeMap = {
    sm: { text: "text-lg", logo: "text-xl" },
    md: { text: "text-xl", logo: "text-2xl" },
    lg: { text: "text-2xl", logo: "text-3xl" },
    xl: { text: "text-3xl", logo: "text-4xl" }
  };

  const currentSize = sizeMap[size];
  const textColor = variant === 'white' ? 'text-white' : 'text-plus500';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Clean Plus500 Text Logo */}
      <div className="flex items-center">
        <span className={cn("font-bold tracking-tight", currentSize.text, textColor)}>
          Plus500
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
  const textColor = variant === 'white' ? 'text-white' : 'text-plus500';
  
  return (
    <div className={cn("flex items-center", className)}>
      <span className={cn("font-bold tracking-tight text-2xl", textColor)}>
        Plus500
      </span>
    </div>
  );
}