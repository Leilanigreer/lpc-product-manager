import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, prevent multiple instances of Prisma Client
  if (!global.__db) {
    global.__db = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'], // Helpful for debugging in development
    });
  }
  prisma = global.__db;
}

// Add error handling for database connection
prisma.$connect()
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
});

export default prisma;