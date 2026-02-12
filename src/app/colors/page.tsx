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
    Loader2,
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
import { GallerySelector } from '@/components/gallery/gallery-selector';

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

import { cn } from '@/lib/utils';

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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right">
                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-4xl font-black tracking-tight text-white font-display uppercase italic text-right">الألوان</h1>
                        <p className="text-gray-400 font-medium text-lg text-right">تخصيص لوحة الألوان للمنتجات بهوية نيون متطورة.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedIds.length > 0 && (
                            <Button
                                variant="destructive"
                                className="rounded-2xl px-8 h-14 shadow-neon-sm bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-black text-lg transition-all"
                                onClick={() => setIsBulkDeleteDialogOpen(true)}
                            >
                                <span className="material-symbols-outlined ml-2">delete_sweep</span>
                                حذف ({selectedIds.length})
                            </Button>
                        )}
                        <Button onClick={openCreateDialog} className="gaming-hover bg-primary hover:bg-primary-dark text-black font-black rounded-2xl px-10 h-16 shadow-neon border-none text-xl font-display uppercase italic">
                            <span className="material-symbols-outlined ml-3 text-2xl">palette</span>
                            لون نيون جديد
                        </Button>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-8 items-center shadow-glass">
                    <div className="relative flex-1 w-full group">
                        <span className="material-symbols-outlined absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                        <Input
                            placeholder="ابحث عن أي لون في النظام..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="pr-16 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-3xl h-16 text-xl transition-all font-bold placeholder:text-gray-600"
                        />
                    </div>
                    <div className="flex items-center gap-6 bg-white/5 p-3 rounded-[1.5rem] border border-white/10 px-8 h-16 shadow-inner text-lg">
                        <span className="text-gray-400 font-black uppercase tracking-widest text-xs font-display">Show</span>
                        <Select value={take.toString()} onValueChange={(val) => {
                            setTake(parseInt(val));
                            setPage(0);
                        }}>
                            <SelectTrigger className="w-24 bg-transparent border-none focus:ring-0 text-white font-black text-xl font-display">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-panel border-white/10 rounded-2xl overflow-hidden shadow-glass p-2">
                                {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={opt.toString()} className="hover:bg-primary/20 focus:bg-primary/20 transition-all rounded-xl p-3 font-bold">{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="glass-panel rounded-[3rem] overflow-hidden border border-white/5 shadow-glass text-right">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-white/5 hover:bg-transparent bg-white/[0.02]">
                                <TableHead className="w-24 text-center">
                                    <div className="flex justify-center">
                                        <input
                                            type="checkbox"
                                            className="rounded-lg border-white/20 accent-primary size-6 cursor-pointer bg-white/5 transition-all hover:scale-110"
                                            checked={selectedIds.length === colors.length && colors.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right py-8 font-black text-gray-400 uppercase tracking-[0.3em] text-[10px] font-display">Preview</TableHead>
                                <TableHead className="text-right py-8 font-black text-gray-400 uppercase tracking-[0.3em] text-[10px] font-display">Accent Name</TableHead>
                                <TableHead className="text-left py-8 font-black text-gray-400 uppercase tracking-[0.3em] text-[10px] pr-12 font-display">Interface</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-96 text-center">
                                        <div className="flex flex-col items-center justify-center gap-6">
                                            <div className="relative">
                                                <Loader2 className="h-20 w-20 animate-spin text-primary" />
                                                <div className="absolute inset-0 blur-3xl bg-primary/30 animate-pulse"></div>
                                            </div>
                                            <p className="text-primary font-black animate-pulse text-xl uppercase tracking-[0.4em] font-display italic">Syncing Colors...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : colors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-96 text-center">
                                        <div className="flex flex-col items-center justify-center gap-10">
                                            <div className="bg-white/5 p-12 rounded-[2.5rem] border border-white/5 shadow-inner group">
                                                <span className="material-symbols-outlined text-8xl text-gray-500/20 group-hover:text-primary/20 transition-colors duration-700">palette</span>
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-3xl font-black text-white font-display uppercase italic">لا توجد ألوان</p>
                                                <p className="text-gray-400 text-lg font-medium">ابدأ بإضافة لون جديد لتخصيص منتجاتك بهوية نيون.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                colors.map((color: any) => (
                                    <TableRow
                                        key={color.id}
                                        className={cn(
                                            "group border-b border-white/5 transition-all duration-500",
                                            selectedIds.includes(color.id) ? "bg-primary/5 shadow-inner-glass" : "hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded-lg border-white/20 accent-primary size-6 cursor-pointer bg-white/5 transition-transform group-hover:scale-125 duration-500"
                                                    checked={selectedIds.includes(color.id)}
                                                    onChange={() => toggleSelect(color.id)}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            {color.image ? (
                                                <div className="relative group/img size-20">
                                                    <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover/img:opacity-100 transition-opacity duration-700"></div>
                                                    <img src={color.image} alt={color.name} className="size-full rounded-2xl object-cover shadow-neon-sm border border-white/10 group-hover/img:scale-110 transition-transform duration-700 relative z-10" />
                                                </div>
                                            ) : (
                                                <div className="size-20 rounded-2xl bg-[#0A0B10] flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all duration-500 shadow-inner group">
                                                    <span className="material-symbols-outlined text-4xl text-gray-700 group-hover:text-primary transition-colors">palette</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-black text-2xl text-white font-display uppercase italic">{color.name}</span>
                                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                                    <span className="size-1.5 rounded-full bg-primary/40"></span>
                                                    ID: {color.id.substring(0, 12)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left py-8 pr-12">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-14 w-14 p-0 rounded-2xl hover:bg-primary/20 transition-all group-hover:border-primary/20 border border-transparent bg-white/5">
                                                        <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-primary transition-colors">more_horiz</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="glass-panel border-white/10 min-w-[240px] rounded-[1.5rem] shadow-glass p-3 animate-in zoom-in-95 duration-200">
                                                    <DropdownMenuLabel className="opacity-40 text-[10px] font-black uppercase tracking-[0.3em] text-right p-4 font-display">Color Matrix Options</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEditDialog(color)} className="p-4 rounded-xl cursor-pointer flex items-center justify-end font-black text-white hover:bg-primary/[0.15] focus:bg-primary/[0.15] transition-all gap-4 group text-lg font-display uppercase italic">
                                                        Edit Color Data
                                                        <span className="material-symbols-outlined text-2xl text-primary group-hover:rotate-12 transition-transform">edit_square</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5 my-2" />
                                                    <DropdownMenuItem
                                                        className="p-4 rounded-xl text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer flex items-center justify-end font-black hover:bg-red-500/10 transition-all gap-4 group text-lg font-display uppercase italic"
                                                        onClick={() => setDeleteId(color.id)}
                                                    >
                                                        Delete Sequence
                                                        <span className="material-symbols-outlined text-2xl group-hover:scale-125 transition-transform">delete_forever</span>
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

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 py-10 border-t border-white/5">
                    <div className="text-xs font-black text-gray-500 order-2 sm:order-1 uppercase tracking-[0.3em] font-display italic text-right">
                        Visualizing <span className="text-primary brightness-150 inline-block mx-2">{colors.length}</span> of <span className="text-white">{totalCount}</span> Accent Units
                    </div>
                    <div className="flex items-center gap-6 order-1 sm:order-2">
                        <Button
                            variant="ghost"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="rounded-2xl h-14 px-8 text-white hover:bg-white/10 disabled:opacity-30 transition-all font-black text-lg uppercase font-display italic"
                        >
                            &larr; Prev
                        </Button>

                        <div className="flex items-center gap-3">
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
                                                "size-14 rounded-2xl font-black text-xl transition-all border font-display italic",
                                                page === pageNum
                                                    ? "bg-primary text-black border-primary shadow-neon scale-110"
                                                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            )}
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
                            className="rounded-2xl h-14 px-8 text-white hover:bg-white/10 disabled:opacity-30 transition-all font-black text-lg uppercase font-display italic"
                        >
                            Next &rarr;
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="border-white/10 max-w-3xl rounded-[3rem] p-0 overflow-hidden text-right flex flex-col">
                    <div className="p-10 flex-1 overflow-y-auto">
                        <DialogHeader className="pb-6 border-b border-white/5 flex flex-col items-end relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -mr-32 -mt-32"></div>
                            <DialogTitle className="text-4xl font-black text-white font-display flex items-center flex-row-reverse gap-6 relative z-10 uppercase italic">
                                <div className="bg-primary/20 p-4 rounded-[1.5rem] border border-primary/20 shadow-neon-sm">
                                    <span className="material-symbols-outlined text-4xl text-primary">palette</span>
                                </div>
                                {editingColor ? 'Edit Visual Identity' : 'Create New Accent'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium text-lg pt-4 pr-1 relative z-10 text-right">
                                Configure the product color parameters to update the visual matrix.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-10 space-y-12">
                            <div className="space-y-4 text-right">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] flex items-center justify-end gap-3 font-display italic">
                                    <span className="h-px w-10 bg-primary/40"></span>
                                    ACCENT NAME
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., PHANTOM BLUE, TOXIC RED..."
                                    className="rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 px-8 h-16 text-2xl font-black text-white uppercase placeholder:text-gray-700 placeholder:italic font-display"
                                />
                            </div>

                            <div className="space-y-6 text-right">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] flex items-center justify-end gap-3 font-display italic">
                                    <span className="h-px w-10 bg-primary/40"></span>
                                    VISUAL PREVIEW ASSET
                                </label>

                                <div className="p-2 rounded-[2.5rem] bg-[#0A0B10] border border-white/5 shadow-inner-glass min-h-[300px] flex items-center justify-center relative group overflow-hidden">
                                    {image ? (
                                        <div className="relative size-full rounded-[2rem] overflow-hidden border border-white/10 shadow-glass group/asset">
                                            <img src={image} alt="Preview" className="w-full h-[300px] object-cover transition-transform duration-1000 group-hover/asset:scale-110" />
                                            <div className="absolute inset-0 bg-black/70 backdrop-blur-md opacity-0 group-hover/asset:opacity-100 transition-all duration-500 flex items-center justify-center">
                                                <Button
                                                    variant="destructive"
                                                    className="rounded-2xl h-20 px-12 shadow-neon flex items-center gap-4 bg-red-500 border-none font-black text-xl font-display uppercase italic transition-transform hover:scale-110"
                                                    onClick={() => setImage('')}
                                                >
                                                    <span className="material-symbols-outlined text-3xl">delete</span>
                                                    Purge Asset
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-[300px] border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-6 group-hover:border-primary/30 transition-all duration-700 bg-white/[0.02]">
                                            <GallerySelector onSelect={setImage} selectedUrl={image}>
                                                <div className="flex flex-col items-center gap-6 cursor-pointer group/btn p-10">
                                                    <div className="bg-white/5 p-8 rounded-full border border-white/5 group-hover/btn:scale-110 group-hover/btn:bg-primary/10 transition-all duration-500 shadow-inner">
                                                        <span className="material-symbols-outlined text-7xl text-gray-500/20 group-hover/btn:text-primary transition-colors">image</span>
                                                    </div>
                                                    <div className="text-center space-y-2">
                                                        <p className="text-xl font-black text-gray-400 group-hover/btn:text-white transition-colors font-display uppercase italic tracking-widest text-right">Open Visual Archive</p>
                                                        <p className="text-sm font-bold text-gray-600 text-right text-right">Drag or click to select color texture</p>
                                                    </div>
                                                </div>
                                            </GallerySelector>
                                        </div>
                                    )}
                                </div>

                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-2xl text-gray-600 group-focus-within:text-primary transition-colors">link</span>
                                    <Input
                                        value={image}
                                        onChange={(e) => setImage(e.target.value)}
                                        placeholder="OR INPUT SOURCE DIRECTORY (URL)..."
                                        className="rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 pr-16 h-16 font-black text-gray-400 uppercase tracking-widest font-display text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-10 pt-6 border-t border-white/5 flex flex-row-reverse gap-6">
                        <Button
                            onClick={handleSubmit}
                            disabled={isCreating || isUpdating || !name}
                            className="bg-primary hover:bg-primary-dark text-black font-black rounded-2xl h-20 flex-1 shadow-neon border-none text-2xl gaming-hover font-display uppercase italic"
                        >
                            {(isCreating || isUpdating) ? (
                                <div className="flex items-center gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    SYNCING...
                                </div>
                            ) : editingColor ? (
                                <div className="flex items-center gap-4">
                                    Update Identity
                                    <span className="material-symbols-outlined text-3xl">terminal</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    Commit Color
                                    <span className="material-symbols-outlined text-3xl">add_circle</span>
                                </div>
                            )}
                        </Button>
                        <Button variant="ghost" onClick={closeDialog} className="rounded-2xl h-20 flex-1 text-white border border-white/5 hover:bg-white/10 font-black text-xl font-display uppercase italic">Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="border-red-500/20 max-w-lg rounded-[3rem] p-0 text-right shadow-glass overflow-hidden relative flex flex-col">
                    <div className="p-10 flex-1 overflow-y-auto">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] -mr-16 -mt-16 animate-pulse"></div>
                        <DialogHeader className="flex flex-col items-end gap-6 relative z-10">
                            <div className="size-24 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center shadow-neon-sm mx-auto group">
                                <span className="material-symbols-outlined text-5xl text-red-500 group-hover:scale-125 transition-transform duration-500">warning</span>
                            </div>
                            <div className="space-y-3 text-center w-full">
                                <DialogTitle className="text-4xl font-black text-white font-display uppercase italic">Terminal Warning</DialogTitle>
                                <DialogDescription className="text-gray-400 font-medium text-lg pt-2 leading-relaxed">
                                    Are you certain? This action will permanently erase the color sequence from the main database.
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="p-12 border-t border-white/5 flex gap-6 relative z-10">
                        <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 rounded-2xl h-16 font-black border border-white/5 hover:bg-white/10 text-lg font-display uppercase italic">Abort</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteColor({ variables: { id: deleteId } })}
                            disabled={isDeleting}
                            className="flex-1 rounded-2xl h-16 font-black shadow-neon bg-red-500 hover:bg-red-600 border-none text-xl font-display uppercase italic transition-all active:scale-95"
                        >
                            {isDeleting ? 'Erasing...' : 'Confirm Purge'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Dialog */}
            <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <DialogContent className="border-red-500/20 max-w-lg rounded-[3rem] p-0 text-right shadow-glass overflow-hidden relative flex flex-col">
                    <div className="p-10 flex-1 overflow-y-auto">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] -mr-16 -mt-16 animate-pulse"></div>
                        <DialogHeader className="flex flex-col items-end gap-6 relative z-10">
                            <div className="size-24 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center shadow-neon-sm mx-auto group">
                                <span className="material-symbols-outlined text-5xl text-red-500 group-hover:scale-125 transition-transform duration-500">auto_delete</span>
                            </div>
                            <div className="space-y-3 text-center w-full">
                                <DialogTitle className="text-4xl font-black text-white font-display uppercase italic tracking-tighter">Bulk Purge Protocol</DialogTitle>
                                <DialogDescription className="text-gray-400 font-medium text-lg pt-2 leading-relaxed">
                                    You are about to erase <span className="text-red-500 font-black">{selectedIds.length}</span> visual units. This data cannot be recovered.
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="p-12 border-t border-white/5 flex gap-6 relative z-10">
                        <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(false)} className="flex-1 rounded-2xl h-16 font-black border border-white/5 hover:bg-white/10 text-lg font-display uppercase italic">Abort</Button>
                        <Button
                            variant="destructive"
                            onClick={() => bulkDeleteColors({ variables: { ids: selectedIds } })}
                            disabled={isBulkDeleting}
                            className="flex-1 rounded-2xl h-16 font-black shadow-neon bg-red-500 hover:bg-red-600 border-none text-xl font-display uppercase italic transition-all active:scale-95"
                        >
                            {isBulkDeleting ? 'Purging Matrix...' : 'Execute Protocol'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
