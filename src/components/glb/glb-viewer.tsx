'use client';

import { useState } from 'react';
import Script from 'next/script';
import { Box, Loader2 } from 'lucide-react';

interface GLBViewerProps {
    src: string;
    poster?: string;
    alt?: string;
    className?: string;
    autoRotate?: boolean;
    cameraControls?: boolean;
    showAr?: boolean;
}

export function GLBViewer({
    src,
    poster,
    alt = '3D Model',
    className = '',
    autoRotate = true,
    cameraControls = true,
    showAr = false
}: GLBViewerProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleLoad = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent parent clicks
        setIsLoaded(true);
    };

    if (!isLoaded) {
        return (
            <div
                className={`relative overflow-hidden bg-white/5 flex items-center justify-center group/placeholder ${className}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {poster ? (
                    <img
                        src={poster}
                        alt={alt}
                        className="w-full h-full object-cover opacity-50 group-hover/placeholder:opacity-70 transition-opacity"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2">
                        <div className="bg-white/5 p-4 rounded-full border border-white/5 group-hover/placeholder:scale-110 transition-transform">
                            <Box className="size-8 opacity-50" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">3D Model</span>
                    </div>
                )}

                <button
                    onClick={handleLoad}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 group-hover/placeholder:bg-black/40 transition-colors"
                >
                    <div className="bg-primary/90 text-black px-4 py-2 rounded-xl font-black text-sm shadow-neon-sm transform scale-90 opacity-0 group-hover/placeholder:opacity-100 group-hover/placeholder:scale-100 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">view_in_ar</span>
                        عرض المجسم
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <Script
                type="module"
                src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"
                strategy="afterInteractive"
            />

            {/* @ts-ignore */}
            <model-viewer
                src={src}
                poster={poster}
                alt={alt}
                shadow-intensity="0.5"
                camera-controls={cameraControls ? '' : undefined}
                touch-action="pan-y"
                ar={showAr ? '' : undefined}
                auto-rotate={autoRotate ? '' : undefined}
                className="w-full h-full bg-muted/10"
                loading="lazy"
                reveal="manual"
                style={{ width: '100%', height: '100%', '--poster-color': 'transparent' } as any}
            >
                <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm">
                    <Loader2 className="size-8 text-primary animate-spin" />
                </div>
                {showAr && (
                    <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md shadow-lg">
                        AR Ready
                    </div>
                )}
                {/* @ts-ignore */}
            </model-viewer>
        </div>
    );
}
