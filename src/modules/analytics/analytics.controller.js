import { getOwnerAnalytics, getAdminAnalytics } from "./analytics.service.js";

import { validateAnalyticsQuery } from "./analytics.validation.js";

// Get owner analytics
export const getOwnerAnalyticsController = async (req, res) => {
  const validation = validateAnalyticsQuery(req.query);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    const analytics = await getOwnerAnalytics(req.user.id, validation.data);

    return res.status(200).json({
      success: true,
      message: "Owner analytics retrieved successfully.",
      data: analytics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get admin analytics
export const getAdminAnalyticsController = async (req, res) => {
  const validation = validateAnalyticsQuery(req.query);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    const analytics = await getAdminAnalytics(validation.data);

    return res.status(200).json({
      success: true,
      message: "Admin analytics retrieved successfully.",
      data: analytics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
