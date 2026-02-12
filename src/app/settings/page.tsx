'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { GallerySelector } from '@/components/gallery/gallery-selector';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'admin_settings';

export default function SettingsPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [settings, setSettings] = useState({
        storeName: 'Fooz Gaming',
        storeEmail: 'contact@foozgaming.com',
        storePhone: '+966 50 000 0000',
        storeLogo: '',
        facebook: '',
        instagram: '',
        twitter: '',
        discord: '',
        whatsapp: '',
        primaryColor: '#8b5cf6', // Default violet-500
        adminName: 'Admin',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
            } catch (e) {
                console.error('Failed to parse settings');
            }
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            const { currentPassword, newPassword, confirmPassword, ...toSave } = settings;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
            setIsSaving(false);
            toast.success('تم حفظ الإعدادات بنجاح', {
                description: 'تم تحديث كافة التغييرات وحفظها محلياً.',
                icon: <span className="material-symbols-outlined text-primary">check_circle</span>
            });
        }, 800);
    };

    const handlePasswordChange = async () => {
        if (!settings.currentPassword || !settings.newPassword || !settings.confirmPassword) {
            toast.error('يرجى ملء كافة حقول كلمة المرور');
            return;
        }

        if (settings.newPassword !== settings.confirmPassword) {
            toast.error('كلمة المرور الجديدة غير متطابقة');
            return;
        }

        if (settings.newPassword.length < 6) {
            toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        setIsChangingPassword(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: settings.currentPassword,
                newPassword: settings.newPassword
            });

            toast.success('تم تغيير كلمة المرور بنجاح');
            setSettings(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error: any) {
            const message = error.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور';
            toast.error(typeof message === 'string' ? message : message[0]);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    return (
        <AdminLayout>
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right">
                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-black tracking-tight text-white font-display uppercase italic">الإعدادات</h1>
                        <p className="text-gray-400 font-medium text-lg">تحكم في هوية المتجر والروابط الاجتماعية والمظهر العام بلمسة نيون.</p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gaming-hover bg-primary hover:bg-primary-dark text-black font-black rounded-xl px-12 h-16 shadow-neon border-none text-xl font-display"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                جاري الحفظ...
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-2xl">save</span>
                                حفظ كافة التغييرات
                            </div>
                        )}
                    </Button>
                </div>

                <Tabs defaultValue="general" className="w-full space-y-10" dir="rtl">
                    <TabsList className="bg-white/5 backdrop-blur-3xl border border-white/5 p-2 h-24 grid grid-cols-2 md:grid-cols-4 rounded-[2.5rem] shadow-glass">
                        <TabsTrigger value="general" className="rounded-3xl py-6 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:font-black data-[state=active]:shadow-neon-sm transition-all duration-500 font-black text-gray-400 hover:text-white text-lg font-display uppercase italic tracking-wider">
                            <span className="material-symbols-outlined ml-3 text-2xl">storefront</span>
                            بيانات المتجر
                        </TabsTrigger>
                        <TabsTrigger value="social" className="rounded-3xl py-6 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:font-black data-[state=active]:shadow-neon-sm transition-all duration-500 font-black text-gray-400 hover:text-white text-lg font-display uppercase italic tracking-wider">
                            <span className="material-symbols-outlined ml-3 text-2xl">share</span>
                            قنوات التواصل
                        </TabsTrigger>
                        <TabsTrigger value="style" className="rounded-3xl py-6 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:font-black data-[state=active]:shadow-neon-sm transition-all duration-500 font-black text-gray-400 hover:text-white text-lg font-display uppercase italic tracking-wider">
                            <span className="material-symbols-outlined ml-3 text-2xl">palette</span>
                            الهوية والمظهر
                        </TabsTrigger>
                        <TabsTrigger value="account" className="rounded-3xl py-6 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:font-black data-[state=active]:shadow-neon-sm transition-all duration-500 font-black text-gray-400 hover:text-white text-lg font-display uppercase italic tracking-wider">
                            <span className="material-symbols-outlined ml-3 text-2xl">person_pin</span>
                            أمان الحساب
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 focus-visible:outline-none">
                        <div className="glass-panel p-12 rounded-[3rem] border border-white/5 shadow-glass">
                            <div className="flex items-center gap-6 mb-12 pb-8 border-b border-white/5 flex-row-reverse">
                                <div className="bg-primary/20 p-4 rounded-[1.5rem] border border-primary/20 shadow-neon-sm">
                                    <span className="material-symbols-outlined text-primary text-3xl">language</span>
                                </div>
                                <h2 className="text-3xl font-black text-white font-display uppercase italic">المعلومات الأساسية</h2>
                            </div>

                            <div className="grid gap-16 md:grid-cols-2">
                                <div className="space-y-8 text-right order-2 md:order-1">
                                    <div className="space-y-4">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center justify-end gap-3 font-display italic">
                                            <span className="h-px w-10 bg-primary/30"></span>
                                            Store Name
                                        </Label>
                                        <Input
                                            value={settings.storeName}
                                            onChange={(e) => handleChange('storeName', e.target.value)}
                                            className="rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 px-8 h-16 text-lg font-black text-white"
                                            placeholder="أدخل اسم المتجر"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center justify-end gap-3 font-display italic">
                                            <span className="h-px w-10 bg-primary/30"></span>
                                            Official Email
                                        </Label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">mail</span>
                                            <Input
                                                value={settings.storeEmail}
                                                onChange={(e) => handleChange('storeEmail', e.target.value)}
                                                className="rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 pr-16 h-16 text-lg font-black text-white"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center justify-end gap-3 font-display italic">
                                            <span className="h-px w-10 bg-primary/30"></span>
                                            Support Phone
                                        </Label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">call</span>
                                            <Input
                                                value={settings.storePhone}
                                                onChange={(e) => handleChange('storePhone', e.target.value)}
                                                className="rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 pr-16 h-16 text-lg font-black text-white"
                                                placeholder="+966 5x xxx xxxx"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8 text-right order-1 md:order-2">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center justify-end gap-3 font-display italic">
                                        <span className="h-px w-10 bg-primary/30"></span>
                                        Brand Identity
                                    </Label>
                                    <div className="space-y-8">
                                        {settings.storeLogo ? (
                                            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 glass-panel group shadow-glass max-w-sm mx-auto md:mr-0 md:ml-auto">
                                                <img src={settings.storeLogo} alt="Logo" className="w-full h-full object-contain p-10 transition-transform group-hover:scale-110 duration-700" />
                                                <div className="absolute inset-0 bg-black/70 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                                                    <Button variant="outline" className="rounded-2xl border-white/10 text-white hover:bg-red-500 hover:text-white hover:border-red-500 h-16 px-10 font-black text-xl font-display uppercase italic" onClick={() => handleChange('storeLogo', '')}>Remove Logo</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-video rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-8 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all duration-700 max-w-sm mx-auto md:mr-0 md:ml-auto group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 group-hover:scale-110 transition-transform duration-500 relative z-10">
                                                    <span className="material-symbols-outlined text-7xl text-gray-500/20">identity_platform</span>
                                                </div>
                                                <div className="text-center space-y-4 relative z-10 px-6">
                                                    <p className="font-bold text-gray-400">اسحب الشعار هنا أو اختر من المعرض</p>
                                                    <GallerySelector onSelect={(url) => handleChange('storeLogo', url)}>
                                                        <Button variant="secondary" className="rounded-2xl bg-white/10 text-white hover:bg-primary hover:text-black font-black font-display uppercase italic px-8 h-12 border border-white/5 transition-all">Browse Gallery</Button>
                                                    </GallerySelector>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start justify-end gap-3 opacity-50 px-6">
                                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest leading-relaxed text-right italic">Transparent PNG recommended for high-end gaming aesthetic.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-6 focus-visible:outline-none">
                        <div className="glass-panel p-12 rounded-[3rem] border border-white/5 shadow-glass">
                            <div className="flex items-center gap-6 mb-12 pb-8 border-b border-white/5 flex-row-reverse">
                                <div className="bg-primary/20 p-4 rounded-[1.5rem] border border-primary/20 shadow-neon-sm">
                                    <span className="material-symbols-outlined text-primary text-3xl">alternate_email</span>
                                </div>
                                <h2 className="text-3xl font-black text-white font-display uppercase italic">الحضور الاجتماعي</h2>
                            </div>

                            <div className="grid gap-10 md:grid-cols-2 text-right">
                                {[
                                    { id: 'facebook', label: 'Facebook', icon: 'facebook', placeholder: 'facebook.com/yourstore' },
                                    { id: 'instagram', label: 'Instagram', icon: 'account_circle', placeholder: 'instagram.com/yourstore' },
                                    { id: 'twitter', label: 'Twitter (X)', icon: 'close', placeholder: 'twitter.com/yourstore' },
                                    { id: 'discord', label: 'Community Discord', icon: 'forum', placeholder: 'discord.gg/invite' },
                                ].map((item) => (
                                    <div key={item.id} className="space-y-4">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center justify-end gap-3 font-display italic">
                                            <span className="h-px w-10 bg-primary/30"></span>
                                            {item.label}
                                        </Label>
                                        <div className="relative group font-display">
                                            <span className="material-symbols-outlined absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">{item.icon}</span>
                                            <Input
                                                value={(settings as any)[item.id]}
                                                onChange={(e) => handleChange(item.id, e.target.value)}
                                                className="rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 pr-16 h-16 text-lg font-black text-white uppercase"
                                                placeholder={item.placeholder}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="space-y-4 md:col-span-2">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center justify-end gap-3 font-display italic">
                                        <span className="h-px w-10 bg-primary/30"></span>
                                        Direct WhatsApp
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 h-8 w-14 flex items-center justify-center bg-primary/10 rounded-xl border border-primary/20 text-primary font-black text-sm font-display italic">WA</div>
                                        <Input
                                            value={settings.whatsapp}
                                            onChange={(e) => handleChange('whatsapp', e.target.value)}
                                            className="rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 pr-24 h-16 text-lg font-black text-white"
                                            placeholder="96650xxxxxxxx"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-black uppercase tracking-widest pr-4 italic">No "+" symbol, just country code and number.</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="style" className="space-y-6 focus-visible:outline-none">
                        <div className="glass-panel p-12 rounded-[3rem] border border-white/5 shadow-glass">
                            <div className="flex items-center gap-6 mb-12 pb-8 border-b border-white/5 flex-row-reverse">
                                <div className="bg-primary/20 p-4 rounded-[1.5rem] border border-primary/20 shadow-neon-sm">
                                    <span className="material-symbols-outlined text-primary text-3xl">brush</span>
                                </div>
                                <h2 className="text-3xl font-black text-white font-display uppercase italic">اللغة البصرية والسمات</h2>
                            </div>

                            <div className="space-y-16 text-right">
                                <div className="space-y-8">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center justify-end gap-3 font-display italic">
                                        <span className="h-px w-10 bg-primary/30"></span>
                                        Neon Accent Color
                                    </Label>
                                    <div className="flex flex-wrap flex-row-reverse gap-8 items-center">
                                        {[
                                            { color: '#8b5cf6', label: 'PULSE' },
                                            { color: '#06b6d4', label: 'CYAN' },
                                            { color: '#10b981', label: 'TOXIC' },
                                            { color: '#f43f5e', label: 'LASER' },
                                            { color: '#f59e0b', label: 'GOLD' },
                                            { color: '#3b82f6', label: 'FLUX' },
                                        ].map((p) => (
                                            <button
                                                key={p.color}
                                                onClick={() => handleChange('primaryColor', p.color)}
                                                className="group relative flex flex-col items-center gap-4 transition-all duration-500"
                                            >
                                                <div
                                                    className={cn(
                                                        "h-16 w-16 rounded-2xl shadow-lg transition-all duration-700 relative",
                                                        settings.primaryColor === p.color ? "scale-110 ring-4 ring-primary/20 border-2 border-white" : "hover:scale-110 border border-white/10"
                                                    )}
                                                    style={{
                                                        backgroundColor: p.color,
                                                        boxShadow: settings.primaryColor === p.color ? `0 0 40px ${p.color}80` : ''
                                                    }}
                                                >
                                                    {settings.primaryColor === p.color && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="size-3 rounded-full bg-white animate-ping" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-[0.2em] transition-colors font-display italic",
                                                    settings.primaryColor === p.color ? "text-primary brightness-150" : "text-gray-500"
                                                )}>{p.label}</span>
                                            </button>
                                        ))}

                                        <div className="h-24 w-[1px] bg-white/5 mx-6" />

                                        <div className="flex flex-col items-center gap-4 group">
                                            <div className="relative overflow-hidden h-16 w-24 rounded-2xl border-2 border-white/10 group-hover:border-primary/50 transition-all duration-700 shadow-glass">
                                                <Input
                                                    type="color"
                                                    value={settings.primaryColor}
                                                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                                                    className="absolute inset-[-20px] w-[200%] h-[200%] cursor-pointer"
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-display italic">{settings.primaryColor}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-12 rounded-[3.5rem] bg-[#0A0B10] border border-white/5 relative overflow-hidden group shadow-inner-glass">
                                    <div className="absolute top-0 right-0 w-[400px] h-[400px] blur-[150px] opacity-10 bg-primary/30 group-hover:opacity-20 transition-opacity duration-1000" />
                                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="size-3 rounded-full bg-primary shadow-neon pulse" />
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] font-display">Live Preview</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white font-display uppercase italic flex items-center gap-4">
                                            System Visual Overhaul
                                            <span className="material-symbols-outlined text-primary text-2xl">fullscreen</span>
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-56 relative z-10">
                                        <div className="rounded-[2rem] bg-white/5 border border-white/5 p-8 flex flex-col justify-between shadow-glass group-hover:bg-white/10 transition-all duration-700">
                                            <div className="w-1/3 h-2 rounded-full bg-white/10" />
                                            <div className="flex items-center gap-6">
                                                <div className="size-14 rounded-2xl shadow-neon-sm scale-animate" style={{ backgroundColor: settings.primaryColor }} />
                                                <div className="flex-1 space-y-3">
                                                    <div className="h-3 w-full rounded-full bg-white/10" />
                                                    <div className="h-2 w-2/3 rounded-full bg-white/5" />
                                                </div>
                                            </div>
                                            <div className="h-12 w-full rounded-2xl animate-pulse" style={{ backgroundColor: settings.primaryColor + '15', border: `2px solid ${settings.primaryColor}30` }} />
                                        </div>
                                        <div className="rounded-[2rem] bg-[#050608] border border-white/5 p-8 relative overflow-hidden flex flex-col items-center justify-center gap-6 shadow-glass">
                                            <div className="absolute inset-0 bg-primary/5 blur-[40px] opacity-20" style={{ backgroundColor: settings.primaryColor }} />
                                            <div className="w-2/3 h-5 rounded-full bg-white/10 relative z-10" />
                                            <div className="w-1/2 h-4 rounded-full bg-white/5 relative z-10" />
                                            <div className="w-3/4 h-3 rounded-full bg-white/5 relative z-10" />
                                        </div>
                                    </div>
                                    <p className="mt-10 text-[10px] text-center text-gray-600 font-black uppercase tracking-[0.4em] opacity-80 font-display italic">Universal ID Applied to Database and Client Renderers</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="account" className="space-y-6 focus-visible:outline-none">
                        <div className="glass-panel p-12 rounded-[3rem] border border-white/5 shadow-glass">
                            <div className="flex items-center gap-6 mb-12 pb-8 border-b border-white/5 flex-row-reverse">
                                <div className="bg-primary/20 p-4 rounded-[1.5rem] border border-primary/20 shadow-neon-sm">
                                    <span className="material-symbols-outlined text-primary text-3xl">key</span>
                                </div>
                                {isChangingPassword ? (
                                    <div className="flex flex-col gap-1 text-right">
                                        <h2 className="text-3xl font-black text-white font-display uppercase italic">Security Update</h2>
                                        <p className="text-xs text-primary font-black animate-pulse uppercase tracking-widest font-display">Updating core security nodes...</p>
                                    </div>
                                ) : (
                                    <h2 className="text-3xl font-black text-white font-display uppercase italic">إدارة الأمان</h2>
                                )}
                            </div>

                            <div className="grid gap-16 md:grid-cols-2">
                                <div className="space-y-12 text-right order-2 md:order-1">
                                    <div className="space-y-4">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center justify-end gap-3 font-display italic">
                                            <span className="h-px w-10 bg-primary/30"></span>
                                            Admin Alias
                                        </Label>
                                        <Input
                                            value={settings.adminName}
                                            onChange={(e) => handleChange('adminName', e.target.value)}
                                            className="rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 px-8 h-16 text-lg font-black text-white font-display"
                                        />
                                    </div>
                                    <div className="p-10 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 text-amber-500/80 relative overflow-hidden shadow-inner flex flex-col gap-4">
                                        <div className="absolute top-0 right-0 w-3 h-full bg-amber-500/20" />
                                        <h4 className="font-black text-xl flex items-center justify-end gap-4 font-display uppercase italic">
                                            Security Alert
                                            <span className="material-symbols-outlined text-2xl">priority_high</span>
                                        </h4>
                                        <p className="text-sm font-bold leading-relaxed pr-4 text-right">سيتم تسجيل خروجك وتحديث الـ Token الخاص بالجلسة تلقائياً عند تغيير كلمة المرور لضمان أمان نظامك بالكامل وحماية البيانات من الوصول غير المصرح به.</p>
                                    </div>
                                </div>

                                <div className="space-y-8 text-right border-white/5 md:border-r md:pr-16 order-1 md:order-2">
                                    <h3 className="font-black text-xs text-primary uppercase tracking-[0.4em] mb-6 font-display italic">Password Modifications</h3>
                                    <div className="space-y-3">
                                        <Label className="text-gray-400 font-bold uppercase text-xs tracking-widest">كلمة المرور الحالية</Label>
                                        <Input
                                            type="password"
                                            value={settings.currentPassword}
                                            onChange={(e) => handleChange('currentPassword', e.target.value)}
                                            className="rounded-2xl bg-white/5 border-white/10 h-16 focus:border-white/30 text-xl font-black text-white"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-gray-400 font-bold uppercase text-xs tracking-widest">كلمة المرور الجديدة</Label>
                                        <Input
                                            type="password"
                                            value={settings.newPassword}
                                            onChange={(e) => handleChange('newPassword', e.target.value)}
                                            className="rounded-2xl bg-white/5 border-white/10 h-16 focus:border-white/30 text-xl font-black text-white font-display"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-gray-400 font-bold uppercase text-xs tracking-widest">تأكيد كلمة المرور</Label>
                                        <Input
                                            type="password"
                                            value={settings.confirmPassword}
                                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                            className="rounded-2xl bg-white/5 border-white/10 h-16 focus:border-white/30 text-xl font-black text-white font-display"
                                        />
                                    </div>
                                    <Button
                                        onClick={handlePasswordChange}
                                        disabled={isChangingPassword}
                                        className="w-full rounded-[2rem] h-20 gaming-hover bg-white text-black font-black mt-10 shadow-glass text-xl border-none hover:bg-primary transition-all duration-700 font-display uppercase italic"
                                    >
                                        {isChangingPassword ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="size-6 animate-spin" />
                                                Processing Security...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-2xl">lock_reset</span>
                                                Commit Password Change
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}

