import { Router } from "../deps.ts";
import * as linkController from "../controllers/linkController.ts";

const router = new Router();

// GET /links - return all links
router.get("/links", linkController.getLinks);
// POST /links - create a new link
router.post("/links", linkController.createLink);
// GET /links/:id - return a specific link
router.get("/links/:id", linkController.getLinkById);
// PUT /links/:id - update a link
router.put("/links/:id", linkController.updateLink);
// DELETE /links/:id - delete a link
router.delete("/links/:id", linkController.deleteLink);
// POST /links/:id/hide - hide a link
router.post("/links/:id/hide", linkController.hideLink);
// POST /links/:id/unhide - unhide a link
router.post("/links/:id/unhide", linkController.unhideLink);
// POST /links/:id/rate - rate a link
router.post("/links/:id/rate", linkController.rateLink);
// PATCH /api/links/:id - update a link (only by submitter)
router.patch("/api/links/:id", linkController.patchLink);
// GET /api/links?sort=recent|rating&search=term
router.get("/api/links", linkController.queryLinks);

export default router;
