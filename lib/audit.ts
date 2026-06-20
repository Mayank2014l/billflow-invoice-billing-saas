import prisma from "./prisma";

interface AuditInput {
  organizationId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: any;
}

export async function logAudit({
  organizationId,
  userId,
  action,
  entity,
  entityId,
  metadata,
}: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        entity,
        entityId,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
