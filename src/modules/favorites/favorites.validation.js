import { ObjectId } from "mongodb";

export const validateFavorite = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      isValid: false,
      message: "Invalid request data.",
    };
  }

  const allowedFields = ["equipmentId"];

  const unknownFields = Object.keys(data).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unknownFields.length > 0) {
    return {
      isValid: false,
      message: `Unknown fields: ${unknownFields.join(", ")}`,
    };
  }

  if (
    typeof data.equipmentId !== "string" ||
    !ObjectId.isValid(data.equipmentId)
  ) {
    return {
      isValid: false,
      message: "Valid equipment ID is required.",
    };
  }

  return {
    isValid: true,
    data: {
      equipmentId: data.equipmentId,
    },
  };
};
