import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import cors from "@fastify/cors";

async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

export default fp(corsPlugin, {
  name: "cors",
});
