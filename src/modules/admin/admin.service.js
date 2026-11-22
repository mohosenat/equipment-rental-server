import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

const getCollection = (name) => getDB().collection(name);

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Get All Equipment for Admin
export const getAdminEquipment = async ({ page, limit, search, status }) => {
  const equipment = getCollection("equipment");

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { name: searchRegex },
      { location: searchRegex },
      { category: searchRegex },
    ];
  }

  const [data, total] = await Promise.all([
    equipment
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),

    equipment.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Approve or Reject Equipment
export const updateAdminEquipmentStatus = async (id, status) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid equipment ID.");
  }

  const result = await getCollection("equipment").updateOne(
    {
      _id: new ObjectId(id),
      status: "pending",
    },
    {
      $set: {
        status,
        updatedAt: new Date(),
      },
    },
  );

  return result;
};

// Get All Users
export const getAdminUsers = async ({ page, limit, search }) => {
  const users = getCollection("user");

  const filter = {};

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const [data, total] = await Promise.all([
    users
      .find(filter)
      .project({
        password: 0,
        passwordHash: 0,
        credential: 0,
        accessToken: 0,
        refreshToken: 0,
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),

    users.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Update User Role
export const updateAdminUserRole = async (userId, role, adminId) => {
  const users = getCollection("user");

  const filters = [{ id: userId }, { _id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  const userFilter = { $or: filters };

  const targetUser = await users.findOne(userFilter);

  if (!targetUser) {
    return { matchedCount: 0 };
  }

  const targetId = String(targetUser.id || targetUser._id);

  if (targetId === String(adminId)) {
    throw new Error("You cannot change your own role.");
  }

  return users.updateOne(userFilter, {
    $set: {
      role,
      updatedAt: new Date(),
    },
  });
};

// Get All Bookings

export const getAdminBookings = async ({ page, limit, search, status }) => {
  const bookings = getCollection("bookings");

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { renterEmail: searchRegex },
      { equipmentName: searchRegex },
      { contactNumber: searchRegex },
      { ownerEmail: searchRegex },
    ];
  }

  const [data, total] = await Promise.all([
    bookings
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),

    bookings.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get All Payments

export const getAdminPayments = async ({ page, limit, search, status }) => {
  const payments = getCollection("payments");

  const filter = {};

  if (status) {
    filter.paymentStatus = status;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { stripeSessionId: searchRegex },
      { renterId: searchRegex },
      { ownerId: searchRegex },
    ];

    if (ObjectId.isValid(search)) {
      filter.$or.push({
        bookingId: new ObjectId(search),
      });
    }
  }

  const [data, total] = await Promise.all([
    payments
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),

    payments.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
// Update Equipment for Admin
export const updateAdminEquipment = async (id, data) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid equipment ID.");
  }

  const result = await getCollection("equipment").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    },
  );

  return result;
};

// Delete Equipment for Admin
export const deleteAdminEquipment = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid equipment ID.");
  }

  const result = await getCollection("equipment").deleteOne({
    _id: new ObjectId(id),
  });

  return result;
};
