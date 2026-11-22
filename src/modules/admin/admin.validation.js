const allowedEquipmentStatuses = ["approved", "rejected"];
const allowedUserRoles = ["customer", "owner", "admin"];

export const validateAdminQuery = (query = {}) => {
  const allowedFields = ["page", "limit", "search", "status"];

  const unknownFields = Object.keys(query).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unknownFields.length > 0) {
    return {
      isValid: false,
      message: `Unknown fields: ${unknownFields.join(", ")}`,
    };
  }

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

  if (!Number.isInteger(page) || page < 1) {
    return {
      isValid: false,
      message: "Page must be a positive integer.",
    };
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return {
      isValid: false,
      message: "Limit must be between 1 and 100.",
    };
  }

  if (query.search !== undefined && typeof query.search !== "string") {
    return {
      isValid: false,
      message: "Search must be a string.",
    };
  }

  if (query.status !== undefined && typeof query.status !== "string") {
    return {
      isValid: false,
      message: "Status must be a string.",
    };
  }

  return {
    isValid: true,
    data: {
      page,
      limit,
      search: query.search?.trim() || "",
      status: query.status || "",
    },
  };
};

export const validateEquipmentStatus = (data) => {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length !== 1 ||
    !allowedEquipmentStatuses.includes(data.status)
  ) {
    return {
      isValid: false,
      message: "Status must be either approved or rejected.",
    };
  }

  return {
    isValid: true,
    data: {
      status: data.status,
    },
  };
};

export const validateUserRole = (data) => {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length !== 1 ||
    !allowedUserRoles.includes(data.role)
  ) {
    return {
      isValid: false,
      message: "Role must be customer, owner, or admin.",
    };
  }

  return {
    isValid: true,
    data: {
      role: data.role,
    },
  };
};
