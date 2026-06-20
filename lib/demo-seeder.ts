import prisma from "./prisma";

export async function seedDemoData(userId: string) {
  // Check if user already has memberships
  const existingMembership = await prisma.membership.findFirst({
    where: { userId },
  });

  if (existingMembership) return; // Already seeded or has organization

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "BillFlow Labs",
      slug: "billflow-labs-" + Math.random().toString(36).substring(2, 7),
      currency: "USD",
      taxName: "VAT",
      taxNumber: "US-987654321",
      address: "123 Innovation Way, Suite 400, San Francisco, CA 94107",
    },
  });

  // 2. Create Owner Membership
  await prisma.membership.create({
    data: {
      userId,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  // 3. Create Clients
  const clientAcme = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: "Acme Corporation",
      email: "billing@acme.com",
      address: "456 Coyote Plaza",
      city: "Los Angeles",
      country: "United States",
      currency: "USD",
      taxNumber: "ACME-112233",
    },
  });

  const clientWayne = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: "Wayne Enterprises",
      email: "invoices@wayne.corp",
      address: "1007 Mountain Drive",
      city: "Gotham City",
      country: "United States",
      currency: "USD",
      taxNumber: "BAT-999888",
    },
  });

  const clientStark = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: "Stark Industries",
      email: "finance@stark.com",
      address: "10880 Wilshire Blvd",
      city: "Malibu",
      country: "United States",
      currency: "USD",
      taxNumber: "PEPPER-4433",
    },
  });

  // 4. Create Products
  const products = [
    { name: "SaaS Product Development", rate: 125, unit: "hr", description: "Full stack engineering services" },
    { name: "UI/UX Design & Prototyping", rate: 95, unit: "hr", description: "Design systems and high fidelity prototypes" },
    { name: "Cloud Architecture Audit", rate: 150, unit: "hr", description: "AWS infrastructure review and optimization plan" },
  ];

  for (const prod of products) {
    await prisma.product.create({
      data: {
        organizationId: org.id,
        ...prod,
      },
    });
  }

  // 5. Create Invoices spread over 4 months
  const today = new Date();
  
  const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(today.getDate() - daysAgo);
    return d;
  };

  const invoiceData = [
    {
      client: clientAcme,
      number: "INV-2026-001",
      status: "PAID" as const,
      daysAgo: 95,
      paidDaysAgo: 90,
      items: [
        { description: "SaaS Product Development", qty: 40, rate: 125 },
        { description: "UI/UX Design & Prototyping", qty: 15, rate: 95 }
      ]
    },
    {
      client: clientWayne,
      number: "INV-2026-002",
      status: "PAID" as const,
      daysAgo: 80,
      paidDaysAgo: 72,
      items: [
        { description: "Cloud Architecture Audit", qty: 10, rate: 150 }
      ]
    },
    {
      client: clientStark,
      number: "INV-2026-003",
      status: "PAID" as const,
      daysAgo: 60,
      paidDaysAgo: 50,
      items: [
        { description: "SaaS Product Development", qty: 80, rate: 125 }
      ]
    },
    {
      client: clientAcme,
      number: "INV-2026-004",
      status: "PAID" as const,
      daysAgo: 50,
      paidDaysAgo: 45,
      items: [
        { description: "UI/UX Design & Prototyping", qty: 30, rate: 95 }
      ]
    },
    {
      client: clientWayne,
      number: "INV-2026-005",
      status: "SENT" as const,
      daysAgo: 35,
      items: [
        { description: "SaaS Product Development", qty: 35, rate: 125 }
      ]
    },
    {
      client: clientStark,
      number: "INV-2026-006",
      status: "PAID" as const,
      daysAgo: 25,
      paidDaysAgo: 20,
      items: [
        { description: "Cloud Architecture Audit", qty: 15, rate: 150 }
      ]
    },
    {
      client: clientAcme,
      number: "INV-2026-007",
      status: "OVERDUE" as const,
      daysAgo: 40,
      items: [
        { description: "SaaS Product Development", qty: 50, rate: 125 }
      ]
    },
    {
      client: clientWayne,
      number: "INV-2026-008",
      status: "PAID" as const,
      daysAgo: 12,
      paidDaysAgo: 8,
      items: [
        { description: "UI/UX Design & Prototyping", qty: 20, rate: 95 }
      ]
    },
    {
      client: clientStark,
      number: "INV-2026-009",
      status: "DRAFT" as const,
      daysAgo: 2,
      items: [
        { description: "SaaS Product Development", qty: 15, rate: 125 }
      ]
    }
  ];

  for (const inv of invoiceData) {
    const issueDate = getPastDate(inv.daysAgo);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days terms
    
    const paidAt = inv.paidDaysAgo ? getPastDate(inv.paidDaysAgo) : null;

    let subtotal = 0;
    const itemsCreate = inv.items.map(item => {
      const amount = item.qty * item.rate;
      subtotal += amount;
      return {
        description: item.description,
        quantity: item.qty,
        rate: item.rate,
        amount,
        taxRate: 10
      };
    });

    const taxAmount = subtotal * 0.1;
    const total = subtotal + taxAmount;

    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: inv.client.id,
        number: inv.number,
        status: inv.status,
        issueDate,
        dueDate,
        subtotal,
        taxAmount,
        discount: 0,
        total,
        paidAt,
        items: {
          create: itemsCreate
        }
      }
    });
  }
}
