import { db } from "../server/db";
import { users, businesses, products, posts } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create sample users
    const [user1] = await db.insert(users).values({
      id: "sample-user-1",
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    const [adminUser] = await db.insert(users).values({
      id: "admin-user-1",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      isAdmin: true,
    }).onConflictDoUpdate({
      target: users.id,
      set: { isAdmin: true, updatedAt: new Date() }
    }).returning();

    console.log("✅ Created users:", user1.email, adminUser.email);

    // Create sample businesses
    const [business1] = await db.insert(businesses).values({
      ownerId: user1.id,
      name: "Florida Sunshine Cafe",
      tagline: "Authentic local flavors in every bite",
      description: "A cozy cafe serving fresh, locally-sourced ingredients with a Florida twist. Come taste the sunshine!",
      category: "Food & Beverage",
      location: "Miami, FL",
      address: "123 Ocean Drive, Miami, FL 33139",
      phone: "(305) 555-0123",
      website: "https://floridasunshinecafe.com",
      isVerified: true,
      isActive: true,
      rating: "4.5",
      reviewCount: 127,
      followerCount: 450,
      postCount: 23,
    }).onConflictDoNothing().returning();

    const [business2] = await db.insert(businesses).values({
      ownerId: adminUser.id,
      name: "Palm Beach Artisans",
      tagline: "Handcrafted treasures from local artists",
      description: "Discover unique, handmade art and crafts from talented Florida artisans. Each piece tells a story.",
      category: "Art & Crafts",
      location: "Palm Beach, FL",
      address: "456 Art District Way, Palm Beach, FL 33480",
      phone: "(561) 555-0456",
      website: "https://palmbeachartisans.com",
      isVerified: true,
      isActive: true,
      rating: "4.8",
      reviewCount: 89,
      followerCount: 312,
      postCount: 18,
    }).onConflictDoNothing().returning();

    if (business1) {
      console.log("✅ Created business:", business1.name);

      // Create sample products for business1
      const [product1] = await db.insert(products).values({
        businessId: business1.id,
        name: "Sunshine Breakfast Platter",
        description: "Our signature breakfast featuring fresh Florida oranges, local honey, and artisan bread",
        price: "14.99",
        originalPrice: "16.99",
        category: "Food & Beverage",
        inventory: 50,
        isActive: true,
        isDigital: false,
        tags: ["local-made", "breakfast", "fresh"],
        rating: "4.7",
        reviewCount: 34,
      }).onConflictDoNothing().returning();

      if (product1) {
        console.log("✅ Created product:", product1.name);
      }

      // Create sample posts
      await db.insert(posts).values({
        businessId: business1.id,
        content: "Beautiful sunrise this morning! Come taste the sunshine with our fresh breakfast specials. ☀️🍊 #FloridasFinest #LocalEats",
        type: "update",
        likeCount: 23,
        commentCount: 5,
        shareCount: 3,
        isVisible: true,
      }).onConflictDoNothing();
    }

    if (business2) {
      console.log("✅ Created business:", business2.name);

      // Create sample products for business2
      const [product2] = await db.insert(products).values({
        businessId: business2.id,
        name: "Ocean Wave Ceramic Bowl",
        description: "Hand-thrown ceramic bowl inspired by Florida's beautiful coastline. Perfect for serving or decoration.",
        price: "45.00",
        category: "Art & Crafts",
        inventory: 12,
        isActive: true,
        isDigital: false,
        tags: ["handcrafted", "ceramic", "local-made", "eco-friendly"],
        rating: "4.9",
        reviewCount: 8,
      }).onConflictDoNothing().returning();

      if (product2) {
        console.log("✅ Created product:", product2.name);
      }

      // Create sample posts
      await db.insert(posts).values({
        businessId: business2.id,
        content: "Just finished a new collection of ocean-inspired ceramics! Each piece captures the essence of our beautiful Florida coastline. 🌊🏺 #HandmadeWithLove #FloridaArt",
        type: "product",
        likeCount: 18,
        commentCount: 7,
        shareCount: 2,
        isVisible: true,
      }).onConflictDoNothing();
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📋 Sample Data Created:");
    console.log("👥 Users: demo@example.com (regular), admin@example.com (admin)");
    console.log("🏪 Businesses: Florida Sunshine Cafe, Palm Beach Artisans");
    console.log("🛍️ Products: Sunshine Breakfast Platter, Ocean Wave Ceramic Bowl");
    console.log("📱 Posts: Sample social media posts");
    console.log("\n💡 To promote yourself to admin in development:");
    console.log("   POST /api/admin/promote (when authenticated)");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => {
    console.log("✅ Seed script completed");
    process.exit(0);
  }).catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
}

export { seed };
