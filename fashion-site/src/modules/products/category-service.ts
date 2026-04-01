import prisma from '@/lib/prisma';
import type { CategoryInput } from '@/lib/validations';
import { slugify } from '@/lib/slug';

export async function listCategories() {
  return prisma.category.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { products: true } },
      children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getCategory(categoryIdOrSlug: string) {
  return prisma.category.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: categoryIdOrSlug }, { slug: categoryIdOrSlug }],
    },
    include: {
      children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      parent: true,
      _count: { select: { products: true } },
    },
  });
}

export async function createCategory(input: CategoryInput) {
  const slug = slugify(input.name);

  const existingSlug = await prisma.category.findFirst({
    where: { slug, deletedAt: null },
  });
  if (existingSlug) throw new Error('SLUG_EXISTS');

  if (input.parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: input.parentId, deletedAt: null },
    });
    if (!parent) throw new Error('PARENT_NOT_FOUND');
  }

  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      image: input.image,
      parentId: input.parentId,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateCategory(categoryId: string, input: Partial<CategoryInput>) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, deletedAt: null },
  });
  if (!category) throw new Error('CATEGORY_NOT_FOUND');

  if (input.name) {
    const slug = slugify(input.name);
    const slugExists = await prisma.category.findFirst({
      where: { slug, id: { not: categoryId }, deletedAt: null },
    });
    if (slugExists) throw new Error('SLUG_EXISTS');
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(input.name && { name: input.name, slug: slugify(input.name) }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.image !== undefined && { image: input.image }),
      ...(input.parentId !== undefined && { parentId: input.parentId }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  });
}

export async function deleteCategory(categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, deletedAt: null },
  });
  if (!category) throw new Error('CATEGORY_NOT_FOUND');

  const productCount = await prisma.product.count({
    where: { categoryId, deletedAt: null },
  });
  if (productCount > 0) throw new Error('CATEGORY_HAS_PRODUCTS');

  await prisma.category.update({
    where: { id: categoryId },
    data: { deletedAt: new Date() },
  });
}
