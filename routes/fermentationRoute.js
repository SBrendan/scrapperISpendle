import express from "express";

import {
  createFermentation,
  getFermentations,
} from "../controllers/fermentationController.js";

const router = express.Router();

router.get("/", getFermentations);
router.post("/new", createFermentation);

export default router;
