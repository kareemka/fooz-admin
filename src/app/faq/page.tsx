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
    Plus,
    Pencil,
    Trash,
    Loader2,
    Search,
    MoreHorizontal,
    HelpCircle,
    Info,
    ChevronLeft,
    ChevronRight,
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const GET_FAQS = gql`
    query GetFaqs($search: String, $skip: Int, $take: Int) {
        faqs(search: $search, skip: $skip, take: $take) {
            items {
                id
                question
                answer
                order
            }
            total
        }
    }
`;

const CREATE_FAQ = gql`
    mutation CreateFaq($input: CreateFaqInput!) {
        createFaq(createFaqInput: $input) {
            id
            question
        }
    }
`;

const UPDATE_FAQ = gql`
    mutation UpdateFaq($id: String!, $input: UpdateFaqInput!) {
        updateFaq(id: $id, updateFaqInput: $input) {
            id
            question
        }
    }
`;

const DELETE_FAQ = gql`
    mutation DeleteFaq($id: String!) {
        removeFaq(id: $id) {
            id
        }
    }
`;

const BULK_DELETE_FAQS = gql`
    mutation BulkDeleteFaqs($ids: [ID!]!) {
        bulkDeleteFaqs(ids: $ids)
    }
`;

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function FAQPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<any>(null);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [order, setOrder] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [take, setTake] = useState(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const { data, loading, error, refetch } = useQuery<{ faqs: { items: any[], total: number } }>(GET_FAQS, {
        variables: {
            search: search || undefined,
            skip: page * take,
            take: take,
        },
    });

    const [createFaq, { loading: isCreating }] = useMutation(CREATE_FAQ, {
        onCompleted: () => {
            toast.success('تم إضافة السؤال بنجاح');
            closeDialog();
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [updateFaq, { loading: isUpdating }] = useMutation(UPDATE_FAQ, {
        onCompleted: () => {
            toast.success('تم تحديث السؤال بنجاح');
            closeDialog();
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [deleteFaq, { loading: isDeleting }] = useMutation(DELETE_FAQ, {
        onCompleted: () => {
            toast.success('تم حذف السؤال بنجاح');
            setDeleteId(null);
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    const [bulkDeleteFaqs, { loading: isBulkDeleting }] = useMutation(BULK_DELETE_FAQS, {
        onCompleted: () => {
            toast.success('تم حذف الأسئلة المختارة بنجاح');
            setSelectedIds([]);
            setIsBulkDeleteDialogOpen(false);
            refetch();
        },
        onError: (error: any) => toast.error(error.message),
    });

    if (error) {
        toast.error(`خطأ في تحميل الأسئلة الشائعة: ${error.message}`);
    }

    const faqs = data?.faqs?.items || [];
    const totalCount = data?.faqs?.total || 0;
    const totalPages = Math.ceil(totalCount / take);

    const toggleSelectAll = () => {
        if (selectedIds.length === faqs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(faqs.map((f: any) => f.id));
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
        setEditingFaq(null);
        setQuestion('');
        setAnswer('');
        setOrder(faqs.length);
        setIsDialogOpen(true);
    };

    const openEditDialog = (faq: any) => {
        setEditingFaq(faq);
        setQuestion(faq.question);
        setAnswer(faq.answer);
        setOrder(faq.order);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingFaq(null);
    };

    const handleSubmit = () => {
        if (!question || !answer) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const input: any = { question, answer, order: parseInt(order.toString()) };
        if (editingFaq) {
            updateFaq({ variables: { id: editingFaq.id, input: { ...input, id: editingFaq.id } } });
        } else {
            createFaq({ variables: { input } });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                    <div className="flex flex-col gap-1 text-right">
                        <h1 className="text-3xl font-black tracking-tight text-white font-display uppercase italic text-right">الأسئلة الشائعة</h1>
                        <p className="text-gray-400 font-medium text-right">إدارة الأسئلة والأجوبة المتكررة لخدمة العملاء.</p>
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
                            <span className="material-symbols-outlined ml-2">add_circle</span> إضافة سؤال جديد
                        </Button>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row gap-6 items-center shadow-glass">
                    <div className="relative flex-1 w-full group text-right">
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                        <Input
                            placeholder="ابحث في الأسئلة..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="pr-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl h-14 text-lg transition-all text-right"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 whitespace-nowrap font-bold uppercase tracking-widest">عرض:</span>
                        <Select value={take.toString()} onValueChange={(val) => {
                            setTake(parseInt(val));
                            setPage(0);
                        }}>
                            <SelectTrigger className="w-28 bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold text-white focus:border-primary/50 transition-all">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-panel border-white/10 rounded-2xl shadow-glass p-2">
                                {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={opt.toString()} className="p-3 rounded-xl cursor-pointer flex items-center justify-end font-bold text-white hover:bg-primary/20 focus:bg-primary/20 transition-all text-right">{opt}</SelectItem>
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
                                        checked={selectedIds.length === faqs.length && faqs.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded-lg border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                    />
                                </TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">السؤال</TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">الجواب</TableHead>
                                <TableHead className="text-right py-6 font-black text-gray-400 uppercase tracking-widest text-xs">الترتيب</TableHead>
                                <TableHead className="text-left py-6 font-black text-gray-400 uppercase tracking-widest text-xs pl-8">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="relative">
                                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                                <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse"></div>
                                            </div>
                                            <p className="text-gray-400 font-black animate-pulse text-lg uppercase tracking-widest">جاري جلب الأسئلة...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : faqs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-6">
                                            <div className="bg-white/5 p-8 rounded-full border border-white/5 shadow-inner">
                                                <span className="material-symbols-outlined text-6xl text-gray-500/20">quiz</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-2xl font-black text-white font-display">لا توجد أسئلة</p>
                                                <p className="text-gray-400">ابدأ بإضافة سؤال جديد ليظهر في الصفحة.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                faqs.map((faq: any) => (
                                    <TableRow key={faq.id} className={cn("group border-b border-white/5 hover:bg-white/5 transition-all duration-300", selectedIds.includes(faq.id) && "bg-primary/5")}>
                                        <TableCell className="text-center py-6">
                                            <Checkbox
                                                checked={selectedIds.includes(faq.id)}
                                                onCheckedChange={() => toggleSelect(faq.id)}
                                                className="rounded-lg border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                            />
                                        </TableCell>
                                        <TableCell className="py-6 max-w-md">
                                            <span className="font-black text-lg text-white font-display block truncate">{faq.question}</span>
                                        </TableCell>
                                        <TableCell className="py-6 max-w-lg">
                                            <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{faq.answer}</p>
                                        </TableCell>
                                        <TableCell className="py-6 font-display font-black text-primary text-xl">#{faq.order}</TableCell>
                                        <TableCell className="text-left py-6 pl-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-12 w-12 p-0 rounded-2xl hover:bg-primary/10 transition-all group-hover:border-primary/20 border border-transparent">
                                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">more_horiz</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="glass-panel border-white/10 min-w-[200px] rounded-2xl shadow-glass p-2">
                                                    <DropdownMenuLabel className="opacity-50 text-[10px] font-black uppercase tracking-widest text-right p-3">خيارات السؤال</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEditDialog(faq)} className="p-3 rounded-xl cursor-pointer flex items-center justify-end font-bold text-white hover:bg-primary/20 focus:bg-primary/20 transition-all gap-3 group">
                                                        تعديل السؤال
                                                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">edit</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5 my-1" />
                                                    <DropdownMenuItem
                                                        className="p-3 rounded-xl text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer flex items-center justify-end font-bold hover:bg-red-500/10 transition-all gap-3 group"
                                                        onClick={() => setDeleteId(faq.id)}
                                                    >
                                                        حذف السؤال
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
                        تم عرض <span className="text-primary font-black scale-110 inline-block mx-1">{faqs.length}</span> من أصل <span className="text-white font-black">{totalCount}</span> سؤال
                    </div>
                    <div className="flex items-center gap-3 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="rounded-2xl border-white/10 hover:bg-white/5 disabled:opacity-30 h-12 w-12 text-white font-black text-xl"
                        >
                            <ChevronRight />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant={page === i ? 'default' : 'outline'}
                                    size="sm"
                                    className={`w-12 h-12 rounded-2xl font-black text-xl ${page === i ? 'bg-primary text-black shadow-neon-sm font-display' : 'border-white/10 text-white hover:bg-white/5 font-display'}`}
                                    onClick={() => setPage(i)}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || loading}
                            className="rounded-2xl border-white/10 hover:bg-white/5 disabled:opacity-30 h-12 w-12 text-white font-black text-xl"
                        >
                            <ChevronLeft />
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 border-white/5 shadow-glass text-right overflow-hidden flex flex-col">
                    <div className="p-8 sm:p-10 flex-1 overflow-y-auto">
                        <DialogHeader className="mb-8 flex flex-col items-end gap-3">
                            <div className="size-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center shadow-neon-sm ml-auto">
                                <span className="material-symbols-outlined text-3xl text-primary">{editingFaq ? 'edit_note' : 'add_circle'}</span>
                            </div>
                            <DialogTitle className="text-3xl font-black text-white font-display uppercase italic text-right">
                                {editingFaq ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium text-lg pt-1 text-right">
                                أدخل تفاصيل السؤال والجواب ليتم عرضها في المتجر.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-8 py-6">
                            <div className="space-y-3">
                                <label className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1 block">السؤال</label>
                                <Input
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="مثلاً: كيف يمكنني تتبع طلبي؟"
                                    className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold text-white focus:border-primary/50 transition-all text-right"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1 block">الجواب</label>
                                <Textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="أدخل الإجابة التفصيلية هنا..."
                                    className="bg-white/5 border-white/10 min-h-[150px] rounded-2xl text-lg font-bold text-white focus:border-primary/50 transition-all text-right resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1 block">الترتيب</label>
                                    <Input
                                        type="number"
                                        value={order}
                                        onChange={(e) => setOrder(parseInt(e.target.value))}
                                        className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold text-primary focus:border-primary/50 transition-all font-display text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-10 flex flex-row-reverse gap-4">
                            <Button variant="ghost" onClick={closeDialog} className="flex-1 rounded-2xl h-14 font-black border border-white/10 hover:bg-white/5 transition-all text-white">إلغاء</Button>
                            <Button onClick={handleSubmit} disabled={isCreating || isUpdating || !question || !answer} className="flex-1 bg-primary hover:bg-primary-dark text-black font-black rounded-2xl h-14 shadow-neon transition-all hover:scale-[1.02] border-none">
                                {(isCreating || isUpdating) ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-black" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined">{editingFaq ? 'save' : 'add_circle'}</span>
                                        {editingFaq ? 'تحديث السؤال' : 'إضافة السؤال'}
                                    </div>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="border-red-500/20 max-w-md rounded-[2.5rem] p-8 text-right shadow-glass">
                    <DialogHeader className="flex flex-col items-end gap-4 text-right">
                        <div className="size-20 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center shadow-neon-sm mx-auto">
                            <span className="material-symbols-outlined text-4xl text-red-500">delete</span>
                        </div>
                        <DialogTitle className="text-3xl font-black text-white font-display pt-2">تأكيد الحذف</DialogTitle>
                        <DialogDescription className="text-gray-400 font-medium text-lg pt-1 text-right">
                            هل أنت متأكد؟ سيؤدي هذا إلى حذف هذا السؤال نهائياً.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-10 flex gap-4">
                        <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 rounded-2xl h-14 font-black border border-white/10 hover:bg-white/5 text-white">إلغاء</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteFaq({ variables: { id: deleteId } })}
                            disabled={isDeleting}
                            className="flex-1 rounded-2xl h-14 font-black shadow-neon bg-red-500 hover:bg-red-600 border-none transition-all"
                        >
                            {isDeleting ? 'جاري الحذف...' : 'حذف نهائي'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <DialogContent className="border-red-500/20 max-w-md rounded-[2.5rem] p-8 text-right shadow-glass">
                    <DialogHeader className="flex flex-col items-end gap-4 text-right">
                        <div className="size-20 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center shadow-neon-sm mx-auto">
                            <span className="material-symbols-outlined text-4xl text-red-500">delete_sweep</span>
                        </div>
                        <DialogTitle className="text-3xl font-black text-white font-display pt-2">حذف جماعي</DialogTitle>
                        <DialogDescription className="text-gray-400 font-medium text-lg pt-1 text-right">
                            هل أنت متأكد من حذف {selectedIds.length} أسئلة مختارة؟ لا يمكن التراجع عن هذا الإجراء.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 mt-10">
                        <Button
                            variant="destructive"
                            onClick={() => bulkDeleteFaqs({ variables: { ids: selectedIds } })}
                            disabled={isBulkDeleting}
                            className="rounded-2xl h-14 font-black bg-red-500 hover:bg-red-600 border-none shadow-neon animation-all"
                        >
                            {isBulkDeleting ? 'جاري الحذف...' : 'حذف المحدد'}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(false)} className="rounded-2xl h-14 font-black text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all">إلغاء</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
