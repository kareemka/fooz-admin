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
import { Loader2, Box, CheckCircle2, FileCode, Search, Upload, X, Grid, LayoutGrid } from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelectedUrl, setTempSelectedUrl] = useState<string | undefined>(selectedUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['media', 'GLB'],
        queryFn: () => mediaService.getAll('GLB'),
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

    const filteredFiles = useMemo(() => {
        return files.filter(file =>
            file.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [files, searchQuery]);

    const handleConfirm = () => {
        if (tempSelectedUrl) {
            onSelect(tempSelectedUrl);
        }
        setIsOpen(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.glb')) {
                toast.error('يرجى اختيار ملف GLB فقط');
                return;
            }
            uploadMutation.mutate(file);
        }
    };

    const selectedFile = useMemo(() => {
        return files.find(f => f.url === tempSelectedUrl);
    }, [files, tempSelectedUrl]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) setTempSelectedUrl(selectedUrl);
        }}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="w-full rounded-2xl h-24 border-dashed border-2 border-secondary/30 hover:border-secondary hover:bg-secondary/5 transition-all flex flex-col gap-2 relative group overflow-hidden bg-secondary/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Box className="size-6 text-secondary relative z-10" />
                    <span className="text-xs font-bold text-secondary italic relative z-10">اختر ملف GLB</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col rounded-[2.5rem] border border-white/10 shadow-2xl bg-[#0a120e]/95 backdrop-blur-3xl p-0 overflow-hidden text-right" dir="rtl">
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
                                <p className="text-[10px] text-secondary font-bold tracking-widest opacity-70 mt-1">
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
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-bold px-6">
                            جميع الفئات
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="size-12 text-secondary animate-spin" />
                            <p className="text-white/60 font-medium animate-pulse">جاري تحميل النماذج...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
                            {/* Upload Tile */}
                            <div
                                className="group relative aspect-[4/5] rounded-[2rem] border-2 border-dashed border-secondary/30 bg-secondary/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-secondary hover:bg-secondary/10 transition-all overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept=".glb"
                                    onChange={handleFileUpload}
                                />
                                {uploadMutation.isPending ? (
                                    <Loader2 className="size-10 text-secondary animate-spin" />
                                ) : (
                                    <>
                                        <div className="p-4 bg-secondary/20 rounded-2xl group-hover:scale-110 transition-transform">
                                            <Upload className="size-8 text-secondary" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-white uppercase tracking-tighter">رفع جديد</p>
                                            <p className="text-[10px] text-secondary font-bold opacity-60">اسحب وافلت ملف .GLB</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className={cn(
                                        "group relative flex flex-col rounded-[2rem] border border-white/10 transition-all duration-300 cursor-pointer overflow-hidden bg-white/5 hover:border-secondary/40",
                                        tempSelectedUrl === file.url && "border-secondary/60 ring-2 ring-secondary/20 bg-secondary/5"
                                    )}
                                    onClick={() => setTempSelectedUrl(file.url)}
                                >
                                    <div className="aspect-square relative overflow-hidden bg-black/40">
                                        <GLBViewer
                                            src={file.url}
                                            className="w-full h-full"
                                            autoRotate={false}
                                        />
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-lg border border-white/10">
                                            {(file.size! / (1024 * 1024)).toFixed(1)} MB
                                        </div>
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
                </div>

                <div className="p-6 bg-black/40 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-bold">المختار:</span>
                        <span className="text-sm text-secondary font-black truncate max-w-[200px]">
                            {selectedFile ? selectedFile.name : 'لا شيء'}
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="h-10 rounded-xl text-gray-400 hover:text-white font-bold px-6"
                            onClick={() => setIsOpen(false)}
                        >
                            إلغاء
                        </Button>
                        <Button
                            className="h-10 rounded-xl bg-secondary hover:bg-secondary/90 text-black font-black px-10 shadow-lg shadow-secondary/20 disabled:opacity-50"
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
