'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { CURRENCY } from '@/lib/constants';
import { GallerySelector } from '@/components/gallery/gallery-selector';

const GET_ACCESSORIES = gql`
  query GetAccessories($search: String, $skip: Int, $take: Int) {
    accessories(search: $search, skip: $skip, take: $take) {
      items {
        id
        name
        price
        image
      }
      total
    }
  }
`;

const CREATE_ACCESSORY = gql`
  mutation CreateAccessory($createAccessoryInput: CreateAccessoryInput!) {
    createAccessory(createAccessoryInput: $createAccessoryInput) {
      id
      name
    }
  }
`;

const UPDATE_ACCESSORY = gql`
  mutation UpdateAccessory($id: String!, $updateAccessoryInput: UpdateAccessoryInput!) {
    updateAccessory(id: $id, updateAccessoryInput: $updateAccessoryInput) {
      id
      name
    }
  }
`;

const REMOVE_ACCESSORY = gql`
  mutation RemoveAccessory($id: String!) {
    removeAccessory(id: $id) {
      id
    }
  }
`;

const BULK_DELETE_ACCESSORIES = gql`
  mutation BulkDeleteAccessories($ids: [ID!]!) {
    bulkDeleteAccessories(ids: $ids)
  }
`;

interface Accessory {
  id: string;
  name: string;
  price: number;
  image?: string;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function AccessoriesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [take, setTake] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Controlled inputs
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const { data, loading, error, refetch } = useQuery<{ accessories: { items: Accessory[], total: number } }>(GET_ACCESSORIES, {
    variables: {
      search: search || undefined,
      skip: page * take,
      take: take
    }
  });

  const [createAccessory, { loading: creating }] = useMutation(CREATE_ACCESSORY, {
    onCompleted: () => {
      toast.success('تم إضافة الإكسسوار بنجاح');
      handleClose();
      refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const [updateAccessory, { loading: updating }] = useMutation(UPDATE_ACCESSORY, {
    onCompleted: () => {
      toast.success('تم تحديث الإكسسوار بنجاح');
      handleClose();
      refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const [removeAccessory, { loading: deleting }] = useMutation(REMOVE_ACCESSORY, {
    onCompleted: () => {
      toast.success('تم حذف الإكسسوار بنجاح');
      setDeleteId(null);
      refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const [bulkDeleteAccessories, { loading: bulkDeleting }] = useMutation(BULK_DELETE_ACCESSORIES, {
    onCompleted: () => {
      toast.success('تم حذف العناصر المختارة بنجاح');
      setSelectedIds([]);
      setIsBulkDeleteDialogOpen(false);
      refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditingAccessory(null);
    setName('');
    setPrice('');
    setImage('');
  };

  const handleSubmit = () => {
    const input = {
      name,
      price: parseFloat(price),
      image: image || undefined
    };

    if (editingAccessory) {
      updateAccessory({ variables: { id: editingAccessory.id, updateAccessoryInput: input } });
    } else {
      createAccessory({ variables: { createAccessoryInput: input } });
    }
  };

  const handleEdit = (accessory: Accessory) => {
    setEditingAccessory(accessory);
    setName(accessory.name);
    setPrice(accessory.price.toString());
    setImage(accessory.image || '');
    setIsOpen(true);
  };

  const handleCreate = () => {
    setEditingAccessory(null);
    setName('');
    setPrice('');
    setImage('');
    setIsOpen(true);
  }

  const accessories = data?.accessories?.items || [];
  const totalCount = data?.accessories?.total || 0;
  const totalPages = Math.ceil(totalCount / take);

  const toggleSelectAll = () => {
    if (selectedIds.length === accessories.length && accessories.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accessories.map((a: Accessory) => a.id));
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-right">
            <h1 className="text-3xl font-bold text-white mb-1">الملحقات</h1>
            <p className="text-gray-400 text-sm">إدارة الإضافات، الأسعار، وحالة الملحقات</p>
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
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover text-background-dark font-bold rounded-xl px-6 h-12 shadow-neon transition-all">
              <span className="material-symbols-outlined ml-2">add</span>
              <span>إضافة ملحق</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between border-glass-border">
          <div className="relative w-full lg:w-1/3 group">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-500">search</span>
            </div>
            <input
              type="text"
              placeholder="البحث عن ملحق..."
              className="w-full bg-[#151d19] border border-glass-border text-white text-sm rounded-xl focus:ring-1 focus:ring-primary focus:border-primary block pr-11 pl-4 py-3 placeholder-gray-600 transition-all font-sans"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-glass border-glass-border">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-[#121c18] border-b border-glass-border">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-[80px] text-center py-5">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        className="size-5 rounded border border-glass-border bg-[#1b2823] text-primary focus:ring-primary h-5 w-5 bg-transparent border-white/20"
                        checked={selectedIds.length === accessories.length && accessories.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-right py-5 font-bold text-gray-400 text-sm uppercase">عرض مسبق</TableHead>
                  <TableHead className="text-right py-5 font-bold text-gray-400 text-sm uppercase">اسم الملحق</TableHead>
                  <TableHead className="text-right py-5 font-bold text-gray-400 text-sm uppercase">السعر</TableHead>
                  <TableHead className="text-left py-5 font-bold text-gray-400 text-sm uppercase pl-8">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-96 text-center">
                      <div className="flex flex-col items-center justify-center gap-6">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-primary font-bold animate-pulse text-lg">جاري التحميل...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : accessories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-96 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <span className="material-symbols-outlined text-6xl text-gray-600">inventory_2</span>
                        <p className="text-xl font-bold text-white">لا توجد ملحقات حالياً</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  accessories.map((accessory: Accessory) => (
                    <TableRow
                      key={accessory.id}
                      className={cn(
                        "group border-b border-white/5 transition-all duration-300 hover:bg-white/[0.02]",
                        selectedIds.includes(accessory.id) ? "bg-primary/5" : ""
                      )}
                    >
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            className="size-5 rounded border border-glass-border bg-[#1b2823] text-primary focus:ring-primary cursor-pointer"
                            checked={selectedIds.includes(accessory.id)}
                            onChange={() => toggleSelect(accessory.id)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        {accessory.image ? (
                          <img src={accessory.image} alt={accessory.name} className="size-16 rounded-xl object-cover border border-white/10" />
                        ) : (
                          <div className="size-16 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                            <span className="material-symbols-outlined text-2xl text-gray-600">image</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col text-right">
                          <span className="font-bold text-white group-hover:text-primary transition-colors">{accessory.name}</span>
                          <span className="text-xs text-gray-500 mt-1">ID: {accessory.id.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-white">{formatPrice(accessory.price)} {CURRENCY.SYMBOL}</span>
                      </TableCell>
                      <TableCell className="text-left py-4 pl-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-lg hover:bg-white/10">
                              <span className="material-symbols-outlined text-gray-400">more_vert</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="glass-panel border-white/10 min-w-[180px] rounded-xl shadow-glass p-1">
                            <DropdownMenuLabel className="text-xs text-gray-500 text-right p-2">خيارات</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(accessory)} className="p-3 rounded-lg cursor-pointer flex items-center justify-end font-bold text-white hover:bg-white/5 gap-3 text-right">
                              تعديل
                              <span className="material-symbols-outlined text-xl text-primary">edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                              className="p-3 rounded-lg text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer flex items-center justify-end font-bold hover:bg-red-500/10 gap-3 text-right"
                              onClick={() => setDeleteId(accessory.id)}
                            >
                              حذف
                              <span className="material-symbols-outlined text-xl">delete</span>
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
          <div className="bg-[#121c18] border-t border-glass-border px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-2xl">
            <div className="text-gray-500 text-sm order-2 md:order-1 text-right">
              عرض <span className="font-bold text-white">{Math.min(totalCount, page * take + 1)}</span> إلى <span className="font-bold text-white">{Math.min(totalCount, (page + 1) * take)}</span> من <span className="font-bold text-white">{totalCount}</span> ملحق
            </div>
            <div className="flex items-center gap-2 order-1 md:order-2">
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
                    "px-3 py-1.5 rounded-lg font-bold transition-all text-sm",
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

        {/* Dialogs */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="border-white/10 max-w-2xl rounded-[2rem] p-0 overflow-hidden text-right flex flex-col">
            <div className="p-8 flex-1 overflow-y-auto">
              <DialogHeader className="pb-6 border-b border-white/5 flex flex-col items-end relative">
                <DialogTitle className="text-2xl font-bold text-white text-right">
                  {editingAccessory ? 'تعديل الإكسسوار' : 'إضافة ملحق جديد'}
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-sm pt-2 text-right">
                  أدخل تفاصيل الملحق المطلوب إضافته أو تحديثه في النظام.
                </DialogDescription>
              </DialogHeader>
              <div className="py-8 space-y-6 text-right">
                <div className="space-y-2 text-right">
                  <Label htmlFor="name" className="text-sm font-bold text-gray-400">اسم الملحق</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثل: سماعة، يد تحكم..."
                    className="rounded-xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-14 text-white text-right"
                    required
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="price" className="text-sm font-bold text-gray-400">السعر ({CURRENCY.SYMBOL})</Label>
                  <div className="relative text-right">
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="rounded-xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 pl-16 h-14 text-white text-right"
                      dir="ltr"
                      required
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">{CURRENCY.SYMBOL}</div>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <Label className="text-sm font-bold text-gray-400">صورة الملحق</Label>
                  {image ? (
                    <div className="relative size-full rounded-xl overflow-hidden border border-white/10 shadow-glass group/asset">
                      <img src={image} alt="Preview" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/asset:opacity-100 transition-all flex items-center justify-center">
                        <Button variant="destructive" size="sm" onClick={() => setImage('')} className="rounded-xl">حذف الصورة</Button>
                      </div>
                    </div>
                  ) : (
                    <GallerySelector onSelect={setImage} selectedUrl={image}>
                      <div className="w-full h-48 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-primary/30 transition-all cursor-pointer bg-white/[0.02]">
                        <span className="material-symbols-outlined text-4xl text-gray-600">add_photo_alternate</span>
                        <p className="text-sm font-bold text-gray-500">اختر صورة من المعرض</p>
                      </div>
                    </GallerySelector>
                  )}
                  <Input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="رابط الصورة المباشر..."
                    className="rounded-xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-14 text-white text-right mt-2"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 pt-4 border-t border-white/5 flex flex-row-reverse gap-4">
              <Button
                onClick={handleSubmit}
                disabled={creating || updating || !name || !price}
                className="bg-primary hover:bg-primary/90 text-black font-bold rounded-xl h-14 flex-1 shadow-neon"
              >
                {(creating || updating) ? 'جاري الحفظ...' : editingAccessory ? 'تحديث' : 'إضافة'}
              </Button>
              <Button variant="ghost" onClick={handleClose} className="rounded-xl h-14 flex-1 text-white hover:bg-white/10 border border-white/5">إلغاء</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialogs */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="border-red-500/20 max-w-md rounded-[2rem] p-8 text-right shadow-glass overflow-hidden border-white/5">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="size-20 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center shadow-neon-sm">
                <span className="material-symbols-outlined text-4xl text-red-500">warning</span>
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold text-white">تأكيد الحذف</DialogTitle>
                <DialogDescription className="text-gray-400 text-sm">سيتم حذف هذا الملحق نهائياً. هل أنت متأكد؟</DialogDescription>
              </div>
              <div className="flex gap-4 w-full mt-4">
                <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 rounded-xl h-14 font-bold border border-white/5 hover:bg-white/10">إلغاء</Button>
                <Button variant="destructive" onClick={() => deleteId && removeAccessory({ variables: { id: deleteId } })} disabled={deleting} className="flex-1 rounded-xl h-14 font-bold bg-red-500 hover:bg-red-600">
                  {deleting ? 'جاري الحذف...' : 'حذف'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent className="border-red-500/20 max-w-md rounded-[2rem] p-8 text-right shadow-glass overflow-hidden border-white/5">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="size-20 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center shadow-neon-sm">
                <span className="material-symbols-outlined text-4xl text-red-500">auto_delete</span>
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold text-white">حذف جماعي</DialogTitle>
                <DialogDescription className="text-gray-400 text-sm">
                  أنت على وشك حذف <span className="text-red-500 font-bold">{selectedIds.length}</span> عنصر. هل تريد المتابعة؟
                </DialogDescription>
              </div>
              <div className="flex gap-4 w-full mt-4">
                <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(false)} className="flex-1 rounded-xl h-14 font-bold border border-white/5 hover:bg-white/10">إلغاء</Button>
                <Button variant="destructive" onClick={() => bulkDeleteAccessories({ variables: { ids: selectedIds } })} disabled={bulkDeleting} className="flex-1 rounded-xl h-14 font-bold bg-red-500 hover:bg-red-600">
                  {bulkDeleting ? 'جاري الحذف...' : 'حذف الكل'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
