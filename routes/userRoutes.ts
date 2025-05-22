import { Router } from "../deps.ts";
import {
  getUserFavorites,
  addUserFavorite,
  updateGraterPoints,
  getUserInfo,
} from "../controllers/userController.ts";

const router = new Router();

router.get("/users/:id/favorites", getUserFavorites);
router.post("/users/:id/favorites", addUserFavorite);
router.put("/users/:id/grater_points", updateGraterPoints);
router.get("/users/:id", getUserInfo);

export default router;
