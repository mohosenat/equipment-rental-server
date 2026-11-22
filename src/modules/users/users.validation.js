// Validate Profile Update
export const validateProfileUpdate = (data) => {
  const allowedFields = ["name", "image", "phone", "address"];

  const unknownFields = Object.keys(data).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unknownFields.length > 0) {
    return {
      valid: false,
      message: `Unknown fields: ${unknownFields.join(", ")}`,
    };
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      message: "At least one field is required.",
    };
  }

  const updateData = {};

  // Name Validation
  if (data.name !== undefined) {
    if (
      typeof data.name !== "string" ||
      data.name.trim().length < 2 ||
      data.name.trim().length > 60
    ) {
      return {
        valid: false,
        message: "Name must be between 2 and 60 characters.",
      };
    }

    updateData.name = data.name.trim();
  }

  // Profile Image Validation
  if (data.image !== undefined) {
    if (data.image !== null && typeof data.image !== "string") {
      return {
        valid: false,
        message: "Profile image must be a valid URL.",
      };
    }

    if (data.image) {
      try {
        const imageUrl = new URL(data.image);

        if (!["http:", "https:"].includes(imageUrl.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        return {
          valid: false,
          message: "Please provide a valid profile image URL.",
        };
      }
    }

    updateData.image = data.image;
  }

  // Phone Validation
  if (data.phone !== undefined) {
    if (typeof data.phone !== "string" || data.phone.trim().length > 20) {
      return {
        valid: false,
        message: "Phone number must be a valid text value.",
      };
    }

    updateData.phone = data.phone.trim();
  }

  // Address Validation
  if (data.address !== undefined) {
    if (typeof data.address !== "string" || data.address.trim().length > 250) {
      return {
        valid: false,
        message: "Address cannot exceed 250 characters.",
      };
    }

    updateData.address = data.address.trim();
  }

  return {
    valid: true,
    data: updateData,
  };
};
