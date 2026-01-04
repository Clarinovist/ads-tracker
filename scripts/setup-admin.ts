import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString: connectionString! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = "admin@example.com";
    const password = "admin123";
    const name = "System Admin";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log("Admin user already exists.");
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            role: "ADMIN"
        }
    });

    console.log("✅ Admin user created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
