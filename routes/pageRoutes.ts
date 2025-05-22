import { Router } from "../deps.ts";
import { serveRegisterPage, serveLoginPage, serveHomePage } from "../controllers/pageController.ts";

const pageRouter = new Router();

// Define endpoints
pageRouter.get("/register", serveRegisterPage);
pageRouter.get("/login", serveLoginPage);
pageRouter.get("/", serveHomePage);

export default pageRouter;
