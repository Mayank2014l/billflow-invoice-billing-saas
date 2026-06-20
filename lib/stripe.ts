import Stripe from "stripe";
import prisma from "./prisma";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-04-10" as any,
    })
  : null;

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: "",
    limits: {
      invoices: 5,
      clients: 3,
      members: 2,
    },
  },
  PRO: {
    name: "Pro Plan",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro_default",
    limits: {
      invoices: Infinity,
      clients: Infinity,
      members: Infinity,
    },
  },
};

export async function getOrgPlan(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  });
  return org?.plan || "FREE";
}

export async function checkPlanLimits(
  organizationId: string,
  type: "invoices" | "clients" | "members"
) {
  const plan = await getOrgPlan(organizationId);
  const planDetails = PLANS[plan];
  const maxLimit = planDetails.limits[type];

  if (maxLimit === Infinity) {
    return { allowed: true, current: 0, limit: maxLimit, label: "Unlimited" };
  }

  let currentCount = 0;
  if (type === "invoices") {
    currentCount = await prisma.invoice.count({
      where: { organizationId },
    });
  } else if (type === "clients") {
    currentCount = await prisma.client.count({
      where: { organizationId },
    });
  } else if (type === "members") {
    currentCount = await prisma.membership.count({
      where: { organizationId },
    });
  }

  return {
    allowed: currentCount < maxLimit,
    current: currentCount,
    limit: maxLimit,
    label: `${currentCount} / ${maxLimit}`,
  };
}
