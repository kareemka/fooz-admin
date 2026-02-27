'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/admin-layout';
import { GET_ORDERS } from '@/lib/queries';
import { CURRENCY } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Loader2 } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  colorName?: string;
  sizeName?: string;
  accessories?: {
    id: string;
    name: string;
    price: number;
  }[];
  product?: {
    name: string;
    mainImage: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface PaginatedOrders {
  items: Order[];
  total: number;
}


const UPDATE_ORDER_STATUS = gql`
    mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
        updateOrderStatus(input: $input) {
            id
            status
        }
    }
`;

const REMOVE_ORDER = gql`
    mutation RemoveOrder($id: String!) {
        removeOrder(id: $id)
    }
`;

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'قيد الانتظار', icon: 'schedule', color: 'bg-yellow-500' },
  { value: 'PROCESSING', label: 'قيد التنفيذ', icon: 'pending', color: 'bg-blue-500' },
  { value: 'SHIPPED', label: 'تم الشحن', icon: 'local_shipping', color: 'bg-purple-500' },
  { value: 'DELIVERED', label: 'تم التوصيل', icon: 'check_circle', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'ملغي', icon: 'cancel', color: 'bg-red-500' },
];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [take, setTake] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{ orders: PaginatedOrders }>(GET_ORDERS, {
    variables: {
      search: search || undefined,
      status: statusFilter || undefined,
      skip: parseInt((page * take).toString()),
      take: parseInt(take.toString())
    }
  });



  const [updateStatus, { loading: isUpdating }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: () => {
      toast.success('تم تحديث حالة الطلب بنجاح');
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const [removeOrder, { loading: isDeleting }] = useMutation(REMOVE_ORDER, {
    onCompleted: () => {
      toast.success('تم حذف الطلب بنجاح');
      setDeleteId(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const orders = data?.orders?.items || [];
  const totalCount = data?.orders?.total || 0;
  const totalPages = Math.ceil(totalCount / take);

  const handleStatusUpdate = (id: string, newStatus: string) => {
    updateStatus({
      variables: {
        input: { id, status: newStatus }
      }
    });
  };

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between font-display">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">إدارة الطلبات</h1>
            <p className="text-sm text-gray-400 font-medium">متابعة طلبات العملاء وحالات التوصيل.</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">search</span>
            <Input
              placeholder="ابحث برقم الطلب أو اسم العميل..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pr-10 h-12 bg-surface/50 border-white/10 text-white rounded-xl focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest whitespace-nowrap">الحالة</span>
              <Select value={statusFilter || 'ALL'} onValueChange={(val) => {
                setStatusFilter(val === 'ALL' ? null : val);
                setPage(0);
              }}>
                <SelectTrigger className="w-full lg:w-48 h-12 bg-surface/50 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="تصفية بالحالة" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/10 text-white rounded-xl">
                  <SelectItem value="ALL">جميع الحالات</SelectItem>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border-white/5 overflow-hidden shadow-glass transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-surface/50 text-gray-400 font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">رقم الطلب</th>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">المبلغ الإجمالي</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-gray-400">جاري جلب الطلبات...</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-64 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-5xl opacity-20">shopping_bag</span>
                        <p className="text-lg font-semibold">لا توجد طلبات حالياً</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => {
                    const statusInfo = getStatusInfo(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-mono font-bold text-primary italic">#{order.orderNumber}</td>
                        <td className="px-6 py-4 font-bold text-white">{order.customerName}</td>
                        <td className="px-6 py-4">
                          <span className="font-black text-white text-base">{formatPrice(order.totalAmount)} {CURRENCY.SYMBOL}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider border",
                            statusInfo.value === 'PENDING' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                            statusInfo.value === 'PROCESSING' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                            statusInfo.value === 'SHIPPED' && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                            statusInfo.value === 'DELIVERED' && "bg-green-500/10 text-green-500 border-green-500/20",
                            statusInfo.value === 'CANCELLED' && "bg-red-500/10 text-red-500 border-red-500/20"
                          )}>
                            <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 text-left">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-lg">more_horiz</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="glass-panel border-white/10 text-white rounded-xl p-1 shadow-glass min-w-[180px]">
                              <DropdownMenuLabel className="text-right opacity-50 text-[10px] font-bold uppercase tracking-widest p-2">خيارات الطلب</DropdownMenuLabel>
                              <DropdownMenuItem asChild className="cursor-pointer justify-end rounded-lg hover:bg-white/10 gap-3 py-2 px-3 focus:bg-white/10 focus:text-white">
                                <Link href={`/orders/${order.id}`}>
                                  <span className="font-bold">عرض التفاصيل</span>
                                  <span className="material-symbols-outlined text-sm">visibility</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5 mx-1" />
                              <DropdownMenuLabel className="text-right opacity-50 text-[10px] font-bold uppercase tracking-widest p-2">تغيير الحالة</DropdownMenuLabel>
                              {STATUS_OPTIONS.map(opt => (
                                <DropdownMenuItem
                                  key={opt.value}
                                  onClick={() => handleStatusUpdate(order.id, opt.value)}
                                  className={cn(
                                    "cursor-pointer justify-end rounded-lg hover:bg-white/10 gap-3 py-2 px-3 focus:bg-white/10 focus:text-white",
                                    order.status === opt.value && "bg-primary/10 text-primary"
                                  )}
                                >
                                  <span className="font-bold">{opt.label}</span>
                                  <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator className="bg-white/5 mx-1" />
                              <DropdownMenuItem
                                onClick={() => setDeleteId(order.id)}
                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer justify-end rounded-lg gap-3 py-2 px-3 font-bold"
                              >
                                <span>حذف السجل</span>
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            إجمالي الطلبات: <span className="text-primary">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
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
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
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

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="border-red-500/20 max-w-md rounded-3xl p-0 shadow-glass overflow-hidden flex flex-col">
          <div className="p-10 flex-1 overflow-y-auto text-center">
            <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-500/20">
              <span className="material-symbols-outlined text-3xl">delete</span>
            </div>
            <DialogTitle className="text-xl font-black mb-2 text-white">تأكيد الحذف</DialogTitle>
            <DialogDescription className="text-gray-400 mb-4">سيتم حذف هذا الطلب نهائياً من قاعدة البيانات. هل أنت متأكد؟</DialogDescription>
          </div>
          <DialogFooter className="p-8 border-t border-white/5 flex gap-3">
            <Button variant="destructive" onClick={() => deleteId && removeOrder({ variables: { id: deleteId } })} disabled={isDeleting} className="flex-1 h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 border-none">حذف نهائي</Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-xl font-bold border border-white/10 text-gray-400">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
