import { Router } from "express";

import { verifyToken, verifyRenter } from "../../middlewares/auth.js";

import {
  addFavoriteController,
  getMyFavoritesController,
  removeFavoriteController,
} from "./favorites.controller.js";

const router = Router();

router.use(verifyToken, verifyRenter);

// Get My Favorites
router.get("/", getMyFavoritesController);

// Add Favorite
router.post("/", addFavoriteController);

// Remove Favorite
router.delete("/:equipmentId", removeFavoriteController);

export default router;
