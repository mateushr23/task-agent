import { Router } from "express";
import { testConnection } from "../db/client.js";

const router = Router();

router.get("/", async (_req, res) => {
  const db = await testConnection();
  res.json({ status: "ok", db });
});

export default router;
