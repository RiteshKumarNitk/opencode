import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Product ──────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required'),
  shortDesc: z.string().max(500).optional(),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  categoryId: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  attributes: z.record(z.string()),
  images: z.array(z.string().url()).default([]),
  isActive: z.boolean().default(true),
});

export const productFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'price', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Category ─────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// ─── Cart ─────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// ─── Order ────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['STRIPE', 'RAZORPAY', 'COD']).default('RAZORPAY'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
});

// ─── Address ──────────────────────────────────────────────────

export const addressSchema = z.object({
  label: z.string().default('Home'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().default('IN'),
  isDefault: z.boolean().default(false),
});

// ─── Coupon ───────────────────────────────────────────────────

export const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive('Discount value must be positive'),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

// ─── Pagination ───────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Types ────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
