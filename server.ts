import { Application, send } from "./deps.ts";
import authRoutes from "./routes/authRoutes.ts";
import pageRoutes from "./routes/pageRoutes.ts";
import linkRoutes from "./routes/linkRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";

const app = new Application();
// This middleware allows cross-origin requests from the React frontend
app.use((ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, x-user-id");
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  return next();
});

app.use(async (ctx, next) => {
  try {
    await send(ctx, ctx.request.url.pathname, {
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

// Register routes
app.use(pageRoutes.routes());
app.use(pageRoutes.allowedMethods());

app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

app.use(linkRoutes.routes());
app.use(linkRoutes.allowedMethods());

app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());

// 404 Fallback Handler
app.use(async (ctx) => {
  if (ctx.response.status === 404) {
    const path = ctx.request.url.pathname;
    if (path === "/" || path === "/index" || path === "/home") {
      await send(ctx, "index.html", { root: `${Deno.cwd()}/public` });
    } else {
      ctx.response.status = 404;
      ctx.response.body = "Not Found";
    }
  }
});

console.log("Server running at http://localhost:8000");
await app.listen({ port: 8000 });
