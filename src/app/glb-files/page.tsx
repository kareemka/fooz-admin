'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService, MediaFile } from '@/services/media.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLayout } from '@/components/layout/admin-layout';
import { GLBViewer } from '@/components/glb/glb-viewer';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export default function GLBFilesPage() {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const limit = 12;

    const { data, isLoading } = useQuery({
        queryKey: ['media', 'GLB', page],
        queryFn: () => mediaService.getAll('GLB', page, limit),
    });

    const files = data?.items || [];
    const meta = data?.meta;

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mediaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', 'GLB'] });
            toast.success('تم حذف الملف بنجاح');
        },
        onError: () => toast.error('فشل حذف الملف'),
    });

    const batchDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => mediaService.deleteMultiple(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', 'GLB'] });
            setSelectedIds([]);
            toast.success('تم حذف الملفات المختارة بنجاح');
        },
        onError: () => toast.error('فشل حذف الملفات المختارة'),
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            await mediaService.upload(file);
            queryClient.invalidateQueries({ queryKey: ['media', 'GLB'] });
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
                        <h1 className="text-3xl font-black tracking-tight text-white font-display uppercase italic">ملفات 3D (GLB)</h1>
                        <p className="text-gray-400 font-medium">إدارة النماذج ثلاثية الأبعاد للعرض بتقنية AR.</p>
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
                                accept=".glb"
                                onChange={handleUpload}
                                className="hidden"
                                id="glb-upload"
                                disabled={uploading}
                            />
                            <label htmlFor="glb-upload">
                                <Button asChild disabled={uploading} className="gaming-hover bg-primary hover:bg-primary-dark text-black font-black rounded-xl px-8 h-12 shadow-neon-sm border-none cursor-pointer">
                                    <span>
                                        {uploading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <span className="material-symbols-outlined ml-2">upload_file</span>}
                                        رفع ملف GLB جديد
                                    </span>
                                </Button>
                            </label>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 glass-panel rounded-[2.5rem]">
                        <div className="relative">
                            <Loader2 className="size-16 text-primary animate-spin" />
                            <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse"></div>
                        </div>
                        <p className="text-gray-400 font-black animate-pulse text-lg uppercase tracking-widest">جاري جلب الملفات...</p>
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel rounded-[2.5rem] border-white/5 shadow-glass">
                        <div className="bg-white/5 p-10 rounded-full mb-6 border border-white/5 shadow-inner">
                            <span className="material-symbols-outlined text-7xl text-gray-500/20">view_in_ar</span>
                        </div>
                        <h3 className="text-3xl font-black text-white font-display">لا توجد ملفات GLB حالياً</h3>
                        <p className="text-gray-400 mt-2 font-medium">قم برفع ملفات GLB لاستخدامها في تجربة الواقع المعزز.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {files.map((file) => (
                                <Card
                                    key={file.id}
                                    className={cn(
                                        "group relative overflow-hidden rounded-[2.5rem] transition-all duration-500 shadow-glass border-none",
                                        selectedIds.includes(file.id) ? "bg-primary/10 ring-2 ring-primary" : "glass-panel hover:bg-white/5"
                                    )}
                                >
                                    <CardContent className="p-6">
                                        <div className="relative mb-6">
                                            <div className="w-full h-64 rounded-3xl border border-white/10 bg-surface-dark/50 overflow-hidden group/viewer relative shadow-inner">
                                                <div
                                                    className={cn(
                                                        "absolute top-4 right-4 z-20 size-8 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-neon-sm",
                                                        selectedIds.includes(file.id) ? "bg-primary border-primary text-black" : "bg-black/40 border-white/30 group-hover:border-primary/50"
                                                    )}
                                                    onClick={() => toggleSelect(file.id)}
                                                >
                                                    {selectedIds.includes(file.id) && <span className="material-symbols-outlined text-xl">check_circle</span>}
                                                </div>

                                                <GLBViewer
                                                    src={file.url}
                                                    className="w-full h-full"
                                                />

                                                <div className="absolute inset-0 bg-black/0 group-hover/viewer:bg-black/40 transition-all duration-500 pointer-events-none flex items-center justify-center backdrop-blur-0 group-hover/viewer:backdrop-blur-sm">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className="opacity-0 group-hover/viewer:opacity-100 transition-all scale-75 group-hover/viewer:scale-100 pointer-events-auto rounded-[1.5rem] size-16 bg-primary text-black hover:bg-primary-dark shadow-neon border-none"
                                                            >
                                                                <span className="material-symbols-outlined text-3xl">zoom_in</span>
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden border-white/10 rounded-[3rem] shadow-glass">
                                                            <DialogHeader className="absolute top-10 left-10 right-10 z-10 p-0 flex flex-row-reverse items-center justify-between pointer-events-none">
                                                                <DialogTitle className="text-4xl font-black text-white font-display flex items-center gap-4">
                                                                    <div className="bg-primary/10 p-4 rounded-3xl border border-primary/20 shadow-neon-sm">
                                                                        <span className="material-symbols-outlined text-4xl text-primary font-display">view_in_ar</span>
                                                                    </div>
                                                                    معاينة النموذج: {file.name}
                                                                </DialogTitle>
                                                            </DialogHeader>
                                                            <div className="w-full h-full">
                                                                <GLBViewer
                                                                    src={file.url}
                                                                    className="w-full h-full"
                                                                    showAr
                                                                    autoRotate={false}
                                                                />
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </div>

                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="rounded-2xl bg-white/10 text-white hover:bg-primary hover:text-black transition-all duration-300 h-12 w-12 border border-white/10 shadow-glass"
                                                    onClick={() => copyToClipboard(file.url, file.id)}
                                                >
                                                    {copiedId === file.id ? <span className="material-symbols-outlined">check</span> : <span className="material-symbols-outlined">content_copy</span>}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="rounded-2xl bg-white/10 text-white hover:bg-red-500 hover:text-white transition-all duration-300 h-12 w-12 border border-white/10 shadow-glass"
                                                    onClick={() => deleteMutation.mutate(file.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    {deleteMutation.isPending ? <Loader2 className="size-6 animate-spin" /> : <span className="material-symbols-outlined">delete</span>}
                                                </Button>
                                            </div>
                                        </div>

                                        <div onClick={() => toggleSelect(file.id)} className="cursor-pointer">
                                            <h3 className="font-black text-2xl text-white truncate font-display group-hover:text-primary transition-colors" title={file.name}>{file.name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{new Date(file.createdAt!).toLocaleDateString('ar-SA')}</p>
                                                <span className="h-1 w-1 rounded-full bg-gray-700"></span>
                                                <span className="text-[10px] text-primary font-black uppercase tracking-widest italic">GLB 3D MODEL</span>
                                            </div>
                                            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-2 rounded-full bg-primary animate-pulse shadow-neon-sm"></div>
                                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest font-display">Live Preview READY</span>
                                                </div>
                                                {file.size && (
                                                    <span className="text-xs text-white font-black font-display bg-white/5 px-4 py-1.5 rounded-2xl border border-white/5">
                                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-8 mt-16 glass-panel p-8 rounded-[2.5rem] border-white/5 shadow-glass">
                                <Button
                                    variant="ghost"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="rounded-2xl px-10 h-14 text-white hover:bg-white/5 font-black text-xl border border-white/10 disabled:opacity-30 transition-all font-display"
                                >
                                    &larr;
                                </Button>

                                <div className="flex items-center gap-3">
                                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                                        <Button
                                            key={p}
                                            variant="ghost"
                                            onClick={() => setPage(p)}
                                            className={cn(
                                                "size-14 rounded-2xl p-0 font-black text-2xl transition-all border font-display",
                                                page === p ? "bg-primary text-black border-primary shadow-neon scale-110" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            )}
                                        >
                                            {p}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="ghost"
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page === meta.totalPages}
                                    className="rounded-2xl px-10 h-14 text-white hover:bg-white/5 font-black text-xl border border-white/10 disabled:opacity-30 transition-all font-display"
                                >
                                    &rarr;
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
