import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: url.username,
    password: url.password,
    database: url.pathname.replace("/", ""),
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const customerPassword = await bcrypt.hash("customer123", 12);

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Administrator with full access",
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: "STAFF" },
    update: {},
    create: {
      name: "STAFF",
      description: "Staff member with limited access",
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: "CUSTOMER" },
    update: {},
    create: {
      name: "CUSTOMER",
      description: "Regular customer",
    },
  });

  console.log("Roles created");

  const permissions = [
    { name: "PRODUCT_VIEW", module: "PRODUCT", description: "View products" },
    { name: "PRODUCT_CREATE", module: "PRODUCT", description: "Create products" },
    { name: "PRODUCT_UPDATE", module: "PRODUCT", description: "Update products" },
    { name: "PRODUCT_DELETE", module: "PRODUCT", description: "Delete products" },
    { name: "CATEGORY_VIEW", module: "CATEGORY", description: "View categories" },
    { name: "CATEGORY_CREATE", module: "CATEGORY", description: "Create categories" },
    { name: "CATEGORY_UPDATE", module: "CATEGORY", description: "Update categories" },
    { name: "CATEGORY_DELETE", module: "CATEGORY", description: "Delete categories" },
    { name: "ORDER_VIEW", module: "ORDER", description: "View orders" },
    { name: "ORDER_UPDATE", module: "ORDER", description: "Update orders" },
    { name: "USER_VIEW", module: "USER", description: "View users" },
    { name: "USER_UPDATE", module: "USER", description: "Update users" },
    { name: "REVIEW_VIEW", module: "REVIEW", description: "View reviews" },
    { name: "REVIEW_APPROVE", module: "REVIEW", description: "Approve reviews" },
    { name: "COUPON_VIEW", module: "COUPON", description: "View coupons" },
    { name: "COUPON_CREATE", module: "COUPON", description: "Create coupons" },
    { name: "REPORT_VIEW", module: "REPORT", description: "View reports" },
    { name: "SETTINGS_VIEW", module: "SETTINGS", description: "View settings" },
    { name: "SETTINGS_UPDATE", module: "SETTINGS", description: "Update settings" },
  ];

  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: created.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: created.id },
    });
  }

  console.log("Permissions created and assigned to admin role");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@rithusnacks.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@rithusnacks.com",
      password: adminPassword,
      roleId: adminRole.id,
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "John Customer",
      email: "customer@example.com",
      password: customerPassword,
      roleId: customerRole.id,
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  console.log("Users created");

  const categories = [
    { name: "Namkeen", slug: "namkeen", description: "Savory snacks and namkeen" },
    { name: "Chips", slug: "chips", description: "Potato chips and crisps" },
    { name: "Sweets", slug: "sweets", description: "Traditional Indian sweets" },
    { name: "Dry Fruits", slug: "dry-fruits", description: "Premium dry fruits and nuts" },
    { name: "Cookies", slug: "cookies", description: "Biscuits and cookies" },
    { name: "Chocolate", slug: "chocolate", description: "Chocolate and confectionery" },
    { name: "Namkeen Mix", slug: "namkeen-mix", description: "Mixed namkeen packs" },
    { name: "Health Snacks", slug: "health-snacks", description: "Healthy snack options" },
  ];

  const createdCategories: { id: number }[] = [];
  for (const cat of categories) {
    const created = await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
    createdCategories.push(created);
  }

  console.log("Categories created");

  const brands = [
    { name: "Rithu Special", slug: "rithu-special", description: "Our premium house brand" },
    { name: "SnackWorld", slug: "snackworld", description: "Popular snack brand" },
    { name: "PureBites", slug: "purebites", description: "Healthy snack options" },
  ];

  const createdBrands: { id: number }[] = [];
  for (const brand of brands) {
    const created = await prisma.productBrand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: { ...brand, isActive: true },
    });
    createdBrands.push(created);
  }

  console.log("Brands created");

  const products = [
    {
      name: "Classic Namkeen Mix",
      slug: "classic-namkeen-mix",
      description: "A delicious blend of traditional Indian namkeen. Made with premium ingredients and authentic spices.",
      shortDescription: "Traditional Indian namkeen mix",
      categoryId: createdCategories[0].id,
      brandId: createdBrands[0].id,
      sku: "NM-001",
      price: 120,
      comparePrice: 150,
      taxRate: 5,
      discountPercent: 20,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Masala Chips",
      slug: "masala-chips",
      description: "Crispy potato chips with a perfect blend of Indian spices.",
      shortDescription: "Spicy masala flavored chips",
      categoryId: createdCategories[1].id,
      brandId: createdBrands[1].id,
      sku: "CH-001",
      price: 40,
      taxRate: 5,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Motichoor Ladoo Box",
      slug: "motichoor-ladoo-box",
      description: "Freshly made motichoor ladoos. A box of 12 pure ghee ladoos.",
      shortDescription: "Box of 12 fresh motichoor ladoos",
      categoryId: createdCategories[2].id,
      brandId: createdBrands[0].id,
      sku: "SW-001",
      price: 350,
      comparePrice: 400,
      taxRate: 5,
      discountPercent: 12,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Premium Cashews",
      slug: "premium-cashews",
      description: "Handpicked premium quality cashews. Rich, creamy, and crunchy.",
      shortDescription: "Premium quality cashew nuts",
      categoryId: createdCategories[3].id,
      brandId: createdBrands[2].id,
      sku: "DF-001",
      price: 500,
      comparePrice: 600,
      taxRate: 5,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Butter Cookies",
      slug: "butter-cookies",
      description: "Rich butter cookies made with real butter. Perfect with tea.",
      shortDescription: "Rich butter cookies pack",
      categoryId: createdCategories[4].id,
      brandId: createdBrands[1].id,
      sku: "CK-001",
      price: 80,
      taxRate: 5,
      isActive: true,
    },
    {
      name: "Dark Chocolate Bar",
      slug: "dark-chocolate-bar",
      description: "Premium 72% dark chocolate. Rich and intense flavor.",
      shortDescription: "72% dark chocolate bar",
      categoryId: createdCategories[5].id,
      brandId: createdBrands[2].id,
      sku: "CH-002",
      price: 150,
      taxRate: 5,
      isActive: true,
    },
    {
      name: "Mixture Namkeen",
      slug: "mixture-namkeen",
      description: "Crispy mixture namkeen with peanuts, sev, and spices.",
      shortDescription: "Crispy spicy mixture",
      categoryId: createdCategories[6].id,
      brandId: createdBrands[0].id,
      sku: "NM-002",
      price: 90,
      comparePrice: 110,
      taxRate: 5,
      discountPercent: 18,
      isActive: true,
    },
    {
      name: "Roasted Makhana",
      slug: "roasted-makhana",
      description: "Lightly roasted fox nuts. A healthy and tasty snack option.",
      shortDescription: "Healthy roasted fox nuts",
      categoryId: createdCategories[7].id,
      brandId: createdBrands[2].id,
      sku: "HS-001",
      price: 180,
      taxRate: 5,
      isActive: true,
      isFeatured: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log("Products created");
  console.log("\n--- Seed Complete ---");
  console.log("Admin Login: admin@rithusnacks.com / admin123");
  console.log("Customer Login: customer@example.com / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
