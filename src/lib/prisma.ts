import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 uses the WASM engine which requires a driver adapter.
// PrismaPg creates a pg.Pool lazily — no real connection is made until
// the first query, so this is safe to evaluate at build time.
function createClient() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://localhost/monote_build_placeholder";
  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
