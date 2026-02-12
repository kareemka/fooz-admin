'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mediaService, MediaFile } from '@/services/media.service';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GallerySelectorProps {
    onSelect: (url: string) => void;
    selectedUrl?: string;
    children?: React.ReactNode;
}

export function GallerySelector({ onSelect, selectedUrl, children }: GallerySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['media', 'IMAGE'],
        queryFn: () => mediaService.getAll('IMAGE'),
    });

    const images = data?.items || [];

    const handleSelect = (url: string) => {
        onSelect(url);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button type="button" variant="outline" className="w-full rounded-xl h-24 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all flex flex-col gap-2">
                        <ImageIcon className="size-6 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground italic">اختر من المعرض</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden flex flex-col">
                <div className="p-8 flex-1 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">معرض الصور</DialogTitle>
                    </DialogHeader>
                    {isLoading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="size-10 text-primary animate-spin" />
                        </div>
                    ) : images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
                            <ImageIcon className="size-12 mb-4 opacity-20" />
                            <p>المعرض فارغ حالياً</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4">
                            {images.map((image) => (
                                <div
                                    key={image.id}
                                    className={cn(
                                        "relative aspect-square rounded-2xl overflow-hidden cursor-pointer group border-2 transition-all",
                                        selectedUrl === image.url ? "border-primary ring-2 ring-primary/20 scale-95" : "border-transparent hover:border-primary/50"
                                    )}
                                    onClick={() => handleSelect(image.url)}
                                >
                                    <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        {selectedUrl === image.url && (
                                            <div className="bg-primary text-white p-2 rounded-full">
                                                <CheckCircle2 className="size-5" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
