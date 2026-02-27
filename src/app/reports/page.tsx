'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
    return (
        <AdminLayout>
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tight text-white font-display uppercase italic">التقارير والإحصائيات</h1>
                    <p className="text-gray-400 font-medium text-lg">تحليل شامل لأداء متجرك ومبيعاتك بصورة ذكية.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-[2rem] border border-white/5 shadow-glass bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all duration-500 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-700"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-widest">إجمالي المبيعات</CardTitle>
                            <div className="bg-primary/20 p-2 rounded-xl border border-primary/20">
                                <span className="material-symbols-outlined text-primary text-xl">payments</span>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-black text-white font-display">45,231.89 <span className="text-sm font-bold opacity-50">ر.س</span></div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-primary font-black text-xs flex items-center">
                                    <span className="material-symbols-outlined text-xs mr-1">trending_up</span>
                                    +20.1%
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">من الشهر الماضي</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border border-white/5 shadow-glass bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all duration-500 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-700"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-widest">الطلبات الجديدة</CardTitle>
                            <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/20">
                                <span className="material-symbols-outlined text-blue-400 text-xl">shopping_cart</span>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-black text-white font-display">+2,350</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-blue-400 font-black text-xs flex items-center">
                                    <span className="material-symbols-outlined text-xs mr-1">trending_up</span>
                                    +180.1%
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">من الشهر الماضي</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border border-white/5 shadow-glass bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all duration-500 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all duration-700"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-widest">العملاء الجدد</CardTitle>
                            <div className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/20">
                                <span className="material-symbols-outlined text-purple-400 text-xl">group</span>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-black text-white font-display">+12,234</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-purple-400 font-black text-xs flex items-center">
                                    <span className="material-symbols-outlined text-xs mr-1">trending_up</span>
                                    +19%
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">من الشهر الماضي</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border border-white/5 shadow-glass bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all duration-500 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/20 transition-all duration-700"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-widest">نشاط الموقع</CardTitle>
                            <div className="bg-orange-500/20 p-2 rounded-xl border border-orange-500/20">
                                <span className="material-symbols-outlined text-orange-400 text-xl">insights</span>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-black text-white font-display">+573</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-orange-400 font-black text-xs flex items-center">
                                    <span className="material-symbols-outlined text-xs mr-1">sensors</span>
                                    بث حي
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">نشط الآن</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 rounded-[2.5rem] border border-white/5 shadow-glass bg-white/5 backdrop-blur-md overflow-hidden min-h-[500px]">
                        <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                            <CardTitle className="text-2xl font-black text-white font-display uppercase italic">نظرة عامة على المبيعات</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-primary shadow-neon-sm animate-pulse"></div>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Live Updates</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[350px] w-full flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-white/5 relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                                <div className="bg-white/5 p-8 rounded-full border border-white/5 mb-6 relative z-10">
                                    <span className="material-symbols-outlined text-6xl text-gray-500/20">equalizer</span>
                                </div>
                                <p className="text-gray-400 font-black text-lg uppercase tracking-widest relative z-10">مساحة الرسم البياني للمبيعات الشهرية</p>
                                <p className="text-gray-500/60 mt-2 font-medium relative z-10 text-sm">سيتم عرض البيانات التفصيلية هنا قريباً.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 rounded-[2.5rem] border border-white/5 shadow-glass bg-white/5 backdrop-blur-md overflow-hidden min-h-[500px]">
                        <CardHeader className="p-8 border-b border-white/5">
                            <CardTitle className="text-2xl font-black text-white font-display uppercase italic">أحدث العمليات</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center group cursor-pointer hover:translate-x-[-4px] transition-all duration-300">
                                        <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">person</span>
                                        </div>
                                        <div className="mr-4 flex-1 space-y-1 text-right">
                                            <p className="text-base font-black text-white font-display uppercase tracking-tight">محمد أحمد</p>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">email@example.com</p>
                                        </div>
                                        <div className="font-black text-primary font-display text-lg">+1,999.00 <span className="text-[10px] opacity-70">ر.س</span></div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-10 py-4 rounded-2xl border border-white/5 bg-white/5 text-gray-400 font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all duration-300 font-display">
                                View All Transactions
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
