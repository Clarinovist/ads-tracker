import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { email, password, name, secret } = await request.json();

        // Protection for this helper endpoint
        if (secret !== "ads-tracker-setup-secret-123") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: "ADMIN"
            }
        });

        return NextResponse.json({
            id: user.id, email: user.email, name: user.name, role: user.role
        });
    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
