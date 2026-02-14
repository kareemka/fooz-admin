'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { GET_PRODUCTS } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CURRENCY } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const GET_CATEGORIES = gql`
    query GetCategories {
        categories {
            items {
                id
                name
            }
        }
    }
`;

const DELETE_PRODUCT = gql`
    mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
    }
`;

const BULK_DELETE_PRODUCTS = gql`
    mutation BulkDeleteProducts($ids: [ID!]!) {
        bulkDeleteProducts(ids: $ids)
    }
`;

const TOGGLE_PRODUCT_STATUS = gql`
    mutation ToggleProductStatus($id: ID!, $isActive: Boolean!) {
        updateProduct(id: $id, input: { isActive: $isActive }) {
            id
            isActive
        }
    }
`;

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function ProductsPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [page, setPage] = useState(0);
    const [take, setTake] = useState(10);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const { data: productsData, loading: productsLoading, refetch } = useQuery<{ products: { items: any[], total: number } }>(GET_PRODUCTS, {
        variables: {
            search: search || undefined,
            category: category === 'all' ? undefined : category,
            skip: parseInt((page * take).toString()),
            take: parseInt(take.toString()),
            includeInactive: true
        },
    });

    const { data: categoriesData } = useQuery<{ categories: { items: any[] } }>(GET_CATEGORIES);

    const [deleteProduct, { loading: deleteLoading }] = useMutation<{ deleteProduct: boolean }, { id: string }>(DELETE_PRODUCT, {
        onCompleted: () => {
            toast.success('تم حذف المنتج بنجاح');
            refetch();
            setDeleteId(null);
        },
        onError: () => {
            toast.error('فشل في حذف المنتج');
        },
    });

    const [bulkDeleteProducts, { loading: isBulkDeleting }] = useMutation(BULK_DELETE_PRODUCTS, {
        onCompleted: () => {
            toast.success('تم حذف المنتجات المختارة بنجاح');
            setSelectedIds([]);
            setIsBulkDeleteDialogOpen(false);
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [toggleProductStatus] = useMutation(TOGGLE_PRODUCT_STATUS, {
        onCompleted: () => {
            toast.success('تم تحديث حالة المنتج');
            refetch();
        },
        onError: (error: any) => toast.error('فشل في تحديث الحالة'),
    });

    const products = productsData?.products?.items || [];
    const totalCount = productsData?.products?.total || 0;
    const totalPages = Math.ceil(totalCount / take);
    const categories = categoriesData?.categories?.items || [];
    const isLoading = productsLoading;

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map((p: any) => p.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">المنتجات</h1>
                        <p className="text-gray-400 text-sm">إدارة المخزون، الأسعار، وحالة المنتجات</p>
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
                        <Button asChild className="bg-primary hover:bg-primary-hover text-background-dark font-bold rounded-xl px-6 h-12 shadow-neon transition-all">
                            <Link href="/products/new">
                                <span className="material-symbols-outlined ml-2">add</span>
                                <span>إضافة منتج</span>
                            </Link>
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
                            placeholder="بحث عن منتج بالاسم أو SKU..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="w-full bg-[#151d19] border border-glass-border text-white text-sm rounded-xl focus:ring-1 focus:ring-primary focus:border-primary block pr-11 pl-4 py-3 placeholder-gray-600 transition-all"
                        />
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
                                            className="rounded border-white/20 accent-primary size-5 cursor-pointer"
                                            checked={selectedIds.length === products.length && products.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-5">المنتج</th>
                                    <th className="px-6 py-5">الفئة</th>
                                    <th className="px-6 py-5">السعر</th>
                                    <th className="px-6 py-5">المخزون</th>
                                    <th className="px-6 py-5">الحالة</th>
                                    <th className="px-6 py-5 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border text-gray-300">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="h-96 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                                <p className="text-primary font-medium">جاري جلب البيانات...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="h-96 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-6">
                                                <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
                                                    <span className="material-symbols-outlined text-6xl text-gray-500/20">inventory_2</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xl font-bold text-white">لا توجد منتجات</p>
                                                    <p className="text-gray-400">ابدأ بإضافة منتج جديد لمتجرك.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product: any) => (
                                        <tr
                                            key={product.id}
                                            className={cn(
                                                "group hover:bg-white/5 transition-colors border-b border-glass-border cursor-pointer",
                                                selectedIds.includes(product.id) && "bg-primary/5"
                                            )}
                                            onClick={() => router.push(`/products/${product.id}/edit`)}
                                        >
                                            <td className="text-center py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-white/20 accent-primary size-5 cursor-pointer bg-surface-dark"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={() => toggleSelect(product.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-14 w-14 rounded-xl overflow-hidden border border-glass-border group-hover:border-primary/50 transition-colors bg-black shadow-inner">
                                                        {product.mainImage ? (
                                                            <img src={product.mainImage} alt={product.name} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-gray-700 bg-surface-dark">
                                                                <span className="material-symbols-outlined text-2xl">image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold text-sm group-hover:text-primary transition-colors">{product.name}</span>
                                                        <span className="text-gray-500 text-[10px] font-mono mt-1">ID: {product.id.substring(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-[#101815] text-gray-400 border border-glass-border group-hover:text-primary group-hover:border-primary/30 transition-colors">
                                                    {product.category?.name || 'بدون فئة'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    {product.discountPercentage ? (
                                                        <>
                                                            <span className="text-[10px] line-through text-gray-500 font-mono">{formatPrice(product.price)} د.ع</span>
                                                            <span className="font-bold text-primary text-lg font-display tracking-tight">{formatPrice(product.price * (1 - product.discountPercentage / 100))} د.ع</span>
                                                        </>
                                                    ) : (
                                                        <span className="font-bold text-white text-lg font-display tracking-tight">{formatPrice(product.price)} د.ع</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        product.stock > 10 ? 'bg-primary shadow-neon-sm' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                                                    )}></div>
                                                    <span className="text-sm font-medium text-gray-300">{product.stock > 0 ? `${product.stock} متوفر` : 'نفد'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={product.isActive}
                                                        onChange={() => toggleProductStatus({ variables: { id: product.id, isActive: !product.isActive } })}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4 text-left" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-start gap-1 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/products/${product.id}/edit`);
                                                        }}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log('Delete clicked, product.id:', product.id);
                                                            setDeleteId(product.id);
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
                            عرض <span className="font-bold text-white">{Math.min(totalCount, page * take + 1)}</span> إلى <span className="font-bold text-white">{Math.min(totalCount, (page + 1) * take)}</span> من <span className="font-bold text-white">{totalCount}</span> منتج
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0 || isLoading}
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
                                    disabled={isLoading}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            {totalPages > 3 && <span className="text-gray-500">...</span>}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1 || isLoading}
                                className="px-3 py-1.5 rounded-lg border border-glass-border bg-[#1b2823] text-white hover:bg-[#273a33] disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="border-red-500/20 max-w-lg rounded-[3rem] p-0 text-right shadow-glass overflow-hidden border-white/5 flex flex-col">
                    <div className="p-10 flex-1 overflow-y-auto">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] -mr-16 -mt-16 animate-pulse"></div>
                        <div className="flex flex-col items-center gap-6 relative z-10 text-center">
                            <div className="size-24 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center shadow-neon-sm group">
                                <span className="material-symbols-outlined text-5xl text-red-500 group-hover:scale-125 transition-transform duration-500">warning</span>
                            </div>
                            <div className="space-y-3 w-full">
                                <DialogTitle className="text-4xl font-black text-white font-display uppercase italic tracking-tighter">تأكيد حذف المنتج</DialogTitle>
                                <DialogDescription className="text-gray-400 font-medium text-lg pt-2 leading-relaxed">
                                    سيتم حذف هذا المنتج نهائياً من قاعدة البيانات. هل أنت متأكد من تنفيذ هذا الإجراء؟
                                </DialogDescription>
                            </div>
                            <div className="flex gap-6 w-full mt-6">
                                <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 rounded-2xl h-16 font-black border border-white/5 hover:bg-white/10 text-lg font-display uppercase italic transition-all">إلغاء</Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => deleteId && deleteProduct({ variables: { id: deleteId } })}
                                    disabled={deleteLoading}
                                    className="flex-1 rounded-2xl h-16 font-black shadow-neon bg-red-500 hover:bg-red-600 border-none text-xl font-display uppercase italic transition-all active:scale-95"
                                >
                                    {deleteLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation */}
            <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <DialogContent className="border-red-500/20 max-w-lg rounded-[3rem] p-0 text-right shadow-glass overflow-hidden border-white/5 flex flex-col">
                    <div className="p-10 flex-1 overflow-y-auto">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] -mr-16 -mt-16 animate-pulse"></div>
                        <div className="flex flex-col items-center gap-6 relative z-10 text-center">
                            <div className="size-24 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center shadow-neon-sm group">
                                <span className="material-symbols-outlined text-5xl text-red-500 group-hover:scale-125 transition-transform duration-500">auto_delete</span>
                            </div>
                            <div className="space-y-3 w-full">
                                <DialogTitle className="text-4xl font-black text-white font-display uppercase italic tracking-tighter">حذف مجموعة منتجات</DialogTitle>
                                <DialogDescription className="text-gray-400 font-medium text-lg pt-2 leading-relaxed">
                                    أنت على وشك حذف <span className="text-red-500 font-black">{selectedIds.length}</span> منتج. هذا الإجراء لا يمكن التراجع عنه.
                                </DialogDescription>
                            </div>
                            <div className="flex gap-6 w-full mt-6">
                                <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(false)} className="flex-1 rounded-2xl h-16 font-black border border-white/5 hover:bg-white/10 text-lg font-display uppercase italic transition-all">إلغاء</Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => bulkDeleteProducts({ variables: { ids: selectedIds } })}
                                    disabled={isBulkDeleting}
                                    className="flex-1 rounded-2xl h-16 font-black shadow-neon bg-red-500 hover:bg-red-600 border-none text-xl font-display uppercase italic transition-all active:scale-95"
                                >
                                    {isBulkDeleting ? 'جاري التنفيذ...' : 'تنفيذ الحذف'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
