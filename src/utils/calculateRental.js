export const calculateRental = (
  startDate,
  endDate,
  price,
  rentalType,
  quantity,
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const durationInMs = end.getTime() - start.getTime();

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    durationInMs <= 0
  ) {
    throw new Error("Invalid rental duration.");
  }

  if (typeof price !== "number" || price <= 0) {
    throw new Error("Invalid rental price.");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Invalid rental quantity.");
  }

  const hours = durationInMs / (1000 * 60 * 60);

  let duration;
  let totalPeriods;

  switch (rentalType) {
    case "hourly":
      duration = Math.ceil(hours);
      totalPeriods = duration;
      break;

    case "daily":
      duration = Math.ceil(hours / 24);
      totalPeriods = duration;
      break;

    case "weekly":
      duration = Math.ceil(hours / (24 * 7));
      totalPeriods = duration;
      break;

    case "monthly":
      duration = Math.ceil(hours / (24 * 30));
      totalPeriods = duration;
      break;

    default:
      throw new Error("Invalid rental type.");
  }

  const totalAmount = price * totalPeriods * quantity;

  return {
    duration,
    rentalType,
    quantity,
    price,
    totalAmount,
  };
};
