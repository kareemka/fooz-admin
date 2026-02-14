'use client';

import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useQuery } from '@apollo/client/react';
import { GET_ORDERS, GET_PRODUCTS, GET_CATEGORIES, GET_FAQS, GET_MONTHLY_SALES } from '@/lib/queries';
import { Loader2 } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';



const StatCard: React.FC<{ title: string; value: string; icon: string; trend: string; color: string; bgIcon: string }> = ({ title, value, icon, trend, color, bgIcon }) => (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-colors">
        <div className={`absolute -right-6 -top-6 w-24 h-24 ${bgIcon} rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-all`}></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-lg bg-surface-dark border border-white/10 ${color}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <span className="flex items-center text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                {trend}
                <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
            </span>
        </div>
        <div className="relative z-10">
            <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white font-display tracking-tight">{value}</p>
        </div>
    </div>
);

export default function DashboardPage() {
    const { data: ordersData, loading: ordersLoading } = useQuery<{ orders: { items: any[], total: number } }>(GET_ORDERS, {
        variables: { take: 5 }
    });

    const { data: productsData } = useQuery<{ products: { total: number } }>(GET_PRODUCTS, {
        variables: { take: 1 }
    });

    const { data: categoriesData } = useQuery<{ categories: { total: number } }>(GET_CATEGORIES, {
        variables: { take: 1 }
    });

    const { data: faqsData } = useQuery<{ faqs: { total: number } }>(GET_FAQS, {
        variables: { take: 1 }
    });

    const { data: salesData, loading: salesLoading } = useQuery<{ monthlySales: Array<{ month: string; totalSales: number; orderCount: number }> }>(GET_MONTHLY_SALES, {
        variables: { months: 6 }
    });

    const orders = ordersData?.orders?.items || [];
    const ordersTotal = ordersData?.orders?.total || 0;
    const productsTotal = productsData?.products?.total || 0;
    const categoriesTotal = categoriesData?.categories?.total || 0;
    const faqsTotal = faqsData?.faqs?.total || 0;
    const chartData = salesData?.monthlySales?.map(item => ({ name: item.month, uv: item.totalSales })) || [];
    const totalSales = salesData?.monthlySales?.reduce((sum, item) => sum + item.totalSales, 0) || 0;
    const loading = ordersLoading || salesLoading;

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'قيد الانتظار';
            case 'PROCESSING': return 'قيد المعالجة';
            case 'SHIPPED': return 'تم الشحن';
            case 'DELIVERED': return 'تم التوصيل';
            case 'CANCELLED': return 'ملغي';
            default: return status;
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard title="إجمالي المنتجات" value={productsTotal.toString()} icon="inventory_2" trend="+0%" color="text-primary" bgIcon="bg-primary" />
                    <StatCard title="التصنيفات" value={categoriesTotal.toString()} icon="category" trend="0%" color="text-purple-400" bgIcon="bg-purple-500" />
                    <StatCard title="إجمالي الطلبات" value={ordersTotal.toString()} icon="shopping_bag" trend="+0%" color="text-blue-400" bgIcon="bg-blue-500" />
                    <StatCard title="إجمالي الأسئلة الشائعة" value={faqsTotal.toString()} icon="help" trend="+0%" color="text-orange-400" bgIcon="bg-orange-500" />
                </div>

                {/* Chart Section */}
                <div className="glass-panel rounded-2xl p-6 lg:p-8 border border-glass-border">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">نظرة عامة على المبيعات</h2>
                            <p className="text-sm text-gray-400">تحليل الأداء المالي للأشهر الستة الماضية</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-2xl font-bold text-white font-display">{formatPrice(totalSales)} IQD</span>
                                <span className="text-xs text-gray-400">إجمالي المبيعات</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        {salesLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#15161C', borderColor: '#333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#00ff9d' }}
                                        formatter={(value: number | undefined) => value ? `${formatPrice(value)} IQD` : '0 IQD'}
                                    />
                                    <Area type="monotone" dataKey="uv" stroke="#00ff9d" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex justify-center items-center h-full text-gray-500">
                                لا توجد بيانات مبيعات
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-glass-border">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white">أحدث الطلبات</h2>
                        <Link href="/orders" className="text-sm text-primary hover:text-primary-hover transition-colors font-medium">عرض الكل</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-surface-dark/50 text-gray-400 font-medium border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">رقم الطلب</th>
                                    <th className="px-6 py-4">العميل</th>
                                    <th className="px-6 py-4">المنتج</th>
                                    <th className="px-6 py-4">السعر</th>
                                    <th className="px-6 py-4">الحالة</th>
                                    <th className="px-6 py-4 text-left">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex justify-center items-center gap-3">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                <span>جاري التحميل...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : orders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-mono">#{order.orderNumber}</td>
                                        <td className="px-6 py-4">{order.customerName}</td>
                                        <td className="px-6 py-4">
                                            {order.items && order.items.length > 0
                                                ? order.items[0].product?.name + (order.items.length > 1 ? ` (+${order.items.length - 1})` : '')
                                                : 'لا يوجد منتجات'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">{formatPrice(order.totalAmount)} IQD</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                order.status === 'DELIVERED' || order.status === 'COMPLETED' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                    order.status === 'PENDING' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                                        order.status === 'SHIPPED' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                            "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                            )}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 text-xs font-medium"
                                            >
                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                                عرض الطلب
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && orders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            لا توجد طلبات لعرضها
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
