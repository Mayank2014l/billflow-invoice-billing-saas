# 🚀 BillFlow - Modern Invoice & Billing SaaS Platform

BillFlow is a complete, production-ready, multi-tenant Invoice and Billing SaaS platform designed for freelancers, creators, and small businesses. It features organization workspace management, role-based access control (RBAC), automatic PDF generation, Stripe subscription billing, a local UPI QR payment bypass gateway, visual charts analytics, recurring invoice schedulers, and comprehensive audit logging.

## 🎨 Visual Features & Preview
- **Beautiful Dashboard**: At-a-glance revenue summaries, collection speed, and workspace usage trackers.
- **Interactive Invoice Builder**: Build professional invoices with autocompleting products, client directories, and multiple template styles (*Modern*, *Classic*, *Minimal*).
- **Multi-Tenant Workspaces**: Switch between organizations instantly with complete cookie-backed state preservation and strict database-level isolation.
- **Dark/Light Mode**: Smooth transitions with a Tailwind CSS v4 class-based dark mode theme.

---

## ⚡ Tech Stack & Architecture

- **Framework**: Next.js 15+ (App Router)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5 (Auth.js)](https://authjs.dev/) with Google, GitHub, Magic Links, and Developer Credentials.
- **Styling**: Tailwind CSS v4 (Vanilla Theme styling)
- **PDF Engine**: `@react-pdf/renderer` (Server-side buffered stream rendering)
- **Email Delivery**: [Resend API](https://resend.com/)
- **Payment Processing**: Stripe Checkout & Webhooks + **UPI QR Gateway Bypass** (for local Indian merchant fallback)
- **Charts & Visualization**: Recharts (responsive area, pie, and bar charts)

---

## 🚀 Key Modules & Capabilities

### 1. Multi-Tenant Database Isolation
Data isolation is securely enforced at the ORM layer. Prisma is extended dynamically (`getTenantDb(orgId)`) to automatically filter and inject `organizationId` for all scoped queries, preventing cross-tenant leakage.

### 2. Tax Presets Manager
Workspace admins/owners can configure tax rates (e.g. GST 18%, VAT 5%) in Settings. These presets load dynamically into the Invoice Builder line items dropdown, with support for quick "Custom..." overrides.

### 3. Audit Logging & CSV Export
Every security action (workspace creation, invoice deletes, client additions, role changes) is recorded in a secure audit ledger. Admins can view paginated activity and export the logs to a downloadable `.csv` file.

### 4. Billing & UPI Upgrade Gateway
Supports dual upgrading paths:
1. **Stripe Subscription checkout** (Pro plan at ₹499/mo).
2. **UPI QR Code payment modal** (local fallback using UTR/Ref ID input for instant workspace upgrade validation).

---

## 🛠️ Getting Started

### Prerequisites
- Node.js v18.x or v20.x
- PostgreSQL database instance

### 1. Clone the repository
```bash
git clone https://github.com/Mayank2014l/billflow-invoice-billing-saas.git
cd billflow-invoice-billing-saas
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/billflow?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/billflow?schema=public"

# NextAuth v5 Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-random-key"

# NextAuth OAuth Credentials (Optional in Dev)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Resend API Key (Optional in Dev - falls back to terminal print)
RESEND_API_KEY=""

# Stripe Credentials (Optional)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRO_PRICE_ID=""

# UPI Payment Settings
NEXT_PUBLIC_UPI_ID="pay-billflow@upi"
```

### 4. Run Migrations & Generate Client
```bash
npx prisma db push
npx prisma generate
```

### 5. Launch Local Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔐 Local Developer Bypass (Onboarding Demo)
During local testing, you don't need to configure Google OAuth or Resend keys:
- Click the **`🚀 Quick Demo Login`** button on the Login page to instantly seed a test workspace with dummy clients, products, and invoices.
- You can type any email address in the credential box and enter to log in instantly.
