import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function prismaPlugin(fastify: FastifyInstance) {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  try {
    await prisma.$connect();
    fastify.log.info("✅ Prisma connected to Supabase database");
  } catch (err) {
    fastify.log.error({ err }, "❌ Failed to connect to database — check DATABASE_URL in .env");
    throw err; // Re-throw so the server doesn't start with a broken DB connection
  }

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
    fastify.log.info("Prisma disconnected from database");
  });
}

export default fp(prismaPlugin, {
  name: "prisma",
});
