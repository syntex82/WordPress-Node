/**
 * Prisma Demo Extension
 * 
 * Provides automatic data isolation for demo users.
 * Demo users can ONLY see and modify data tagged with their demoInstanceId.
 * Real users see ONLY data where demoInstanceId is null.
 * 
 * SECURITY: This is critical for preventing demo users from accessing real data.
 */

import { Prisma, PrismaClient } from '@prisma/client';

// Models that have demoInstanceId for isolation
const DEMO_ISOLATED_MODELS = [
  'User',
  'Post',
  'Page',
  'Product',
  'Course',
  'Media',
] as const;

type DemoIsolatedModel = typeof DEMO_ISOLATED_MODELS[number];

/**
 * Create a Prisma client extension that filters by demoInstanceId
 */
export function createDemoFilteredPrisma(
  basePrisma: PrismaClient,
  demoInstanceId: string | null,
) {
  return basePrisma.$extends({
    name: 'demoFilter',
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (isDemoIsolatedModel(model)) {
            args.where = addDemoFilter(args.where, demoInstanceId);
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (isDemoIsolatedModel(model)) {
            args.where = addDemoFilter(args.where, demoInstanceId);
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          // For findUnique, we verify after fetch that the record belongs to the demo
          const result = await query(args);
          if (result && isDemoIsolatedModel(model)) {
            const record = result as any;
            if (!validateDemoAccess(record.demoInstanceId, demoInstanceId)) {
              return null; // Pretend record doesn't exist
            }
          }
          return result;
        },
        async count({ model, args, query }) {
          if (isDemoIsolatedModel(model)) {
            args.where = addDemoFilter(args.where, demoInstanceId);
          }
          return query(args);
        },
        async create({ model, args, query }) {
          // Demo users can only create demo data
          if (isDemoIsolatedModel(model) && demoInstanceId) {
            (args.data as any).demoInstanceId = demoInstanceId;
          }
          return query(args);
        },
        async update({ model, args, query }) {
          if (isDemoIsolatedModel(model)) {
            args.where = addDemoFilter(args.where, demoInstanceId);
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (isDemoIsolatedModel(model)) {
            args.where = addDemoFilter(args.where, demoInstanceId);
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (isDemoIsolatedModel(model)) {
            args.where = addDemoFilter(args.where, demoInstanceId);
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (isDemoIsolatedModel(model)) {
            args.where = addDemoFilter(args.where, demoInstanceId);
          }
          return query(args);
        },
      },
    },
  });
}

function isDemoIsolatedModel(model: string): model is DemoIsolatedModel {
  return DEMO_ISOLATED_MODELS.includes(model as DemoIsolatedModel);
}

function addDemoFilter(where: any, demoInstanceId: string | null): any {
  const demoFilter = { demoInstanceId: demoInstanceId };
  
  if (!where) {
    return demoFilter;
  }
  
  // If there's an existing AND condition, add to it
  if (where.AND) {
    return {
      ...where,
      AND: Array.isArray(where.AND) 
        ? [...where.AND, demoFilter]
        : [where.AND, demoFilter],
    };
  }
  
  // Otherwise merge the filter
  return { ...where, ...demoFilter };
}

function validateDemoAccess(
  recordDemoId: string | null | undefined,
  sessionDemoId: string | null,
): boolean {
  // Both null = real user accessing real data ✓
  // Both same value = demo user accessing their demo data ✓
  // Different values = BLOCKED
  if (recordDemoId === undefined) return true; // Model doesn't have demoInstanceId
  return recordDemoId === sessionDemoId;
}

export type DemoFilteredPrisma = ReturnType<typeof createDemoFilteredPrisma>;

