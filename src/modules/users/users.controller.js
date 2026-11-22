import { getMyProfile, updateMyProfile } from "./users.service.js";

import { validateProfileUpdate } from "./users.validation.js";

// Get My Profile
export const getMyProfileController = async (req, res) => {
  try {
    const user = await getMyProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update My Profile
export const updateMyProfileController = async (req, res) => {
  const validation = validateProfileUpdate(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    const user = await updateMyProfile(req.user.id, validation.data);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
