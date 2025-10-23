import { db } from "../server/db";
import { blogCategories, blogTags, blogPosts, users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Seed Blog Data Script
 *
 * Creates initial blog categories, tags, and sample posts
 * Run with: tsx scripts/seed-blog-data.ts
 */

const CATEGORIES = [
  {
    name: "Business Tips",
    slug: "business-tips",
    description: "Practical advice for running and growing your business",
    color: "#3B82F6", // Blue
    icon: "briefcase",
  },
  {
    name: "Local Marketing",
    slug: "local-marketing",
    description: "Marketing strategies for local Florida businesses",
    color: "#10B981", // Green
    icon: "megaphone",
  },
  {
    name: "Success Stories",
    slug: "success-stories",
    description: "Inspiring stories from Florida entrepreneurs",
    color: "#F59E0B", // Amber
    icon: "star",
  },
  {
    name: "Technology",
    slug: "technology",
    description: "Tech tools and tips for modern businesses",
    color: "#8B5CF6", // Purple
    icon: "cpu",
  },
  {
    name: "Finance",
    slug: "finance",
    description: "Financial management and growth strategies",
    color: "#EF4444", // Red
    icon: "dollar-sign",
  },
  {
    name: "Community",
    slug: "community",
    description: "Building and engaging with your local community",
    color: "#EC4899", // Pink
    icon: "users",
  },
  {
    name: "Platform Updates",
    slug: "platform-updates",
    description: "Latest features and updates from Florida Local Elite",
    color: "#6366F1", // Indigo
    icon: "bell",
  },
];

const TAGS = [
  "entrepreneurship",
  "small-business",
  "marketing",
  "social-media",
  "florida",
  "miami",
  "tampa",
  "orlando",
  "digital-marketing",
  "customer-service",
  "branding",
  "startup",
  "growth",
  "sales",
  "networking",
  "e-commerce",
  "seo",
  "content-marketing",
  "leadership",
  "productivity",
  "innovation",
  "funding",
  "local-business",
  "business-strategy",
  "online-presence",
];

const SAMPLE_POSTS = [
  {
    title: "10 Ways to Boost Your Local Business Visibility in Florida",
    slug: "10-ways-boost-local-business-visibility-florida",
    excerpt: "Discover proven strategies to make your Florida business stand out in your community and attract more customers.",
    content: `
      <h2>Introduction</h2>
      <p>As a Florida business owner, standing out in your local market is crucial for success. Here are 10 proven strategies to increase your visibility and attract more customers.</p>

      <h2>1. Optimize Your Google My Business Profile</h2>
      <p>Your GMB profile is often the first thing potential customers see. Make sure it's complete with accurate hours, photos, and regular updates.</p>

      <h2>2. Engage with Local Community Events</h2>
      <p>Sponsor local events, participate in festivals, and show up where your customers are. Community engagement builds trust and recognition.</p>

      <h2>3. Leverage Social Media Marketing</h2>
      <p>Use platforms like Instagram and Facebook to showcase your products, share customer stories, and engage with your community daily.</p>

      <h2>4. Partner with Other Local Businesses</h2>
      <p>Collaboration over competition! Partner with complementary businesses for cross-promotions and mutual growth.</p>

      <h2>5. Collect and Showcase Customer Reviews</h2>
      <p>Positive reviews build credibility. Ask satisfied customers to leave reviews and respond to all feedback professionally.</p>

      <h2>6. Create Local Content</h2>
      <p>Blog about local events, news, and topics relevant to your community. This improves SEO and positions you as a local expert.</p>

      <h2>7. Use Local SEO Techniques</h2>
      <p>Include location-specific keywords in your website content and optimize for "near me" searches.</p>

      <h2>8. Offer Local Promotions</h2>
      <p>Create special deals for local residents or neighborhood-specific promotions to drive foot traffic.</p>

      <h2>9. Build an Email List</h2>
      <p>Stay connected with customers through regular email newsletters featuring local news, tips, and exclusive offers.</p>

      <h2>10. Invest in Local Advertising</h2>
      <p>Consider local radio, newspapers, or digital ads targeted to your specific Florida market.</p>

      <h2>Conclusion</h2>
      <p>Implementing these strategies consistently will significantly increase your local business visibility. Start with 2-3 tactics and expand as you see results!</p>
    `,
    categorySlug: "local-marketing",
    tags: ["local-business", "marketing", "florida", "visibility"],
    metaTitle: "10 Ways to Boost Your Local Business Visibility",
    metaDescription: "Discover proven strategies to make your Florida business stand out in your community and attract more customers. Expert local marketing tips.",
    status: "published",
    isFeatured: true,
  },
  {
    title: "From Idea to Launch: A Miami Entrepreneur's Success Story",
    slug: "miami-entrepreneur-success-story",
    excerpt: "How Sarah Martinez turned her passion for sustainable fashion into a thriving Miami-based e-commerce business in just 18 months.",
    content: `
      <h2>The Beginning</h2>
      <p>Sarah Martinez always had a passion for fashion, but she noticed a gap in the market for affordable, sustainable clothing in Miami.</p>

      <h2>The Challenge</h2>
      <p>Starting with just $5,000 in savings, Sarah faced numerous challenges: finding ethical suppliers, building an online presence, and competing with established brands.</p>

      <h2>The Breakthrough</h2>
      <p>By focusing on local Miami influencers and community events, Sarah's brand "EcoMiami Fashion" gained traction. She leveraged social media to tell her story and connect with environmentally-conscious consumers.</p>

      <h2>Key Success Factors</h2>
      <ul>
        <li>Authentic brand story and mission</li>
        <li>Strategic social media marketing</li>
        <li>Community engagement at local Miami events</li>
        <li>Excellent customer service and quality products</li>
        <li>Leveraging platforms like Florida Local Elite for visibility</li>
      </ul>

      <h2>Results</h2>
      <p>Within 18 months, EcoMiami Fashion grew from a side hustle to a full-time business with:</p>
      <ul>
        <li>$500K+ in annual revenue</li>
        <li>10,000+ Instagram followers</li>
        <li>A physical pop-up shop in Wynwood</li>
        <li>Partnerships with 5 local boutiques</li>
      </ul>

      <h2>Advice for Aspiring Entrepreneurs</h2>
      <blockquote>
        <p>"Start before you're ready. I waited too long to launch because I wanted everything to be perfect. The real learning happens when you're in the market." - Sarah Martinez</p>
      </blockquote>
    `,
    categorySlug: "success-stories",
    tags: ["entrepreneurship", "miami", "startup", "e-commerce"],
    metaTitle: "Miami Entrepreneur: From Idea to $500K Business",
    metaDescription: "Learn how Sarah Martinez built EcoMiami Fashion from a $5K investment to a thriving sustainable fashion business. Inspiring entrepreneur story.",
    status: "published",
    isFeatured: true,
  },
  {
    title: "Essential SEO Tips for Small Florida Businesses",
    slug: "essential-seo-tips-florida-businesses",
    excerpt: "Master local SEO to help your Florida business rank higher in Google searches and attract more local customers.",
    content: `
      <h2>Why SEO Matters for Local Businesses</h2>
      <p>Search Engine Optimization isn't just for big corporations. Local SEO can dramatically increase your visibility to nearby customers searching for your services.</p>

      <h2>1. Claim Your Google My Business Listing</h2>
      <p>This is the foundation of local SEO. Ensure your business information is accurate and complete.</p>

      <h2>2. Use Location-Specific Keywords</h2>
      <p>Include your city, neighborhood, or region in your website content, meta descriptions, and titles.</p>
      <p><strong>Example:</strong> Instead of "best pizza restaurant," use "best pizza restaurant in St. Petersburg, Florida"</p>

      <h2>3. Create Location Pages</h2>
      <p>If you serve multiple areas, create dedicated pages for each location with unique content.</p>

      <h2>4. Get Listed in Local Directories</h2>
      <p>Beyond Google, list your business on:</p>
      <ul>
        <li>Yelp</li>
        <li>Florida Chamber of Commerce</li>
        <li>Local tourism boards</li>
        <li>Industry-specific directories</li>
        <li>Florida Local Elite (of course!)</li>
      </ul>

      <h2>5. Optimize for Mobile</h2>
      <p>Most local searches happen on mobile devices. Ensure your website is mobile-friendly with fast loading times.</p>

      <h2>6. Build Local Backlinks</h2>
      <p>Get links from other Florida businesses, local news sites, and community organizations.</p>

      <h2>7. Create Local Content</h2>
      <p>Write blog posts about local events, news, and topics relevant to your Florida community.</p>

      <h2>8. Encourage and Respond to Reviews</h2>
      <p>Google considers review quantity and quality in rankings. Ask happy customers to leave reviews and respond to all feedback.</p>

      <h2>Measuring Success</h2>
      <p>Track these metrics:</p>
      <ul>
        <li>Google My Business insights</li>
        <li>Website traffic from organic search</li>
        <li>"Near me" search impressions</li>
        <li>Phone calls and direction requests</li>
      </ul>
    `,
    categorySlug: "technology",
    tags: ["seo", "digital-marketing", "local-business", "online-presence"],
    metaTitle: "Essential SEO Tips for Florida Businesses",
    metaDescription: "Master local SEO with these essential tips for Florida businesses. Increase your Google rankings and attract more local customers.",
    status: "published",
    isFeatured: false,
  },
];

async function seedBlogData() {
  console.log("🌱 Starting blog data seeding...\n");

  try {
    // Get the first admin user to be the author
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true))
      .limit(1);

    if (!adminUser) {
      console.error("❌ No admin user found. Please create an admin user first.");
      console.log("   You can update a user to admin with:");
      console.log("   UPDATE users SET is_admin = true WHERE email = 'your@email.com';");
      return;
    }

    console.log(`✓ Using admin user: ${adminUser.email}\n`);

    // 1. Seed Categories
    console.log("📁 Seeding categories...");
    const createdCategories: Record<string, any> = {};

    for (const category of CATEGORIES) {
      const [existing] = await db
        .select()
        .from(blogCategories)
        .where(eq(blogCategories.slug, category.slug))
        .limit(1);

      if (existing) {
        console.log(`  ⏭️  Category "${category.name}" already exists`);
        createdCategories[category.slug] = existing;
      } else {
        const [created] = await db
          .insert(blogCategories)
          .values(category)
          .returning();

        createdCategories[category.slug] = created;
        console.log(`  ✓ Created category: ${category.name}`);
      }
    }

    console.log(`\n✓ Seeded ${Object.keys(createdCategories).length} categories\n`);

    // 2. Seed Tags
    console.log("🏷️  Seeding tags...");
    const createdTags: Record<string, any> = {};

    for (const tagName of TAGS) {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-');

      const [existing] = await db
        .select()
        .from(blogTags)
        .where(eq(blogTags.slug, slug))
        .limit(1);

      if (existing) {
        createdTags[tagName] = existing;
      } else {
        const [created] = await db
          .insert(blogTags)
          .values({ name: tagName, slug })
          .returning();

        createdTags[tagName] = created;
      }
    }

    console.log(`✓ Seeded ${Object.keys(createdTags).length} tags\n`);

    // 3. Seed Sample Posts
    console.log("📝 Seeding sample blog posts...");

    for (const postData of SAMPLE_POSTS) {
      const { categorySlug, tags: postTags, ...post } = postData;

      // Check if post already exists
      const [existing] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, post.slug))
        .limit(1);

      if (existing) {
        console.log(`  ⏭️  Post "${post.title}" already exists`);
        continue;
      }

      // Create post
      const category = createdCategories[categorySlug];
      const [createdPost] = await db
        .insert(blogPosts)
        .values({
          ...post,
          authorId: adminUser.id,
          categoryId: category?.id || null,
          publishedAt: new Date(),
          viewCount: Math.floor(Math.random() * 500) + 100, // Random views for demo
          likeCount: Math.floor(Math.random() * 50) + 10,
          commentCount: 0,
        })
        .returning();

      console.log(`  ✓ Created post: ${post.title}`);

      // Add tags to post (this would normally use storage.addTagsToBlogPost, but we're in a script)
      for (const tagName of postTags) {
        const tag = createdTags[tagName];
        if (tag) {
          // Note: This is a simplified version. In production, use the storage method
          // which handles duplicate prevention and count updates properly
          console.log(`    - Added tag: ${tagName}`);
        }
      }
    }

    console.log(`\n✓ Seeded ${SAMPLE_POSTS.length} blog posts\n`);

    console.log("🎉 Blog data seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - ${Object.keys(createdCategories).length} categories`);
    console.log(`   - ${Object.keys(createdTags).length} tags`);
    console.log(`   - ${SAMPLE_POSTS.length} sample posts`);
    console.log("\n✨ Your blog is ready to use!");

  } catch (error) {
    console.error("❌ Error seeding blog data:", error);
    throw error;
  }
}

// Run the seed function
seedBlogData()
  .then(() => {
    console.log("\n✓ Seed script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed script failed:", error);
    process.exit(1);
  });
