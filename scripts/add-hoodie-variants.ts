/**
 * Script to add size/color variants to NodePress Hoody product
 * Run with: npx ts-node scripts/add-hoodie-variants.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  { name: 'Red', code: '#DC2626' },
  { name: 'Black', code: '#000000' },
  { name: 'Navy', code: '#1E3A5F' },
  { name: 'White', code: '#FFFFFF' },
];

async function main() {
  // Find the NodePress Hoody product
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { name: { contains: 'NodePress Hoody', mode: 'insensitive' } },
        { name: { contains: 'NodePress Hoodie', mode: 'insensitive' } },
        { slug: { contains: 'wp-node-hoody' } },
        { slug: { contains: 'wp-node-hoodie' } },
      ],
    },
  });

  if (!product) {
    console.log('❌ NodePress Hoody product not found!');
    console.log('Searching for all products...');
    const allProducts = await prisma.product.findMany({ select: { id: true, name: true, slug: true } });
    console.log('Available products:', allProducts);
    return;
  }

  console.log(`✅ Found product: ${product.name} (${product.id})`);

  // Delete existing variants
  const deleted = await prisma.productVariant.deleteMany({
    where: { productId: product.id },
  });
  console.log(`🗑️  Deleted ${deleted.count} existing variants`);

  // Generate all size/color combinations
  const variants: any[] = [];
  let sortOrder = 0;

  for (const size of SIZES) {
    for (const color of COLORS) {
      variants.push({
        productId: product.id,
        name: `${size} / ${color.name}`,
        sku: `HOODY-${size}-${color.name.toUpperCase().replace(/\s/g, '')}`,
        size,
        color: color.name,
        colorCode: color.code,
        price: product.price, // Use base product price
        stock: 10, // Default stock of 10 per variant
        lowStockThreshold: 3,
        isActive: true,
        isDefault: sortOrder === 0,
        sortOrder: sortOrder++,
        options: { size, color: color.name, colorCode: color.code },
      });
    }
  }

  // Create variants
  const created = await prisma.productVariant.createMany({
    data: variants,
  });
  console.log(`✨ Created ${created.count} variants`);

  // Update product to enable variants
  await prisma.product.update({
    where: { id: product.id },
    data: {
      hasVariants: true,
      variantOptions: {
        sizes: SIZES,
        colors: COLORS,
      },
    },
  });
  console.log('✅ Product updated with hasVariants=true and variantOptions');

  // Show created variants
  const allVariants = await prisma.productVariant.findMany({
    where: { productId: product.id },
    orderBy: { sortOrder: 'asc' },
  });
  
  console.log('\n📦 Created variants:');
  console.log('─'.repeat(60));
  allVariants.forEach((v) => {
    console.log(`  ${v.name.padEnd(15)} | SKU: ${v.sku?.padEnd(20)} | Stock: ${v.stock}`);
  });
  console.log('─'.repeat(60));
  console.log(`\n🎉 Done! ${product.name} now has ${allVariants.length} variants.`);
  console.log('Refresh the product page to see size/color selectors.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

