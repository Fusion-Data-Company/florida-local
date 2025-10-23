import { db } from "../server/db";
import { users, entrepreneurs, businesses } from "../shared/schema";
import { eq } from "drizzle-orm";

async function linkJasonProfile() {
  console.log("🔗 Linking Jason's Replit profile to entrepreneur and business data...");

  try {
    // Find the Replit user with theinsuranceschool@gmail.com email
    const [replitUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "theinsuranceschool@gmail.com"))
      .limit(1);

    if (!replitUser) {
      console.error("❌ Jason's user account not found - he needs to log in first");
      return;
    }

    console.log(`✅ Found Jason's Replit user: ${replitUser.id} (${replitUser.email})`);

    // Update entrepreneur profile to use Replit user ID
    await db
      .update(entrepreneurs)
      .set({ userId: replitUser.id })
      .where(eq(entrepreneurs.userId, "elite-jason-perez"));

    console.log(`✅ Updated entrepreneur profile to user ID: ${replitUser.id}`);

    // Update businesses to use Replit user ID
    await db
      .update(businesses)
      .set({ ownerId: replitUser.id })
      .where(eq(businesses.ownerId, "elite-jason-perez"));

    console.log(`✅ Updated Central Florida Insurance School to owner ID: ${replitUser.id}`);

    // Delete the old user if it exists
    await db.delete(users).where(eq(users.id, "elite-jason-perez"));
    console.log(`✅ Removed old user record`);

    console.log("\n🎉 Successfully linked Jason's profile!");
    console.log(`✅ User ID: ${replitUser.id}`);
    console.log(`✅ Email: ${replitUser.email}`);
    console.log(`✅ Name: ${replitUser.firstName} ${replitUser.lastName}`);

  } catch (error) {
    console.error("❌ Error linking profile:", error);
  }

  process.exit(0);
}

linkJasonProfile();
