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

    // Create sample businesses with professional images
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
      coverImageUrl: "/attached_assets/stock_images/elegant_restaurant_i_5b327bb1.jpg",
      isVerified: true,
      isActive: true,
      rating: "4.5",
      reviewCount: 127,
      followerCount: 450,
      postCount: 23,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
        coverImageUrl: "/attached_assets/stock_images/elegant_restaurant_i_5b327bb1.jpg",
        updatedAt: new Date() 
      }
    }).returning();

    const [business2] = await db.insert(businesses).values({
      ownerId: adminUser.id,
      name: "Miami Beach Wellness Center",
      tagline: "Luxury spa and wellness sanctuary",
      description: "Experience ultimate relaxation at Miami's premier wellness center. Our luxury treatments rejuvenate body and soul.",
      category: "Health & Beauty",
      location: "Miami Beach, FL",
      address: "789 Collins Avenue, Miami Beach, FL 33139",
      phone: "(305) 555-0789",
      website: "https://miamibeachwellness.com",
      coverImageUrl: "/attached_assets/stock_images/luxury_spa_wellness__78221b18.jpg",
      isVerified: true,
      isActive: true,
      rating: "4.9",
      reviewCount: 203,
      followerCount: 850,
      postCount: 45,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
        coverImageUrl: "/attached_assets/stock_images/luxury_spa_wellness__78221b18.jpg",
        updatedAt: new Date() 
      }
    }).returning();

    const [business3] = await db.insert(businesses).values({
      ownerId: user1.id,
      name: "Coastal Wedding Planners",
      tagline: "Creating unforgettable beachside celebrations",
      description: "Specializing in elegant beach weddings and coastal celebrations. Let us make your dream wedding a reality.",
      category: "Wedding Services",
      location: "Key Biscayne, FL",
      address: "456 Crandon Boulevard, Key Biscayne, FL 33149",
      phone: "(305) 555-0456",
      website: "https://coastalweddingplanners.com",
      coverImageUrl: "/attached_assets/stock_images/beach_wedding_ceremo_b81563df.jpg",
      isVerified: true,
      isActive: true,
      rating: "4.8",
      reviewCount: 156,
      followerCount: 320,
      postCount: 28,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
        coverImageUrl: "/attached_assets/stock_images/beach_wedding_ceremo_b81563df.jpg",
        updatedAt: new Date() 
      }
    }).returning();

    const [business4] = await db.insert(businesses).values({
      ownerId: adminUser.id,
      name: "Elite Food Tours",
      tagline: "Culinary adventures for discerning palates",
      description: "Discover Miami's finest culinary scene with our exclusive food tours. Experience gourmet dining like never before.",
      category: "Food & Beverage",
      location: "South Beach, FL",
      address: "321 Ocean Drive, Miami Beach, FL 33139",
      phone: "(305) 555-0321",
      website: "https://elitefoodtours.com",
      coverImageUrl: "/attached_assets/stock_images/fine_dining_food_pre_6c60b0bf.jpg",
      isVerified: true,
      isActive: true,
      rating: "4.7",
      reviewCount: 98,
      followerCount: 420,
      postCount: 67,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
        coverImageUrl: "/attached_assets/stock_images/fine_dining_food_pre_6c60b0bf.jpg",
        updatedAt: new Date() 
      }
    }).returning();

    const [business5] = await db.insert(businesses).values({
      ownerId: user1.id,
      name: "Everglades Wildlife Photography",
      tagline: "Capturing Florida's natural beauty",
      description: "Professional nature photography services specializing in Florida's unique wildlife and landscapes.",
      category: "Photography",
      location: "Homestead, FL",
      address: "987 Krome Avenue, Homestead, FL 33030",
      phone: "(305) 555-0987",
      website: "https://evergladeswildlife.com",
      coverImageUrl: "/attached_assets/stock_images/professional_photogr_afdb1a59.jpg",
      isVerified: true,
      isActive: true,
      rating: "4.9",
      reviewCount: 74,
      followerCount: 290,
      postCount: 52,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
        coverImageUrl: "/attached_assets/stock_images/professional_photogr_afdb1a59.jpg",
        updatedAt: new Date() 
      }
    }).returning();

    const [business6] = await db.insert(businesses).values({
      ownerId: adminUser.id,
      name: "Sunset Yoga Studio",
      tagline: "Find your zen by the sea",
      description: "Peaceful yoga classes and wellness programs with breathtaking Miami sunsets as your backdrop.",
      category: "Health & Beauty",
      location: "Coconut Grove, FL",
      address: "654 Main Highway, Coconut Grove, FL 33133",
      phone: "(305) 555-0654",
      website: "https://sunsetyogastudio.com",
      coverImageUrl: "/attached_assets/stock_images/sunset_yoga_studio_p_c38ab4c1.jpg",
      isVerified: true,
      isActive: true,
      rating: "4.8",
      reviewCount: 185,
      followerCount: 540,
      postCount: 39,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
        coverImageUrl: "/attached_assets/stock_images/sunset_yoga_studio_p_c38ab4c1.jpg",
        updatedAt: new Date() 
      }
    }).returning();

    // Create products and posts for all businesses
    const allBusinesses = [business1, business2, business3, business4, business5, business6];
    
    if (business1) {
      console.log("✅ Created business:", business1.name);

      // Create sample products for Florida Sunshine Cafe
      await db.insert(products).values({
        businessId: business1.id,
        name: "Gourmet Cuban Sandwich",
        description: "Our signature Cuban sandwich with premium roasted pork, ham, Swiss cheese, and house pickles",
        price: "16.99",
        originalPrice: "18.99",
        category: "Food & Beverage",
        images: ["/attached_assets/stock_images/gourmet_cuban_sandwi_e0346f8d.jpg"],
        inventory: 50,
        isActive: true,
        isDigital: false,
        tags: ["local-made", "cuban", "signature"],
        rating: "4.8",
        reviewCount: 45,
      }).onConflictDoUpdate({
        target: products.id,
        set: { 
          images: ["/attached_assets/stock_images/gourmet_cuban_sandwi_e0346f8d.jpg"],
          updatedAt: new Date() 
        }
      });

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

      // Create sample products for Miami Beach Wellness Center
      await db.insert(products).values({
        businessId: business2.id,
        name: "Luxury Spa Treatment Package",
        description: "Complete wellness experience with massage, facial, and aromatherapy session",
        price: "299.00",
        originalPrice: "350.00",
        category: "Health & Beauty",
        images: ["/attached_assets/stock_images/luxury_spa_wellness__9285aa1d.jpg"],
        inventory: 20,
        isActive: true,
        isDigital: false,
        tags: ["luxury", "wellness", "spa", "relaxation"],
        rating: "4.9",
        reviewCount: 67,
      }).onConflictDoUpdate({
        target: products.id,
        set: { 
          images: ["/attached_assets/stock_images/luxury_spa_wellness__9285aa1d.jpg"],
          updatedAt: new Date() 
        }
      });

      // Create sample posts
      await db.insert(posts).values({
        businessId: business2.id,
        content: "Unwind and rejuvenate at Miami's premier wellness sanctuary. Book your luxury spa experience today! 🧘‍♀️✨ #Wellness #MiamiSpa #Relaxation",
        type: "product",
        likeCount: 34,
        commentCount: 12,
        shareCount: 8,
        isVisible: true,
      }).onConflictDoNothing();
    }

    if (business3) {
      console.log("✅ Created business:", business3.name);

      // Create sample products for Coastal Wedding Planners
      await db.insert(products).values({
        businessId: business3.id,
        name: "Beach Wedding Planning Package",
        description: "Complete beachside wedding coordination including venue, decor, and day-of management",
        price: "2499.00",
        originalPrice: "2899.00",
        category: "Wedding Services",
        images: ["/attached_assets/stock_images/elegant_wedding_deco_caf9a8bc.jpg"],
        inventory: 5,
        isActive: true,
        isDigital: true,
        tags: ["beach-wedding", "planning", "luxury", "coastal"],
        rating: "4.9",
        reviewCount: 23,
      }).onConflictDoUpdate({
        target: products.id,
        set: { 
          images: ["/attached_assets/stock_images/elegant_wedding_deco_caf9a8bc.jpg"],
          updatedAt: new Date() 
        }
      });

      // Create sample posts
      await db.insert(posts).values({
        businessId: business3.id,
        content: "Creating magical moments by the sea 🌊💍 This weekend's beach wedding was absolutely stunning! #BeachWedding #WeddingPlanning #CoastalCelebration",
        type: "product",
        likeCount: 28,
        commentCount: 9,
        shareCount: 15,
        isVisible: true,
      }).onConflictDoNothing();
    }

    if (business4) {
      console.log("✅ Created business:", business4.name);

      // Create sample products for Elite Food Tours
      await db.insert(products).values({
        businessId: business4.id,
        name: "VIP Culinary Experience Tour",
        description: "Exclusive 4-hour guided tour featuring Miami's finest restaurants and hidden culinary gems",
        price: "189.00",
        category: "Food & Beverage",
        images: ["/attached_assets/stock_images/luxury_travel_experi_f2b67257.jpg"],
        inventory: 15,
        isActive: true,
        isDigital: true,
        tags: ["food-tour", "vip", "culinary", "exclusive"],
        rating: "4.8",
        reviewCount: 42,
      }).onConflictDoUpdate({
        target: products.id,
        set: { 
          images: ["/attached_assets/stock_images/luxury_travel_experi_f2b67257.jpg"],
          updatedAt: new Date() 
        }
      });

      // Create sample posts
      await db.insert(posts).values({
        businessId: business4.id,
        content: "Discovering Miami's culinary treasures one bite at a time! Join our VIP food tour for an unforgettable gastronomic journey 🍴✨ #FoodTour #MiamiEats #CulinaryExperience",
        type: "product",
        likeCount: 31,
        commentCount: 7,
        shareCount: 12,
        isVisible: true,
      }).onConflictDoNothing();
    }

    if (business5) {
      console.log("✅ Created business:", business5.name);

      // Create sample products for Everglades Wildlife Photography
      await db.insert(products).values({
        businessId: business5.id,
        name: "Professional Photography Session",
        description: "Custom photography session capturing Florida's unique wildlife and natural beauty",
        price: "450.00",
        originalPrice: "500.00",
        category: "Photography",
        images: ["/attached_assets/stock_images/premium_photography__509b059a.jpg"],
        inventory: 10,
        isActive: true,
        isDigital: true,
        tags: ["photography", "wildlife", "professional", "nature"],
        rating: "4.9",
        reviewCount: 28,
      }).onConflictDoUpdate({
        target: products.id,
        set: { 
          images: ["/attached_assets/stock_images/premium_photography__509b059a.jpg"],
          updatedAt: new Date() 
        }
      });

      // Create sample posts
      await db.insert(posts).values({
        businessId: business5.id,
        content: "Captured this magnificent great blue heron at sunrise in the Everglades. Nature's beauty never ceases to amaze! 📸🦢 #WildlifePhotography #Everglades #NatureLovers",
        type: "update",
        likeCount: 45,
        commentCount: 13,
        shareCount: 20,
        isVisible: true,
      }).onConflictDoNothing();
    }

    if (business6) {
      console.log("✅ Created business:", business6.name);

      // Create sample products for Sunset Yoga Studio
      await db.insert(products).values({
        businessId: business6.id,
        name: "Sunset Yoga Class Package",
        description: "10-session package for our popular sunset yoga classes with Miami Bay views",
        price: "179.00",
        originalPrice: "220.00",
        category: "Health & Beauty",
        images: ["/attached_assets/stock_images/yoga_meditation_well_a72e6325.jpg"],
        inventory: 25,
        isActive: true,
        isDigital: false,
        tags: ["yoga", "sunset", "wellness", "meditation"],
        rating: "4.8",
        reviewCount: 56,
      }).onConflictDoUpdate({
        target: products.id,
        set: { 
          images: ["/attached_assets/stock_images/yoga_meditation_well_a72e6325.jpg"],
          updatedAt: new Date() 
        }
      });

      // Create sample posts
      await db.insert(posts).values({
        businessId: business6.id,
        content: "Tonight's sunset yoga session was absolutely magical 🧘‍♀️🌅 Join us tomorrow for another peaceful evening by the bay! #SunsetYoga #Mindfulness #MiamiYoga",
        type: "update",
        likeCount: 52,
        commentCount: 18,
        shareCount: 11,
        isVisible: true,
      }).onConflictDoNothing();
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📋 Sample Data Created:");
    console.log("👥 Users: demo@example.com (regular), admin@example.com (admin)");
    console.log("🏪 Businesses: Florida Sunshine Cafe, Miami Beach Wellness Center, Coastal Wedding Planners,");
    console.log("              Elite Food Tours, Everglades Wildlife Photography, Sunset Yoga Studio");
    console.log("🛍️ Products: Gourmet Cuban Sandwich, Luxury Spa Treatment Package, Beach Wedding Planning Package,");
    console.log("            VIP Culinary Experience Tour, Professional Photography Session, Sunset Yoga Class Package");
    console.log("📸 Professional Images: All businesses now have professional cover images and product images");
    console.log("📱 Posts: Sample social media posts for all businesses");
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
