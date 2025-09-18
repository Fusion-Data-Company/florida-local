import { db } from "../server/db";
import { users, businesses, products, posts } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🏖️ Creating ELITE DEMO with Miami luxury businesses...");

  try {
    // Create ELITE ENTREPRENEURS with professional profiles
    const [alexRivera] = await db.insert(users).values({
      id: "elite-alex-rivera",
      email: "alex.rivera@sunsetbeachsurf.com",
      firstName: "Alex",
      lastName: "Rivera",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    const [sofiaMartinez] = await db.insert(users).values({
      id: "elite-sofia-martinez",
      email: "sofia.martinez@azurewellness.com",
      firstName: "Sofia",
      lastName: "Martinez",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    const [marcusThompson] = await db.insert(users).values({
      id: "elite-marcus-thompson",
      email: "marcus.thompson@oceangrill.com",
      firstName: "Marcus",
      lastName: "Thompson",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    const [isabellaChen] = await db.insert(users).values({
      id: "elite-isabella-chen",
      email: "isabella.chen@elitephotography.com",
      firstName: "Isabella",
      lastName: "Chen",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    const [davidJones] = await db.insert(users).values({
      id: "elite-david-jones",
      email: "david.jones@sunsetyoga.com",
      firstName: "David",
      lastName: "Jones",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    // Create admin user
    const [adminUser] = await db.insert(users).values({
      id: "admin-user-1",
      email: "admin@floridalocalelite.com",
      firstName: "Admin",
      lastName: "User",
      isAdmin: true,
    }).onConflictDoUpdate({
      target: users.id,
      set: { isAdmin: true, updatedAt: new Date() }
    }).returning();

    console.log("✅ Created elite entrepreneurs and admin");

    // 1. SUNSET BEACH SURF SHOP - FLAGSHIP ELITE BUSINESS
    const [sunsetSurfShop] = await db.insert(businesses).values({
      ownerId: alexRivera.id,
      name: "Sunset Beach Surf Shop",
      tagline: "Ride the waves, live the dream - Premium surf gear & experiences",
      description: "South Florida's premier surf destination since 2015. We offer top-tier surfboards, premium beachwear, surf lessons with certified instructors, and unforgettable surf experiences. From beginner-friendly lessons to advanced coaching, we help you master the waves while embracing the authentic surf lifestyle.",
      category: "Sports & Recreation",
      location: "Miami Beach, FL",
      address: "456 Ocean Drive, Miami Beach, FL 33139",
      phone: "(305) 555-SURF",
      website: "https://sunsetbeachsurf.com",
      logoUrl: "/attached_assets/stock_images/luxury_travel_experi_f2b67257.jpg",
      coverImageUrl: "/attached_assets/stock_images/luxury_travel_experi_f2b67257.jpg",
      operatingHours: {
        monday: { open: "7:00", close: "19:00" },
        tuesday: { open: "7:00", close: "19:00" },
        wednesday: { open: "7:00", close: "19:00" },
        thursday: { open: "7:00", close: "19:00" },
        friday: { open: "7:00", close: "20:00" },
        saturday: { open: "6:00", close: "20:00" },
        sunday: { open: "6:00", close: "19:00" }
      },
      socialLinks: {
        instagram: "https://instagram.com/sunsetbeachsurf",
        facebook: "https://facebook.com/sunsetbeachsurfshop",
        tiktok: "https://tiktok.com/@sunsetbeachsurf"
      },
      isVerified: true,
      isActive: true,
      rating: "4.9",
      reviewCount: 347,
      followerCount: 2840,
      postCount: 156,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      logoUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        updatedAt: new Date() 
      }
    }).returning();

    // 2. AZURE WELLNESS SPA - LUXURY WELLNESS
    const [azureWellnessSpa] = await db.insert(businesses).values({
      ownerId: sofiaMartinez.id,
      name: "Azure Wellness Spa",
      tagline: "Luxury wellness experiences that rejuvenate your mind, body & soul",
      description: "Miami's most exclusive wellness sanctuary offering world-class spa treatments, holistic therapies, and transformative wellness experiences. Our certified therapists use only premium organic products and cutting-edge wellness technologies to deliver unparalleled relaxation and rejuvenation.",
      category: "Health & Beauty",
      location: "Coral Gables, FL",
      address: "789 Miracle Mile, Coral Gables, FL 33134",
      phone: "(305) 555-AZURE",
      website: "https://azurewellnessspa.com",
      logoUrl: "/attached_assets/stock_images/luxury_spa_wellness__78221b18.jpg",
      coverImageUrl: "/attached_assets/stock_images/luxury_spa_wellness__78221b18.jpg",
      operatingHours: {
        monday: { open: "9:00", close: "20:00" },
        tuesday: { open: "9:00", close: "20:00" },
        wednesday: { open: "9:00", close: "20:00" },
        thursday: { open: "9:00", close: "21:00" },
        friday: { open: "9:00", close: "21:00" },
        saturday: { open: "8:00", close: "21:00" },
        sunday: { open: "9:00", close: "19:00" }
      },
      socialLinks: {
        instagram: "https://instagram.com/azurewellnessspa",
        facebook: "https://facebook.com/azurewellnessspa"
      },
      isVerified: true,
      isActive: true,
      rating: "4.8",
      reviewCount: 298,
      followerCount: 1650,
      postCount: 89,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
      coverImageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      logoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        updatedAt: new Date() 
      }
    }).returning();

    // 3. OCEAN GRILL RESTAURANT - FINE DINING EXCELLENCE
    const [oceanGrillRestaurant] = await db.insert(businesses).values({
      ownerId: marcusThompson.id,
      name: "Ocean Grill Restaurant",
      tagline: "Exquisite oceanfront dining with world-class cuisine",
      description: "Award-winning fine dining restaurant featuring fresh seafood, prime steaks, and innovative culinary creations. Our oceanfront location offers breathtaking views while our James Beard-trained chefs craft unforgettable dining experiences using the finest local and imported ingredients.",
      category: "Food & Beverage",
      location: "Key Biscayne, FL",
      address: "321 Ocean Boulevard, Key Biscayne, FL 33149",
      phone: "(305) 555-OCEAN",
      website: "https://oceangrillrestaurant.com",
      logoUrl: "/attached_assets/stock_images/elegant_restaurant_f_aa323e17.jpg",
      coverImageUrl: "/attached_assets/stock_images/elegant_restaurant_f_aa323e17.jpg",
      operatingHours: {
        monday: { closed: true },
        tuesday: { open: "17:00", close: "22:00" },
        wednesday: { open: "17:00", close: "22:00" },
        thursday: { open: "17:00", close: "22:30" },
        friday: { open: "17:00", close: "23:00" },
        saturday: { open: "17:00", close: "23:00" },
        sunday: { open: "17:00", close: "21:30" }
      },
      socialLinks: {
        instagram: "https://instagram.com/oceangrillrestaurant",
        facebook: "https://facebook.com/oceangrillrestaurant"
      },
      isVerified: true,
      isActive: true,
      rating: "4.7",
      reviewCount: 456,
      followerCount: 3200,
      postCount: 234,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
      coverImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      logoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        updatedAt: new Date() 
      }
    }).returning();

    // 4. ELITE PHOTOGRAPHY STUDIO - PROFESSIONAL PHOTOGRAPHY
    const [elitePhotographyStudio] = await db.insert(businesses).values({
      ownerId: isabellaChen.id,
      name: "Elite Photography Studio",
      tagline: "Capturing life's most precious moments with artistic excellence",
      description: "Premier photography studio specializing in luxury weddings, corporate headshots, fashion photography, and exclusive events. Our award-winning photographers combine technical expertise with artistic vision to create timeless images that tell your unique story.",
      category: "Professional Services",
      location: "South Beach, FL",
      address: "567 Lincoln Road, Miami Beach, FL 33139",
      phone: "(305) 555-ELITE",
      website: "https://elitephotographystudio.com",
      logoUrl: "/attached_assets/stock_images/professional_photogr_7ec7b11b.jpg",
      coverImageUrl: "/attached_assets/stock_images/professional_photogr_7ec7b11b.jpg",
      operatingHours: {
        monday: { open: "9:00", close: "18:00" },
        tuesday: { open: "9:00", close: "18:00" },
        wednesday: { open: "9:00", close: "18:00" },
        thursday: { open: "9:00", close: "19:00" },
        friday: { open: "9:00", close: "19:00" },
        saturday: { open: "8:00", close: "20:00" },
        sunday: { open: "10:00", close: "16:00" }
      },
      socialLinks: {
        instagram: "https://instagram.com/elitephotographystudio",
        facebook: "https://facebook.com/elitephotographystudio",
        pinterest: "https://pinterest.com/elitephotographystudio"
      },
      isVerified: true,
      isActive: true,
      rating: "4.9",
      reviewCount: 189,
      followerCount: 4500,
      postCount: 312,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
        coverImageUrl: "/attached_assets/stock_images/professional_photogr_7ec7b11b.jpg",
        logoUrl: "/attached_assets/stock_images/professional_photogr_7ec7b11b.jpg",
        updatedAt: new Date() 
      }
    }).returning();

    // 5. SUNSET YOGA SANCTUARY - WELLNESS & MINDFULNESS
    const [sunsetYogaSanctuary] = await db.insert(businesses).values({
      ownerId: davidJones.id,
      name: "Sunset Yoga Sanctuary",
      tagline: "Find your inner peace with breathtaking ocean views",
      description: "Transformative yoga experiences in Miami's most serene beachfront location. Our certified instructors guide you through various yoga styles from gentle Hatha to dynamic Vinyasa, all while enjoying stunning sunset views over Biscayne Bay. Perfect for beginners and advanced practitioners alike.",
      category: "Health & Wellness",
      location: "Coconut Grove, FL",
      address: "890 Bayshore Drive, Coconut Grove, FL 33133",
      phone: "(305) 555-YOGA",
      website: "https://sunsetyogasanctuary.com",
      logoUrl: "/attached_assets/stock_images/sunset_yoga_studio_p_c38ab4c1.jpg",
      coverImageUrl: "/attached_assets/stock_images/sunset_yoga_studio_p_c38ab4c1.jpg",
      operatingHours: {
        monday: { open: "6:00", close: "20:00" },
        tuesday: { open: "6:00", close: "20:00" },
        wednesday: { open: "6:00", close: "20:00" },
        thursday: { open: "6:00", close: "20:00" },
        friday: { open: "6:00", close: "19:00" },
        saturday: { open: "7:00", close: "18:00" },
        sunday: { open: "7:00", close: "18:00" }
      },
      socialLinks: {
        instagram: "https://instagram.com/sunsetyogasanctuary",
        facebook: "https://facebook.com/sunsetyogasanctuary",
        youtube: "https://youtube.com/sunsetyogasanctuary"
      },
      isVerified: true,
      isActive: true,
      rating: "4.8",
      reviewCount: 267,
      followerCount: 1890,
      postCount: 145,
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { 
        coverImageUrl: "/attached_assets/stock_images/sunset_yoga_studio_p_c38ab4c1.jpg",
        logoUrl: "/attached_assets/stock_images/sunset_yoga_studio_p_c38ab4c1.jpg",
        updatedAt: new Date() 
      }
    }).returning();

    const [legacyYogaStudio] = await db.insert(businesses).values({
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

    console.log("✅ Created all elite businesses");

    // PREMIUM PRODUCTS FOR SUNSET BEACH SURF SHOP
    if (sunsetSurfShop) {
      console.log("🏄‍♂️ Adding premium products for Sunset Beach Surf Shop...");

      await db.insert(products).values([
        {
          businessId: sunsetSurfShop.id,
          name: "Pro Elite Surfboard - 9'2\" Longboard",
          description: "Handcrafted premium longboard perfect for Florida's gentle waves. Made with sustainable bamboo core and fiberglass finish. Includes custom grip pad and travel bag.",
          price: "899.99",
          originalPrice: "1199.99",
          category: "Sports Equipment",
          images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          inventory: 15,
          isActive: true,
          isDigital: false,
          tags: ["premium", "handcrafted", "eco-friendly", "longboard"],
          rating: "4.9",
          reviewCount: 23,
        },
        {
          businessId: sunsetSurfShop.id,
          name: "Ocean Breeze Wetsuit - Premium 3/2mm",
          description: "Ultra-flexible neoprene wetsuit designed for Florida waters. Features reinforced knees, back zip, and thermal lining for comfort during longer sessions.",
          price: "249.99",
          originalPrice: "299.99",
          category: "Surf Gear",
          images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          inventory: 30,
          isActive: true,
          isDigital: false,
          tags: ["wetsuit", "premium", "thermal", "flexible"],
          rating: "4.7",
          reviewCount: 45,
        },
        {
          businessId: sunsetSurfShop.id,
          name: "Private Surf Lesson - VIP Experience",
          description: "One-on-one surf instruction with our certified professional instructors. Includes board rental, wetsuit, and underwater photography of your session.",
          price: "150.00",
          category: "Services",
          images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          inventory: 100,
          isActive: true,
          isDigital: true,
          tags: ["lesson", "private", "professional", "photography"],
          rating: "5.0",
          reviewCount: 67,
        },
        {
          businessId: sunsetSurfShop.id,
          name: "Sunset Beach Lifestyle Tee",
          description: "Premium organic cotton t-shirt with our signature sunset logo. Soft, comfortable, and perfect for beach days or casual wear.",
          price: "34.99",
          originalPrice: "44.99",
          category: "Apparel",
          images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          inventory: 75,
          isActive: true,
          isDigital: false,
          tags: ["organic", "cotton", "lifestyle", "comfortable"],
          rating: "4.6",
          reviewCount: 89,
        }
      ]).onConflictDoNothing();

      // Elite social posts for Surf Shop
      await db.insert(posts).values([
        {
          businessId: sunsetSurfShop.id,
          content: "🏄‍♂️ Perfect waves this morning! Our Pro Elite 9'2\" longboards are flying off the racks. Book your private lesson today and ride the waves like a pro! #SurfLife #MiamiBeach #PerfectWaves",
          type: "update",
          images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          likeCount: 156,
          commentCount: 23,
          shareCount: 12,
          isVisible: true,
        },
        {
          businessId: sunsetSurfShop.id,
          content: "🌅 Nothing beats a sunrise surf session! Our team is out there every morning at 6 AM. Join us for the ultimate Miami Beach experience. Early bird lessons available! #SunriseSurf #EarlyBird",
          type: "achievement",
          likeCount: 89,
          commentCount: 15,
          shareCount: 8,
          isVisible: true,
        }
      ]).onConflictDoNothing();
    }

    // LUXURY SPA PRODUCTS FOR AZURE WELLNESS SPA
    if (azureWellnessSpa) {
      console.log("✨ Adding luxury spa products for Azure Wellness Spa...");

      // Create luxury spa products
      await db.insert(products).values({
        businessId: azureWellnessSpa.id,
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
        businessId: azureWellnessSpa.id,
        content: "Unwind and rejuvenate at Miami's premier wellness sanctuary. Book your luxury spa experience today! 🧘‍♀️✨ #Wellness #MiamiSpa #Relaxation",
        type: "product",
        likeCount: 34,
        commentCount: 12,
        shareCount: 8,
        isVisible: true,
      }).onConflictDoNothing();
    }

    if (oceanGrillRestaurant) {
      console.log("✅ Created business:", oceanGrillRestaurant.name);

      // Create sample products for Coastal Wedding Planners
      await db.insert(products).values({
        businessId: oceanGrillRestaurant.id,
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
        businessId: oceanGrillRestaurant.id,
        content: "Creating magical moments by the sea 🌊💍 This weekend's beach wedding was absolutely stunning! #BeachWedding #WeddingPlanning #CoastalCelebration",
        type: "product",
        likeCount: 28,
        commentCount: 9,
        shareCount: 15,
        isVisible: true,
      }).onConflictDoNothing();
    }

    if (elitePhotographyStudio) {
      console.log("✅ Created business:", elitePhotographyStudio.name);

      // Create sample products for Elite Food Tours
      await db.insert(products).values({
        businessId: elitePhotographyStudio.id,
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
          images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          updatedAt: new Date() 
        }
      });

      // Create sample posts
      await db.insert(posts).values({
        businessId: elitePhotographyStudio.id,
        content: "Discovering Miami's culinary treasures one bite at a time! Join our VIP food tour for an unforgettable gastronomic journey 🍴✨ #FoodTour #MiamiEats #CulinaryExperience",
        type: "product",
        likeCount: 31,
        commentCount: 7,
        shareCount: 12,
        isVisible: true,
      }).onConflictDoNothing();
    }

    if (legacyYogaStudio) {
      console.log("✅ Created business:", legacyYogaStudio.name);

      // Create sample products for Everglades Wildlife Photography
      await db.insert(products).values({
        businessId: legacyYogaStudio.id,
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
        businessId: legacyYogaStudio.id,
        content: "Captured this magnificent great blue heron at sunrise in the Everglades. Nature's beauty never ceases to amaze! 📸🦢 #WildlifePhotography #Everglades #NatureLovers",
        type: "update",
        likeCount: 45,
        commentCount: 13,
        shareCount: 20,
        isVisible: true,
      }).onConflictDoNothing();
    }

    if (legacyYogaStudio) {
      console.log("✅ Created business:", legacyYogaStudio.name);

      // Create sample products for Sunset Yoga Studio
      await db.insert(products).values({
        businessId: legacyYogaStudio.id,
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
        businessId: legacyYogaStudio.id,
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
