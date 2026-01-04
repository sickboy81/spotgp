import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

const sizeMap = {
    sm: { width: 140, height: 47, text: 'text-base' },
    md: { width: 180, height: 60, text: 'text-lg' },
    lg: { width: 240, height: 80, text: 'text-xl' },
    xl: { width: 300, height: 100, text: 'text-2xl' },
};

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
    const dimensions = sizeMap[size];
    const [imageError, setImageError] = useState(false);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Logo Image */}
            {!imageError ? (
                <img
                    src="/logo.png"
                    alt="SpotGP"
                    // Use standard responsive sizing
                    className="flex-shrink-0 object-contain max-h-[50px] md:max-h-[60px] w-auto"
                    onError={() => setImageError(true)}
                />
            ) : (
                // Fallback SVG if image not found
                <svg
                    width={dimensions.width}
                    height={dimensions.height}
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                >
                    {/* Background Circle */}
                    <circle cx="32" cy="32" r="30" fill="url(#gradient)" />

                    {/* Inner Circle (Heart shape inspiration) */}
                    <path
                        d="M32 20C28 16 20 18 20 26C20 34 32 44 32 44C32 44 44 34 44 26C44 18 36 16 32 20Z"
                        fill="white"
                        opacity="0.9"
                    />

                    {/* Elegant accent line */}
                    <path
                        d="M20 38 Q32 30 44 38"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.7"
                    />

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#cd0e2d" />
                            <stop offset="100%" stopColor="#8b0a1f" />
                        </linearGradient>
                    </defs>
                </svg>
            )}

            {/* Logo Text - Hidden when using image logo, as text is already in the image */}
            {showText && imageError && (
                <span className={cn(
                    "font-black uppercase tracking-wider bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent",
                    dimensions.text,
                    "whitespace-nowrap",
                    "font-['Montserrat',sans-serif]"
                )}>
                    SpotGP
                </span>
            )}
        </div>
    );
}

