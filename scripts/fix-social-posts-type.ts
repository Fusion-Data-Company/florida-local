import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fixSocialPostsBusinessIdType() {
  console.log("Fixing social_posts.business_id type from text to uuid...");

  try {
    // Drop the foreign key constraint first
    await db.execute(sql`
      ALTER TABLE social_posts
      DROP CONSTRAINT IF EXISTS social_posts_business_id_businesses_id_fk
    `);
    console.log("✓ Dropped old foreign key constraint");

    // Convert the column type
    await db.execute(sql`
      ALTER TABLE social_posts
      ALTER COLUMN business_id TYPE uuid USING business_id::uuid
    `);
    console.log("✓ Converted business_id from text to uuid");

    // Re-add the foreign key constraint
    await db.execute(sql`
      ALTER TABLE social_posts
      ADD CONSTRAINT social_posts_business_id_businesses_id_fk
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    `);
    console.log("✓ Re-added foreign key constraint");

    console.log("\n✅ Successfully fixed social_posts.business_id type!");
  } catch (error) {
    console.error("❌ Error fixing type:", error);
    throw error;
  }
}

fixSocialPostsBusinessIdType()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
