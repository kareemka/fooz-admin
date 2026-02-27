'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { X } from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const navItems = [
    { name: 'لوحة التحكم', path: '/dashboard', icon: 'dashboard' },
    { name: 'المنتجات', path: '/products', icon: 'inventory_2' },
    { name: 'الملحقات', path: '/accessories', icon: 'inventory_2' },
    { name: 'الطلبات', path: '/orders', icon: 'shopping_cart' },
    { name: 'المعرض', path: '/gallery', icon: 'perm_media' },
    { name: 'الأقسام', path: '/categories', icon: 'category' },
    { name: 'الألوان', path: '/colors', icon: 'palette' },
    { name: 'البنرات', path: '/banners', icon: 'view_carousel' },
    { name: 'أكواد الخصم', path: '/coupons', icon: 'confirmation_number' },
    { name: 'الأسئلة الشائعة', path: '/faq', icon: 'quiz' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className={cn(
            "fixed inset-y-0 right-0 z-50 w-72 bg-surface-dark border-l border-glass-border h-full flex flex-col transition-all duration-300 lg:static lg:translate-x-0",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Logo Section */}
            <div className="h-20 flex items-center gap-3 px-6 border-b border-glass-border">
                <button onClick={onClose} className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-gray-400 h-10 w-10 flex items-center justify-center transition-colors">
                    <X className="h-5 w-5" />
                </button>
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-neon border border-primary/30 flex items-center justify-center bg-black">
                    <span className="material-symbols-outlined text-primary text-2xl">stadia_controller</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="font-display text-xl font-bold tracking-tight text-white">Fooz <span className="text-primary">Gaming</span></h1>
                    <p className="text-[10px] text-gray-400 font-display tracking-widest uppercase">Admin Panel</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {navItems.map((item) => {
                    // Basic active check logic for nested routes as well
                    const isActive = item.path === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-neon'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            )}
                        >
                            <span className={cn(
                                "material-symbols-outlined text-2xl transition-colors",
                                isActive ? '' : 'group-hover:text-primary'
                            )}>
                                {item.icon}
                            </span>
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    );
                })}

                <div className="pt-4 pb-2">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">النظام</p>
                </div>

                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
                    <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">settings</span>
                    <span className="font-medium text-sm">الإعدادات</span>
                </Link>
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-glass-border">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors group"
                >
                    <span className="material-symbols-outlined text-2xl group-hover:rotate-180 transition-transform">logout</span>
                    <span className="font-medium text-sm">تسجيل الخروج</span>
                </button>
            </div>
        </aside>
    );
}
