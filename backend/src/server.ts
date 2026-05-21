import Fastify from "fastify";
import prismaPlugin from "./plugins/prisma";
import corsPlugin from "./plugins/cors";
import taskRoutes from "./routes/tasks";

async function buildApp() {
  const environment = process.env.NODE_ENV || "development";

  const fastify = Fastify({
    logger:
      environment === "development"
        ? {
            transport: {
              target: "pino-pretty",
              options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
              },
            },
          }
        : true,
  });

  // Register plugins
  await fastify.register(corsPlugin);
  await fastify.register(prismaPlugin);

  // Register routes
  await fastify.register(taskRoutes, { prefix: "/tasks" });

  // Health check
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  return fastify;
}

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";

  try {
    await app.listen({ port, host });
    app.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { buildApp };
