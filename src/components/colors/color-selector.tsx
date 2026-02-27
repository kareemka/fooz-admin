'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_COLORS } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Palette, CheckCircle2, Search, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface ColorSelectorProps {
    selectedIds: string[];
    onSelect: (ids: string[]) => void;
    label?: string;
    icon?: any;
    multiSelect?: boolean;
    children?: React.ReactNode;
}

const ITEMS_PER_PAGE = 20;

export function ColorSelector({
    selectedIds,
    onSelect,
    label = 'الألوان',
    icon: Icon = Palette,
    multiSelect = true,
    children
}: ColorSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);

    const { data, loading } = useQuery<{ colors: { items: any[], total: number } }>(GET_COLORS, {
        variables: {
            search: searchQuery || undefined,
            skip: page * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
        },
        fetchPolicy: 'network-only',
    });

    const colors = data?.colors?.items || [];
    const totalCount = data?.colors?.total || 0;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setTempSelectedIds(selectedIds);
            setPage(0);
        }
    }, [isOpen, selectedIds]);

    const handleConfirm = () => {
        onSelect(tempSelectedIds);
        setIsOpen(false);
    };

    const toggleSelect = (id: string) => {
        if (multiSelect) {
            setTempSelectedIds(prev =>
                prev.includes(id)
                    ? prev.filter(i => i !== id)
                    : [...prev, id]
            );
        } else {
            setTempSelectedIds([id]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-2xl h-24 border-dashed border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all flex flex-col gap-2 relative group overflow-hidden bg-primary/5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Icon className="size-6 text-primary relative z-10" />
                        <span className="text-xs font-bold text-primary italic relative z-10">اختر {label}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[90vw] lg:max-w-6xl h-[90vh] flex flex-col rounded-[2.5rem] border border-white/10 shadow-2xl bg-[#0a120e]/95 backdrop-blur-3xl p-0 overflow-hidden text-right"
                dir="rtl"
            >
                <DialogHeader className="p-8 pb-4 relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/20 p-3 rounded-2xl shadow-neon">
                                <Icon className="size-7 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                                    اختيار {label}
                                </DialogTitle>
                                <p className="text-[10px] text-primary font-bold tracking-widest opacity-70 mt-1 uppercase">
                                    Asset Selection // اختيار الأصول
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="ابحث عن اسم اللون..."
                                className="h-12 bg-white/5 border-white/10 rounded-xl pr-12 text-white focus:border-primary transition-all"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(0);
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
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="size-12 text-primary animate-spin" />
                            <p className="text-white/60 font-medium animate-pulse">جاري تحميل البيانات...</p>
                        </div>
                    ) : colors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                            <Palette className="size-16 opacity-20" />
                            <p className="font-bold">لا توجد ألوان متاحة</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-3 py-4">
                            {colors.map((color: any) => {
                                const isSelected = tempSelectedIds.includes(color.id);
                                return (
                                    <div
                                        key={color.id}
                                        onClick={() => toggleSelect(color.id)}
                                        className={cn(
                                            "group relative flex flex-col p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden bg-white/5",
                                            isSelected
                                                ? "border-primary/60 ring-2 ring-primary/20 bg-primary/5 scale-[1.02]"
                                                : "border-white/10 hover:border-primary/40"
                                        )}
                                    >
                                        <div className="aspect-square relative rounded-xl overflow-hidden mb-3 border-2 border-background shadow-inner bg-black/40">
                                            {color.image ? (
                                                <img
                                                    src={color.image}
                                                    alt={color.name}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Palette className="size-8 text-white/20" />
                                                </div>
                                            )}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-primary text-black p-1 rounded-full shadow-lg shadow-primary/40 animate-in zoom-in">
                                                    <CheckCircle2 className="size-3" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-xs text-white text-center truncate">{color.name}</h3>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-black/40 border-t border-white/10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-bold">المختار:</span>
                            <div className="flex gap-1 flex-wrap max-w-[400px]">
                                {tempSelectedIds.length > 0 ? (
                                    <span className="text-sm text-primary font-black">
                                        تم اختيار {tempSelectedIds.length} {label}
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-500 font-medium">لا شيء</span>
                                )}
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 rounded-lg bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/50 text-white disabled:opacity-30"
                                    disabled={page <= 0}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md min-w-[2rem] text-center">{page + 1}</span>
                                    <span className="text-xs font-bold text-white/40">من</span>
                                    <span className="text-xs font-black text-white/60">{totalPages}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 rounded-lg bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/50 text-white disabled:opacity-30"
                                    disabled={page >= totalPages - 1}
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
                                tempSelectedIds.length > 0
                                    ? "bg-primary hover:bg-primary/90 text-black shadow-primary/20 hover:shadow-primary/30 hover:scale-105"
                                    : "bg-white/10 text-white/50 cursor-not-allowed"
                            )}
                            onClick={handleConfirm}
                            disabled={tempSelectedIds.length === 0}
                        >
                            تأكيد الاختيار
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
