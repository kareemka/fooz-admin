'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { GET_CATEGORIES } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GallerySelector } from '@/components/gallery/gallery-selector';
import { Loader2 } from 'lucide-react';

const CREATE_CATEGORY = gql`
    mutation CreateCategory($input: CreateCategoryInput!) {
        createCategory(input: $input) {
            id
            name
            slug
            image
            productsCount
        }
    }
`;

const UPDATE_CATEGORY = gql`
    mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
        updateCategory(id: $id, input: $input) {
            id
            name
        }
    }
`;

const DELETE_CATEGORY = gql`
    mutation DeleteCategory($id: ID!) {
        deleteCategory(id: $id)
    }
`;

const BULK_DELETE_CATEGORIES = gql`
    mutation BulkDeleteCategories($ids: [ID!]!) {
        bulkDeleteCategories(ids: $ids)
    }
`;

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function CategoriesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [image, setImage] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [take, setTake] = useState(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const { data, loading, error, refetch } = useQuery<{ categories: { items: any[], total: number } }>(GET_CATEGORIES, {
        variables: {
            search: search || undefined,
            skip: parseInt((page * take).toString()),
            take: parseInt(take.toString())
        }
    });

    const [createCategory, { loading: isCreating }] = useMutation<{ createCategory: any }, { input: any }>(CREATE_CATEGORY, {
        onCompleted: () => {
            toast.success('تم إنشاء الفئة بنجاح');
            closeDialog();
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [updateCategory, { loading: isUpdating }] = useMutation<{ updateCategory: any }, { id: string, input: any }>(UPDATE_CATEGORY, {
        onCompleted: () => {
            toast.success('تم تحديث الفئة بنجاح');
            closeDialog();
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [deleteCategory, { loading: isDeleting }] = useMutation<{ deleteCategory: boolean }, { id: string }>(DELETE_CATEGORY, {
        onCompleted: () => {
            toast.success('تم حذف الفئة بنجاح');
            setDeleteId(null);
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [bulkDeleteCategories, { loading: isBulkDeleting }] = useMutation(BULK_DELETE_CATEGORIES, {
        onCompleted: () => {
            toast.success('تم حذف الفئات المختارة بنجاح');
            setSelectedIds([]);
            setIsBulkDeleteDialogOpen(false);
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const categories = data?.categories?.items || [];
    const totalCount = data?.categories?.total || 0;
    const totalPages = Math.ceil(totalCount / take);

    const toggleSelectAll = () => {
        if (selectedIds.length === categories.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(categories.map((c: any) => c.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleNameChange = (val: string) => {
        setName(val);
        if (!editingCategory) {
            setSlug(val.toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\p{L}\p{N}-]+/gu, '')
            );
        }
    };

    const openCreateDialog = () => {
        setEditingCategory(null);
        setName('');
        setSlug('');
        setImage('');
        setIsDialogOpen(true);
    };

    const openEditDialog = (category: any) => {
        setEditingCategory(category);
        setName(category.name);
        setSlug(category.slug);
        setImage(category.image || '');
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingCategory(null);
    };

    const handleSubmit = () => {
        const input = { name, slug, image: image || undefined };
        if (editingCategory) {
            updateCategory({ variables: { id: editingCategory.id, input } });
        } else {
            createCategory({ variables: { input } });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between font-display">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">الفئات</h1>
                        <p className="text-sm text-gray-400 font-medium">تنظيم المنتجات الخاصة بك في فئات احترافية.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedIds.length > 0 && (
                            <Button
                                variant="destructive"
                                className="rounded-xl border-none bg-red-500/10 text-red-500 hover:bg-red-500/20 px-6 h-12 font-bold transition-all"
                                onClick={() => setIsBulkDeleteDialogOpen(true)}
                            >
                                <span className="material-symbols-outlined ml-2">delete</span>
                                حذف المحدد ({selectedIds.length})
                            </Button>
                        )}
                        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/80 text-black font-black rounded-xl px-8 h-12 shadow-neon transition-all hover:scale-105 active:scale-95 border-none">
                            <span className="material-symbols-outlined ml-2">add</span>
                            إضافة فئة
                        </Button>
                    </div>
                </div>

                <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full group">
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">search</span>
                        <Input
                            placeholder="ابحث عن أي فئة..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="pr-10 h-12 bg-surface/50 border-white/10 text-white rounded-xl focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">عرض</span>
                        <Select value={take.toString()} onValueChange={(val) => {
                            setTake(parseInt(val));
                            setPage(0);
                        }}>
                            <SelectTrigger className="w-24 h-12 bg-surface/50 border-white/10 text-white rounded-xl">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-[4/3] rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                        ))
                    ) : categories.length === 0 ? (
                        <div className="col-span-full h-96 flex flex-col items-center justify-center gap-4 text-gray-500">
                            <span className="material-symbols-outlined text-6xl opacity-20">category</span>
                            <p className="text-xl font-bold">لا توجد فئات حالياً</p>
                        </div>
                    ) : (
                        categories.map((category: any) => (
                            <div
                                key={category.id}
                                className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all cursor-pointer shadow-glass"
                                onClick={() => openEditDialog(category)}
                            >
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${category.image || 'https://picsum.photos/400/300?grayscale'})` }}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                                <div className="relative z-10 h-full flex flex-col justify-end p-5 text-right">
                                    <div className="flex justify-between items-center w-full mb-1">
                                        <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-primary">
                                            <span className="material-symbols-outlined">category</span>
                                        </div>
                                        <span className="text-xs font-bold bg-black/60 px-2 py-1 rounded text-white border border-white/10">{category.productsCount || 0} منتج</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{category.name}</h4>
                                    <p className="text-xs text-gray-400 font-mono">{category.slug}</p>

                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditDialog(category); }}
                                            className="p-1.5 rounded-lg bg-black/60 text-white hover:text-primary border border-white/10"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteId(category.id); }}
                                            className="p-1.5 rounded-lg bg-black/60 text-white hover:text-red-400 border border-white/10"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {!loading && (
                        <button
                            onClick={openCreateDialog}
                            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-white hover:border-primary hover:bg-white/5 transition-all group shadow-glass"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors shadow-neon">
                                <span className="material-symbols-outlined text-2xl">add</span>
                            </div>
                            <span className="font-medium font-display">إضافة تصنيف جديد</span>
                        </button>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-white/5">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                        إجمالي الفئات: <span className="text-primary">{totalCount}</span>
                    </div>
                    <div className="flex items-center gap-2" dir="rtl">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 h-10 w-10 text-white"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </Button>

                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    className={cn(
                                        "w-10 h-10 rounded-xl transition-all font-bold border",
                                        page === i
                                            ? 'bg-primary text-black border-primary shadow-neon-sm'
                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                    )}
                                    onClick={() => setPage(i)}
                                    disabled={loading}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || loading}
                            className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 h-10 w-10 text-white"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="border-white/10 text-white max-w-2xl rounded-3xl p-0 shadow-glass overflow-hidden flex flex-col">
                    <div className="p-8 flex-1 overflow-y-auto">
                        <DialogHeader className="text-right pb-6 border-b border-white/5">
                            <DialogTitle className="text-2xl font-black font-display italic">
                                {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium">أدخل تفاصيل الفئة أدناه ليتم تحديثها في المتجر.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-6 text-right">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">اسم الفئة</label>
                                <Input
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="مثال: كراسي ألعاب"
                                    className="rounded-xl bg-surface/50 border-white/10 text-white pr-4 h-12 focus:border-primary/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">الرابط (Slug)</label>
                                <Input
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="gaming-chairs"
                                    className="rounded-xl bg-surface/50 border-white/10 text-white font-mono text-sm h-12 pr-4 text-left"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">صورة الفئة</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="border border-dashed border-white/10 rounded-2xl p-4 bg-white/5">
                                            <GallerySelector onSelect={setImage} selectedUrl={image} />
                                        </div>
                                        <Input
                                            value={image}
                                            onChange={(e) => setImage(e.target.value)}
                                            placeholder="رابط الصورة المباشر..."
                                            className="rounded-xl bg-surface/50 border-white/10 text-white h-10 text-xs text-left pr-4"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-surface shadow-neon-sm">
                                        {image ? (
                                            <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-700">
                                                <span className="material-symbols-outlined text-4xl opacity-20">image</span>
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

            {/* Delete Confirmation */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="border-red-500/20 text-white max-w-md rounded-3xl p-8 shadow-glass text-center">
                    <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-500/20">
                        <span className="material-symbols-outlined text-3xl">delete</span>
                    </div>
                    <DialogTitle className="text-xl font-black mb-2">تأكيد الحذف</DialogTitle>
                    <DialogDescription className="text-gray-400 mb-8 font-medium italic text-right">سيتم حذف هذه الفئة نهائياً من قاعدة البيانات. هل أنت متأكد؟</DialogDescription>
                    <div className="flex gap-3">
                        <Button variant="destructive" onClick={() => deleteId && deleteCategory({ variables: { id: deleteId } })} disabled={isDeleting} className="flex-1 h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/20">حذف نهائي</Button>
                        <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-xl font-bold border border-white/10 text-gray-400 hover:bg-white/5">إلغاء</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation */}
            <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <DialogContent className="border-red-500/20 text-white max-w-md rounded-3xl p-8 shadow-glass text-center">
                    <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-500/20">
                        <span className="material-symbols-outlined text-3xl">delete</span>
                    </div>
                    <DialogTitle className="text-xl font-black mb-2 font-display">حذف المجموعة</DialogTitle>
                    <DialogDescription className="text-gray-400 mb-8 font-medium italic text-right">أنت على وشك حذف {selectedIds.length} فئة. هذا الإجراء لا يمكن التراجع عنه.</DialogDescription>
                    <div className="flex gap-3">
                        <Button variant="destructive" onClick={() => bulkDeleteCategories({ variables: { ids: selectedIds } })} disabled={isBulkDeleting} className="flex-1 h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/20">حذف الكل</Button>
                        <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold border border-white/10 text-gray-400 hover:bg-white/5">إلغاء</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
