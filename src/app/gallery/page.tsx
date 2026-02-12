'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService, MediaFile } from '@/services/media.service';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLayout } from '@/components/layout/admin-layout';
import { GLBViewer } from '@/components/glb/glb-viewer';
import { cn } from '@/lib/utils';

export default function GalleryPage() {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [selectedType, setSelectedType] = useState<'IMAGE' | 'GLB' | undefined>(undefined);
    const limit = 10;

    const { data, isLoading } = useQuery({
        queryKey: ['media', selectedType, page],
        queryFn: () => mediaService.getAll(selectedType, page, limit),
    });

    const items = data?.items || [];
    const meta = data?.meta;

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mediaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media'] });
            toast.success('تم حذف العنصر بنجاح');
        },
        onError: () => toast.error('فشل حذف العنصر'),
    });

    const batchDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => mediaService.deleteMultiple(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setSelectedIds([]);
            toast.success('تم حذف العناصر المختارة بنجاح');
        },
        onError: () => toast.error('فشل حذف العناصر المختارة'),
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            await mediaService.upload(file);
            queryClient.invalidateQueries({ queryKey: ['media'] });
            toast.success('تم رفع الملف بنجاح');
        } catch (error) {
            toast.error('فشل رفع الملف');
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast.success('تم نسخ الرابط');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black tracking-tight text-white font-display uppercase italic">المعرض</h1>
                        <p className="text-gray-400 font-medium">إدارة صور المنتجات والملفات ثلاثية الأبعاد.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedIds.length > 0 && (
                            <Button
                                variant="destructive"
                                className="rounded-xl px-6 h-12 font-black shadow-neon-sm animate-in zoom-in-95 duration-200"
                                onClick={() => batchDeleteMutation.mutate(selectedIds)}
                                disabled={batchDeleteMutation.isPending}
                            >
                                {batchDeleteMutation.isPending ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <span className="material-symbols-outlined ml-2">delete_sweep</span>}
                                حذف المحدد ({selectedIds.length})
                            </Button>
                        )}
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*,.glb"
                                onChange={handleUpload}
                                className="hidden"
                                id="media-upload"
                                disabled={uploading}
                            />
                            <label htmlFor="media-upload">
                                <Button asChild disabled={uploading} className="gaming-hover bg-primary hover:bg-primary-dark text-black font-black rounded-xl px-8 h-12 shadow-neon-sm border-none cursor-pointer">
                                    <span>
                                        {uploading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <span className="material-symbols-outlined ml-2">add_to_photos</span>}
                                        رفع ملف جديد
                                    </span>
                                </Button>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between pb-6 border-b border-white/5">
                    <div className="flex gap-2  w-full lg:w-auto pb-2 lg:pb-0 font-display">
                        <button
                            onClick={() => { setSelectedType(undefined); setPage(1); }}
                            className={cn(
                                "px-5 h-10 font-bold text-xs rounded-xl transition-all hover:scale-105 active:scale-95",
                                selectedType === undefined
                                    ? "bg-primary text-black shadow-neon font-black"
                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            )}>الكل</button>
                        <button
                            onClick={() => { setSelectedType('IMAGE'); setPage(1); }}
                            className={cn(
                                "px-5 h-10 font-bold text-xs rounded-xl transition-all hover:scale-105 active:scale-95",
                                selectedType === 'IMAGE'
                                    ? "bg-primary text-black shadow-neon font-black"
                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            )}>صور (JPG/PNG)</button>
                        <button
                            onClick={() => { setSelectedType('GLB'); setPage(1); }}
                            className={cn(
                                "px-5 h-10 font-bold text-xs rounded-xl whitespace-nowrap flex items-center gap-2 transition-all hover:scale-105 active:scale-95",
                                selectedType === 'GLB'
                                    ? "bg-primary text-black shadow-neon font-black"
                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            )}>
                            <span className="material-symbols-outlined text-sm">view_in_ar</span>
                            ملفات 3D
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                        إجمالي العناصر: <span className="text-primary">{meta?.total || 0}</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                        <div className="relative">
                            <div className="size-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
                            <div className="absolute inset-0 blur-xl bg-primary/10 animate-pulse"></div>
                        </div>
                        <p className="text-gray-500 font-bold animate-pulse text-xs uppercase tracking-widest">جاري تحميل المعرض...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel rounded-[2.5rem] border-white/5 shadow-glass">
                        <div className="bg-white/5 p-10 rounded-full mb-6 border border-white/5 shadow-inner">
                            <span className="material-symbols-outlined text-7xl text-gray-500/20">collections</span>
                        </div>
                        <h3 className="text-3xl font-black text-white font-display">لا توجد ملفات حالياً</h3>
                        <p className="text-gray-400 mt-2 font-medium">قم برفع الملفات لتبدأ بعرضها هنا.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "group relative rounded-2xl overflow-hidden border transition-all duration-500 shadow-glass cursor-pointer bg-white/5",
                                        selectedIds.includes(item.id)
                                            ? "border-primary bg-primary/5 scale-[0.98]"
                                            : "border-white/10 hover:border-primary/50"
                                    )}
                                    onClick={() => toggleSelect(item.id)}
                                >
                                    <div className="absolute top-3 left-3 z-10">
                                        <div className={cn(
                                            "size-6 rounded-lg border-2 flex items-center justify-center transition-all backdrop-blur-md",
                                            selectedIds.includes(item.id)
                                                ? "bg-primary border-primary text-black"
                                                : "bg-black/40 border-white/20 group-hover:border-primary/40"
                                        )}>
                                            {selectedIds.includes(item.id) && <span className="material-symbols-outlined text-sm font-black">check</span>}
                                        </div>
                                    </div>

                                    <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.type || 'IMAGE'}
                                    </div>

                                    <div className="aspect-square relative flex items-center justify-center bg-black/20">
                                        {item.type === 'GLB' ? (
                                            <GLBViewer
                                                src={item.url}
                                                className="w-full h-full"
                                                autoRotate={true}
                                                cameraControls={false}
                                            />
                                        ) : (
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700"
                                            />
                                        )}
                                    </div>

                                    <div className="p-4 bg-surface-dark border-t border-white/5">
                                        <h3 className="text-white font-bold text-xs truncate text-right font-display">{item.name}</h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                {new Date(item.createdAt!).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                            </span>
                                            <span className="text-[10px] text-primary/50 font-bold uppercase tracking-tighter italic">FOOZ MEDIA</span>
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(item.url, item.id);
                                            }}
                                            className="w-40 h-10 bg-white text-black rounded-xl font-black text-xs hover:bg-primary transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-lg">content_copy</span>
                                            {copiedId === item.id ? 'تم النسخ' : 'نسخ الرابط'}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteMutation.mutate(item.id);
                                            }}
                                            disabled={deleteMutation.isPending}
                                            className="w-40 h-10 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/5"
                                        >
                                            {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <span className="material-symbols-outlined text-lg">delete</span>}
                                            حذف العنصر
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-16 py-8  border-t border-white/5" dir="rtl">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 h-10 w-10 text-white transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </Button>

                                <div className="flex items-center gap-1.5  max-w-full px-4 scrollbar-hide">
                                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                                        <Button
                                            key={p}
                                            variant="ghost"
                                            onClick={() => setPage(p)}
                                            className={cn(
                                                "w-10 h-10 min-w-[2.5rem] rounded-xl transition-all font-black text-sm border font-display",
                                                page === p
                                                    ? "bg-primary text-black border-primary shadow-neon scale-110"
                                                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            )}
                                        >
                                            {p}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page === meta.totalPages}
                                    className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 h-10 w-10 text-white transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
