/**
 * Database Seed Script — Personal Mode
 * 
 * Populates local SQLite database with:
 * 1. Single local user (`id: "local"`)
 * 2. Three default workspace contexts: Personal (blue), Work (emerald), Freelance (purple)
 * 3. Sample tasks with varying statuses (TODO, IN_PROGRESS, DONE) and priorities
 * 4. Sample daily habits with log completion history
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Planner database for Personal Mode...");

  // 1. Create or update local user
  const user = await prisma.user.upsert({
    where: { id: "local" },
    update: {
      name: "Personal User",
      email: "local@personal.mode",
    },
    create: {
      id: "local",
      name: "Personal User",
      email: "local@personal.mode",
    },
  });

  console.log(`👤 Local user initialized: ${user.id} (${user.name})`);

  // 2. Create default Contexts
  const personalContext = await prisma.context.upsert({
    where: { id: "context_personal" },
    update: { name: "Personal", color: "blue" },
    create: {
      id: "context_personal",
      name: "Personal",
      color: "blue",
      userId: "local",
    },
  });

  const workContext = await prisma.context.upsert({
    where: { id: "context_work" },
    update: { name: "Work", color: "emerald" },
    create: {
      id: "context_work",
      name: "Work",
      color: "emerald",
      userId: "local",
    },
  });

  const freelanceContext = await prisma.context.upsert({
    where: { id: "context_freelance" },
    update: { name: "Freelance", color: "purple" },
    create: {
      id: "context_freelance",
      name: "Freelance",
      color: "purple",
      userId: "local",
    },
  });

  console.log("📂 Contexts seeded: Personal, Work, Freelance");

  // 3. Create Sample Tasks
  const sampleTasks = [
    {
      id: "task_1",
      title: "Plan weekly goals & priority focus",
      description: "Review current month roadmap and list top 3 priority tasks.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      tags: JSON.stringify(["planning", "focus"]),
      contextId: personalContext.id,
    },
    {
      id: "task_2",
      title: "Morning 30-min walk & stretch",
      description: "Get sunlight and fresh air before starting deep work.",
      status: "DONE",
      completed: true,
      priority: "MEDIUM",
      tags: JSON.stringify(["health"]),
      contextId: personalContext.id,
    },
    {
      id: "task_3",
      title: "Finish API route handler implementation",
      description: "Ensure Next.js 16 awaited params pattern across all route files.",
      status: "TODO",
      priority: "HIGH",
      tags: JSON.stringify(["dev", "backend"]),
      contextId: workContext.id,
    },
    {
      id: "task_4",
      title: "Review Q3 client project deliverables",
      description: "Audit milestone progress and draft status report.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      tags: JSON.stringify(["freelance", "review"]),
      contextId: freelanceContext.id,
    },
  ];

  for (const taskData of sampleTasks) {
    await prisma.task.upsert({
      where: { id: taskData.id },
      update: taskData,
      create: taskData,
    });
  }

  console.log(`📋 ${sampleTasks.length} sample tasks seeded`);

  // 4. Create Sample Habits & Logs
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  const habit1 = await prisma.habit.upsert({
    where: { id: "habit_1" },
    update: { name: "Morning Meditation (10 mins)", streak: 2 },
    create: {
      id: "habit_1",
      name: "Morning Meditation (10 mins)",
      streak: 2,
      userId: "local",
    },
  });

  const habit2 = await prisma.habit.upsert({
    where: { id: "habit_2" },
    update: { name: "Read 15 Pages of a Book", streak: 1 },
    create: {
      id: "habit_2",
      name: "Read 15 Pages of a Book",
      streak: 1,
      userId: "local",
    },
  });

  // Seed logs
  await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: habit1.id, date: yesterdayStr } },
    update: { completed: true },
    create: { habitId: habit1.id, date: yesterdayStr, completed: true },
  });

  await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: habit1.id, date: todayStr } },
    update: { completed: true },
    create: { habitId: habit1.id, date: todayStr, completed: true },
  });

  await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: habit2.id, date: todayStr } },
    update: { completed: true },
    create: { habitId: habit2.id, date: todayStr, completed: true },
  });

  console.log("🔥 Sample habits and streaks seeded successfully");
  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await (prisma as any).$disconnect();
  });
