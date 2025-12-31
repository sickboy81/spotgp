import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholder?: string;
    onLoad?: () => void;
    onError?: () => void;
}

export function LazyImage({
    src,
    alt,
    className,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5DYXJyZWdhbmRvLi4uPC90ZXh0Pjwvc3ZnPg==',
    onLoad,
    onError
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(() => {
        // Initialize as loaded if IntersectionObserver is not supported (fallback)
        return typeof window !== 'undefined' && !('IntersectionObserver' in window);
    });
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        // Use Intersection Observer for lazy loading
        if (imgRef.current && 'IntersectionObserver' in window) {
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && imgRef.current && !isLoaded && !hasError) {
                            // Load the image directly - browser handles caching
                            if (imgRef.current) {
                                imgRef.current.src = src;
                                setIsLoaded(true);
                                onLoad?.();
                            }
                            observerRef.current?.unobserve(entry.target);
                        }
                    });
                },
                { rootMargin: '200px' } // Start loading 200px before image enters viewport for smoother scrolling
            );

            observerRef.current.observe(imgRef.current);
        }

        const currentObserver = observerRef.current;
        const currentImg = imgRef.current;

        return () => {
            if (currentObserver && currentImg) {
                currentObserver.unobserve(currentImg);
            }
        };
    }, [src, isLoaded, hasError, onLoad, onError]);

    return (
        <div className={cn("relative overflow-hidden", className)}>
            <img
                ref={imgRef}
                src={isLoaded && !hasError ? src : placeholder}
                alt={alt}
                className={cn(
                    "transition-opacity duration-300",
                    isLoaded && !hasError ? "opacity-100" : "opacity-50 blur-sm",
                    className
                )}
                loading="lazy"
                onLoad={() => onLoad?.()}
                onError={() => {
                    setHasError(true);
                    onError?.();
                }}
            />
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
                    Erro ao carregar
                </div>
            )}
        </div>
    );
}

