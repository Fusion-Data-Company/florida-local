import { db } from "../server/db";
import { users, entrepreneurs, businesses } from "../shared/schema";
import { eq } from "drizzle-orm";

async function linkRobProfile() {
  console.log("🔗 Linking Rob's Replit profile to entrepreneur and business data...");

  try {
    // Find the Replit user with rob@fusiondataco.com email
    const [replitUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "rob@fusiondataco.com"))
      .limit(1);

    if (!replitUser) {
      console.error("❌ Rob's user account not found");
      return;
    }

    console.log(`✅ Found Rob's Replit user: ${replitUser.id} (${replitUser.email})`);

    // Update entrepreneur profile to use Replit user ID
    await db
      .update(entrepreneurs)
      .set({ userId: replitUser.id })
      .where(eq(entrepreneurs.userId, "admin-rob-fusion"));

    console.log(`✅ Updated entrepreneur profile to user ID: ${replitUser.id}`);

    // Update businesses to use Replit user ID
    await db
      .update(businesses)
      .set({ ownerId: replitUser.id })
      .where(eq(businesses.ownerId, "admin-rob-fusion"));

    console.log(`✅ Updated Fusion Data Co business to owner ID: ${replitUser.id}`);

    // Delete the old admin user if it exists
    await db.delete(users).where(eq(users.id, "admin-rob-fusion"));
    console.log(`✅ Removed old admin user record`);

    console.log("\n🎉 Successfully linked Rob's profile!");
    console.log(`✅ User ID: ${replitUser.id}`);
    console.log(`✅ Email: ${replitUser.email}`);
    console.log(`✅ Name: ${replitUser.firstName} ${replitUser.lastName}`);
    console.log(`✅ Admin: ${replitUser.isAdmin}`);

  } catch (error) {
    console.error("❌ Error linking profile:", error);
  }

  process.exit(0);
}

linkRobProfile();
