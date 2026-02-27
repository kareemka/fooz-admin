'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
import { Loader2, Box, CheckCircle2, Search, Upload, ChevronRight, ChevronLeft, FileX, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GLBViewer } from '@/components/glb/glb-viewer';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface GLBSelectorProps {
    onSelect: (url: string) => void;
    selectedUrl?: string;
}

export function GLBSelector({ onSelect, selectedUrl }: GLBSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelectedUrl, setTempSelectedUrl] = useState<string | undefined>(selectedUrl);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['media', 'GLB', page],
        queryFn: () => mediaService.getAll('GLB', page, 12),
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => mediaService.upload(file),
        onSuccess: (newFile) => {
            queryClient.invalidateQueries({ queryKey: ['media', 'GLB'] });
            setTempSelectedUrl(newFile.url);
            toast.success('تم رفع الملف بنجاح');
        },
        onError: () => {
            toast.error('فشل رفع الملف');
        }
    });

    const files = data?.items || [];
    const meta = data?.meta;

    const filteredFiles = useMemo(() => {
        return files.filter(file =>
            file.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [files, searchQuery]);

    // Reset search when dialog opens
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setTempSelectedUrl(selectedUrl);
            setPage(1);
        }
    }, [isOpen, selectedUrl]);

    const handleConfirm = () => {
        if (tempSelectedUrl) {
            onSelect(tempSelectedUrl);
            setIsOpen(false);
        }
    };

    const handleFileUpload = (file: File) => {
        if (!file.name.endsWith('.glb')) {
            toast.error('يرجى اختيار ملف GLB فقط');
            return;
        }
        uploadMutation.mutate(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const selectedFile = useMemo(() => {
        return files.find(f => f.url === tempSelectedUrl);
    }, [files, tempSelectedUrl]);

    const hasFiles = files.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl h-24 border-dashed border-2 border-secondary/30 hover:border-secondary hover:bg-secondary/5 transition-all flex flex-col gap-2 relative group overflow-hidden bg-secondary/5"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {selectedUrl ? (
                        <>
                            <CheckCircle2 className="size-6 text-secondary relative z-10" />
                            <span className="text-xs font-bold text-secondary italic relative z-10">تم اختيار ملف</span>
                        </>
                    ) : (
                        <>
                            <Box className="size-6 text-secondary relative z-10" />
                            <span className="text-xs font-bold text-secondary italic relative z-10">اختر ملف GLB</span>
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[90vw] lg:max-w-6xl h-[85vh] flex flex-col rounded-[2.5rem] border border-white/10 shadow-2xl bg-[#0a120e]/95 backdrop-blur-3xl p-0 overflow-hidden text-right"
                dir="rtl"
            >
                <DialogHeader className="p-8 pb-4 relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-secondary/20 p-3 rounded-2xl shadow-neon-secondary">
                                <Box className="size-7 text-secondary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                                    اختيار ملف .GLB
                                </DialogTitle>
                                <p className="text-[10px] text-secondary font-bold tracking-widest opacity-70 mt-1 uppercase">
                                    ASSET_LIBRARY_V.0.4.2 // مكتبة الأصول
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-gray-500 group-focus-within:text-secondary transition-colors" />
                            <Input
                                placeholder="ابحث عن اسم الملف..."
                                className="h-12 bg-white/5 border-white/10 rounded-xl pr-12 text-white focus:border-secondary transition-all"
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

                <div
                    className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="relative">
                                <Loader2 className="size-12 text-secondary animate-spin" />
                                <Sparkles className="size-5 text-secondary/60 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                            <p className="text-white/60 font-medium animate-pulse">جاري تحميل النماذج...</p>
                        </div>
                    ) : (
                        <>
                            {!hasFiles && !uploadMutation.isPending ? (
                                <div className="flex flex-col items-center justify-center h-full gap-6">
                                    <div className="bg-white/5 p-8 rounded-3xl border border-dashed border-white/20">
                                        <FileX className="size-16 text-white/30" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-white mb-2">لا توجد ملفات GLB</h3>
                                        <p className="text-sm text-white/50">ابدأ برفع أول ملف GLB إلى المكتبة</p>
                                    </div>
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-black font-black px-8"
                                    >
                                        <Upload className="size-4 ml-2" />
                                        رفع ملف جديد
                                    </Button>
                                </div>
                            ) : filteredFiles.length === 0 && searchQuery ? (
                                <div className="flex flex-col items-center justify-center h-full gap-6">
                                    <div className="bg-white/5 p-8 rounded-3xl border border-dashed border-white/20">
                                        <Search className="size-16 text-white/30" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-white mb-2">لم يتم العثور على نتائج</h3>
                                        <p className="text-sm text-white/50">جرب مصطلح بحث آخر</p>
                                    </div>
                                    <Button
                                        onClick={() => setSearchQuery('')}
                                        variant="outline"
                                        className="h-10 rounded-xl border-white/20 text-white hover:bg-white/5"
                                    >
                                        مسح البحث
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-4 py-4">
                                    {/* Upload Tile */}
                                    <div
                                        className={cn(
                                            "group relative aspect-square rounded-[2rem] border-2 border-dashed transition-all overflow-hidden",
                                            isDragging
                                                ? "border-secondary bg-secondary/20 scale-105"
                                                : "border-secondary/30 bg-secondary/5 hover:border-secondary hover:bg-secondary/10 cursor-pointer"
                                        )}
                                        onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            accept=".glb"
                                            onChange={handleFileInputChange}
                                        />
                                        {uploadMutation.isPending ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="size-10 text-secondary animate-spin" />
                                                <p className="text-xs text-secondary font-bold animate-pulse">جاري الرفع...</p>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                                <div className="p-4 bg-secondary/20 rounded-2xl group-hover:scale-110 transition-transform">
                                                    <Upload className="size-8 text-secondary" />
                                                </div>
                                                <div className="text-center px-4">
                                                    <p className="font-bold text-white text-xs uppercase tracking-tighter">رفع جديد</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {filteredFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            className={cn(
                                                "group relative flex flex-col rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden bg-white/5",
                                                tempSelectedUrl === file.url
                                                    ? "border-secondary/60 ring-2 ring-secondary/20 bg-secondary/5 scale-[1.02]"
                                                    : "border-white/10 hover:border-secondary/40 hover:scale-[1.01]"
                                            )}
                                            onClick={() => setTempSelectedUrl(file.url)}
                                        >
                                            <div className="aspect-square relative overflow-hidden bg-black/40">
                                                <GLBViewer
                                                    src={file.url}
                                                    className="w-full h-full"
                                                    autoRotate={tempSelectedUrl === file.url}
                                                />
                                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-lg border border-white/10">
                                                    {file.size ? (file.size / (1024 * 1024)).toFixed(1) : '0.0'} MB
                                                </div>
                                                {tempSelectedUrl === file.url && (
                                                    <div className="absolute inset-0 bg-secondary/5 pointer-events-none" />
                                                )}
                                                {tempSelectedUrl === file.url && (
                                                    <div className="absolute top-3 right-3 bg-secondary text-black p-1.5 rounded-full shadow-lg shadow-secondary/40 animate-in zoom-in">
                                                        <CheckCircle2 className="size-4" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 flex flex-col gap-1.5 border-t border-white/10">
                                                <h3 className="font-bold text-xs text-white truncate" title={file.name}>{file.name}</h3>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">ID: {file.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Drag overlay */}
                    {isDragging && (
                        <div className="fixed inset-0 bg-secondary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
                            <div className="bg-secondary/20 border-2 border-dashed border-secondary rounded-3xl p-12 text-center">
                                <Upload className="size-16 text-secondary mx-auto mb-4 animate-bounce" />
                                <p className="text-2xl font-black text-secondary">أفلت الملف هنا</p>
                            </div>
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
                                    <span className="text-sm text-secondary font-black truncate max-w-[200px]">
                                        {selectedFile ? selectedFile.name : 'لا شيء'}
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
                                    className="size-8 rounded-lg bg-white/5 border-white/10 hover:bg-secondary/10 hover:border-secondary/50 text-white disabled:opacity-30"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md min-w-[2rem] text-center">{page}</span>
                                    <span className="text-xs font-bold text-white/40">من</span>
                                    <span className="text-xs font-black text-white/60">{meta.totalPages}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 rounded-lg bg-white/5 border-white/10 hover:bg-secondary/10 hover:border-secondary/50 text-white disabled:opacity-30"
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
                                    ? "bg-secondary hover:bg-secondary/90 text-black shadow-secondary/20 hover:shadow-secondary/30 hover:scale-105"
                                    : "bg-white/10 text-white/50 cursor-not-allowed"
                            )}
                            onClick={handleConfirm}
                            disabled={!tempSelectedUrl}
                        >
                            تأكيد الاختيار
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}