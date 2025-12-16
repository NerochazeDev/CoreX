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

        {/* Shield Inner Highlight - Subtle shine */}
        <path 
          d="M 32 6 L 50 16 L 50 35 C 50 53 32 70 32 70 C 32 70 14 53 14 35 L 14 16 Z" 
          fill="none"
          stroke={variant === 'white' ? '#f97316' : 'white'}
          strokeWidth={strokeWidth[size] === "1.5" ? "0.8" : strokeWidth[size] === "2" ? "1" : strokeWidth[size] === "2.5" ? "1.2" : "1.5"}
          opacity="0.25"
        />

        {/* Large Bitcoin Symbol - Centered */}
        <g opacity={animated ? 0.85 : 0.95}>
          {/* Bitcoin "B" Shape */}
          <text 
            x="32" 
            y="45" 
            textAnchor="middle" 
            fontSize={size === 'sm' ? '28' : size === 'md' ? '36' : size === 'lg' ? '44' : '52'}
            fontWeight="900"
            fill={variant === 'dark' ? '#ea580c' : variant === 'white' ? '#f97316' : 'white'}
            fontFamily="Arial, sans-serif"
          >
            ₿
          </text>
        </g>

        {/* Top Security Badge - Checkmark in circle */}
        <g>
          <circle cx="48" cy="14" r="4.5" fill={variant === 'dark' ? '#10b981' : '#34d399'} opacity="0.9" />
          <path 
            d="M 46.5 14 L 47.5 15 L 49.5 13" 
            stroke="white" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </g>

        {/* Bottom Lock Badge - Lock symbol */}
        <g>
          <circle cx="32" cy="70" r="4" fill={variant === 'dark' ? '#10b981' : '#34d399'} opacity="0.9" />
          <rect x="29.5" y="66.5" width="5" height="4" rx="0.8" fill="white" opacity="0.9" />
          <path d="M 29.5 66.5 Q 29.5 64.5 32 64.5 Q 34.5 64.5 34.5 66.5" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>

        {/* Rotating Animation Indicator - Subtle glow */}
        {animated && (
          <g opacity="0.4">
            <circle cx="32" cy="40" r="20" fill="none" stroke={variant === 'dark' ? '#dc2626' : '#fbbf24'} strokeWidth={strokeWidth[size]} className="animate-spin" style={{ transformOrigin: '32px 40px' }} />
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

  // Bitcoin symbol
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '32');
  text.setAttribute('y', '45');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '36');
  text.setAttribute('font-weight', '900');
  text.setAttribute('fill', 'white');
  text.setAttribute('font-family', 'Arial, sans-serif');
  text.textContent = '₿';
  svg.appendChild(text);

  // Top security badge
  const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  badge.setAttribute('cx', '48');
  badge.setAttribute('cy', '14');
  badge.setAttribute('r', '4.5');
  badge.setAttribute('fill', '#34d399');
  svg.appendChild(badge);

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
