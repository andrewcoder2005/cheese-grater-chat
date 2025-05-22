import client from "../models/db.ts";
import { bcrypt } from "../deps.ts";
export interface User {
  user_id: number;
  username: string;
  email: string;
  password: string;
  grater_points: number;
}

export async function createUser({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}): Promise<User | null> {
  try {
    const result = await client.queryObject<User>({
      text: `
        INSERT INTO users (username, email, password)
        VALUES ($1, $2, $3)
        RETURNING *;
      `,
      args: [username, email, password],
    });
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Failed to create user:", error);
    return null;
  }
}

export async function checkUserExist(email: string): Promise<User | null> {
  email = email.toLowerCase().trim();
  const result = await client.queryObject<User>({
    text: `
            SELECT * FROM users WHERE email = $1;
            `,
    args: [email],
  });
  return result.rows[0] ?? null;
}
export async function validateUser(email: string, password: string) {
  email = email.toLowerCase().trim();

  const result = await client.queryObject<User>({
    text: `SELECT * FROM users WHERE email = $1;`,
    args: [email],
  });

  const user = result.rows[0];
  if (!user) return null;

  const passwordMatches = await bcrypt.compare(password, user.password);
  return passwordMatches
    ? {
        id: user.user_id,
        username: user.username,
        email: user.email,
        grater_points: user.grater_points,
      }
    : null;
}
export async function gainGraterPoints(userId: number, points: number) {
  try {
    await client.queryObject({
      text: `
            UPDATE users SET grater_points = grater_points + $1 WHERE user_id = $2;
            `,
      args: [points, userId],
    });
  } catch (error) {
    console.error("Failed to gain grater points:", error);
  }
}