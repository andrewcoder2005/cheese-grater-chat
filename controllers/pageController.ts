import { Context, send } from "../deps.ts";

export async function serveRegisterPage(ctx: Context) {
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = await Deno.readTextFile("./public/register.html");
}

export async function serveLoginPage(ctx: Context) {
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = await Deno.readTextFile("./public/login.html");
}

export async function serveHomePage(ctx: Context) {
  await send(ctx, "index.html", { root: `${Deno.cwd()}/public` });
}
