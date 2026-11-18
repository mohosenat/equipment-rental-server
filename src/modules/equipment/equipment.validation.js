const allowedCategories = [
  "construction",
  "photography",
  "vehicles",
  "agriculture",
  "electronics",
  "event equipment",
];

const allowedRentalTypes = ["hourly", "daily", "weekly", "monthly"];

const allowedConditions = ["new", "like-new", "good", "fair"];

const allowedFields = [
  "name",
  "description",
  "category",
  "location",
  "price",
  "rentalType",
  "quantity",
  "condition",
  "brand",
  "model",
  "image",
  "terms",
];

// Validate individual equipment fields
const validateFields = (data, isUpdate = false) => {
  const errors = {};
  const validatedData = {};

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      isValid: false,
      errors: { body: "Invalid request data." },
    };
  }

  // Reject fields that are not allowed
  Object.keys(data).forEach((field) => {
    if (!allowedFields.includes(field)) {
      errors[field] = `${field} is not allowed.`;
    }
  });

  const requiredFields = [
    "name",
    "description",
    "category",
    "location",
    "price",
    "rentalType",
    "quantity",
    "condition",
    "image",
    "terms",
  ];

  // Check required fields during creation
  if (!isUpdate) {
    requiredFields.forEach((field) => {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        errors[field] = `${field} is required.`;
      }
    });
  }

  // Validate name
  if (data.name !== undefined) {
    if (
      typeof data.name !== "string" ||
      data.name.trim().length < 3 ||
      data.name.trim().length > 100
    ) {
      errors.name = "Name must be between 3 and 100 characters.";
    } else {
      validatedData.name = data.name.trim();
    }
  }

  // Validate description
  if (data.description !== undefined) {
    if (
      typeof data.description !== "string" ||
      data.description.trim().length < 20 ||
      data.description.trim().length > 2000
    ) {
      errors.description =
        "Description must be between 20 and 2000 characters.";
    } else {
      validatedData.description = data.description.trim();
    }
  }

  // Validate category
  if (data.category !== undefined) {
    const category =
      typeof data.category === "string"
        ? data.category.trim().toLowerCase()
        : "";

    if (!allowedCategories.includes(category)) {
      errors.category = "Invalid equipment category.";
    } else {
      validatedData.category = category;
    }
  }

  // Validate location
  if (data.location !== undefined) {
    if (typeof data.location !== "string" || data.location.trim().length < 3) {
      errors.location = "Please provide a valid location.";
    } else {
      validatedData.location = data.location.trim();
    }
  }

  // Validate price
  if (data.price !== undefined) {
    const price = Number(data.price);

    if (data.price === "" || !Number.isFinite(price) || price <= 0) {
      errors.price = "Price must be a positive number.";
    } else {
      validatedData.price = price;
    }
  }

  // Validate rental type
  if (data.rentalType !== undefined) {
    const rentalType =
      typeof data.rentalType === "string"
        ? data.rentalType.trim().toLowerCase()
        : "";

    if (!allowedRentalTypes.includes(rentalType)) {
      errors.rentalType = "Invalid rental type.";
    } else {
      validatedData.rentalType = rentalType;
    }
  }

  // Validate quantity
  if (data.quantity !== undefined) {
    const quantity = Number(data.quantity);

    if (data.quantity === "" || !Number.isInteger(quantity) || quantity <= 0) {
      errors.quantity = "Quantity must be a positive integer.";
    } else {
      validatedData.quantity = quantity;
    }
  }

  // Validate condition
  if (data.condition !== undefined) {
    const condition =
      typeof data.condition === "string"
        ? data.condition.trim().toLowerCase()
        : "";

    if (!allowedConditions.includes(condition)) {
      errors.condition = "Invalid equipment condition.";
    } else {
      validatedData.condition = condition;
    }
  }

  // Validate optional brand and model
  ["brand", "model"].forEach((field) => {
    if (data[field] !== undefined) {
      if (typeof data[field] !== "string") {
        errors[field] = `${field} must be a string.`;
      } else {
        validatedData[field] = data[field].trim();
      }
    }
  });

  // Validate image URL
  if (data.image !== undefined) {
    try {
      const imageUrl = new URL(data.image);

      if (!["http:", "https:"].includes(imageUrl.protocol)) {
        throw new Error("Invalid protocol");
      }

      validatedData.image = imageUrl.href;
    } catch {
      errors.image = "Please provide a valid image URL.";
    }
  }

  // Validate rental terms
  if (data.terms !== undefined) {
    if (
      typeof data.terms !== "string" ||
      data.terms.trim().length < 5 ||
      data.terms.trim().length > 1000
    ) {
      errors.terms = "Terms must be between 5 and 1000 characters.";
    } else {
      validatedData.terms = data.terms.trim();
    }
  }

  // Update must contain at least one field
  if (isUpdate && Object.keys(data).length === 0) {
    errors.body = "Please provide at least one field to update.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: validatedData,
  };
};

// Validate new equipment
export const validateEquipment = (data) => {
  return validateFields(data);
};

// Validate equipment updates
export const validateEquipmentUpdate = (data) => {
  return validateFields(data, true);
};
