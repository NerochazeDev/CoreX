import { cn } from "@/lib/utils";
import { VaultIcon } from "./vault-icon";

interface BitVaultLogoProps {
  className?: string;
  showPro?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "white";
  useVaultIcon?: boolean;
}

export function BitVaultLogo({ 
  className, 
  showPro = true, 
  size = "md", 
  variant = "light",
  useVaultIcon = false
}: BitVaultLogoProps) {
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

  const textColor = variant === 'white' ? 'text-white' : variant === 'dark' ? 'text-orange-500' : 'text-primary';
  const bgColor = variant === 'white' ? 'bg-white' : 'bg-gradient-to-r from-orange-500 to-amber-500';
  const iconTextColor = variant === 'white' ? 'text-orange-500' : 'text-white';

  if (useVaultIcon) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <VaultIcon size={size} variant={variant} />
        <span className={cn("font-bold tracking-tight", sizeClasses[size], textColor)}>
          BitVault
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center">
        {/* Bitcoin-inspired icon */}
        <div className={cn("rounded-lg flex items-center justify-center mr-2 shadow-lg", iconSize[size], bgColor)}>
          <span className={cn("font-bold leading-none", iconTextColor)} style={{ fontSize: size === 'xl' ? '1.5rem' : size === 'lg' ? '1.2rem' : '1rem' }}>₿</span>
        </div>
        <span className={cn("font-bold tracking-tight", sizeClasses[size], textColor)}>
          BitVault
        </span>
      </div>
      {showPro && (
        <span className="text-orange-500 font-bold px-3 py-1 rounded-full text-sm bg-orange-500/10 border border-orange-500/20">
          PRO
        </span>
      )}
    </div>
  );
}

export function BitVaultBrand({ className }: { className?: string }) {
  return (
    <div className={cn("text-center space-y-4", className)}>
      <BitVaultLogo size="xl" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Professional Bitcoin
        </h1>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
          Investment Platform
        </h1>
        <h1 className="text-2xl font-bold text-orange-500">
          PRO EDITION
        </h1>
      </div>
      <p className="text-lg text-muted-foreground font-medium">
        Secure • Professional • Exclusive
      </p>
    </div>
  );
}

export function SimpleBitVaultLogo({ className, variant = "light" }: { className?: string; variant?: "light" | "dark" | "white" }) {
  const colorClass = variant === 'white' ? 'text-white' : 'text-primary';
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-md", 
        variant === 'white' ? 'bg-white' : 'bg-gradient-to-r from-orange-500 to-amber-500'
      )}>
        <span className={cn("font-bold text-lg leading-none", 
          variant === 'white' ? 'text-orange-500' : 'text-white'
        )}>₿</span>
      </div>
      <span className={cn("font-bold tracking-tight text-2xl", colorClass)}>BitVault</span>
    </div>
  );
}