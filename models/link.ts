import client from "../models/db.ts";

export interface Link {
  link_id: number;
  title: string;
  description: string;
  created_at: string;
  hidden: boolean;
  username: string;
  grater_points: number;
  avg_rating: number;
  rating_count: number;
}

export async function getAllLinks(sort: "recent" | "top" = "recent"): Promise<Link[]> {
  const queryText = `
    SELECT l.link_id, l.title, l.description, l.url, l.created_at, l.hidden,
           u.username, u.grater_points,
           COALESCE(AVG(r.score), 0) AS avg_rating,
           COUNT(r.rating_id) AS rating_count
    FROM links l
    LEFT JOIN users u ON l.submitter_id = u.user_id
    LEFT JOIN ratings r ON l.link_id = r.link_id
    WHERE l.hidden = FALSE
    GROUP BY l.link_id, l.title, l.description, l.url, l.created_at, l.hidden, u.username, u.grater_points
    ORDER BY ${sort === "top" ? "avg_rating DESC, rating_count DESC" : "l.created_at DESC"}
  `;

  const result = await client.queryObject<Link>({ text: queryText, args: [] });
  return result.rows;
}

export async function createLink(title: string, description: string, url: string, submitterId: number): Promise<void> {
  await client.queryObject({
    text: `INSERT INTO links (title, description, url, submitter_id) VALUES ($1, $2, $3, $4)`,
    args: [title, description, url, submitterId],
  });
}
export async function getLinkById(linkId: number): Promise<Link | null> {
  const result = await client.queryObject<Link>({
    text: `SELECT * FROM links WHERE link_id = $1`,
    args: [linkId],
  });
  return result.rows[0] ?? null;
}
export async function updateLink(linkId: number, title: string, description: string): Promise<void> {
  await client.queryObject({
    text: `UPDATE links SET title = $1, description = $2 WHERE link_id = $3`,
    args: [title, description, linkId],
  });
}

export async function deleteLink(linkId: number): Promise<void> {
  await client.queryObject({
    text: `DELETE FROM links WHERE link_id = $1`,
    args: [linkId],
  });
}

export async function hideLink(linkId: number): Promise<void> {
  await client.queryObject({
    text: `UPDATE links SET hidden = TRUE WHERE link_id = $1`,
    args: [linkId],
  });
}
export async function unhideLink(linkId: number): Promise<void> {
  await client.queryObject({
    text: `UPDATE links SET hidden = FALSE WHERE link_id = $1`,
    args: [linkId],
  });
}
export async function rateLink(linkId: number, userId: number, score: number): Promise<void> {
  await client.queryObject({
    text: `INSERT INTO ratings (link_id, user_id, score) VALUES ($1, $2, $3)`,
    args: [linkId, userId, score],
  });
}
