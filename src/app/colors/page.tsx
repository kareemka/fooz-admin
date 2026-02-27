'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { GallerySelector } from '@/components/gallery/gallery-selector';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const GET_COLORS = gql`
    query GetColors($search: String, $skip: Int, $take: Int) {
        colors(search: $search, skip: $skip, take: $take) {
            items {
                id
                name
                image
            }
            total
        }
    }
`;

const CREATE_COLOR = gql`
    mutation CreateColor($input: CreateColorInput!) {
        createColor(input: $input) {
            id
            name
            image
        }
    }
`;

const UPDATE_COLOR = gql`
    mutation UpdateColor($id: ID!, $input: UpdateColorInput!) {
        updateColor(id: $id, input: $input) {
            id
            name
            image
        }
    }
`;

const DELETE_COLOR = gql`
    mutation DeleteColor($id: ID!) {
        deleteColor(id: $id)
    }
`;

const BULK_DELETE_COLORS = gql`
    mutation BulkDeleteColors($ids: [ID!]!) {
        bulkDeleteColors(ids: $ids)
    }
`;

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function ColorsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingColor, setEditingColor] = useState<any>(null);
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [take, setTake] = useState(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const { data, loading, error, refetch } = useQuery<{ colors: { items: any[], total: number } }>(GET_COLORS, {
        variables: {
            search: search || undefined,
            skip: page * take,
            take: take
        }
    });

    const [createColor, { loading: isCreating }] = useMutation<{ createColor: any }, { input: any }>(CREATE_COLOR, {
        onCompleted: () => {
            toast.success('تم إنشاء اللون بنجاح');
            closeDialog();
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [updateColor, { loading: isUpdating }] = useMutation<{ updateColor: any }, { id: string, input: any }>(UPDATE_COLOR, {
        onCompleted: () => {
            toast.success('تم تحديث اللون بنجاح');
            closeDialog();
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [deleteColor, { loading: isDeleting }] = useMutation<{ deleteColor: boolean }, { id: string }>(DELETE_COLOR, {
        onCompleted: () => {
            toast.success('تم حذف اللون بنجاح');
            setDeleteId(null);
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [bulkDeleteColors, { loading: isBulkDeleting }] = useMutation(BULK_DELETE_COLORS, {
        onCompleted: () => {
            toast.success('تم حذف العناصر المختارة بنجاح');
            setSelectedIds([]);
            setIsBulkDeleteDialogOpen(false);
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    if (error) {
        toast.error(`خطأ في تحميل الألوان: ${error.message}`);
    }

    const colors = data?.colors?.items || [];
    const totalCount = data?.colors?.total || 0;
    const totalPages = Math.ceil(totalCount / take);

    const toggleSelectAll = () => {
        if (selectedIds.length === colors.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(colors.map((c: any) => c.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const openCreateDialog = () => {
        setEditingColor(null);
        setName('');
        setImage('');
        setIsDialogOpen(true);
    };

    const openEditDialog = (color: any) => {
        setEditingColor(color);
        setName(color.name);
        setImage(color.image || '');
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingColor(null);
    };

    const handleSubmit = () => {
        const input = { name, image: image || undefined };
        if (editingColor) {
            updateColor({ variables: { id: editingColor.id, input } });
        } else {
            createColor({ variables: { input } });
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">الألوان</h1>
                        <p className="text-gray-400 text-sm">تخصيص لوحة الألوان للمنتجات</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedIds.length > 0 && (
                            <Button
                                variant="destructive"
                                className="rounded-xl px-6 h-12 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                                onClick={() => setIsBulkDeleteDialogOpen(true)}
                            >
                                <span className="material-symbols-outlined ml-2">delete_sweep</span>
                                حذف ({selectedIds.length})
                            </Button>
                        )}
                        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-hover text-background-dark font-bold rounded-xl px-6 h-12 shadow-neon transition-all">
                            <span className="material-symbols-outlined ml-2">palette</span>
                            إضافة لون جديد
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-panel rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full lg:w-1/3 group">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-gray-500">search</span>
                        </div>
                        <input
                            type="text"
                            placeholder="بحث عن لون..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="w-full bg-[#151d19] border border-glass-border text-white text-sm rounded-xl focus:ring-1 focus:ring-primary focus:border-primary block pr-11 pl-4 py-3 placeholder-gray-600 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">عرض</span>
                        <Select value={take.toString()} onValueChange={(val) => {
                            setTake(parseInt(val));
                            setPage(0);
                        }}>
                            <SelectTrigger className="w-24 h-12 bg-[#151d19] border-glass-border text-white rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-panel border-white/10 text-white rounded-xl">
                                {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-glass-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-[#121c18] border-b border-glass-border text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                    <th className="w-12 py-5 text-center px-6">
                                        <input
                                            type="checkbox"
                                            className="rounded border-white/20 accent-primary size-5 cursor-pointer bg-surface-dark"
                                            checked={selectedIds.length === colors.length && colors.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-5">المعاينة</th>
                                    <th className="px-6 py-5">اسم اللون</th>
                                    <th className="px-6 py-5 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border text-gray-300">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="h-96 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                                <p className="text-primary font-medium">جاري جلب البيانات...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : colors.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="h-96 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-6">
                                                <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
                                                    <span className="material-symbols-outlined text-6xl text-gray-500/20">palette</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xl font-bold text-white">لا توجد ألوان</p>
                                                    <p className="text-gray-400">ابدأ بإضافة لون جديد.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    colors.map((color: any) => (
                                        <tr
                                            key={color.id}
                                            className={cn(
                                                "group hover:bg-white/5 transition-colors border-b border-glass-border cursor-pointer",
                                                selectedIds.includes(color.id) && "bg-primary/5"
                                            )}
                                            onClick={() => openEditDialog(color)}
                                        >
                                            <td className="text-center py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-white/20 accent-primary size-5 cursor-pointer bg-surface-dark"
                                                    checked={selectedIds.includes(color.id)}
                                                    onChange={() => toggleSelect(color.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-14 w-14 rounded-xl overflow-hidden border border-glass-border group-hover:border-primary/50 transition-colors bg-black shadow-inner">
                                                    {color.image ? (
                                                        <img src={color.image} alt={color.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-700 bg-surface-dark">
                                                            <span className="material-symbols-outlined text-2xl">palette</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-lg group-hover:text-primary transition-colors">{color.name}</span>
                                                    <span className="text-gray-500 text-[10px] font-mono mt-1">ID: {color.id.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditDialog(color);
                                                        }}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteId(color.id);
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-[#121c18] border-t border-glass-border px-6 py-4 flex items-center justify-between">
                        <div className="text-gray-500 text-sm">
                            عرض <span className="font-bold text-white">{Math.min(totalCount, page * take + 1)}</span> إلى <span className="font-bold text-white">{Math.min(totalCount, (page + 1) * take)}</span> من <span className="font-bold text-white">{totalCount}</span> لون
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0 || loading}
                                className="px-3 py-1.5 rounded-lg border border-glass-border bg-[#1b2823] text-white hover:bg-[#273a33] disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                            {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => (
                                <button
                                    key={i}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg font-bold transition-all",
                                        page === i
                                            ? 'bg-primary text-[#0f1614]'
                                            : 'border border-glass-border bg-[#1b2823] text-gray-400 hover:text-white hover:bg-[#273a33]'
                                    )}
                                    onClick={() => setPage(i)}
                                    disabled={loading}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            {totalPages > 3 && <span className="text-gray-500">...</span>}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1 || loading}
                                className="px-3 py-1.5 rounded-lg border border-glass-border bg-[#1b2823] text-white hover:bg-[#273a33] disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="border-white/10 text-white max-w-2xl rounded-3xl p-0 shadow-glass overflow-hidden flex flex-col">
                    <div className="p-8 flex-1 overflow-y-auto">
                        <DialogHeader className="text-right pb-6 border-b border-white/5">
                            <DialogTitle className="text-2xl font-black">
                                {editingColor ? 'تعديل اللون' : 'إضافة لون جديد'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium">أدخل تفاصيل اللون أدناه ليتم تحديثه في المتجر.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-6 text-right">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">اسم اللون</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="مثال: أحمر، أزرق..."
                                    className="rounded-xl bg-[#151d19] border-white/10 text-white pr-4 h-12 focus:border-primary/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">معاينة اللون</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="border border-dashed border-white/10 rounded-2xl p-4 bg-white/5">
                                            <GallerySelector onSelect={setImage} selectedUrl={image} />
                                        </div>
                                        <Input
                                            value={image}
                                            onChange={(e) => setImage(e.target.value)}
                                            placeholder="رابط الصورة المباشر..."
                                            className="rounded-xl bg-[#151d19] border-white/10 text-white h-10 text-xs text-left pr-4"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#151d19] shadow-neon-sm">
                                        {image ? (
                                            <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-700">
                                                <span className="material-symbols-outlined text-4xl opacity-20">palette</span>
                                                <span className="text-xs font-bold opacity-30">لا توجد صورة</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex-row-reverse gap-3 p-8 border-t border-white/5">
                        <Button onClick={handleSubmit} disabled={isCreating || isUpdating} className="flex-1 h-12 bg-primary hover:bg-primary/80 text-black font-black rounded-xl shadow-neon border-none transition-all active:scale-95">
                            {(isCreating || isUpdating) ? <Loader2 className="animate-spin" /> : 'حفظ التغييرات'}
                        </Button>
                        <Button variant="ghost" onClick={closeDialog} className="flex-1 h-12 rounded-xl text-gray-400 font-bold border border-white/10 hover:bg-white/5">إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="border-red-500/20 text-white max-w-md rounded-3xl p-8 shadow-glass text-center">
                    <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-500/20">
                        <span className="material-symbols-outlined text-3xl">delete</span>
                    </div>
                    <DialogTitle className="text-xl font-black mb-2">تأكيد الحذف</DialogTitle>
                    <DialogDescription className="text-gray-400 mb-8 font-medium italic text-right">سيتم حذف هذا اللون نهائياً من قاعدة البيانات. هل أنت متأكد؟</DialogDescription>
                    <div className="flex gap-3">
                        <Button variant="destructive" onClick={() => deleteId && deleteColor({ variables: { id: deleteId } })} disabled={isDeleting} className="flex-1 h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/20">حذف نهائي</Button>
                        <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-xl font-bold border border-white/10 text-gray-400 hover:bg-white/5">إلغاء</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <DialogContent className="border-red-500/20 text-white max-w-md rounded-3xl p-8 shadow-glass text-center">
                    <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-500/20">
                        <span className="material-symbols-outlined text-3xl">delete</span>
                    </div>
                    <DialogTitle className="text-xl font-black mb-2">حذف المجموعة</DialogTitle>
                    <DialogDescription className="text-gray-400 mb-8 font-medium italic text-right">أنت على وشك حذف {selectedIds.length} لون. هذا الإجراء لا يمكن التراجع عنه.</DialogDescription>
                    <div className="flex gap-3">
                        <Button variant="destructive" onClick={() => bulkDeleteColors({ variables: { ids: selectedIds } })} disabled={isBulkDeleting} className="flex-1 h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/20">حذف الكل</Button>
                        <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold border border-white/10 text-gray-400 hover:bg-white/5">إلغاء</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
