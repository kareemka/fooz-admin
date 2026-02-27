'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '@/services/media.service';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Image as ImageIcon, CheckCircle2, Search, Upload, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface GallerySelectorProps {
    onSelect: (url: string) => void;
    selectedUrl?: string;
    children?: React.ReactNode;
}

export function GallerySelector({ onSelect, selectedUrl, children }: GallerySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelectedUrl, setTempSelectedUrl] = useState<string | undefined>(selectedUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['media', 'IMAGE', page],
        queryFn: () => mediaService.getAll('IMAGE', page, 15),
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => mediaService.upload(file),
        onSuccess: (newFile) => {
            queryClient.invalidateQueries({ queryKey: ['media', 'IMAGE'] });
            setTempSelectedUrl(newFile.url);
            toast.success('تم رفع الصورة بنجاح');
        },
        onError: () => {
            toast.error('فشل رفع الصورة');
        }
    });

    const images = data?.items || [];
    const meta = data?.meta;

    const filteredImages = useMemo(() => {
        return images.filter(img =>
            img.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [images, searchQuery]);

    const handleConfirm = () => {
        if (tempSelectedUrl) {
            onSelect(tempSelectedUrl);
        }
        setIsOpen(false);
    };



    const selectedImage = useMemo(() => {
        return images.find(img => img.url === tempSelectedUrl);
    }, [images, tempSelectedUrl]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) {
                setTempSelectedUrl(selectedUrl);
                setPage(1);
            }
        }}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button type="button" variant="outline" className="w-full rounded-2xl h-24 border-dashed border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all flex flex-col gap-2 relative group overflow-hidden bg-primary/5">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ImageIcon className="size-6 text-primary relative z-10" />
                        <span className="text-xs font-bold text-primary italic relative z-10">اختر من المعرض</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[90vw] lg:max-w-6xl h-[85vh] flex flex-col rounded-[2.5rem] border border-white/10 shadow-2xl bg-[#0a120e]/95 backdrop-blur-3xl p-0 overflow-hidden text-right" dir="rtl">
                <DialogHeader className="p-8 pb-4 relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/20 p-3 rounded-2xl shadow-neon">
                                <ImageIcon className="size-7 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                                    معرض الصور
                                </DialogTitle>
                                <p className="text-[10px] text-primary font-bold tracking-widest opacity-70 mt-1 uppercase">
                                    IMAGE_LIBRARY_V.2.0.1 // مكتبة الصور
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="ابحث عن اسم الصورة..."
                                className="h-12 bg-white/5 border-white/10 rounded-xl pr-12 text-white focus:border-primary transition-all"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="size-12 text-primary animate-spin" />
                            <p className="text-white/60 font-medium animate-pulse">جاري تحميل الصور...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 py-4">
                            {/* Upload Tile */}
                            <div
                                className="group relative aspect-square rounded-[1.5rem] border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/10 transition-all overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (!file.type.startsWith('image/')) {
                                                toast.error('يرجى اختيار صور فقط');
                                                return;
                                            }
                                            uploadMutation.mutate(file);
                                        }
                                    }}
                                />
                                {uploadMutation.isPending ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="size-10 text-primary animate-spin" />
                                        <p className="text-[10px] text-primary font-bold animate-pulse">جاري الرفع...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-4 bg-primary/20 rounded-2xl group-hover:scale-110 transition-transform">
                                            <Upload className="size-8 text-primary" />
                                        </div>
                                        <div className="text-center px-4">
                                            <p className="font-bold text-white text-xs uppercase tracking-tighter">رفع جديد</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {filteredImages.map((image) => (
                                <div
                                    key={image.id}
                                    className={cn(
                                        "group relative flex flex-col rounded-[1.5rem] border border-white/10 transition-all duration-300 cursor-pointer overflow-hidden bg-white/5 hover:border-primary/40",
                                        tempSelectedUrl === image.url && "border-primary/60 ring-2 ring-primary/20 bg-primary/5 scale-[1.02]"
                                    )}
                                    onClick={() => setTempSelectedUrl(image.url)}
                                >
                                    <div className="aspect-square relative overflow-hidden bg-black/40">
                                        <img src={image.url} alt={image.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

                                        {tempSelectedUrl === image.url && (
                                            <div className="absolute top-3 right-3 bg-primary text-black p-1.5 rounded-full shadow-lg shadow-primary/40 animate-in zoom-in">
                                                <CheckCircle2 className="size-4" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 flex flex-col gap-1 border-t border-white/10">
                                        <h3 className="font-bold text-[10px] text-white truncate" title={image.name}>{image.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">ID: {image.id.slice(0, 8)}</p>
                                            {image.size && (
                                                <p className="text-[8px] text-primary/60 font-black">{(image.size / 1024).toFixed(0)} KB</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination & Actions */}
                <div className="p-6 bg-black/40 border-t border-white/10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-bold">المختار:</span>
                            {tempSelectedUrl ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-primary font-black truncate max-w-[200px]">
                                        {selectedImage ? selectedImage.name : 'صورة مختارة'}
                                    </span>
                                    <button
                                        onClick={() => setTempSelectedUrl(undefined)}
                                        className="text-gray-500 hover:text-white transition-colors"
                                        title="إلغاء الاختيار"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-500 font-medium">لا شيء</span>
                            )}
                        </div>

                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 rounded-lg bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/50 text-white disabled:opacity-30"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md min-w-[2rem] text-center">{page}</span>
                                    <span className="text-xs font-bold text-white/40">من</span>
                                    <span className="text-xs font-black text-white/60">{meta.totalPages}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 rounded-lg bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/50 text-white disabled:opacity-30"
                                    disabled={page >= meta.totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            className="h-14 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-bold px-8 transition-all"
                            onClick={() => setIsOpen(false)}
                        >
                            إلغاء
                        </Button>
                        <Button
                            className={cn(
                                "h-14 rounded-xl font-black px-12 shadow-lg transition-all",
                                tempSelectedUrl
                                    ? "bg-primary hover:bg-primary/90 text-black shadow-primary/20 hover:shadow-primary/30 hover:scale-105"
                                    : "bg-white/10 text-white/50 cursor-not-allowed"
                            )}
                            onClick={handleConfirm}
                            disabled={!tempSelectedUrl}
                        >
                            استخدام الصورة
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

