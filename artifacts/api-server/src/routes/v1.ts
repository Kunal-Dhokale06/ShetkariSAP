import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);

router.get("/me", requireAuth, (_req, res) => {
  res.json({
    success: true,
    message: "Authenticated",
    data: {
      user: (_req as typeof _req & { user?: { sub: string; role: string } }).user,
    },
    errors: [],
  });
});

export default router;
