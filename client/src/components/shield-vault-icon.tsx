import { cn } from "@/lib/utils";

interface ShieldVaultIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "white";
  animated?: boolean;
}

export function ShieldVaultIcon({ 
  className, 
  size = "md", 
  variant = "light",
  animated = false
}: ShieldVaultIconProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const strokeWidth = {
    sm: "1.5",
    md: "2",
    lg: "2.5",
    xl: "3"
  };

  const viewBox = "0 0 64 80";

  return (
    <div className={cn(sizeMap[size], "relative", className)}>
      <svg 
        viewBox={viewBox} 
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <linearGradient id="shieldGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <filter id="shadowFilter">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Shield Background */}
        <path 
          d="M 32 4 L 52 16 L 52 35 C 52 55 32 74 32 74 C 32 74 12 55 12 35 L 12 16 Z" 
          fill={variant === 'white' ? 'white' : 'url(#shieldGradient)'}
          stroke={variant === 'dark' ? '#ea580c' : variant === 'white' ? '#f97316' : '#fb923c'}
          strokeWidth={strokeWidth[size]}
          filter="url(#shadowFilter)"
        />

        {/* Shield Border Shine */}
        <path 
          d="M 32 4 L 52 16 L 52 35 C 52 55 32 74 32 74 C 32 74 12 55 12 35 L 12 16 Z" 
          fill="none"
          stroke={variant === 'white' ? '#f97316' : 'white'}
          strokeWidth={strokeWidth[size] === "1.5" ? "0.8" : strokeWidth[size] === "2" ? "1" : strokeWidth[size] === "2.5" ? "1.2" : "1.5"}
          opacity="0.2"
        />

        {/* Vault Door - Pentagon shape inside shield */}
        <path 
          d="M 32 12 L 48 22 L 48 42 C 48 58 32 66 32 66 C 32 66 16 58 16 42 L 16 22 Z" 
          fill={variant === 'white' ? '#fff9f5' : variant === 'dark' ? '#7c2d12' : '#fed7aa'}
          stroke={variant === 'dark' ? '#dc2626' : '#ea580c'}
          strokeWidth={strokeWidth[size]}
        />

        {/* Door Inner Highlight */}
        <path 
          d="M 32 14 L 46 23 L 46 42 C 46 56 32 64 32 64 C 32 64 18 56 18 42 L 18 23 Z" 
          fill="none"
          stroke={variant === 'white' ? '#f97316' : 'white'}
          strokeWidth={strokeWidth[size] === "1.5" ? "0.8" : strokeWidth[size] === "2" ? "1" : strokeWidth[size] === "2.5" ? "1.2" : "1.5"}
          opacity="0.15"
        />

        {/* Combination Lock Circle */}
        <circle 
          cx="32" 
          cy="36" 
          r="9"
          fill={variant === 'white' ? 'white' : variant === 'dark' ? '#1f2937' : '#fef3c7'}
          stroke={variant === 'dark' ? '#ea580c' : '#f97316'}
          strokeWidth={strokeWidth[size]}
        />

        {/* Lock Inner Ring */}
        <circle 
          cx="32" 
          cy="36" 
          r="6.5"
          fill="none"
          stroke={variant === 'dark' ? '#ea580c' : '#f97316'}
          strokeWidth={strokeWidth[size] === "1.5" ? "0.8" : strokeWidth[size] === "2" ? "1" : strokeWidth[size] === "2.5" ? "1.2" : "1.5"}
        />

        {/* Dial Indicator Lines */}
        <line x1="32" y1="27" x2="32" y2="25" stroke={variant === 'dark' ? '#ea580c' : '#f97316'} strokeWidth={strokeWidth[size]} strokeLinecap="round" />
        <line x1="41" y1="36" x2="43" y2="36" stroke={variant === 'dark' ? '#ea580c' : '#f97316'} strokeWidth={strokeWidth[size]} strokeLinecap="round" />
        <line x1="32" y1="45" x2="32" y2="47" stroke={variant === 'dark' ? '#ea580c' : '#f97316'} strokeWidth={strokeWidth[size]} strokeLinecap="round" />
        <line x1="23" y1="36" x2="21" y2="36" stroke={variant === 'dark' ? '#ea580c' : '#f97316'} strokeWidth={strokeWidth[size]} strokeLinecap="round" />

        {/* Center Bitcoin Symbol */}
        <text 
          x="32" 
          y="40" 
          textAnchor="middle" 
          fontSize={size === 'sm' ? '14' : size === 'md' ? '16' : size === 'lg' ? '20' : '24'}
          fontWeight="bold"
          fill={variant === 'dark' ? '#ea580c' : '#f97316'}
          fontFamily="Arial, sans-serif"
        >
          ₿
        </text>

        {/* Security Checkmark - Top of shield */}
        <g opacity="0.85">
          <circle cx="48" cy="16" r="3.5" fill={variant === 'dark' ? '#10b981' : '#34d399'} />
          <path d="M 46.5 16 L 47.5 17 L 49.5 15" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Lock Symbol - Bottom of shield */}
        <g opacity="0.85">
          <rect x="29.5" y="60" width="5" height="4" rx="1" fill={variant === 'dark' ? '#10b981' : '#34d399'} />
          <path d="M 29.5 60 Q 29.5 57.5 32 57.5 Q 34.5 57.5 34.5 60" stroke={variant === 'dark' ? '#10b981' : '#34d399'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>

        {/* Rotating Animation Indicator */}
        {animated && (
          <g opacity="0.6">
            <path
              d="M 32 26 A 10 10 0 0 1 40 28"
              fill="none"
              stroke={variant === 'dark' ? '#dc2626' : '#fbbf24'}
              strokeWidth={strokeWidth[size]}
              strokeLinecap="round"
              className="animate-spin"
              style={{ transformOrigin: '32px 36px' }}
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export function ShieldVaultLogo({ 
  className, 
  size = "md",
  variant = "light",
  showText = true,
  animated = false 
}: ShieldVaultIconProps & { showText?: boolean }) {
  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl"
  };

  const textColor = variant === 'white' ? 'text-white' : variant === 'dark' ? 'text-orange-500' : 'text-primary';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ShieldVaultIcon size={size} variant={variant} animated={animated} />
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold tracking-tight", textSize[size], textColor)}>
            BitVault
          </span>
          {size !== 'sm' && (
            <span className="text-orange-500 font-bold text-xs px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              SECURE
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Utility function to export shield vault icon as PNG
export async function downloadShieldVaultIconPNG(size: number = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 1.25; // Shield is taller than wide
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;

  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 80');
  svg.setAttribute('width', canvas.width.toString());
  svg.setAttribute('height', canvas.height.toString());

  // Define gradients
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'shieldGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');
  
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stopColor', '#f97316');
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stopColor', '#fb923c');
  
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  svg.appendChild(defs);

  // Shield path
  const shieldPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  shieldPath.setAttribute('d', 'M 32 4 L 52 16 L 52 35 C 52 55 32 74 32 74 C 32 74 12 55 12 35 L 12 16 Z');
  shieldPath.setAttribute('fill', 'url(#shieldGradient)');
  shieldPath.setAttribute('stroke', '#fb923c');
  shieldPath.setAttribute('stroke-width', '2');
  svg.appendChild(shieldPath);

  // Vault door
  const doorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  doorPath.setAttribute('d', 'M 32 12 L 48 22 L 48 42 C 48 58 32 66 32 66 C 32 66 16 58 16 42 L 16 22 Z');
  doorPath.setAttribute('fill', '#fed7aa');
  doorPath.setAttribute('stroke', '#ea580c');
  doorPath.setAttribute('stroke-width', '2');
  svg.appendChild(doorPath);

  // Lock circle
  const lockCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  lockCircle.setAttribute('cx', '32');
  lockCircle.setAttribute('cy', '36');
  lockCircle.setAttribute('r', '9');
  lockCircle.setAttribute('fill', '#fef3c7');
  lockCircle.setAttribute('stroke', '#f97316');
  lockCircle.setAttribute('stroke-width', '2');
  svg.appendChild(lockCircle);

  // Inner ring
  const innerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  innerRing.setAttribute('cx', '32');
  innerRing.setAttribute('cy', '36');
  innerRing.setAttribute('r', '6.5');
  innerRing.setAttribute('fill', 'none');
  innerRing.setAttribute('stroke', '#f97316');
  innerRing.setAttribute('stroke-width', '1');
  svg.appendChild(innerRing);

  // Bitcoin symbol
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '32');
  text.setAttribute('y', '40');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '16');
  text.setAttribute('font-weight', 'bold');
  text.setAttribute('fill', '#f97316');
  text.setAttribute('font-family', 'Arial, sans-serif');
  text.textContent = '₿';
  svg.appendChild(text);

  // Convert to image
  const svgData = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bitvault-shield-logo-${size}x${Math.round(size * 1.25)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };
  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
}
