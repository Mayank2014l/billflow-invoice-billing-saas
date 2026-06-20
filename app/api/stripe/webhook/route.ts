import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object as any;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const orgId = session.metadata?.organizationId;
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.subscription as string;

        if (orgId) {
          await prisma.organization.update({
            where: { id: orgId },
            data: {
              plan: "PRO",
              stripeCustomerId,
              stripeSubscriptionId,
            },
          });

          await prisma.auditLog.create({
            data: {
              organizationId: orgId,
              userId: "stripe-webhook",
              action: "UPGRADE_PLAN",
              entity: "Organization",
              entityId: orgId,
              metadata: { plan: "PRO", subscriptionId: stripeSubscriptionId },
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.id as string;
        const status = session.status;

        // Find the org by customer ID or subscription ID
        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { stripeCustomerId },
              { stripeSubscriptionId },
            ],
          },
        });

        if (org) {
          const isPro = ["active", "trialing"].includes(status);
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: isPro ? "PRO" : "FREE",
              stripeSubscriptionId,
            },
          });

          await prisma.auditLog.create({
            data: {
              organizationId: org.id,
              userId: "stripe-webhook",
              action: "UPDATE_SUBSCRIPTION",
              entity: "Organization",
              entityId: org.id,
              metadata: { plan: isPro ? "PRO" : "FREE", status },
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSubscriptionId = session.id as string;

        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId },
        });

        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: "FREE",
              stripeSubscriptionId: null,
            },
          });

          await prisma.auditLog.create({
            data: {
              organizationId: org.id,
              userId: "stripe-webhook",
              action: "CANCEL_SUBSCRIPTION",
              entity: "Organization",
              entityId: org.id,
              metadata: { plan: "FREE" },
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
