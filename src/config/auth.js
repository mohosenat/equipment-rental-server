import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";

import { getDB, getMongoClient } from "./db.js";

export const createAuth = () => {
  return betterAuth({
    database: mongodbAdapter(getDB(), {
      client: getMongoClient(),
    }),

    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [process.env.CLIENT_URL],

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },

    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "customer",
          input: false,
        },
      },
    },

    // Assign role securely during registration
    databaseHooks: {
      user: {
        create: {
          before: async (user, ctx) => {
            const requestedRole = ctx?.body?.role;

            const role = requestedRole === "owner" ? "owner" : "customer";

            return {
              data: {
                ...user,
                role,
              },
            };
          },
        },
      },
    },

    plugins: [
      jwt({
        jwt: {
          definePayload: ({ user }) => ({
            id: user.id,
            email: user.email,
            role: user.role,
          }),
        },
      }),
    ],
  });
};
