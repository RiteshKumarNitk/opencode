import { PrismaClient, Role, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword('Password123');

  // ─── Admin User ───────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@fashionstore.com',
      passwordHash,
      firstName: 'Store',
      lastName: 'Admin',
      phone: '+91-9876543210',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('  Created admin: admin@fashionstore.com / Password123');

  // ─── Customer Users ───────────────────────────────────────────
  const customer1 = await prisma.user.create({
    data: { email: 'rahul@example.com', passwordHash, firstName: 'Rahul', lastName: 'Kumar', phone: '+91-9876543211', role: Role.CUSTOMER },
  });
  const customer2 = await prisma.user.create({
    data: { email: 'sneha@example.com', passwordHash, firstName: 'Sneha', lastName: 'Patel', phone: '+91-9876543212', role: Role.CUSTOMER },
  });
  console.log('  Created 2 customers');

  // ─── Categories (Jaypore-style) ──────────────────────────────
  const women = await prisma.category.create({
    data: { name: 'Women', slug: 'women', description: "Explore women's fashion", image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', sortOrder: 1 },
  });

  const subcategories = [
    { name: 'Dresses', slug: 'dresses', desc: 'Beautiful dresses for every occasion', parentId: women.id },
    { name: 'Kurtas & Kurtis', slug: 'kurtas-kurtis', desc: 'Traditional & contemporary kurtas', parentId: women.id },
    { name: 'Sarees', slug: 'sarees', desc: 'Elegant sarees in various fabrics', parentId: women.id },
    { name: 'Tops & Tunics', slug: 'tops-tunics', desc: 'Casual & formal tops', parentId: women.id },
    { name: 'Ethnic Wear', slug: 'ethnic-wear', desc: 'Complete ethnic collection', parentId: women.id },
  ];

  const cats: Record<string, string> = { women: women.id };
  for (const sub of subcategories) {
    const cat = await prisma.category.create({
      data: { name: sub.name, slug: sub.slug, description: sub.desc, parentId: sub.parentId, sortOrder: 2 },
    });
    cats[sub.slug] = cat.id;
  }

  const men = await prisma.category.create({
    data: { name: 'Men', slug: 'men', description: "Explore men's fashion", image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', sortOrder: 2 },
  });
  const menSubs = ['Kurtas', 'Shirts', 'T-Shirts'];
  for (const name of menSubs) {
    await prisma.category.create({
      data: { name, slug: name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'), parentId: men.id, sortOrder: 3 },
    });
  }

  console.log('  Created categories with subcategories');

  // ─── Products ─────────────────────────────────────────────────
  const products = [
    {
      name: 'Floral Print Maxi Dress',
      slug: 'floral-print-maxi-dress',
      desc: 'A stunning floral print maxi dress in soft cotton fabric. Perfect for summer outings and casual gatherings. Features a flattering A-line silhouette with adjustable waist tie.',
      price: 2499, comparePrice: 3999, isFeatured: true,
      cat: cats['dresses'],
      images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],
      variants: [
        { name: 'S', sku: 'FMD-S', price: 2499, stock: 15, attrs: { size: 'S' } },
        { name: 'M', sku: 'FMD-M', price: 2499, stock: 20, attrs: { size: 'M' } },
        { name: 'L', sku: 'FMD-L', price: 2499, stock: 12, attrs: { size: 'L' } },
        { name: 'XL', sku: 'FMD-XL', price: 2499, stock: 8, attrs: { size: 'XL' } },
      ],
    },
    {
      name: 'Embroidered Anarkali Kurta',
      slug: 'embroidered-anarkali-kurta',
      desc: 'Beautifully embroidered Anarkali kurta in rich georgette fabric. Features intricate thread work and a flowing silhouette that flatters every body type.',
      price: 1899, comparePrice: 2999, isFeatured: true,
      cat: cats['kurtas-kurtis'],
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'],
      variants: [
        { name: 'S', sku: 'EAK-S', price: 1899, stock: 10, attrs: { size: 'S' } },
        { name: 'M', sku: 'EAK-M', price: 1899, stock: 18, attrs: { size: 'M' } },
        { name: 'L', sku: 'EAK-L', price: 1899, stock: 14, attrs: { size: 'L' } },
      ],
    },
    {
      name: 'Banarasi Silk Saree',
      slug: 'banarasi-silk-saree',
      desc: 'Exquisite Banarasi silk saree with traditional gold zari border. Comes with unstitched blouse piece. Perfect for weddings and festive occasions.',
      price: 4999, comparePrice: 7999, isFeatured: true,
      cat: cats['sarees'],
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'],
      variants: [
        { name: 'Free Size', sku: 'BSS-FS', price: 4999, stock: 25, attrs: {} },
      ],
    },
    {
      name: 'Casual Cotton Tunic Top',
      slug: 'casual-cotton-tunic-top',
      desc: 'Lightweight cotton tunic top with block print design. Comfortable fit for everyday wear. Pairs well with jeans or palazzo pants.',
      price: 899, comparePrice: 1299, isFeatured: false,
      cat: cats['tops-tunics'],
      images: ['https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=600'],
      variants: [
        { name: 'S', sku: 'CTT-S', price: 899, stock: 20, attrs: { size: 'S' } },
        { name: 'M', sku: 'CTT-M', price: 899, stock: 25, attrs: { size: 'M' } },
        { name: 'L', sku: 'CTT-L', price: 899, stock: 15, attrs: { size: 'L' } },
      ],
    },
    {
      name: 'Chanderi Silk Suit Set',
      slug: 'chanderi-silk-suit-set',
      desc: 'Elegant Chanderi silk suit set with dupatta. Features delicate embroidery on the neckline and sleeves. Perfect for semi-formal occasions.',
      price: 3299, comparePrice: 4999, isFeatured: true,
      cat: cats['ethnic-wear'],
      images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600'],
      variants: [
        { name: 'S', sku: 'CSS-S', price: 3299, stock: 8, attrs: { size: 'S' } },
        { name: 'M', sku: 'CSS-M', price: 3299, stock: 12, attrs: { size: 'M' } },
        { name: 'L', sku: 'CSS-L', price: 3299, stock: 10, attrs: { size: 'L' } },
      ],
    },
    {
      name: 'Printed Wrap Dress',
      slug: 'printed-wrap-dress',
      desc: 'Stylish printed wrap dress in breathable viscose fabric. Features 3/4 sleeves and a flattering wrap-around design. Ideal for office to evening transition.',
      price: 1799, comparePrice: 2499, isFeatured: false,
      cat: cats['dresses'],
      images: ['https://images.unsplash.com/photo-1596783074918-c84cb1bd5d44?w=600'],
      variants: [
        { name: 'S', sku: 'PWD-S', price: 1799, stock: 12, attrs: { size: 'S' } },
        { name: 'M', sku: 'PWD-M', price: 1799, stock: 15, attrs: { size: 'M' } },
        { name: 'L', sku: 'PWD-L', price: 1799, stock: 10, attrs: { size: 'L' } },
      ],
    },
    {
      name: 'Lucknowi Chikankari Kurta',
      slug: 'lucknowi-chikankari-kurta',
      desc: 'Handcrafted Lucknowi Chikankari kurta in pure cotton. Features delicate white thread embroidery on pastel fabric. A timeless addition to your wardrobe.',
      price: 2199, comparePrice: 3499, isFeatured: true,
      cat: cats['kurtas-kurtis'],
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'],
      variants: [
        { name: 'S', sku: 'LCK-S', price: 2199, stock: 6, attrs: { size: 'S' } },
        { name: 'M', sku: 'LCK-M', price: 2199, stock: 10, attrs: { size: 'M' } },
        { name: 'L', sku: 'LCK-L', price: 2199, stock: 8, attrs: { size: 'L' } },
      ],
    },
    {
      name: 'Kanjivaram Silk Saree',
      slug: 'kanjivaram-silk-saree',
      desc: 'Authentic Kanjivaram silk saree with temple border and contrast pallu. Rich color combination with gold zari work. Comes with blouse piece.',
      price: 8999, comparePrice: 12999, isFeatured: true,
      cat: cats['sarees'],
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'],
      variants: [
        { name: 'Free Size', sku: 'KSS-FS', price: 8999, stock: 10, attrs: {} },
      ],
    },
  ];

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.desc,
        shortDesc: p.desc.substring(0, 100),
        images: p.images,
        price: p.price,
        comparePrice: p.comparePrice,
        isActive: true,
        isFeatured: p.isFeatured,
        categoryId: p.cat,
      },
    });

    for (const v of p.variants) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          attributes: v.attrs,
        },
      });
    }
  }

  console.log(`  Created ${products.length} products with variants`);

  // ─── Addresses ────────────────────────────────────────────────
  await prisma.address.create({
    data: {
      userId: customer1.id, label: 'Home', fullName: 'Rahul Kumar', phone: '+91-9876543211',
      line1: '123, MG Road', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', isDefault: true,
    },
  });
  await prisma.address.create({
    data: {
      userId: customer2.id, label: 'Home', fullName: 'Sneha Patel', phone: '+91-9876543212',
      line1: '45, Brigade Road', city: 'Bangalore', state: 'Karnataka', postalCode: '560001', isDefault: true,
    },
  });
  console.log('  Created addresses');

  // ─── Coupons ──────────────────────────────────────────────────
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', description: '10% off on first order', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 500, maxDiscount: 500, usageLimit: 100, isActive: true },
      { code: 'FLAT200', description: 'Flat ₹200 off', discountType: 'FIXED', discountValue: 200, minOrderAmount: 1999, usageLimit: 50, isActive: true },
      { code: 'SUMMER15', description: '15% off summer sale', discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 1500, maxDiscount: 1000, usageLimit: 200, isActive: true },
    ],
  });
  console.log('  Created 3 coupons');

  console.log('');
  console.log('✅ Seed completed!');
  console.log('');
  console.log('🔑 Login credentials (all use Password123):');
  console.log('   Admin:    admin@fashionstore.com');
  console.log('   Customer: rahul@example.com');
  console.log('   Customer: sneha@example.com');
  console.log('');
  console.log('🏷️  Coupons: WELCOME10, FLAT200, SUMMER15');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
