import { Client } from "../deps.ts";
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const client = new Client({
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("DB_NAME"),
  hostname: Deno.env.get("DB_HOST"),
  port: parseInt(Deno.env.get("DB_PORT")!),
});

try {
  await client.connect();
} catch (error) {
  console.log('Connection failed!', error);
  Deno.exit(1)
}

export default client;
