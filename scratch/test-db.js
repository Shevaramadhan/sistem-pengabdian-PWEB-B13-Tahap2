const db = require('../lib/db');

async function test() {
  try {
    const [tables] = await db.query("SHOW TABLES");
    console.log("Tables in database:", tables);

    for (let tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      const [columns] = await db.query(`DESCRIBE \`${tableName}\``);
      console.log(`\nColumns for table ${tableName}:`);
      console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));
    }

    const [users] = await db.query("SELECT id, username, email FROM users");
    console.log("\nUsers:");
    console.table(users);

    const [lecturers] = await db.query("SELECT id, user_id, nidn FROM lecturers");
    console.log("\nLecturers:");
    console.table(lecturers);

    const [invitations] = await db.query("SELECT * FROM community_service_members");
    console.log("\nCommunity Service Members:");
    console.table(invitations);

    const [services] = await db.query("SELECT id, title, created_by FROM community_services");
    console.log("\nCommunity Services:");
    console.table(services);

    process.exit(0);
  } catch (err) {
    console.error("Database connection or query error:", err);
    process.exit(1);
  }
}

test();
