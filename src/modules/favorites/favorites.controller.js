import {
  addFavorite,
  getMyFavorites,
  removeFavorite,
} from "./favorites.service.js";

import { validateFavorite } from "./favorites.validation.js";

// Add Favorite
export const addFavoriteController = async (req, res) => {
  try {
    const validation = validateFavorite(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const favorite = await addFavorite(
      validation.data.equipmentId,
      req.user.id,
    );

    return res.status(201).json({
      success: true,
      message: "Equipment added to favorites successfully.",
      data: favorite,
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    if (
      error.message === "Equipment not found or not available." ||
      error.message === "Equipment is already in your favorites."
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add equipment to favorites.",
    });
  }
};

// Get My Favorites
export const getMyFavoritesController = async (req, res) => {
  try {
    const favorites = await getMyFavorites(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Favorites retrieved successfully.",
      data: favorites,
    });
  } catch (error) {
    console.error("Get favorites error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve favorites.",
    });
  }
};

// Remove Favorite
export const removeFavoriteController = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID.",
      });
    }

    const result = await removeFavorite(equipmentId, req.user.id);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Equipment removed from favorites successfully.",
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove favorite.",
    });
  }
};
