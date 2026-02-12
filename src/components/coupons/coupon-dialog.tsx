'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@apollo/client/react';
import { CREATE_COUPON, UPDATE_COUPON } from '@/lib/queries';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const couponSchema = z.object({
    code: z.string().min(3, 'الكود يجب أن يكون 3 أحرف على الأقل'),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.number().min(0.01, 'القيمة يجب أن تكون أكبر من صفر'),
    expiryDate: z.string().optional().nullable(),
    minOrderAmount: z.number().min(0).optional().nullable(),
    isActive: z.boolean().default(true),
});

type CouponFormValues = z.infer<typeof couponSchema>;

interface CouponDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    coupon?: any;
    onSuccess: () => void;
}

export function CouponDialog({ open, onOpenChange, coupon, onSuccess }: CouponDialogProps) {
    const isEditing = !!coupon;

    const form = useForm<CouponFormValues>({
        resolver: zodResolver(couponSchema) as any,
        defaultValues: {
            code: '',
            discountType: 'PERCENTAGE',
            discountValue: 0,
            expiryDate: '',
            minOrderAmount: 0,
            isActive: true,
        },
    });

    useEffect(() => {
        if (coupon) {
            form.reset({
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
                minOrderAmount: coupon.minOrderAmount || 0,
                isActive: coupon.isActive,
            });
        } else {
            form.reset({
                code: '',
                discountType: 'PERCENTAGE',
                discountValue: 0,
                expiryDate: '',
                minOrderAmount: 0,
                isActive: true,
            });
        }
    }, [coupon, form]);

    const [createCoupon, { loading: createLoading }] = useMutation(CREATE_COUPON, {
        onCompleted: () => {
            toast.success('تم إضافة الكود بنجاح');
            onSuccess();
            onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
    });

    const [updateCoupon, { loading: updateLoading }] = useMutation(UPDATE_COUPON, {
        onCompleted: () => {
            toast.success('تم تحديث الكود بنجاح');
            onSuccess();
            onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
    });

    const isLoading = createLoading || updateLoading;

    const onSubmit = (values: CouponFormValues) => {
        const input = {
            ...values,
            expiryDate: values.expiryDate ? new Date(values.expiryDate) : null,
            minOrderAmount: values.minOrderAmount || 0,
        };

        if (isEditing) {
            updateCoupon({ variables: { id: coupon.id, input } });
        } else {
            createCoupon({ variables: { input } });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-[2.5rem] border-white/5 p-0 shadow-glass overflow-hidden flex flex-col">
                <div className="p-8 sm:p-10 flex-1 overflow-y-auto">
                    <DialogHeader className="mb-8 flex flex-col items-end gap-3 text-right">
                        <div className="size-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center shadow-neon-sm ml-auto">
                            <span className="material-symbols-outlined text-3xl text-primary">{isEditing ? 'edit_note' : 'add_circle'}</span>
                        </div>
                        <DialogTitle className="text-3xl font-black text-white font-display uppercase italic">
                            {isEditing ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}
                        </DialogTitle>
                        <p className="text-gray-400 font-medium text-lg">أدخل تفاصيل كود الخصم والعروض الترويجية.</p>
                    </DialogHeader>

                    <Form {...(form as any)}>
                        <form onSubmit={(form.handleSubmit as any)(onSubmit)} className="space-y-8 text-right">
                            <FormField
                                control={form.control as any}
                                name="code"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1">الكود (مثلاً: RAMADAN20)</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-white/5 border-white/10 h-14 rounded-2xl text-xl font-display font-black text-primary focus:border-primary/50 transition-all uppercase text-left" placeholder="PROMO2024" />
                                        </FormControl>
                                        <FormMessage className="text-red-400 font-bold" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                                <FormField
                                    control={form.control as any}
                                    name="discountType"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1">نوع الخصم</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold text-white focus:ring-primary/20 transition-all">
                                                        <SelectValue placeholder="اختر النوع" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glass-panel border-white/10 rounded-2xl overflow-hidden shadow-glass p-1">
                                                    <SelectItem value="PERCENTAGE" className="p-3 rounded-xl hover:bg-primary/20 focus:bg-primary/20 transition-all font-bold">نسبة مئوية (%)</SelectItem>
                                                    <SelectItem value="FIXED" className="p-3 rounded-xl hover:bg-primary/20 focus:bg-primary/20 transition-all font-bold">مبلغ ثابت ($)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-red-400 font-bold" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="discountValue"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1">قيمة الخصم</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    value={field.value === 0 ? '' : field.value}
                                                    onChange={e => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                    className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold text-white focus:border-primary/50 transition-all"
                                                    placeholder="0.00"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-400 font-bold" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField
                                    control={form.control as any}
                                    name="expiryDate"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1">تاريخ الانتهاء</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={field.value || ''}
                                                    className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold text-white focus:border-primary/50 transition-all"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-400 font-bold" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="minOrderAmount"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-gray-400 font-black uppercase tracking-widest text-xs pr-1">الحد الأدنى للطلب</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    value={field.value === 0 ? '' : field.value}
                                                    onChange={e => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                    className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-bold text-white focus:border-primary/50 transition-all"
                                                    placeholder="0.00"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-400 font-bold" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control as any}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-3xl border border-white/10 p-6 bg-white/5 hover:bg-white/10 transition-all group">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 text-right">
                                            <FormLabel className="text-lg font-black text-white group-hover:text-primary transition-colors cursor-pointer block">تفعيل الكود</FormLabel>
                                            <p className="text-sm text-gray-400 font-medium italic">سيتمكن العملاء من استخدام هذا الكود في المتجر.</p>
                                        </div>
                                        <FormMessage className="text-red-400 font-bold" />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-6 flex flex-row-reverse gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="flex-1 rounded-2xl h-14 font-black border border-white/10 hover:bg-white/5 transition-all"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-primary hover:bg-primary-dark text-black font-black rounded-2xl h-14 shadow-neon transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined">{isEditing ? 'save' : 'add_circle'}</span>
                                            {isEditing ? 'حفظ التعديلات' : 'إضافة الكود'}
                                        </div>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
