import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { ENV } from "./env";

const globalForPrisma = globalThis as unknown as { prismav2: PrismaClient };

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL });

export const prisma = globalForPrisma.prismav2 || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismav2 = prisma;
