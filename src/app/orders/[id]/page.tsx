'use client';

import { useParams, useRouter } from 'next/navigation';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useState } from 'react';
import Link from 'next/link';
import { CURRENCY } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const GET_ORDER_DETAILS = gql`
    query GetOrder($id: String!) {
        order(id: $id) {
            id
            orderNumber
            customerName
            customerPhone
            shippingAddress
            totalAmount
            status
            createdAt
            items {
                id
                productId
                quantity
                price
                surfaceColorName
                surfaceColorImage
                edgeColorName
                edgeColorImage
                sizeName
                sizeDimensions
                accessories {
                    id
                    name
                    price,
                    image
                }
                product {
                    name
                    mainImage
                }
            }
        }
    }
`;

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

const STATUS_STEPS = [
    { value: 'PENDING', label: 'قيد الانتظار', icon: 'schedule', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { value: 'PROCESSING', label: 'قيد التنفيذ', icon: 'pending', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { value: 'SHIPPED', label: 'تم الشحن', icon: 'local_shipping', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { value: 'DELIVERED', label: 'تم التوصيل', icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-500/10' },
];

const STATUS_OPTIONS = [
    ...STATUS_STEPS,
    { value: 'CANCELLED', label: 'ملغي', icon: 'cancel', color: 'text-red-500', bg: 'bg-red-500/10' },
];

interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    surfaceColorName?: string;
    surfaceColorImage?: string;
    edgeColorName?: string;
    edgeColorImage?: string;
    sizeName?: string;
    sizeDimensions?: string;
    accessories?: {
        id: string;
        name: string;
        price: number;
        image?: string;
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

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params?.id as string;
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, loading, error, refetch } = useQuery<{ order: Order }>(GET_ORDER_DETAILS, {
        variables: { id: orderId },
        skip: !orderId,
    });

    const [updateStatus, { loading: isUpdating }] = useMutation(UPDATE_ORDER_STATUS, {
        onCompleted: () => {
            toast.success('تم تحديث حالة الطلب بنجاح');
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const [removeOrder] = useMutation(REMOVE_ORDER, {
        onCompleted: () => {
            toast.success('تم حذف الطلب بنجاح');
            router.push('/orders');
        },
        onError: (error) => toast.error(error.message),
    });

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[80vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-gray-400 font-medium">جاري تحميل تفاصيل الطلب...</p>
                </div>
            </div>
        </AdminLayout>
    );

    if (error || !data?.order) return (
        <AdminLayout>
            <div className="flex flex-col items-center justify-center h-[80vh] gap-6 p-8 text-center text-white">
                <div className="size-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 mb-4">
                    <span className="material-symbols-outlined text-5xl">error</span>
                </div>
                <h2 className="text-3xl font-black italic uppercase">عذراً، لم يتم العثور على الطلب</h2>
                <p className="text-gray-400 max-w-sm font-medium">ربما تم حذف الطلب أو أن الرابط غير صحيح. يرجى العودة لصفحة الطلبات.</p>
                <Button asChild className="bg-primary hover:bg-primary/80 text-black font-black rounded-xl px-8 h-12 shadow-neon transition-all">
                    <Link href="/orders">
                        <span className="material-symbols-outlined ml-2">arrow_forward</span>
                        العودة للطلبات
                    </Link>
                </Button>
            </div>
        </AdminLayout>
    );

    const { order } = data;
    const currentStatusIndex = STATUS_STEPS.findIndex(s => s.value === order.status);
    const isCancelled = order.status === 'CANCELLED';

    const handleStatusUpdate = (newStatus: string) => {
        updateStatus({
            variables: {
                input: { id: orderId, status: newStatus }
            }
        });
    };

    const handleDelete = async () => {
        if (confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) {
            setIsDeleting(true);
            await removeOrder({ variables: { id: orderId } });
            setIsDeleting(false);
        }
    };

    const currentStatus = STATUS_OPTIONS.find(s => s.value === order.status);

    return (
        <AdminLayout>
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
                {/* Breadcrumbs & Header */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start justify-between font-display">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <Link href="/orders" className="hover:text-primary transition-colors">الطلبات</Link>
                            <span className="material-symbols-outlined text-xs">chevron_left</span>
                            <span className="text-gray-300">تفاصيل الطلب</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase italic">
                                طلب <span className="text-primary">#{order.orderNumber}</span>
                            </h1>
                            <span className={cn(
                                "inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider border",
                                currentStatus?.value === 'PENDING' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                                currentStatus?.value === 'PROCESSING' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                currentStatus?.value === 'SHIPPED' && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                                currentStatus?.value === 'DELIVERED' && "bg-green-500/10 text-green-500 border-green-500/20",
                                currentStatus?.value === 'CANCELLED' && "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                                <span className="material-symbols-outlined text-[14px]">{currentStatus?.icon}</span>
                                {currentStatus?.label}
                            </span>
                        </div>
                        <p className="text-gray-400 font-medium flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">event</span>
                            تم الطلب في {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="bg-white/5 border border-white/10 text-white font-bold rounded-xl px-6 h-12 hover:bg-white/10 transition-all">
                                    تحديث الحالة
                                    <span className="material-symbols-outlined mr-2">expand_more</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-panel border-white/10 text-white rounded-xl p-1 shadow-glass min-w-[200px]">
                                <div className="p-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">اختر حالة جديدة</div>
                                {STATUS_OPTIONS.map((status) => (
                                    <DropdownMenuItem
                                        key={status.value}
                                        onClick={() => handleStatusUpdate(status.value)}
                                        className="gap-3 justify-end cursor-pointer rounded-lg hover:bg-white/10 py-2.5 px-3 focus:bg-white/10 focus:text-white"
                                    >
                                        <span className="font-bold">{status.label}</span>
                                        <span className={cn("material-symbols-outlined text-sm", status.color)}>{status.icon}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="destructive"
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-bold rounded-xl px-6 h-12 transition-all"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <span className="material-symbols-outlined ml-2">delete</span>
                            حذف الطلب
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Timeline */}
                        {!isCancelled && (
                            <div className="glass-panel p-8 rounded-3xl border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
                                <div className="flex justify-between relative z-10">
                                    {STATUS_STEPS.map((step, index) => {
                                        const isActive = index <= currentStatusIndex;
                                        const isCurrent = index === currentStatusIndex;

                                        return (
                                            <div key={step.value} className="flex flex-col items-center gap-4 relative flex-1 group">
                                                {index !== STATUS_STEPS.length - 1 && (
                                                    <div className={cn(
                                                        "absolute top-5 left-0 w-full h-[2px] -z-10 -translate-x-1/2 transition-all duration-700",
                                                        index < currentStatusIndex ? 'bg-primary shadow-neon-sm' : 'bg-white/10'
                                                    )} />
                                                )}
                                                <div className={cn(
                                                    "size-10 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                                                    isActive
                                                        ? 'bg-primary border-primary text-black shadow-neon animate-pulse-slow'
                                                        : 'bg-surface border-white/10 text-gray-500',
                                                    isCurrent && 'ring-4 ring-primary/20 scale-110'
                                                )}>
                                                    <span className="material-symbols-outlined text-xl">{step.icon}</span>
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest transition-colors duration-300 text-center",
                                                    isActive ? 'text-primary' : 'text-gray-500'
                                                )}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Products List */}
                        <div className="glass-panel rounded-3xl border-white/5 overflow-hidden shadow-glass">
                            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-2xl">shopping_cart</span>
                                    المنتجات المشتراة
                                </h3>
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-primary/20">
                                    {order.items.length} منتجات
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-surface/50 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4">المنتج والمواصفات</th>
                                            <th className="px-6 py-4 text-center">السعر</th>
                                            <th className="px-6 py-4 text-center">الكمية</th>
                                            <th className="px-6 py-4 text-left">المجموع</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {order.items.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-6">
                                                    <div className="flex items-start gap-5">
                                                        <div className="size-24 rounded-2xl overflow-hidden bg-surface border border-white/10 shadow-neon-sm shrink-0 group-hover:scale-105 transition-transform duration-500">
                                                            <img src={item.product?.mainImage} alt={item.product?.name} className="h-full w-full object-cover" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <p className="font-black text-xl text-white group-hover:text-primary transition-colors">{item.product?.name}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {item.surfaceColorName && (
                                                                    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase">لون السطح:</span>
                                                                        <span className="text-xs font-black text-gray-200">{item.surfaceColorName}</span>
                                                                        {item.surfaceColorImage && (
                                                                            <div className="size-4 rounded-full border border-white/20 overflow-hidden shadow-neon-sm">
                                                                                <img src={item.surfaceColorImage} alt={item.surfaceColorName} className="h-full w-full object-cover" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {item.edgeColorName && (
                                                                    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase">لون الأطراف:</span>
                                                                        <span className="text-xs font-black text-gray-200">{item.edgeColorName}</span>
                                                                        {item.edgeColorImage && (
                                                                            <div className="size-4 rounded-full border border-white/20 overflow-hidden shadow-neon-sm">
                                                                                <img src={item.edgeColorImage} alt={item.edgeColorName} className="h-full w-full object-cover" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {item.sizeName && (
                                                                    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase">المقاس:</span>
                                                                        <span className="text-xs font-black text-gray-200">{item.sizeName} {item.sizeDimensions && `(${item.sizeDimensions})`}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {item.accessories && item.accessories.length > 0 && (
                                                                <div className="pt-2 space-y-2">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">الإكسسوارات الإضافية:</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {item.accessories.map((acc: any) => (
                                                                            <div key={acc.id} className="bg-primary/5 border border-primary/20 rounded-lg px-2 py-1 flex items-center gap-2 transition-all hover:bg-primary/10">
                                                                                {acc.image && (
                                                                                    <div className="size-6 rounded bg-surface border border-white/10 overflow-hidden">
                                                                                        <img src={acc.image} alt={acc.name} className="h-full w-full object-cover" />
                                                                                    </div>
                                                                                )}
                                                                                <span className="text-[10px] font-bold text-primary">+{acc.name}</span>
                                                                                <span className="text-[10px] font-black text-gray-400">({acc.price} {CURRENCY.SYMBOL})</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center font-mono font-bold text-gray-300">
                                                    {formatPrice(item.price)} {CURRENCY.SYMBOL}
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className="inline-flex size-10 items-center justify-center bg-white/5 border border-white/10 rounded-xl font-black text-white text-lg shadow-neon-sm">
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-left">
                                                    <div className="font-black text-2xl text-primary font-mono italic">
                                                        {formatPrice(item.price * item.quantity)} <span className="text-sm opacity-50">{CURRENCY.SYMBOL}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Customer Info */}
                        <div className="glass-panel rounded-3xl border-white/5 overflow-hidden shadow-glass relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="p-6 border-b border-white/5 bg-white/5">
                                <h3 className="font-black italic uppercase text-white flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-xl">person</span>
                                    بيانات العميل
                                </h3>
                            </div>
                            <div className="p-6 space-y-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="size-16 rounded-2xl bg-surface border border-white/10 flex items-center justify-center text-primary font-black text-2xl shadow-neon-sm italic">
                                        {order.customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-black text-xl text-white uppercase">{order.customerName}</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">تاريخ التسجيل: {new Date(order.createdAt).getFullYear()}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface/50 border border-white/5 hover:border-primary/30 transition-all group/item">
                                        <span className="material-symbols-outlined text-gray-500 group-hover/item:text-primary transition-colors">call</span>
                                        <span className="font-mono font-bold text-gray-200" dir="ltr">{order.customerPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface/50 border border-white/5 hover:border-primary/30 transition-all group/item">
                                        <span className="material-symbols-outlined text-gray-500 group-hover/item:text-primary transition-colors">location_on</span>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">عنوان الشحن</p>
                                            <p className="text-xs font-bold text-gray-300 leading-relaxed">{order.shippingAddress}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="glass-panel rounded-3xl border-white/5 overflow-hidden shadow-glass relative">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="material-symbols-outlined text-primary/20 text-6xl rotate-12">receipt_long</span>
                            </div>
                            <div className="p-8 space-y-6 relative z-10">
                                <h3 className="font-black italic uppercase text-white mb-6">ملخص الحساب</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                        <span>عدد المنتجات</span>
                                        <span className="font-mono text-white text-base">{order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                        <span>رسوم التوصيل</span>
                                        <span className="font-mono text-green-500 text-base">مجاني</span>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-1">المجموع النهائي</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black italic bg-gradient-to-r from-white to-primary bg-clip-text text-transparent drop-shadow-neon">
                                                {formatPrice(order.totalAmount)}
                                            </span>
                                            <span className="text-sm font-black text-primary uppercase italic">{CURRENCY.SYMBOL}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button className="w-full bg-white text-black hover:bg-primary hover:text-black font-black uppercase italic rounded-2xl h-14 mt-8 transition-all shadow-neon group">
                                    <span className="material-symbols-outlined ml-2 group-hover:animate-bounce">print</span>
                                    طباعة الفاتورة
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
