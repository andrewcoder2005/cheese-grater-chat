// CONTROLLER: Oak route handlers for each route
import * as LinkModel from "../models/link.ts";
import client from "../models/db.ts";
import type { Context } from "../deps.ts";


function getParam(ctx: Context, key: string): string | undefined {
  // Use unknown and cast to { params?: Record<string, string> }
  const withParams = ctx as unknown as { params?: Record<string, string> };
  return withParams.params?.[key];
}

export async function getLinks(ctx: Context) {
  try {
    const sort = ctx.request.url.searchParams.get("sort") === "rating" ? "top" : "recent";
    const links = await LinkModel.getAllLinks(sort);
    ctx.response.status = 200;
    ctx.response.body = JSON.parse(
      JSON.stringify(links, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch links" };
  }
}

export async function createLink(ctx: Context) {
  const { title, description, url, submitterId } = await ctx.request.body().value;
  try {
    await LinkModel.createLink(title, description, url, submitterId);
    ctx.response.status = 201;
    ctx.response.body = { message: "Link created successfully" };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to create link" };
  }
}

export async function getLinkById(ctx: Context) {
  const idStr = getParam(ctx, "id");
  const linkId = Number(idStr);
  if (isNaN(linkId)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid link ID" };
    return;
  }
  try {
    const link = await LinkModel.getLinkById(linkId);
    if (link) {
      ctx.response.status = 200;
      ctx.response.body = link;
    } else {
      ctx.response.status = 404;
      ctx.response.body = { error: "Link not found" };
    }
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch link" };
  }
}

export async function updateLink(ctx: Context) {
  const user = ctx.state.user;
  if (!user) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  const idStr = getParam(ctx, "id");
  const linkId = Number(idStr);
  const { title, description } = await ctx.request.body({ type: "json" }).value;
  if (!title) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing required fields." };
    return;
  }
  const check = await client.queryObject({
    text: `SELECT * FROM links WHERE link_id = $1 AND submitter_id = $2`,
    args: [linkId, user.user_id],
  });
  if (!check.rows.length) {
    ctx.response.status = 403;
    ctx.response.body = { error: "Not authorized to update this link." };
    return;
  }
  try {
    await LinkModel.updateLink(linkId, title, description);
    ctx.response.status = 200;
    ctx.response.body = { message: "Link updated successfully" };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update link" };
  }
}

export async function deleteLink(ctx: Context) {
  const idStr = getParam(ctx, "id");
  const linkId = Number(idStr);
  try {
    await LinkModel.deleteLink(linkId);
    ctx.response.status = 200;
    ctx.response.body = { message: "Link deleted successfully" };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to delete link" };
  }
}

export async function hideLink(ctx: Context) {
  const idStr = getParam(ctx, "id");
  const linkId = Number(idStr);
  try {
    await LinkModel.hideLink(linkId);
    ctx.response.status = 200;
    ctx.response.body = { message: "Link hidden successfully" };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to hide link" };
  }
}

export async function unhideLink(ctx: Context) {
  const idStr = getParam(ctx, "id");
  const linkId = Number(idStr);
  try {
    await LinkModel.unhideLink(linkId);
    ctx.response.status = 200;
    ctx.response.body = { message: "Link unhidden successfully" };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to unhide link" };
  }
}

export async function rateLink(ctx: Context) {
  const idStr = getParam(ctx, "id");
  const linkId = Number(idStr);
  const { userId, score } = await ctx.request.body().value;
  if (!userId || !score || score < 1 || score > 5) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid user or score." };
    return;
  }
  try {
    await client.queryObject({
      text: `
        INSERT INTO ratings (user_id, link_id, score)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, link_id) DO UPDATE SET score = $3;
      `,
      args: [userId, linkId, score],
    });
    const submitterResult = await client.queryObject({
      text: `SELECT submitter_id FROM links WHERE link_id = $1`,
      args: [linkId],
    });
    let submitterId = null;
    if (submitterResult.rows[0]) {
      const row = submitterResult.rows[0];
      submitterId = Object.values(row)[0];
    }
    if (typeof submitterId === "bigint") submitterId = Number(submitterId);
    if (submitterId && submitterId !== userId) {
      let points = 0;
      if (score >= 4) points = 2;
      else if (score <= 2) points = -1;
      if (points !== 0) {
        await import("../models/user.ts").then(m => m.gainGraterPoints(submitterId, points));
      }
    }
    ctx.response.body = { success: true };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to submit rating." };
  }
}

export async function patchLink(ctx: Context) {
  const idStr = getParam(ctx, "id");
  const link_id = Number(idStr);
  const { title, url, description } = await ctx.request.body({ type: "json" }).value;
  let user_id = 1; // fallback
  try {
    const authUser = ctx.request.headers.get("x-user-id") || ctx.request.url.searchParams.get("userId");
    if (authUser) user_id = Number(authUser);
  } catch (_e) { /* ignore */ }
  const check = await client.queryObject({
    text: `SELECT * FROM links WHERE link_id = $1 AND submitter_id = $2`,
    args: [link_id, user_id],
  });
  if (!check.rows.length) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Not authorized to update this link." };
    return;
  }
  const result = await client.queryObject({
    text: `
      UPDATE links
      SET title = $1, url = $2, description = $3
      WHERE link_id = $4
      RETURNING link_id as id, title, url, description, created_at;
    `,
    args: [title, url, description, link_id],
  });
  ctx.response.body = result.rows[0] ?? {};
}

export async function queryLinks(ctx: Context) {
  const sort = ctx.request.url.searchParams.get("sort") || "recent";
  const search = ctx.request.url.searchParams.get("search") || "";
  let orderBy = "l.created_at DESC";
  if (sort === "rating") {
    orderBy = "avg_rating DESC NULLS LAST, l.created_at DESC";
  }
  let searchClause = "";
  const args: string[] = [];
  if (search) {
    searchClause = `AND (l.title ILIKE $1 OR l.description ILIKE $1)`;
    args.push(`%${search}%`);
  }
  const result = await client.queryObject({
    text: `
      SELECT l.link_id as id, l.title, l.url, l.description, l.created_at, u.username,
        COALESCE(AVG(r.score), 0) as rating
      FROM links l
      LEFT JOIN users u ON l.submitter_id = u.user_id
      LEFT JOIN ratings r ON l.link_id = r.link_id
      WHERE (l.hidden = FALSE OR l.hidden IS NULL)
      ${searchClause}
      GROUP BY l.link_id, u.username
      ORDER BY ${orderBy}
    `,
    args,
  });
  ctx.response.body = result.rows;
}

