const allowedStatuses = ["in_progress", "completed"];

export const validateBookingStatus = (data) => {
  const errors = {};

  if (!data || typeof data.status !== "string") {
    errors.status = "Booking status is required.";
  } else if (!allowedStatuses.includes(data.status)) {
    errors.status = "Invalid booking status.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      status: data?.status,
    },
  };
};
