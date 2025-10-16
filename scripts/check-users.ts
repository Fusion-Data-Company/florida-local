import { db } from '../server/db';
import { users } from '../shared/schema';

async function checkUsers() {
  const allUsers = await db.select().from(users);
  console.log('📊 Total users in database:', allUsers.length);
  console.log('');

  allUsers.forEach((user, i) => {
    console.log(`User ${i + 1}:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.firstName} ${user.lastName}`);
    console.log(`  Admin: ${user.isAdmin}`);
    console.log(`  Created: ${user.createdAt}`);
    console.log('');
  });

  process.exit(0);
}

checkUsers().catch(console.error);
