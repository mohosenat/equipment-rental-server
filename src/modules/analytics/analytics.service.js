import { getDB } from "../../config/db.js";

// Build date filter
const buildDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return {};

  const filter = {};

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      filter.createdAt.$gte = startDate;
    }

    if (endDate) {
      // Include the entire selected end date
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.createdAt.$lt = nextDay;
    }
  }

  return filter;
};

// Get booking statistics
const getBookingStatistics = async (bookingsCollection, filter) => {
  const result = await bookingsCollection
    .aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          total: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const statistics = {
    total: 0,
    confirmed: 0,
    pending: 0,
    pending_payment: 0,
    cancelled: 0,
    payment_review: 0,
  };

  result.forEach((item) => {
    statistics[item._id] = item.total;
    statistics.total += item.total;
  });

  return statistics;
};

// Get owner analytics
export const getOwnerAnalytics = async (ownerId, dateFilters) => {
  const db = getDB();

  const equipmentCollection = db.collection("equipment");
  const bookingsCollection = db.collection("bookings");
  const paymentsCollection = db.collection("payments");

  const dateFilter = buildDateFilter(
    dateFilters.startDate,
    dateFilters.endDate,
  );

  // Equipment statistics
  const totalEquipment = await equipmentCollection.countDocuments({
    ownerId,
  });

  const approvedEquipment = await equipmentCollection.countDocuments({
    ownerId,
    status: "approved",
  });

  const pendingEquipment = await equipmentCollection.countDocuments({
    ownerId,
    status: "pending",
  });

  // Booking statistics
  const bookingFilter = {
    ownerId,
    ...dateFilter,
  };

  const bookingStatistics = await getBookingStatistics(
    bookingsCollection,
    bookingFilter,
  );

  // Payment statistics
  const paymentFilter = {
    ownerId,
    paymentStatus: "paid",
    ...dateFilter,
  };

  const paymentSummary = await paymentsCollection
    .aggregate([
      { $match: paymentFilter },
      {
        $group: {
          _id: "$currency",
          totalRevenue: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const revenue = paymentSummary.map((item) => ({
    currency: item._id,
    totalRevenue: item.totalRevenue,
    totalPayments: item.totalPayments,
  }));

  return {
    equipment: {
      total: totalEquipment,
      approved: approvedEquipment,
      pending: pendingEquipment,
    },

    bookings: bookingStatistics,

    revenue,
  };
};

// Get admin analytics
export const getAdminAnalytics = async (dateFilters) => {
  const db = getDB();

  const userCollection = db.collection("user");
  const equipmentCollection = db.collection("equipment");
  const bookingsCollection = db.collection("bookings");
  const paymentsCollection = db.collection("payments");

  const dateFilter = buildDateFilter(
    dateFilters.startDate,
    dateFilters.endDate,
  );

  // User statistics
  const totalUsers = await userCollection.countDocuments();

  const totalCustomers = await userCollection.countDocuments({
    role: "customer",
  });

  const totalOwners = await userCollection.countDocuments({
    role: "owner",
  });

  const totalAdmins = await userCollection.countDocuments({
    role: "admin",
  });

  // Equipment statistics
  const totalEquipment = await equipmentCollection.countDocuments();

  const approvedEquipment = await equipmentCollection.countDocuments({
    status: "approved",
  });

  const pendingEquipment = await equipmentCollection.countDocuments({
    status: "pending",
  });

  const rejectedEquipment = await equipmentCollection.countDocuments({
    status: "rejected",
  });

  // Booking statistics
  const bookingStatistics = await getBookingStatistics(
    bookingsCollection,
    dateFilter,
  );

  // Payment statistics
  const paymentSummary = await paymentsCollection
    .aggregate([
      {
        $match: {
          paymentStatus: "paid",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$currency",
          totalRevenue: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const revenue = paymentSummary.map((item) => ({
    currency: item._id,
    totalRevenue: item.totalRevenue,
    totalPayments: item.totalPayments,
  }));

  return {
    users: {
      total: totalUsers,
      customers: totalCustomers,
      owners: totalOwners,
      admins: totalAdmins,
    },

    equipment: {
      total: totalEquipment,
      approved: approvedEquipment,
      pending: pendingEquipment,
      rejected: rejectedEquipment,
    },

    bookings: bookingStatistics,

    revenue,
  };
};
