import client from "./models/db.ts";

const sqlScript = await Deno.readTextFile("./schema.sql"); 

try {
  await client.queryArray(sqlScript);
  console.log("Database initialized.");
} catch (error) {
  console.error("Error initializing database:", error);
} finally {
  await client.end();
}
