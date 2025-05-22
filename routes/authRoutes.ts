import { Router } from "../deps.ts";
import { registerController, loginController } from "../controllers/authController.ts";

const router = new Router();

router.post("/register", registerController);
router.post("/login", loginController);

export default router;
