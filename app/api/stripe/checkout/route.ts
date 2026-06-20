import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { stripe, PLANS } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const authCheck = await requireRole(["OWNER"]);
  if (!authCheck.authorized) return authCheck.response;

  const { organization, userId, userEmail, userName } = authCheck;

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe integration is not configured on the server." },
      { status: 501 }
    );
  }

  try {
    let stripeCustomerId = organization.stripeCustomerId;

    // 1. Create or retrieve Stripe Customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName || organization.name,
        metadata: {
          organizationId: organization.id,
        },
      });

      stripeCustomerId = customer.id;

      // Update organization with customer ID
      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId },
      });
    }

    const { action } = await req.json().catch(() => ({ action: "subscribe" }));

    // 2. If already subscribed, redirect to billing portal instead
    if (organization.plan === "PRO" || action === "portal") {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/billing`,
      });

      return NextResponse.json({ url: portalSession.url });
    }

    // 3. Otherwise, create a Checkout Session for the PRO subscription
    const priceId = PLANS.PRO.priceId;
    if (!priceId || priceId === "price_pro_default") {
      return NextResponse.json(
        { error: "Stripe Price ID is not set. Please set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID." },
        { status: 400 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/billing?canceled=true`,
      metadata: {
        organizationId: organization.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
