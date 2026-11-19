const allowedFields = [
  "equipmentId",
  "startDate",
  "endDate",
  "quantity",
  "contactNumber",
  "deliveryAddress",
  "notes",
];

export const validateBooking = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      valid: false,
      message: "Invalid booking data.",
    };
  }

  const unknownFields = Object.keys(data).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unknownFields.length > 0) {
    return {
      valid: false,
      message: `Unknown fields: ${unknownFields.join(", ")}`,
    };
  }

  const requiredFields = [
    "equipmentId",
    "startDate",
    "endDate",
    "quantity",
    "contactNumber",
    "deliveryAddress",
  ];

  for (const field of requiredFields) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      return {
        valid: false,
        message: `${field} is required.`,
      };
    }
  }

  if (typeof data.equipmentId !== "string") {
    return {
      valid: false,
      message: "Invalid equipment ID.",
    };
  }

  if (
    typeof data.quantity !== "number" ||
    !Number.isInteger(data.quantity) ||
    data.quantity <= 0
  ) {
    return {
      valid: false,
      message: "Quantity must be a positive integer.",
    };
  }

  if (typeof data.contactNumber !== "string" || !data.contactNumber.trim()) {
    return {
      valid: false,
      message: "Valid contact number is required.",
    };
  }

  if (
    typeof data.deliveryAddress !== "string" ||
    !data.deliveryAddress.trim()
  ) {
    return {
      valid: false,
      message: "Valid delivery address is required.",
    };
  }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return {
      valid: false,
      message: "Invalid booking dates.",
    };
  }

  if (endDate <= startDate) {
    return {
      valid: false,
      message: "End date must be after start date.",
    };
  }

  if (data.notes !== undefined && typeof data.notes !== "string") {
    return {
      valid: false,
      message: "Notes must be a string.",
    };
  }

  return {
    valid: true,
    data: {
      equipmentId: data.equipmentId,
      startDate,
      endDate,
      quantity: data.quantity,
      contactNumber: data.contactNumber.trim(),
      deliveryAddress: data.deliveryAddress.trim(),
      notes: data.notes?.trim() || "",
    },
  };
};
