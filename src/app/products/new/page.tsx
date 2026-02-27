'use client';

import { useState } from 'react';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { ProductInput } from '@/schemas';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ProductForm } from '@/components/product/product-form';
import { toast } from 'sonner';

const CREATE_PRODUCT = gql`
    mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
            id
            slug
        }
    }
`;

export default function NewProductPage() {
    const [showSuccess, setShowSuccess] = useState(false);

    const [createProduct, { loading: isCreating }] = useMutation<{ createProduct: any }, { input: any }>(CREATE_PRODUCT, {
        update(cache) {
            // Evict the products query from cache to force a refresh on the products page
            cache.evict({ fieldName: 'products' });
            cache.gc();
        },
        onCompleted: () => {
            setShowSuccess(true);
        },
        onError: (error: any) => {
            toast.error(error.message || 'فشل في إنشاء المنتج');
        },
    });

    const handleFormSubmit = (data: ProductInput) => {
        // Map frontend schema to backend input
        const input = {
            name: data.name,
            slug: data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(2, 7),
            description: data.description,
            price: Number(data.price),
            discountPercentage: data.discountPercentage ? Number(data.discountPercentage) : undefined,
            stock: Number(data.stock),
            isActive: data.isActive,
            mainImage: data.images[0] || '',
            galleryImages: data.images.slice(1),
            glbFileUrl: data.glbUrl || undefined,
            categoryId: data.categoryId,
            surfaceColorIds: data.surfaceColorIds,
            edgeColorIds: data.edgeColorIds,
            accessoryIds: data.accessoryIds,
            sizes: data.sizes?.map(s => ({ ...s, price: Number(s.price) })),
        };
        createProduct({ variables: { input } });
    };

    return (
        <AdminLayout>
            <ProductForm
                onSubmit={handleFormSubmit}
                isLoading={isCreating}
                isSuccess={showSuccess}
                onReset={() => setShowSuccess(false)}
            />
        </AdminLayout>
    );
}
