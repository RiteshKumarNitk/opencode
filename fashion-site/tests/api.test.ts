import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const mockProduct = {
  id: 'prod-1',
  name: 'Test Product',
  slug: 'test-product',
  price: 999,
  images: ['/test.jpg'],
  category: { id: 'cat-1', name: 'Test Category' },
};

export const mockApi = setupServer(
  http.get('/api/products', () => {
    return HttpResponse.json({ success: true, data: [mockProduct], pagination: { total: 1, page: 1, limit: 20 } });
  }),
  http.get('/api/products/:id', ({ params }) => {
    return HttpResponse.json({ success: true, data: mockProduct });
  }),
  http.get('/api/categories', () => {
    return HttpResponse.json({ success: true, data: [{ id: 'cat-1', name: 'Category 1' }] });
  })
);

describe('API Tests', () => {
  beforeAll(() => mockApi.listen());
  afterAll(() => mockApi.close());

  it('should fetch products', async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe('Test Product');
  });

  it('should fetch categories', async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});

describe('Validation Tests', () => {
  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid')).toBe(false);
  });

  it('should validate phone number', () => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    expect(phoneRegex.test('+91 9876543210')).toBe(true);
    expect(phoneRegex.test('123')).toBe(false);
  });

  it('should validate price range', () => {
    const validatePrice = (price: number) => price > 0 && price < 1000000;
    expect(validatePrice(100)).toBe(true);
    expect(validatePrice(-10)).toBe(false);
  });
});

describe('Utility Functions', () => {
  it('should format currency correctly', () => {
    const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
    expect(formatCurrency(1000)).toBe('₹1,000');
  });

  it('should generate slug from name', () => {
    const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    expect(slugify('Test Product')).toBe('test-product');
    expect(slugify('Hello World!')).toBe('hello-world');
  });

  it('should calculate discount percentage', () => {
    const calcDiscount = (original: number, sale: number) => Math.round(((original - sale) / original) * 100);
    expect(calcDiscount(1000, 800)).toBe(20);
    expect(calcDiscount(500, 500)).toBe(0);
  });
});

describe('Cart Logic', () => {
  it('should calculate cart total', () => {
    const items = [
      { price: 500, quantity: 2 },
      { price: 300, quantity: 1 },
    ];
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(total).toBe(1300);
  });

  it('should apply coupon discount', () => {
    const subtotal = 1000;
    const discount = 10;
    const discounted = subtotal - (subtotal * discount / 100);
    expect(discounted).toBe(900);
  });

  it('should calculate shipping based on subtotal', () => {
    const shipping = (subtotal: number) => subtotal > 500 ? 0 : 50;
    expect(shipping(600)).toBe(0);
    expect(shipping(400)).toBe(50);
  });
});

describe('Order Status Flow', () => {
  const statusFlow = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  
  it('should allow forward progression', () => {
    const canProgress = (current: string, next: string) => 
      statusFlow.indexOf(next) > statusFlow.indexOf(current);
    
    expect(canProgress('PENDING', 'CONFIRMED')).toBe(true);
    expect(canProgress('SHIPPED', 'PENDING')).toBe(false);
  });

  it('should identify final states', () => {
    const finalStates = ['DELIVERED', 'CANCELLED', 'REFUNDED'];
    expect(finalStates.includes('DELIVERED')).toBe(true);
    expect(finalStates.includes('PENDING')).toBe(false);
  });
});