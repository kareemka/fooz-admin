'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { GET_COUPONS, DELETE_COUPON } from '@/lib/queries';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CouponDialog } from '@/components/coupons/coupon-dialog';
import { CURRENCY } from '@/lib/constants';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function CouponsPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [take, setTake] = useState(10);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);

    const { data, loading, refetch } = useQuery<{ coupons: { items: any[], total: number } }>(GET_COUPONS, {
        variables: {
            search: search || undefined,
            skip: page * take,
            take: take
        },
    });

    const [deleteCoupon, { loading: deleteLoading }] = useMutation(DELETE_COUPON, {
        onCompleted: () => {
            toast.success('تم حذف الكود بنجاح');
            refetch();
            setDeleteId(null);
        },
        onError: (error) => {
            toast.error(error.message || 'فشل في حذف الكود');
        },
    });

    const coupons = data?.coupons?.items || [];
    const totalCount = data?.coupons?.total || 0;
    const totalPages = Math.ceil(totalCount / take);

    const handleEdit = (coupon: any) => {
        setEditingCoupon(coupon);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingCoupon(null);
        setIsDialogOpen(true);
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                    <div className="flex flex-col gap-1 text-right">
                        <h1 className="text-3xl font-black tracking-tight text-white font-display uppercase italic text-right">أكواد الخصم</h1>
                        <p className="text-gray-400 font-medium text-right">إدارة كوبونات الخصم والعروض الترويجية بأسلوب نيون.</p>
                    </div>
                    <Button onClick={handleAdd} className="gaming-hover bg-primary hover:bg-primary-dark text-black font-black rounded-xl px-8 h-12 shadow-neon-sm border-none">
                        <span className="material-symbols-outlined ml-2">add_circle</span> إضافة كود خصم
                    </Button>
                </div>

                <div className="glass-panel p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row gap-6 items-center shadow-glass">
                    <div className="relative flex-1 w-full group">
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                        <Input
                            placeholder="ابحث عن أي كود..."
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
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">الكود</TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">النوع</TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">القيمة</TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">تاريخ الانتهاء</TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs font-display">الحد الأدنى</TableHead>
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
                                            <p className="text-gray-400 font-black animate-pulse text-lg uppercase tracking-widest">جاري جلب الأكواد...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : coupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-6">
                                            <div className="bg-white/5 p-8 rounded-full border border-white/5 shadow-inner">
                                                <span className="material-symbols-outlined text-6xl text-gray-500/20">confirmation_number</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-2xl font-black text-white font-display">لا توجد أكواد خصم</p>
                                                <p className="text-gray-400">ابدأ بإضافة كود خصم جديد لعملائك.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                coupons.map((coupon: any) => (
                                    <TableRow key={coupon.id} className="group border-b border-white/5 hover:bg-white/5 transition-all duration-300">
                                        <TableCell className="font-black text-xl text-primary font-display">{coupon.code}</TableCell>
                                        <TableCell className="text-gray-300 font-medium">
                                            {coupon.discountType === 'PERCENTAGE' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                                        </TableCell>
                                        <TableCell className="text-white font-black text-lg">
                                            {coupon.discountValue}{coupon.discountType === 'PERCENTAGE' ? '%' : ` ${CURRENCY.SYMBOL}`}
                                        </TableCell>
                                        <TableCell className="text-gray-400">
                                            {coupon.expiryDate ? format(new Date(coupon.expiryDate), 'dd MMMM yyyy', { locale: ar }) : 'بدون تاريخ'}
                                        </TableCell>
                                        <TableCell className="text-gray-400">
                                            {coupon.minOrderAmount ? `${coupon.minOrderAmount} ${CURRENCY.SYMBOL}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    "rounded-full px-4 py-1 border font-black text-[10px] uppercase tracking-widest",
                                                    coupon.isActive
                                                        ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-neon-sm'
                                                        : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                )}
                                                variant="outline"
                                            >
                                                {coupon.isActive ? 'نشط' : 'معطل'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-left py-6 pl-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-12 w-12 p-0 rounded-2xl hover:bg-primary/10 transition-all group-hover:border-primary/20 border border-transparent">
                                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">more_horiz</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="glass-panel border-white/10 min-w-[200px] rounded-2xl shadow-glass p-2">
                                                    <DropdownMenuLabel className="opacity-50 text-[10px] font-black uppercase tracking-widest text-right p-3">خيارات الكود</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEdit(coupon)} className="p-3 rounded-xl cursor-pointer flex items-center justify-end font-bold text-white hover:bg-primary/20 focus:bg-primary/20 transition-all gap-3 group">
                                                        تعديل الكود
                                                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">edit</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5 my-1" />
                                                    <DropdownMenuItem
                                                        className="p-3 rounded-xl text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer flex items-center justify-end font-bold hover:bg-red-500/10 transition-all gap-3 group"
                                                        onClick={() => setDeleteId(coupon.id)}
                                                    >
                                                        حذف الكود
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
                        تم عرض <span className="text-primary font-black scale-110 inline-block mx-1">{coupons.length}</span> من أصل <span className="text-white font-black">{totalCount}</span> كود
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
                            {(() => {
                                const windowSize = 5;
                                const startPage = Math.max(0, Math.min(page - 2, Math.max(0, totalPages - windowSize)));
                                const endPage = Math.min(totalPages, startPage + windowSize);

                                return Array.from({ length: Math.max(1, endPage - startPage) }).map((_, i) => {
                                    const pageNum = totalPages > 0 ? startPage + i : 0;
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant="ghost"
                                            onClick={() => setPage(pageNum)}
                                            className={cn(
                                                "size-12 rounded-xl font-black text-lg transition-all border",
                                                page === pageNum
                                                    ? "bg-primary text-black border-primary shadow-neon scale-110"
                                                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            )}
                                            disabled={loading || totalPages === 0}
                                        >
                                            {pageNum + 1}
                                        </Button>
                                    );
                                });
                            })()}
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => setPage((p) => Math.min(Math.max(0, totalPages - 1), p + 1))}
                            disabled={page >= Math.max(0, totalPages - 1) || loading}
                            className="rounded-xl h-12 px-6 text-white hover:bg-white/10 disabled:opacity-30 transition-all font-black"
                        >
                            التالي &larr;
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="border-red-500/20 max-w-md rounded-[2.5rem] p-0 text-right shadow-glass overflow-hidden flex flex-col">
                    <div className="p-10 flex-1 overflow-y-auto">
                        <DialogHeader className="flex flex-col items-end gap-4">
                            <div className="size-20 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center shadow-neon-sm mx-auto">
                                <span className="material-symbols-outlined text-4xl text-red-500">delete</span>
                            </div>
                            <DialogTitle className="text-3xl font-black text-white font-display pt-2">تأكيد الحذف</DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium text-lg pt-1 text-right">
                                هل أنت متأكد؟ سيؤدي هذا إلى حذف هذا الكود نهائياً.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="p-8 border-t border-white/5 flex gap-4">
                        <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 rounded-2xl h-14 font-black border border-white/10 hover:bg-white/5">إلغاء</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteCoupon({ variables: { id: deleteId } })}
                            disabled={deleteLoading}
                            className="flex-1 rounded-2xl h-14 font-black shadow-neon bg-red-500 hover:bg-red-600 border-none"
                        >
                            {deleteLoading ? 'جاري الحذف...' : 'حذف الكود نهائياً'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CouponDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                coupon={editingCoupon}
                onSuccess={refetch}
            />
        </AdminLayout>
    );
}
