'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema, ProductInput } from '@/schemas';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { gql } from '@apollo/client';
import { useQuery as useApolloQuery } from '@apollo/client/react';
import { Loader2, Plus, Trash2, Box as BoxIcon, Image as ImageIcon, Gamepad2, Palette, Ruler } from 'lucide-react';
import { GallerySelector } from '@/components/gallery/gallery-selector';
import { GLBSelector } from '@/components/gallery/glb-selector';
import { ColorSelector } from '@/components/colors/color-selector';
import { formatPrice } from '@/lib/utils';
import { CURRENCY } from '@/lib/constants';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_COLORS as GET_COLORS_QUERY } from '@/lib/queries';

interface ProductFormProps {
    initialData?: Partial<ProductInput>;
    onSubmit: (data: ProductInput) => void;
    isLoading?: boolean;
    isSuccess?: boolean;
    onReset?: () => void;
}

const GET_CATEGORIES = gql`
    query GetCategories {
        categories {
            items {
                id
                name
            }
        }
    }
`;

const GET_ACCESSORIES = gql`
    query GetAccessories {
        accessories {
            items {
                id
                name
                price
                image
            }
        }
    }
`;

// Redundant queries moved to lib/queries.ts

function ColorsSection({ form, name, label, icon: Icon }: { form: any, name: string, label: string, icon: any }) {
    const { data } = useQuery<{ colors: { items: any[] } }>(GET_COLORS_QUERY);
    const allColors = data?.colors?.items || [];
    const selectedIds = form.watch(name) || [];

    const selectedColors = useMemo(() => {
        return allColors.filter((c: any) => selectedIds.includes(c.id));
    }, [allColors, selectedIds]);

    return (
        <Card className="rounded-2xl sm:rounded-[2rem] border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 py-5 sm:py-6 px-5 sm:px-8">
                <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-3">
                    <div className="bg-primary/20 p-1.5 sm:p-2 rounded-xl"><Icon className="size-4 sm:size-5 text-primary" /></div>
                    {label} <span className="text-destructive">*</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 sm:pt-8 px-5 sm:px-8 pb-8 sm:pb-10">
                <div className="flex flex-wrap gap-3">
                    {selectedColors.map((color: any) => (
                        <div
                            key={color.id}
                            className="group relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 pr-3 hover:border-primary/50 transition-all"
                        >
                            <div className="size-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                {color.image ? (
                                    <img src={color.image} alt={color.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <Palette className="size-3 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-white">{color.name}</span>
                            <button
                                type="button"
                                onClick={() => form.setValue(name, selectedIds.filter((id: string) => id !== color.id))}
                                className="size-5 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="size-3" />
                            </button>
                        </div>
                    ))}

                    <ColorSelector
                        selectedIds={selectedIds}
                        onSelect={(ids) => form.setValue(name, ids)}
                        label={label}
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl border-dashed border-2 border-primary/30 hover:border-primary hover:bg-primary/5 h-24 px-6 flex flex-col items-center justify-center gap-2 transition-all font-bold text-xs bg-primary/5 shrink-0 group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Plus className="size-6 text-primary relative z-10" />
                            <span className="text-[10px] text-primary relative z-10 italic">إضافة/تعديل</span>
                        </Button>
                    </ColorSelector>
                </div>
                {selectedIds.length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic text-center">لم يتم اختيار أي لون بعد</p>
                )}
                <FormMessage className="text-xs font-bold text-center" />
            </CardContent>
        </Card>
    );
}

function SizesSection({ form }: { form: any }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "sizes",
    });

    return (
        <Card className="rounded-2xl sm:rounded-[2rem] border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 py-5 sm:py-6 px-5 sm:px-8 flex flex-row items-center justify-between">
                <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-3">
                    <div className="bg-primary/20 p-1.5 sm:p-2 rounded-xl"><Ruler className="size-4 sm:size-5 text-primary" /></div>
                    المقاسات المتاحة
                </CardTitle>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', price: 0, dimensions: '' })}
                    className="rounded-xl border-primary/30 hover:bg-primary/5 text-primary font-bold h-9 px-3"
                >
                    <Plus className="size-4 ml-1" /> إضافة
                </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 sm:pt-8 px-5 sm:px-8 pb-8 sm:pb-10">
                {fields.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm italic">لا توجد مقاسات محددة (اختياري).</p>
                ) : (
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl border-2 border-primary/10 bg-primary/5 relative group">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 size-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="size-3" />
                                </Button>

                                <FormField
                                    control={form.control}
                                    name={`sizes.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-tighter opacity-70">المقاس</FormLabel>
                                            <FormControl>
                                                <Input placeholder="S, M, L..." className="h-10 rounded-xl bg-background" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`sizes.${index}.price`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-tighter opacity-70">السعر الإضافي</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" className="h-10 rounded-xl bg-background" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`sizes.${index}.dimensions`}
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-[10px] font-black uppercase tracking-tighter opacity-70">الأبعاد (اختياري)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="40x50x20 cm..." className="h-10 rounded-xl bg-background" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AccessoriesSection({ form }: { form: any }) {
    const { data, loading } = useApolloQuery<{ accessories: { items: any[] } }>(GET_ACCESSORIES);
    const accessories = data?.accessories?.items || [];

    return (
        <Card className="rounded-2xl sm:rounded-[2rem] border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 py-5 sm:py-6 px-5 sm:px-8">
                <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-3">
                    <div className="bg-primary/20 p-1.5 sm:p-2 rounded-xl"><Gamepad2 className="size-4 sm:size-5 text-primary" /></div>
                    الإكسسوارات الملحقة
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 sm:pt-8 px-5 sm:px-8 pb-8 sm:pb-10">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : accessories.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm">لا توجد إكسسوارات متاحة.</p>
                ) : (
                    <FormField
                        control={form.control}
                        name="accessoryIds"
                        render={() => (
                            <FormItem>
                                <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {accessories.map((accessory) => (
                                        <FormField
                                            key={accessory.id}
                                            control={form.control}
                                            name="accessoryIds"
                                            render={({ field }) => {
                                                return (
                                                    <FormItem
                                                        key={accessory.id}
                                                        className="flex flex-row items-start space-x-3 space-x-reverse rounded-xl border p-3 shadow-sm hover:bg-primary/5 transition-colors cursor-pointer"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(accessory.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...(field.value || []), accessory.id])
                                                                        : field.onChange(
                                                                            field.value?.filter(
                                                                                (value: string) => value !== accessory.id
                                                                            )
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-bold text-sm cursor-pointer flex-1 pt-1">
                                                            {accessory.name} <span className="text-muted-foreground text-xs font-normal">({formatPrice(accessory.price)} {CURRENCY.SYMBOL})</span>
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <p className="text-[10px] text-muted-foreground text-center italic">حدد الإكسسوارات التي يمكن شراؤها مع هذا المنتج</p>
            </CardContent>
        </Card>
    );
}

export function ProductForm({ initialData, onSubmit, isLoading, isSuccess, onReset }: ProductFormProps) {
    const [step, setStep] = useState(1);
    const { data: categoriesData, loading: isLoadingCats } = useApolloQuery<{ categories: { items: any[] } }>(GET_CATEGORIES);
    const categories = categoriesData?.categories?.items || [];

    const form = useForm<ProductInput>({
        resolver: zodResolver(ProductSchema) as any,
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            price: initialData?.price || 0,
            discountPercentage: initialData?.discountPercentage || null,
            categoryId: initialData?.categoryId || '',
            stock: initialData?.stock || 0,
            images: initialData?.images || [],
            glbUrl: initialData?.glbUrl || '',
            isActive: initialData?.isActive ?? true,
            accessoryIds: initialData?.accessoryIds || [],
            surfaceColorIds: (initialData as any)?.surfaceColorIds || [],
            edgeColorIds: (initialData as any)?.edgeColorIds || [],
            sizes: initialData?.sizes || [],
        } as any,
    });

    const currentImages = form.watch('images');
    const currentGlb = form.watch('glbUrl');

    const removeImage = (index: number) => {
        const newImages = [...currentImages];
        newImages.splice(index, 1);
        form.setValue('images', newImages);
    };

    const addImage = (url: string) => {
        if (!currentImages.includes(url)) {
            form.setValue('images', [...currentImages, url]);
        }
    };

    const nextStep = async () => {
        // Simple validation for each step if needed
        let fieldsToValidate: any[] = [];
        if (step === 1) fieldsToValidate = ['name', 'description', 'categoryId', 'surfaceColorIds', 'edgeColorIds'];
        if (step === 2) fieldsToValidate = ['images'];
        if (step === 3) fieldsToValidate = ['price', 'stock'];

        const isValid = await form.trigger(fieldsToValidate as any);
        if (isValid) setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const onFormSubmit = (values: any) => {
        onSubmit(values as ProductInput);
    };

    return (
        <Form {...(form as any)}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full relative text-right">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-primary/70 text-sm">
                            <span>المنتجات</span>
                            <span className="material-symbols-outlined text-[16px] rotate-180">chevron_right</span>
                            <span className="text-white">{initialData ? 'تعديل المنتج' : 'منتج جديد'}</span>
                        </div>
                        <h1 className="text-white text-3xl md:text-4xl font-bold font-display">
                            {initialData ? `تعديل: ${initialData.name}` : 'إضافة منتج جديد'}
                        </h1>
                    </div>
                </div>

                {/* Stepper Progress */}
                <div className="relative mb-8">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-dark -translate-y-1/2 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-l from-primary to-emerald-800 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
                    </div>
                    <div className="relative flex justify-between w-full">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`flex flex-col items-center gap-2 ${step >= s ? 'text-white' : 'text-gray-600'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${step > s ? 'bg-surface-dark border-2 border-primary text-primary' : step === s ? 'bg-primary text-black shadow-neon scale-110' : 'bg-surface-dark border-2 border-gray-700 text-gray-500'}`}>
                                    {step > s ? <span className="material-symbols-outlined text-xl">check</span> : <span className="font-bold text-lg font-display">{s}</span>}
                                </div>
                                <span className={`text-xs font-medium hidden md:block ${step === s ? 'text-primary font-bold' : ''}`}>
                                    {s === 1 ? 'معلومات أساسية' : s === 2 ? 'الوسائط' : 'السعر والمخزون'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Card */}
                <div key={`step-content-${step}`} className="glass-panel rounded-[2.5rem] p-6 md:p-10 border border-glass-border min-h-[500px]">
                    {step === 1 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField
                                    control={form.control as any}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-white text-base font-medium flex items-center gap-2">
                                                اسم المنتج <span className="text-primary">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                                                        <span className="material-symbols-outlined">label</span>
                                                    </span>
                                                    <Input
                                                        placeholder="أدخل اسم المنتج..."
                                                        className="h-14 bg-[#1b2723]/50 border-[#3b544a] rounded-xl text-white pr-12 focus:border-primary focus:ring-1 focus:ring-primary/50 text-lg font-bold"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs font-bold" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="categoryId"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-white text-base font-medium flex items-center gap-2">
                                                الفئة <span className="text-primary">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                                                            <span className="material-symbols-outlined">category</span>
                                                        </span>
                                                        <SelectTrigger className="h-14 bg-[#1b2723]/50 border-[#3b544a] rounded-xl text-white pr-12 focus:border-primary focus:ring-1 focus:ring-primary/50 text-right">
                                                            <SelectValue placeholder="اختر فئة المنتج" />
                                                        </SelectTrigger>
                                                    </div>
                                                </FormControl>
                                                <SelectContent className="glass-panel border-white/10 text-white rounded-xl">
                                                    {isLoadingCats ? (
                                                        <div className="flex items-center justify-center p-4">
                                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                        </div>
                                                    ) : (
                                                        categories?.map((cat: any) => (
                                                            <SelectItem key={cat.id} value={cat.id} className="rounded-xl py-3 font-bold text-right">
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs font-bold" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control as any}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-white text-base font-medium flex items-center gap-2">
                                            وصف المنتج <span className="text-primary">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="w-full bg-[#1b2723]/50 border border-[#3b544a] rounded-xl overflow-hidden min-h-[250px] flex flex-col">
                                                <div className="bg-[#263730] border-b border-[#3b544a] p-2 flex gap-2">
                                                    <button type="button" className="p-1 text-gray-400 hover:text-white"><span className="material-symbols-outlined text-[20px]">format_bold</span></button>
                                                    <button type="button" className="p-1 text-gray-400 hover:text-white"><span className="material-symbols-outlined text-[20px]">format_italic</span></button>
                                                    <button type="button" className="p-1 text-gray-400 hover:text-white"><span className="material-symbols-outlined text-[20px]">format_list_bulleted</span></button>
                                                </div>
                                                <Textarea
                                                    placeholder="اكتب وصفاً جذاباً للمنتج هنا..."
                                                    className="w-full flex-1 bg-transparent p-4 text-white focus:outline-none resize-none border-none focus-visible:ring-0 leading-relaxed min-h-[200px]"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <ColorsSection form={form} name="surfaceColorIds" label="لون السطح" icon={Palette} />
                                <ColorsSection form={form} name="edgeColorIds" label="لون الأطراف" icon={Palette} />
                            </div>
                            <div className="grid grid-cols-1 gap-8">
                                <AccessoriesSection form={form} />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="lg:col-span-1 flex flex-col gap-6">
                                <div className="glass-panel p-6 rounded-2xl border-t-4 border-primary bg-primary/5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">lightbulb</span>
                                        نصائح للصور
                                    </h3>
                                    <ul className="space-y-4 text-sm text-gray-300">
                                        <li className="flex gap-3"><span className="size-2 rounded-full bg-primary mt-1.5 shrink-0"></span>استخدم صوراً عالية الدقة (1200x1200px)</li>
                                        <li className="flex gap-3"><span className="size-2 rounded-full bg-primary mt-1.5 shrink-0"></span>خلفية بيضاء أو شفافة تبرز المنتج</li>
                                        <li className="flex gap-3"><span className="size-2 rounded-full bg-primary mt-1.5 shrink-0"></span>قم برفع ملف 3D (GLB) لزيادة التفاعل</li>
                                    </ul>
                                </div>
                                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-secondary/5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary">view_in_ar</span>
                                        واقع معزز (AR)
                                    </h3>
                                    {currentGlb ? (
                                        <div className="p-4 rounded-xl border border-secondary/20 bg-black/40 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <BoxIcon className="size-5 text-secondary" />
                                                <span className="text-xs font-bold truncate max-w-[120px]">نموذج مختار</span>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:bg-red-400/10 h-8 w-8" onClick={() => form.setValue('glbUrl', '')}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <GLBSelector onSelect={(url) => form.setValue('glbUrl', url)} selectedUrl={currentGlb} />
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-white text-base font-medium flex items-center gap-2">صور المنتج <span className="text-primary">*</span></label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {currentImages.map((image, index) => (
                                            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white/10 group shadow-lg">
                                                <img src={image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`Product ${index}`} />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="rounded-xl size-10 shadow-xl"
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        <Trash2 className="size-5" />
                                                    </Button>
                                                </div>
                                                {index === 0 && <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-primary text-black text-[9px] font-black uppercase">الأساسية</span>}
                                            </div>
                                        ))}
                                        <GallerySelector onSelect={addImage} />
                                    </div>
                                    <FormMessage>{form.formState.errors.images?.message}</FormMessage>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <FormField
                                    control={form.control as any}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-gray-400 text-sm font-medium">السعر الأصلي (د.ع) <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className="h-14 bg-surface-dark border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary text-xl font-black font-display"
                                                        placeholder="0.00"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="discountPercentage"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-gray-400 text-sm font-medium">نسبة الخصم (%)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="h-14 bg-surface-dark border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary text-xl font-black font-display text-primary"
                                                    placeholder="0"
                                                    value={field.value || ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                                <FormField
                                    control={form.control as any}
                                    name="stock"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-gray-400 text-sm font-medium">الكمية المتوفرة <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <div className="flex items-center bg-surface-dark border border-white/10 rounded-xl overflow-hidden h-14 w-full md:w-64">
                                                    <button type="button" className="px-6 h-full hover:bg-white/5 text-xl font-bold transition-colors" onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}>-</button>
                                                    <Input
                                                        type="number"
                                                        className="flex-1 bg-transparent text-center text-white border-none focus:ring-0 text-xl font-black font-display h-full"
                                                        {...field}
                                                    />
                                                    <button type="button" className="px-6 h-full hover:bg-white/5 text-xl font-bold transition-colors" onClick={() => field.onChange((field.value || 0) + 1)}>+</button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-2xl border-2 p-6 bg-primary/5 border-primary/20 h-24 mt-3">
                                            <div className="space-y-1">
                                                <FormLabel className="font-black text-lg text-primary">تفعيل المنتج</FormLabel>
                                                <p className="text-[10px] font-medium opacity-60 italic">هل المنتج متاح للبيع والظهور في المتجر؟</p>
                                            </div>
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="h-8 w-8 rounded-lg border-2 border-primary data-[state=checked]:bg-primary"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-10 border-t border-white/5">
                                <SizesSection form={form} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Actions */}
                <div className="flex justify-between items-center mt-6">
                    <Button
                        key={`prev-btn-${step}`}
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={step === 1}
                        className={`px-8 h-12 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all flex items-center gap-2 ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        <span className="material-symbols-outlined rotate-180">arrow_back</span>
                        السابق
                    </Button>

                    {step === 3 ? (
                        <Button
                            key="submit-btn"
                            type="submit"
                            disabled={isLoading}
                            className="px-10 h-12 bg-primary text-black font-extrabold rounded-xl shadow-neon transition-all flex items-center gap-2 hover:scale-[1.03] active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    {initialData ? 'حفظ التعديلات' : 'نشر المنتج'}
                                    <span className="material-symbols-outlined">check_circle</span>
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            key={`next-btn-${step}`}
                            type="button"
                            onClick={nextStep}
                            className="px-10 h-12 bg-primary text-black font-extrabold rounded-xl shadow-neon transition-all flex items-center gap-2 hover:scale-[1.03] active:scale-[0.98]"
                        >
                            التالي
                            <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
                        </Button>
                    )}
                </div>
            </form>
            {/* Success Modal */}
            {isSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-panel w-full max-w-md p-8 rounded-2xl flex flex-col items-center text-center relative border-t border-white/10">
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/50 flex items-center justify-center mb-6 shadow-neon animate-pulse">
                            <span className="material-symbols-outlined text-4xl text-primary">check</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {initialData ? 'تم تحديث المنتج بنجاح!' : 'تمت إضافة المنتج بنجاح!'}
                        </h2>
                        <p className="text-gray-400 mb-8">المنتج متاح الآن في متجرك</p>
                        <div className="flex gap-3 w-full">
                            {!initialData && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep(1);
                                        form.reset();
                                        if (onReset) onReset();
                                    }}
                                    className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-hover transition-colors"
                                >
                                    إضافة آخر
                                </button>
                            )}
                            <Link
                                href="/products"
                                className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center"
                            >
                                عرض المنتجات
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </Form>
    );
}
