import prisma from "./prisma";

export function getTenantDb(organizationId: string) {
  if (!organizationId) {
    throw new Error("organizationId is required for tenant isolation");
  }

  return prisma.$extends({
    query: {
      client: {
        async $allOperations({ operation, args, query }) {
          return handleTenantQuery("client", organizationId, operation, args, query);
        }
      },
      product: {
        async $allOperations({ operation, args, query }) {
          return handleTenantQuery("product", organizationId, operation, args, query);
        }
      },
      taxPreset: {
        async $allOperations({ operation, args, query }) {
          return handleTenantQuery("taxPreset", organizationId, operation, args, query);
        }
      },
      invoice: {
        async $allOperations({ operation, args, query }) {
          return handleTenantQuery("invoice", organizationId, operation, args, query);
        }
      },
      recurringInvoice: {
        async $allOperations({ operation, args, query }) {
          return handleTenantQuery("recurringInvoice", organizationId, operation, args, query);
        }
      },
      invite: {
        async $allOperations({ operation, args, query }) {
          return handleTenantQuery("invite", organizationId, operation, args, query);
        }
      },
      membership: {
        async $allOperations({ operation, args, query }) {
          return handleTenantQuery("membership", organizationId, operation, args, query);
        }
      },
      auditLog: {
        async $allOperations({ operation, args, query }) {
          return handleTenantQuery("auditLog", organizationId, operation, args, query);
        }
      }
    }
  });
}

async function handleTenantQuery(
  model: string,
  organizationId: string,
  operation: string,
  args: any,
  query: any
) {
  args.where = args.where || {};

  // For findUnique, Prisma requires queries to specify unique fields.
  // We change findUnique to findFirst to allow filtering by both the unique key AND organizationId.
  let targetOperation = operation;
  if (operation === "findUnique" || operation === "findUniqueOrThrow") {
    targetOperation = operation === "findUnique" ? "findFirst" : "findFirstOrThrow";
  }

  // Inject organizationId filter into where clauses for reading/updating/deleting
  if (
    targetOperation === "findMany" ||
    targetOperation === "findFirst" ||
    targetOperation === "findFirstOrThrow" ||
    targetOperation === "count" ||
    targetOperation === "aggregate" ||
    targetOperation === "groupBy" ||
    targetOperation === "update" ||
    targetOperation === "updateMany" ||
    targetOperation === "delete" ||
    targetOperation === "deleteMany"
  ) {
    args.where.organizationId = organizationId;
  } else if (targetOperation === "upsert") {
    args.where.organizationId = organizationId;
    args.create = args.create || {};
    args.create.organizationId = organizationId;
    args.update = args.update || {};
    args.update.organizationId = organizationId;
  }

  // Inject organizationId into data creation
  if (targetOperation === "create") {
    args.data = args.data || {};
    args.data.organizationId = organizationId;
  } else if (targetOperation === "createMany") {
    if (args.data) {
      if (Array.isArray(args.data)) {
        args.data = args.data.map((item: any) => ({
          ...item,
          organizationId
        }));
      } else {
        args.data.organizationId = organizationId;
      }
    }
  }

  // Execute query under correct operation type
  if (operation !== targetOperation) {
    // If we mapped findUnique to findFirst, execute the underlying findFirst/findFirstOrThrow instead
    const db: any = prisma;
    return db[model][targetOperation](args);
  }

  return query(args);
}
