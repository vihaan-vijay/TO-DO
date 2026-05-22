import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { Priority } from "@prisma/client";

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(Priority).optional().default('MEDIUM'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  tags: z.array(z.string()).optional(),
  subtasks: z.array(z.string().min(1)).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  completed: z.boolean().optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

const querySchema = z.object({
  completed: z.enum(["true", "false"]).optional(),
  priority: z.nativeEnum(Priority).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority", "title"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
});

const subtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required").max(200),
});

const taskIncludes = {
  tags: true,
  subtasks: {
    orderBy: { createdAt: "asc" as const },
  },
};

export default async function taskRoutes(fastify: FastifyInstance) {
  // GET /tasks — list all tasks
  fastify.get(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = querySchema.parse(request.query);
        const page = Math.max(1, parseInt(query.page));
        const limit = Math.min(100, Math.max(1, parseInt(query.limit)));
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.completed !== undefined) {
          where.completed = query.completed === "true";
        }

        if (query.priority) {
          where.priority = query.priority;
        }

        if (query.search) {
          where.OR = [
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ];
        }

        const [tasks, total] = await Promise.all([
          fastify.prisma.task.findMany({
            where,
            include: taskIncludes,
            orderBy: { [query.sortBy]: query.order },
            skip,
            take: limit,
          }),
          fastify.prisma.task.count({ where }),
        ]);

        return reply.send({
          tasks,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.status(400).send({ error: "Validation Error", details: err.issues });
        }
        throw err;
      }
    }
  );

  // POST /tasks — create a new task
  fastify.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createTaskSchema.parse(request.body);

        const tagConnections = body.tags
          ? await Promise.all(
              body.tags.map(async (tagName) => {
                const tag = await fastify.prisma.tag.upsert({
                  where: { name: tagName.toLowerCase().trim() },
                  update: {},
                  create: { name: tagName.toLowerCase().trim() },
                });
                return { id: tag.id };
              })
            )
          : [];

        const task = await fastify.prisma.task.create({
          data: {
            title: body.title,
            description: body.description,
            priority: body.priority,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            tags: { connect: tagConnections },
            subtasks: body.subtasks
              ? { create: body.subtasks.map((title) => ({ title })) }
              : undefined,
          },
          include: taskIncludes,
        });

        return reply.status(201).send({ task });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.status(400).send({ error: "Validation Error", details: err.issues });
        }
        throw err;
      }
    }
  );

  // GET /tasks/:id — get a single task
  fastify.get(
    "/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const task = await fastify.prisma.task.findUnique({
        where: { id: request.params.id },
        include: taskIncludes,
      });

      if (!task) {
        return reply.status(404).send({ error: "Not Found", message: "Task not found" });
      }

      return reply.send({ task });
    }
  );

  // PATCH /tasks/:id — update a task
  fastify.patch(
    "/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const body = updateTaskSchema.parse(request.body);

        const existing = await fastify.prisma.task.findUnique({
          where: { id: request.params.id },
        });

        if (!existing) {
          return reply.status(404).send({ error: "Not Found", message: "Task not found" });
        }

        const updateData: any = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.completed !== undefined) updateData.completed = body.completed;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.dueDate !== undefined) {
          updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
        }

        if (body.tags !== undefined) {
          const tagConnections = await Promise.all(
            body.tags.map(async (tagName) => {
              const tag = await fastify.prisma.tag.upsert({
                where: { name: tagName.toLowerCase().trim() },
                update: {},
                create: { name: tagName.toLowerCase().trim() },
              });
              return { id: tag.id };
            })
          );
          updateData.tags = { set: [], connect: tagConnections };
        }

        const task = await fastify.prisma.task.update({
          where: { id: request.params.id },
          data: updateData,
          include: taskIncludes,
        });

        return reply.send({ task });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.status(400).send({ error: "Validation Error", details: err.issues });
        }
        throw err;
      }
    }
  );

  // DELETE /tasks/:id — delete a task
  fastify.delete(
    "/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const existing = await fastify.prisma.task.findUnique({
        where: { id: request.params.id },
      });

      if (!existing) {
        return reply.status(404).send({ error: "Not Found", message: "Task not found" });
      }

      await fastify.prisma.task.delete({ where: { id: request.params.id } });
      return reply.send({ message: "Task deleted successfully" });
    }
  );

  // PATCH /tasks/:id/toggle — toggle task completion
  fastify.patch(
    "/:id/toggle",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const existing = await fastify.prisma.task.findUnique({
        where: { id: request.params.id },
      });

      if (!existing) {
        return reply.status(404).send({ error: "Not Found", message: "Task not found" });
      }

      const task = await fastify.prisma.task.update({
        where: { id: request.params.id },
        data: { completed: !existing.completed },
        include: taskIncludes,
      });

      return reply.send({ task });
    }
  );

  // --- Subtask routes ---

  // POST /tasks/:id/subtasks — add a subtask
  fastify.post(
    "/:id/subtasks",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const body = subtaskSchema.parse(request.body);

        const task = await fastify.prisma.task.findUnique({
          where: { id: request.params.id },
        });

        if (!task) {
          return reply.status(404).send({ error: "Not Found", message: "Task not found" });
        }

        const subtask = await fastify.prisma.subtask.create({
          data: {
            title: body.title,
            taskId: request.params.id,
          },
        });

        return reply.status(201).send({ subtask });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.status(400).send({ error: "Validation Error", details: err.issues });
        }
        throw err;
      }
    }
  );

  // PATCH /tasks/:taskId/subtasks/:subtaskId/toggle — toggle subtask
  fastify.patch(
    "/:taskId/subtasks/:subtaskId/toggle",
    async (
      request: FastifyRequest<{ Params: { taskId: string; subtaskId: string } }>,
      reply: FastifyReply
    ) => {
      const subtask = await fastify.prisma.subtask.findFirst({
        where: { id: request.params.subtaskId, taskId: request.params.taskId },
      });

      if (!subtask) {
        return reply.status(404).send({ error: "Not Found", message: "Subtask not found" });
      }

      const updated = await fastify.prisma.subtask.update({
        where: { id: request.params.subtaskId },
        data: { completed: !subtask.completed },
      });

      return reply.send({ subtask: updated });
    }
  );

  // DELETE /tasks/:taskId/subtasks/:subtaskId — delete a subtask
  fastify.delete(
    "/:taskId/subtasks/:subtaskId",
    async (
      request: FastifyRequest<{ Params: { taskId: string; subtaskId: string } }>,
      reply: FastifyReply
    ) => {
      const subtask = await fastify.prisma.subtask.findFirst({
        where: { id: request.params.subtaskId, taskId: request.params.taskId },
      });

      if (!subtask) {
        return reply.status(404).send({ error: "Not Found", message: "Subtask not found" });
      }

      await fastify.prisma.subtask.delete({ where: { id: request.params.subtaskId } });
      return reply.send({ message: "Subtask deleted" });
    }
  );
}
