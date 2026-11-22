export const validateAnalyticsQuery = (query) => {
  const { startDate, endDate } = query;

  if (startDate && isNaN(Date.parse(startDate))) {
    return {
      valid: false,
      message: "Invalid start date.",
    };
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return {
      valid: false,
      message: "Invalid end date.",
    };
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && end && start > end) {
    return {
      valid: false,
      message: "Start date cannot be after end date.",
    };
  }

  return {
    valid: true,
    data: {
      startDate: start,
      endDate: end,
    },
  };
};
