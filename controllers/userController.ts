import { Context } from "../deps.ts";
import client from "../models/db.ts";

// Helper to get route params in Oak (for Deno v1.40+)
function getParam(ctx: Context, key: string): string | undefined {
  const withParams = ctx as unknown as { params?: Record<string, string> };
  return withParams.params?.[key];
}

// GET /users/:id/favorites - Get all links rated >= 4 by a user
export async function getUserFavorites(ctx: Context) {
  const userId = Number(getParam(ctx, "id"));
  if (isNaN(userId)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid user ID" };
    return;
  }
  try {
    const query = `
      WITH rated_links AS (
        SELECT DISTINCT link_id
        FROM ratings
        WHERE user_id = $1 AND score >= 4
      )
      SELECT
        l.link_id,
        l.title,
        l.description,
        l.url,
        l.created_at,
        u.username,
        COALESCE(AVG(r.score), 0) AS avg_rating,
        COUNT(r.rating_id) AS rating_count
      FROM
        links l
        LEFT JOIN users u ON l.submitter_id = u.user_id
        LEFT JOIN ratings r ON l.link_id = r.link_id
      WHERE
        l.link_id IN (SELECT link_id FROM rated_links)
        AND COALESCE(l.hidden, FALSE) = FALSE
      GROUP BY
        l.link_id, l.title, l.description, l.url, l.created_at, u.username
      ORDER BY
        l.created_at DESC
    `;
    const result = await client.queryObject({
      text: query,
      args: [userId],
    });
    if (!result.rows || !Array.isArray(result.rows)) {
      ctx.response.status = 200;
      ctx.response.body = [];
      return;
    }
    const safeRows = result.rows.map((row) => {
      const safeRow: Record<string, unknown> = {};
      if (typeof row === "object" && row !== null) {
        const typedRow = row as Record<string, unknown>;
        for (const key of Object.keys(typedRow)) {
          const value = typedRow[key];
          if (typeof value === "bigint") {
            safeRow[key] = value.toString();
          } else if (value === undefined || value === null) {
            safeRow[key] = null;
          } else {
            safeRow[key] = value;
          }
        }
      }
      return safeRow;
    });
    ctx.response.status = 200;
    ctx.response.body = safeRows;
  } catch (_error) {
    console.error("Failed to fetch favorites:", _error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch favorites" };
  }
}

// POST /users/:id/favorites - add a link to user's favorites if not already present
export async function addUserFavorite(ctx: Context) {
  const userId = Number(getParam(ctx, "id"));
  const { linkId } = await ctx.request.body({ type: "json" }).value;
  if (!userId || typeof linkId !== "number") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing or invalid userId or linkId" };
    return;
  }
  try {
    await client.queryObject({
      text: `
        INSERT INTO favorites (user_id, link_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, link_id) DO NOTHING;
      `,
      args: [userId, linkId],
    });
    ctx.response.body = { success: true };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to add favorite" };
  }
}

// PUT /users/:id/grater_points - update grater points
export async function updateGraterPoints(ctx: Context) {
  const userId = Number(getParam(ctx, "id"));
  const { points } = await ctx.request.body({ type: "json" }).value;
  if (!userId || typeof points !== "number") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing or invalid userId or points" };
    return;
  }
  try {
    await client.queryObject({
      text: `
        UPDATE users
        SET grater_points = grater_points + $1
        WHERE user_id = $2;
      `,
      args: [points, userId],
    });
    ctx.response.body = { success: true };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update grater points" };
  }
}

// GET /users/:id - Get user info (including grater_points)
export async function getUserInfo(ctx: Context) {
  const userId = Number(getParam(ctx, "id"));
  if (isNaN(userId)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid user ID" };
    return;
  }
  try {
    const result = await client.queryObject({
      text: `SELECT user_id, username, email, grater_points FROM users WHERE user_id = $1`,
      args: [userId],
    });
    if (!result.rows.length) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }
    ctx.response.status = 200;
    ctx.response.body = result.rows[0] as Record<string, unknown>;
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch user info" };
  }
}
