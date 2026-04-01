import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';
import type { ProductInput, ProductVariantInput, ProductFilterInput } from '@/lib/validations';
import { slugify, generateSKU } from '@/lib/slug';

// ─── List Products ────────────────────────────────────────────

export async function listProducts(filters: ProductFilterInput) {
  const where: any = { deletedAt: null };

  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { deletedAt: null },
          select: {
            id: true, name: true, sku: true, price: true,
            comparePrice: true, stock: true, attributes: true,
            images: true, isActive: true,
          },
        },
        _count: { select: { variants: true } },
      },
      orderBy: { [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc' },
      skip: ((filters.page || 1) - 1) * (filters.limit || 20),
      take: filters.limit || 20,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

// ─── Get Single Product ───────────────────────────────────────

export async function getProduct(productIdOrSlug: string) {
  return prisma.product.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: { deletedAt: null, isActive: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

// ─── Create Product ───────────────────────────────────────────

export async function createProduct(input: ProductInput) {
  const slug = slugify(input.name);

  const existingSlug = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
  });
  if (existingSlug) throw new Error('SLUG_EXISTS');

  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, deletedAt: null },
    });
    if (!category) throw new Error('CATEGORY_NOT_FOUND');
  }

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      shortDesc: input.shortDesc,
      images: input.images || [],
      price: input.price,
      comparePrice: input.comparePrice,
      sku: input.sku || generateSKU(input.name),
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
      categoryId: input.categoryId,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: true,
    },
  });

  if (input.variants && input.variants.length > 0) {
    for (const variant of input.variants) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: variant.name,
          sku: variant.sku || generateSKU(`${input.name}-${variant.name}`),
          price: variant.price,
          comparePrice: variant.comparePrice,
          stock: variant.stock || 0,
          attributes: variant.attributes || {},
          images: variant.images || [],
        },
      });
    }
  }

  return getProduct(product.id);
}

// ─── Update Product ───────────────────────────────────────────

export async function updateProduct(productId: string, input: Partial<ProductInput>) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!existing) throw new Error('PRODUCT_NOT_FOUND');

  if (input.name) {
    const slug = slugify(input.name);
    const slugExists = await prisma.product.findFirst({
      where: { slug, id: { not: productId }, deletedAt: null },
    });
    if (slugExists) throw new Error('SLUG_EXISTS');
    (input as any).slug = slug;
  }

  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, deletedAt: null },
    });
    if (!category) throw new Error('CATEGORY_NOT_FOUND');
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.name && { name: input.name, slug: slugify(input.name) }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.shortDesc !== undefined && { shortDesc: input.shortDesc }),
      ...(input.images !== undefined && { images: input.images }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.comparePrice !== undefined && { comparePrice: input.comparePrice }),
      ...(input.sku !== undefined && { sku: input.sku }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    },
  });

  return getProduct(updated.id);
}

// ─── Delete Product (Soft Delete) ─────────────────────────────

export async function deleteProduct(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: new Date() },
  });
}

// ─── Create Variant ───────────────────────────────────────────

export async function createVariant(productId: string, input: ProductVariantInput) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  return prisma.productVariant.create({
    data: {
      productId,
      name: input.name,
      sku: input.sku || generateSKU(`${product.name}-${input.name}`),
      price: input.price,
      comparePrice: input.comparePrice,
      stock: input.stock || 0,
      attributes: input.attributes || {},
      images: input.images || [],
    },
  });
}

// ─── Update Variant ───────────────────────────────────────────

export async function updateVariant(variantId: string, input: Partial<ProductVariantInput>) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, deletedAt: null },
  });
  if (!variant) throw new Error('VARIANT_NOT_FOUND');

  return prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.comparePrice !== undefined && { comparePrice: input.comparePrice }),
      ...(input.stock !== undefined && { stock: input.stock }),
      ...(input.attributes !== undefined && { attributes: input.attributes }),
      ...(input.images !== undefined && { images: input.images }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

// ─── Delete Variant ───────────────────────────────────────────

export async function deleteVariant(variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, deletedAt: null },
  });
  if (!variant) throw new Error('VARIANT_NOT_FOUND');

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { deletedAt: new Date() },
  });
}
