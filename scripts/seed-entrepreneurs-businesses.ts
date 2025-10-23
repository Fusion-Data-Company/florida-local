import { db } from "../server/db";
import { users, businesses, entrepreneurs, premiumAdSlots } from "../shared/schema";
import { hashPassword } from "../server/auth";

/**
 * Seed script for Entrepreneurs & Businesses Discovery Page
 * Populates the database with sample entrepreneurs, businesses, and premium ad slots
 */

const sampleEntrepreneurs = [
  {
    name: "Maria Rodriguez",
    email: "maria@floridaelite.com",
    title: "Serial Entrepreneur & Tech Innovator",
    bio: "Building the future of Florida's tech ecosystem, one startup at a time. Passionate about sustainable business practices and community growth.",
    location: "Miami, FL",
    businessesCount: 3,
    followers: 1245,
    revenue: 850000,
    verified: true,
  },
  {
    name: "James Chen",
    email: "james@floridaelite.com",
    title: "Restaurant Group Owner",
    bio: "Bringing authentic flavors to Florida with 5 award-winning restaurants across the state. Food is love, and love should be shared.",
    location: "Orlando, FL",
    businessesCount: 5,
    followers: 2134,
    revenue: 1250000,
    verified: true,
  },
  {
    name: "Sarah Williams",
    email: "sarah@floridaelite.com",
    title: "E-commerce Specialist & Marketing Guru",
    bio: "Helping local businesses thrive online. Expert in digital marketing, SEO, and building brands that connect with customers.",
    location: "Tampa, FL",
    businessesCount: 2,
    followers: 987,
    revenue: 450000,
    verified: true,
  },
  {
    name: "David Thompson",
    email: "david@floridaelite.com",
    title: "Real Estate Developer",
    bio: "Creating communities, not just buildings. Focused on sustainable development and enhancing Florida's urban landscapes.",
    location: "Fort Lauderdale, FL",
    businessesCount: 4,
    followers: 1567,
    revenue: 2100000,
    verified: true,
  },
  {
    name: "Elena Martinez",
    email: "elena@floridaelite.com",
    title: "Health & Wellness Coach",
    bio: "Empowering Floridians to live their healthiest lives through holistic wellness programs and personalized coaching.",
    location: "Jacksonville, FL",
    businessesCount: 2,
    followers: 756,
    revenue: 320000,
    verified: false,
  },
  {
    name: "Michael Johnson",
    email: "michael@floridaelite.com",
    title: "Retail Innovation Leader",
    bio: "Reimagining the retail experience with cutting-edge technology and customer-first approaches. Founder of multiple successful retail ventures.",
    location: "St. Petersburg, FL",
    businessesCount: 3,
    followers: 1834,
    revenue: 950000,
    verified: true,
  },
  {
    name: "Lisa Patel",
    email: "lisa@floridaelite.com",
    title: "Education Technology Founder",
    bio: "Making quality education accessible to all. Building platforms that connect students with opportunities and knowledge.",
    location: "Tallahassee, FL",
    businessesCount: 1,
    followers: 543,
    revenue: 280000,
    verified: false,
  },
  {
    name: "Robert Garcia",
    email: "robert@floridaelite.com",
    title: "Automotive Industry Pioneer",
    bio: "Revolutionizing car buying in Florida with transparent pricing and exceptional customer service across our dealership network.",
    location: "Sarasota, FL",
    businessesCount: 4,
    followers: 1123,
    revenue: 1750000,
    verified: true,
  },
];

const sampleBusinesses = [
  { name: "Sunset Grill Miami", category: "Restaurant", tagline: "Fresh seafood with an ocean view", location: "Miami Beach, FL", rating: 4.8, reviews: 234 },
  { name: "TechFlow Solutions", category: "Technology", tagline: "Custom software for Florida businesses", location: "Miami, FL", rating: 4.9, reviews: 89 },
  { name: "Coastal Coffee Co.", category: "Cafe", tagline: "Artisan coffee roasted locally", location: "Tampa, FL", rating: 4.7, reviews: 456 },
  { name: "Florida Fresh Produce", category: "Grocery", tagline: "Farm-to-table freshness daily", location: "Orlando, FL", rating: 4.6, reviews: 178 },
  { name: "Wellness Center Tampa", category: "Healthcare", tagline: "Holistic health for mind and body", location: "Tampa, FL", rating: 4.9, reviews: 312 },
  { name: "Sunshine Auto Group", category: "Automotive", tagline: "Your trusted car partner", location: "Fort Myers, FL", rating: 4.5, reviews: 567 },
  { name: "Palms Boutique Hotel", category: "Hospitality", tagline: "Luxury meets comfort", location: "Key West, FL", rating: 4.8, reviews: 892 },
  { name: "Elite Fitness Studio", category: "Fitness", tagline: "Transform your life, one workout at a time", location: "Jacksonville, FL", rating: 4.7, reviews: 445 },
  { name: "Beachside Yoga Retreat", category: "Wellness", tagline: "Find your balance by the ocean", location: "Naples, FL", rating: 4.9, reviews: 201 },
  { name: "Orlando Tech Hub", category: "Coworking", tagline: "Where innovation meets community", location: "Orlando, FL", rating: 4.6, reviews: 156 },
  { name: "Gourmet Catering Co.", category: "Catering", tagline: "Making your events unforgettable", location: "Miami, FL", rating: 4.8, reviews: 334 },
  { name: "Florida Law Partners", category: "Legal", tagline: "Protecting your rights, building your future", location: "Tampa, FL", rating: 4.7, reviews: 98 },
  { name: "Creative Design Studio", category: "Design", tagline: "Bringing your brand vision to life", location: "St. Petersburg, FL", rating: 4.9, reviews: 267 },
  { name: "Home Renovation Pros", category: "Construction", tagline: "Building dreams, one home at a time", location: "Fort Lauderdale, FL", rating: 4.6, reviews: 423 },
  { name: "Pet Paradise Resort", category: "Pet Services", tagline: "Where pets vacation in style", location: "Sarasota, FL", rating: 4.8, reviews: 678 },
];

const premiumAdSlotsData = [
  { companyName: "Florida Elite Marketing", tagline: "Grow your business with data-driven marketing", isPremium: true },
  { companyName: "Sunshine Insurance Group", tagline: "Protecting Florida families for 30+ years", isPremium: true },
  { companyName: "Coastal Real Estate Partners", tagline: "Find your dream home in paradise", isPremium: true },
  { companyName: "Your Company Here", tagline: "Reach thousands of local customers", isPremium: false },
  { companyName: "Your Company Here", tagline: "Premium advertising space available", isPremium: false },
  { companyName: "Your Company Here", tagline: "Connect with Florida's top entrepreneurs", isPremium: false },
  { companyName: "Your Company Here", tagline: "Showcase your brand to locals", isPremium: false },
  { companyName: "Your Company Here", tagline: "Premium visibility for your business", isPremium: false },
  { companyName: "Your Company Here", tagline: "Claim this spot today", isPremium: false },
];

async function seed() {
  console.log("🌱 Starting Entrepreneurs & Businesses seed...\n");

  try {
    // 1. Create entrepreneur users
    console.log("📝 Creating entrepreneur users...");
    const entrepreneurUsers = [];

    for (const entrepreneur of sampleEntrepreneurs) {
      const hashedPassword = await hashPassword("password123");

      const [user] = await db
        .insert(users)
        .values({
          username: entrepreneur.email.split("@")[0],
          email: entrepreneur.email,
          password: hashedPassword,
          firstName: entrepreneur.name.split(" ")[0],
          lastName: entrepreneur.name.split(" ").slice(1).join(" "),
          role: "user",
        })
        .onConflictDoNothing()
        .returning();

      if (user) {
        entrepreneurUsers.push({ ...user, ...entrepreneur });
        console.log(`  ✓ Created user: ${entrepreneur.name}`);
      }
    }

    // 2. Create entrepreneur profiles
    console.log("\n👔 Creating entrepreneur profiles...");
    const entrepreneurProfiles = [];

    for (const entData of entrepreneurUsers) {
      const [profile] = await db
        .insert(entrepreneurs)
        .values({
          userId: entData.id,
          displayName: entData.name,
          title: entData.title,
          bio: entData.bio,
          location: entData.location,
          verified: entData.verified,
          stats: {
            businesses: entData.businessesCount,
            followers: entData.followers,
            revenue: entData.revenue,
          },
        })
        .onConflictDoNothing()
        .returning();

      if (profile) {
        entrepreneurProfiles.push(profile);
        console.log(`  ✓ Created profile: ${entData.name}`);
      }
    }

    // 3. Create businesses
    console.log("\n🏢 Creating featured businesses...");

    for (let i = 0; i < sampleBusinesses.length; i++) {
      const biz = sampleBusinesses[i];
      const ownerIndex = i % entrepreneurUsers.length;
      const owner = entrepreneurUsers[ownerIndex];

      const [business] = await db
        .insert(businesses)
        .values({
          name: biz.name,
          ownerId: owner.id,
          category: biz.category,
          tagline: biz.tagline,
          description: `${biz.tagline} - A premier ${biz.category.toLowerCase()} business in ${biz.location}`,
          location: biz.location,
          rating: biz.rating,
          reviewCount: biz.reviews,
          isFeatured: true,
        })
        .onConflictDoNothing()
        .returning();

      if (business) {
        console.log(`  ✓ Created business: ${biz.name} (Owner: ${owner.name})`);
      }
    }

    // 4. Create premium ad slots
    console.log("\n💎 Creating premium advertising slots...");

    for (const slot of premiumAdSlotsData) {
      const [adSlot] = await db
        .insert(premiumAdSlots)
        .values({
          companyName: slot.companyName,
          tagline: slot.tagline,
          isPremium: slot.isPremium,
          imageUrl: slot.isPremium ? `https://api.dicebear.com/7.x/shapes/svg?seed=${slot.companyName}` : "",
        })
        .onConflictDoNothing()
        .returning();

      if (adSlot) {
        const status = slot.isPremium ? "PREMIUM" : "AVAILABLE";
        console.log(`  ✓ Created ad slot: ${slot.companyName} [${status}]`);
      }
    }

    console.log("\n✅ Seed completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   • ${entrepreneurUsers.length} entrepreneurs created`);
    console.log(`   • ${sampleBusinesses.length} businesses created`);
    console.log(`   • ${premiumAdSlotsData.length} ad slots created`);
    console.log(`\n🎉 Database is ready! Visit /entrepreneurs-businesses to see the results.`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
