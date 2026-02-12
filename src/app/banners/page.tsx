'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Trash,
    Loader2,
    Image as ImageIcon,
} from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { GallerySelector } from '@/components/gallery/gallery-selector';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';

const GET_BANNERS = gql`
    query GetBanners($search: String, $skip: Int, $take: Int) {
        banners(search: $search, skip: $skip, take: $take) {
            items {
                id
                title
                image
                link
                order
                isActive
            }
            total
        }
    }
`;

const CREATE_BANNER = gql`
    mutation CreateBanner($input: CreateBannerInput!) {
        createBanner(input: $input) {
            id
            title
        }
    }
`;

const UPDATE_BANNER = gql`
    mutation UpdateBanner($id: ID!, $input: UpdateBannerInput!) {
        updateBanner(id: $id, input: $input) {
            id
            title
        }
    }
`;

const DELETE_BANNER = gql`
    mutation DeleteBanner($id: ID!) {
        deleteBanner(id: $id)
    }
`;

const BULK_DELETE_BANNERS = gql`
    mutation BulkDeleteBanners($ids: [ID!]!) {
        bulkDeleteBanners(ids: $ids)
    }
`;

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const BANNER_TYPES = [
    { value: 'MAIN', label: 'الرئيسية' },
    { value: 'SIDE', label: 'جانبي' },
    { value: 'PROMO', label: 'ترويجي' },
];

export default function BannersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [image, setImage] = useState('');
    const [link, setLink] = useState('');
    const [order, setOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [take, setTake] = useState(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const { data, loading, error, refetch } = useQuery<{ banners: { items: any[], total: number } }>(GET_BANNERS, {
        variables: {
            search: search || undefined,
            skip: page * take,
            take: take
        }
    });

    const [createBanner, { loading: isCreating }] = useMutation(CREATE_BANNER, {
        onCompleted: () => {
            toast.success('تم إنشاء البانر بنجاح');
            closeDialog();
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [updateBanner, { loading: isUpdating }] = useMutation(UPDATE_BANNER, {
        onCompleted: () => {
            toast.success('تم تحديث البانر بنجاح');
            closeDialog();
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [deleteBanner, { loading: isDeleting }] = useMutation(DELETE_BANNER, {
        onCompleted: () => {
            toast.success('تم حذف البانر بنجاح');
            setDeleteId(null);
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [bulkDeleteBanners, { loading: isBulkDeleting }] = useMutation(BULK_DELETE_BANNERS, {
        onCompleted: () => {
            toast.success('تم حذف البانرات المختارة بنجاح');
            setSelectedIds([]);
            setIsBulkDeleteDialogOpen(false);
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    if (error) {
        toast.error(`خطأ في تحميل البانرات: ${error.message}`);
    }

    const banners = data?.banners?.items || [];
    const totalCount = data?.banners?.total || 0;
    const totalPages = Math.ceil(totalCount / take);

    const toggleSelectAll = () => {
        if (selectedIds.length === banners.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(banners.map((b: any) => b.id));
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
        setEditingBanner(null);
        setTitle('');
        setTitle('');
        setImage('');
        setLink('');
        setOrder(banners.length);
        setIsActive(true);
        setIsDialogOpen(true);
    };

    const openEditDialog = (banner: any) => {
        setEditingBanner(banner);
        setTitle(banner.title);
        setImage(banner.image);
        setLink(banner.link || '');
        setOrder(banner.order);
        setIsActive(banner.isActive);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingBanner(null);
    };

    const handleSubmit = () => {
        if (!title || !image) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const input: any = { title, image, link, order: parseInt(order.toString()), isActive };
        if (editingBanner) {
            updateBanner({ variables: { id: editingBanner.id, input: input } });
        } else {
            createBanner({ variables: { input } });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                    <div className="flex flex-col gap-1 text-right">
                        <h1 className="text-3xl font-black tracking-tight text-white font-display uppercase italic text-right">البانرات الإعلانية</h1>
                        <p className="text-gray-400 font-medium text-right">إدارة العروض المرئية والبانرات في المتجر.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedIds.length > 0 && (
                            <Button
                                variant="destructive"
                                className="rounded-xl px-6 h-12 font-black shadow-neon-sm animate-in zoom-in-95 duration-200"
                                onClick={() => setIsBulkDeleteDialogOpen(true)}
                            >
                                <span className="material-symbols-outlined ml-2">delete_sweep</span> حذف المحدد ({selectedIds.length})
                            </Button>
                        )}
                        <Button onClick={openCreateDialog} className="gaming-hover bg-primary hover:bg-primary-dark text-black font-black rounded-xl px-8 h-12 shadow-neon-sm border-none">
                            <span className="material-symbols-outlined ml-2">add_photo_alternate</span> إضافة بانر جديد
                        </Button>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row gap-6 items-center shadow-glass">
                    <div className="relative flex-1 w-full group text-right">
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                        <Input
                            placeholder="ابحث في البانرات..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="pr-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl h-14 text-lg transition-all text-right"
                        />
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                        <span className="text-sm text-gray-400 font-bold pr-3">عرض:</span>
                        <Select value={take.toString()} onValueChange={(val) => {
                            setTake(parseInt(val));
                            setPage(0);
                        }}>
                            <SelectTrigger className="w-24 bg-transparent border-none focus:ring-0 text-white font-black">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-panel border-white/10 rounded-2xl overflow-hidden shadow-glass">
                                {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={opt.toString()} className="hover:bg-primary/20 focus:bg-primary/20 transition-colors">{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/5 shadow-glass text-right">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-white/5 hover:bg-transparent text-right">
                                <TableHead className="w-16 text-center py-6">
                                    <Checkbox
                                        checked={selectedIds.length === banners.length && banners.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded-lg border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                    />
                                </TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">الصورة</TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">العنوان</TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">الترتيب</TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">الحالة</TableHead>
                                <TableHead className="text-left py-6 font-black text-gray-400 uppercase tracking-widest text-xs pl-8">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="relative">
                                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                                <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse"></div>
                                            </div>
                                            <p className="text-gray-400 font-black animate-pulse text-lg uppercase tracking-widest">جاري جلب البانرات...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : banners.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-6">
                                            <div className="bg-white/5 p-8 rounded-full border border-white/5 shadow-inner">
                                                <span className="material-symbols-outlined text-6xl text-gray-500/20">collections</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-2xl font-black text-white font-display">لا توجد بانرات</p>
                                                <p className="text-gray-400">ابدأ بإضافة بانر جديد ليظهر في المتجر.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                banners.map((banner: any) => (
                                    <TableRow key={banner.id} className={cn("group border-b border-white/5 hover:bg-white/5 transition-all duration-300", selectedIds.includes(banner.id) && "bg-primary/5")}>
                                        <TableCell className="text-center py-6">
                                            <Checkbox
                                                checked={selectedIds.includes(banner.id)}
                                                onCheckedChange={() => toggleSelect(banner.id)}
                                                className="rounded-lg border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                            />
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="relative h-16 w-32 rounded-xl overflow-hidden border border-white/10 shadow-neon-sm group-hover:scale-110 transition-transform duration-500">
                                                <img src={banner.image} alt={banner.title || 'Banner Image'} className="w-full h-full object-cover" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-black text-lg text-white font-display">{banner.title}</span>
                                                {banner.link && (
                                                    <a href={banner.link} target="_blank" className="text-primary text-xs flex items-center gap-1 hover:underline">
                                                        <span className="material-symbols-outlined text-sm">link</span> {banner.link}
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 font-display font-black text-primary text-xl">#{banner.order}</TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2.5 w-2.5 rounded-full shadow-neon-sm animate-pulse", banner.isActive ? 'bg-green-500' : 'bg-red-500')} />
                                                <span className={cn("text-xs font-black uppercase tracking-widest", banner.isActive ? 'text-green-500' : 'text-red-500')}>
                                                    {banner.isActive ? 'نشط' : 'معطل'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left py-6 pl-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-12 w-12 p-0 rounded-2xl hover:bg-primary/10 transition-all group-hover:border-primary/20 border border-transparent">
                                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">more_horiz</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="glass-panel border-white/10 min-w-[200px] rounded-2xl shadow-glass p-2">
                                                    <DropdownMenuLabel className="opacity-50 text-[10px] font-black uppercase tracking-widest text-right p-3">خيارات البانر</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEditDialog(banner)} className="p-3 rounded-xl cursor-pointer flex items-center justify-end font-bold text-white hover:bg-primary/20 focus:bg-primary/20 transition-all gap-3 group">
                                                        تعديل البانر
                                                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">edit</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5 my-1" />
                                                    <DropdownMenuItem
                                                        className="p-3 rounded-xl text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer flex items-center justify-end font-bold hover:bg-red-500/10 transition-all gap-3 group"
                                                        onClick={() => setDeleteId(banner.id)}
                                                    >
                                                        حذف البانر
                                                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 border-t border-white/5">
                    <div className="text-sm font-bold text-gray-400 order-2 sm:order-1 uppercase tracking-widest text-right">
                        تم عرض <span className="text-primary font-black scale-110 inline-block mx-1">{banners.length}</span> من أصل <span className="text-white font-black">{totalCount}</span> بانر
                    </div>
                    <div className="flex items-center gap-4 order-1 sm:order-2">
                        <Button
                            variant="ghost"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="rounded-xl h-12 px-6 text-white hover:bg-white/10 disabled:opacity-30 transition-all font-black"
                        >
                            &rarr; السابق
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    onClick={() => setPage(i)}
                                    className={cn(
                                        "size-12 rounded-xl font-black text-lg transition-all border",
                                        page === i
                                            ? "bg-primary text-black border-primary shadow-neon scale-110"
                                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                    )}
                                    disabled={loading}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || loading}
                            className="rounded-xl h-12 px-6 text-white hover:bg-white/10 disabled:opacity-30 transition-all font-black"
                        >
                            التالي &larr;
                        </Button>
                    </div>
                </div>
            </div>

            {/* Dialogs remain for next phase or inline update if requested */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 border-white/5 shadow-glass text-right overflow-hidden flex flex-col">
                    <div className="p-8 sm:p-10 flex-1 overflow-y-auto">
                        <DialogHeader className="mb-8 flex flex-col items-end gap-3">
                            <div className="size-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center shadow-neon-sm ml-auto">
                                <span className="material-symbols-outlined text-3xl text-primary">{editingBanner ? 'edit_note' : 'add_photo_alternate'}</span>
                            </div>
                            <DialogTitle className="text-3xl font-black text-white font-display uppercase italic text-right">
                                {editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium text-lg pt-1 text-right">
                                أدخل تفاصيل البانر الإعلاني ليتم عرضه في المتجر.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-8 py-6">
                            <div className="space-y-3">
                                <label className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1 block">عنوان البانر</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: عروض الشتاء القوية" className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold text-white focus:border-primary/50 transition-all text-right" />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <div className="space-y-4">
                                    <label className="text-sm font-black text-primary uppercase tracking-widest flex items-center justify-end gap-2 mb-2 text-right">
                                        صورة البانر
                                        <ImageIcon className="h-4 w-4" />
                                    </label>
                                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all bg-white/5">
                                        <GallerySelector onSelect={setImage} selectedUrl={image} />
                                    </div>
                                    <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="أو الصق رابط الصورة..." className="rounded-2xl bg-surface-dark/50 border-white/10 text-white h-12 text-sm text-left pr-4" dir="ltr" />
                                </div>
                                <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-white/10 bg-surface-dark shadow-neon-sm group">
                                    {image ? (
                                        <>
                                            <img src={image} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <Button variant="destructive" size="icon" className="rounded-full size-16 shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300 border-none" onClick={() => setImage('')}>
                                                    <Trash className="size-8" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-600">
                                            <ImageIcon className="size-20 opacity-20" />
                                            <span className="text-sm font-bold opacity-30">لا توجد صورة</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1 block">رابط التوجيه (اختياري)</label>
                                    <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/products/gaming-pc" className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold text-white focus:border-primary/50 transition-all text-left" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1 block">الترتيب</label>
                                    <Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value))} className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold text-primary focus:border-primary/50 transition-all font-display text-right" />
                                </div>
                                <div className="flex items-end">
                                    <div className="flex items-center justify-between w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-primary/30 transition-all">
                                        <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-primary" />
                                        <span className="text-white font-black text-sm uppercase tracking-widest">تفعيل البانر</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 border-t border-white/5 flex flex-row-reverse gap-4">
                        <Button variant="ghost" onClick={closeDialog} className="flex-1 rounded-2xl h-14 font-black border border-white/10 hover:bg-white/5 transition-all">إلغاء</Button>
                        <Button onClick={handleSubmit} disabled={isCreating || isUpdating || !title || !image} className="flex-1 bg-primary hover:bg-primary-dark text-black font-black rounded-2xl h-14 shadow-neon transition-all hover:scale-[1.02] active:scale-[0.98] border-none">
                            {(isCreating || isUpdating) ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">{editingBanner ? 'save' : 'add_circle'}</span>
                                    {editingBanner ? 'تحديث البانر' : 'إضافة البانر'}
                                </div>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="border-red-500/20 max-w-md rounded-[2.5rem] p-0 text-right shadow-glass overflow-hidden flex flex-col">
                    <div className="p-10 flex-1 overflow-y-auto">
                        <DialogHeader className="flex flex-col items-end gap-4 text-right">
                            <div className="size-20 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center shadow-neon-sm mx-auto">
                                <span className="material-symbols-outlined text-4xl text-red-500">delete</span>
                            </div>
                            <DialogTitle className="text-3xl font-black text-white font-display pt-2">تأكيد الحذف</DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium text-lg pt-1 text-right">
                                هل أنت متأكد؟ سيؤدي هذا إلى حذف هذا البانر نهائياً.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="p-8 border-t border-white/5 flex gap-4">
                        <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 rounded-2xl h-14 font-black border border-white/10 hover:bg-white/5 transition-all">إلغاء</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteBanner({ variables: { id: deleteId } })}
                            disabled={isDeleting}
                            className="flex-1 rounded-2xl h-14 font-black shadow-neon bg-red-500 hover:bg-red-600 border-none transition-all"
                        >
                            {isDeleting ? 'جاري الحذف...' : 'حذف نهائي'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <DialogContent className="border-red-500/20 max-w-md rounded-[2.5rem] p-0 text-right shadow-glass overflow-hidden flex flex-col">
                    <div className="p-10 flex-1 overflow-y-auto">
                        <DialogHeader className="flex flex-col items-end gap-4 text-right">
                            <div className="size-20 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center shadow-neon-sm mx-auto">
                                <span className="material-symbols-outlined text-4xl text-red-500">delete_sweep</span>
                            </div>
                            <DialogTitle className="text-3xl font-black text-white font-display pt-2 text-right">حذف جماعي</DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium text-lg pt-1 text-right">
                                هل أنت متأكد من حذف {selectedIds.length} بانرات؟ لا يمكن التراجع عن هذا الإجراء.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="p-8 border-t border-white/5 grid grid-cols-2 gap-3">
                        <Button
                            variant="destructive"
                            onClick={() => bulkDeleteBanners({ variables: { ids: selectedIds } })}
                            disabled={isBulkDeleting}
                            className="rounded-2xl h-14 font-black bg-red-500 hover:bg-red-600 border-none shadow-neon animation-all"
                        >
                            {isBulkDeleting ? 'جاري الحذف...' : 'حذف المحدد'}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(false)} className="rounded-2xl h-14 font-black text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all">إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
