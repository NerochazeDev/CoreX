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
    sm: { container: "px-4 py-2", text: "text-lg", plus: "text-sm", top: "top-1", left: "left-6" },
    md: { container: "px-6 py-3", text: "text-2xl", plus: "text-lg", top: "top-1", left: "left-8" },
    lg: { container: "px-8 py-4", text: "text-3xl", plus: "text-xl", top: "top-2", left: "left-10" },
    xl: { container: "px-10 py-5", text: "text-4xl", plus: "text-2xl", top: "top-2", left: "left-12" }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Exact Plus500 Logo Recreation */}
      <div className={cn(
        "bg-plus500 rounded-xl relative inline-block",
        currentSize.container
      )}>
        <span 
          className={cn(
            "font-bold text-white relative",
            currentSize.text
          )}
          style={{ fontFamily: 'Orbitron, monospace, sans-serif' }}
        >
          Plu
          <span 
            className={cn(
              "absolute text-white font-bold",
              currentSize.plus,
              currentSize.top,
              currentSize.left
            )}
          >
            +
          </span>
          s500
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
  return (
    <div className={cn("flex items-center", className)}>
      <div className="bg-plus500 rounded-xl px-6 py-3 relative inline-block">
        <span 
          className="font-bold text-white relative text-2xl"
          style={{ fontFamily: 'Orbitron, monospace, sans-serif' }}
        >
          Plu
          <span className="absolute text-white font-bold text-lg top-1 left-8">
            +
          </span>
          s500
        </span>
      </div>
    </div>
  );
}