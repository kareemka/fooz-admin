'use client';

import { useState } from 'react';

import { useRouter, useParams } from 'next/navigation';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { ProductInput } from '@/schemas';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ProductForm } from '@/components/product/product-form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const GET_PRODUCT = gql`
    query GetProduct($id: ID!) {
        product(id: $id) {
            id
            name
            description
            price
            discountPercentage
            stock
            isActive
            mainImage
            galleryImages
            glbFileUrl
            categoryId
            surfaceColors {
                id
            }
            edgeColors {
                id
            }
            accessories {
                id
            }
            sizes {
                id
                name
                price
                dimensions
            }
        }
    }
`;

const UPDATE_PRODUCT = gql`
    mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
        updateProduct(id: $id, input: $input) {
            id
            slug
        }
    }
`;

export default function EditProductPage() {
    const params = useParams();
    const id = params.id as string;
    const [showSuccess, setShowSuccess] = useState(false);

    const { data: productData, loading: isLoading } = useQuery<{ product: any }>(GET_PRODUCT, {
        variables: { id },
    });

    const [updateProduct, { loading: isUpdating }] = useMutation<{ updateProduct: any }, { id: string, input: any }>(UPDATE_PRODUCT, {
        onCompleted: () => {
            setShowSuccess(true);
        },
        onError: (error: any) => {
            toast.error(error.message || 'فشل في تحديث المنتج');
        },
    });

    const product = productData?.product;

    const handleFormSubmit = (data: ProductInput) => {
        const input = {
            name: data.name,
            description: data.description,
            price: Number(data.price),
            discountPercentage: data.discountPercentage ? Number(data.discountPercentage) : null,
            stock: Number(data.stock),
            isActive: data.isActive,
            mainImage: data.images[0] || '',
            galleryImages: data.images.slice(1),
            glbFileUrl: data.glbUrl || null,
            categoryId: data.categoryId,
            surfaceColorIds: data.surfaceColorIds,
            edgeColorIds: data.edgeColorIds,
            accessoryIds: data.accessoryIds,
            sizes: data.sizes?.map(s => ({
                name: s.name,
                price: Number(s.price),
                dimensions: s.dimensions || null
            })),
        };
        updateProduct({ variables: { id, input } });
    };

    const initialData: ProductInput | null = product ? {
        ...product,
        images: [product.mainImage, ...product.galleryImages].filter(Boolean),
        glbUrl: product.glbFileUrl || '',
        accessoryIds: product.accessories?.map((a: any) => a.id) || [],
        surfaceColorIds: product.surfaceColors?.map((c: any) => c.id) || [],
        edgeColorIds: product.edgeColors?.map((c: any) => c.id) || [],
        sizes: product.sizes || [],
    } : null;

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AdminLayout>
        );
    }

    if (!product) {
        return (
            <AdminLayout>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold">المنتج غير موجود</h2>
                    <Button asChild className="mt-4">
                        <Link href="/products">العودة إلى المنتجات</Link>
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <ProductForm
                initialData={initialData as any}
                onSubmit={handleFormSubmit}
                isLoading={isUpdating}
                isSuccess={showSuccess}
                onReset={() => setShowSuccess(false)}
            />
        </AdminLayout>
    );
}
