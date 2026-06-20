import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.EMAIL_FROM || "BillFlow <noreply@resend.dev>";

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  if (!resend) {
    console.warn("Resend API key missing. Email would have been sent to:", to, "Subject:", subject);
    return { success: true, mock: true };
  }

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
      }))
    });

    if (response.error) {
      console.error("Resend API error:", response.error);
      return { success: false, error: response.error };
    }

    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    return { success: false, error };
  }
}

// 1. Invoice Email Template
export async function sendInvoiceEmail(
  to: string,
  orgName: string,
  invoiceNumber: string,
  total: number,
  currency: string,
  dueDate: string,
  viewUrl: string,
  pdfBuffer?: Buffer
) {
  const subject = `New Invoice ${invoiceNumber} from ${orgName}`;
  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #7c3aed; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">BillFlow</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; color: #111827;">New Invoice from ${orgName}</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">You have received a new invoice from <strong>${orgName}</strong>. Details of the invoice are below:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Invoice Number</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Amount Due</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6;">${currency} ${total.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Due Date</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6;">${dueDate}</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 32px 0 20px 0;">
            <a href="${viewUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View & Pay Invoice</a>
          </div>
          
          <p style="font-size: 14px; line-height: 1.5; color: #6b7280; text-align: center;">We have attached a PDF copy of your invoice for your records.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          Powered by <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #7c3aed; text-decoration: none; font-weight: 600;">BillFlow</a>
        </div>
      </div>
    </div>
  `;

  const attachments = pdfBuffer ? [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }] : undefined;
  return sendEmail({ to, subject, html, attachments });
}

// 2. Payment Reminder Template
export async function sendReminderEmail(
  to: string,
  orgName: string,
  invoiceNumber: string,
  total: number,
  currency: string,
  dueDate: string,
  viewUrl: string
) {
  const subject = `Reminder: Invoice ${invoiceNumber} is due soon`;
  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #7c3aed; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">BillFlow</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; color: #111827;">Invoice Payment Reminder</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> from <strong>${orgName}</strong> is due on <strong>${dueDate}</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Invoice Number</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Amount Due</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6;">${currency} ${total.toFixed(2)}</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 32px 0 20px 0;">
            <a href="${viewUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View & Pay Invoice</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          Powered by <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #7c3aed; text-decoration: none; font-weight: 600;">BillFlow</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// 3. Invite Email Template
export async function sendInviteEmail(
  to: string,
  orgName: string,
  inviterName: string,
  inviteUrl: string
) {
  const subject = `Join ${orgName} on BillFlow`;
  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #7c3aed; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">BillFlow</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; color: #111827;">Join Your Team</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563;"><strong>${inviterName}</strong> has invited you to join the organization <strong>${orgName}</strong> on BillFlow.</p>
          
          <div style="text-align: center; margin: 32px 0 20px 0;">
            <a href="${inviteUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Accept Invitation</a>
          </div>
          
          <p style="font-size: 14px; line-height: 1.5; color: #6b7280;">If you don't have a BillFlow account, you will be prompted to create one first.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          Powered by <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #7c3aed; text-decoration: none; font-weight: 600;">BillFlow</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// 4. Payment Confirmation Template
export async function sendReceiptEmail(
  to: string,
  orgName: string,
  invoiceNumber: string,
  total: number,
  currency: string,
  paidAt: string
) {
  const subject = `Payment Received for Invoice ${invoiceNumber}`;
  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #10b981; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">BillFlow</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; color: #111827;">Thank You for Your Payment!</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">Your payment for invoice <strong>${invoiceNumber}</strong> has been successfully received and recorded.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Invoice Number</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Amount Paid</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6;">${currency} ${total.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Payment Date</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6;">${paidAt}</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          Powered by <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #7c3aed; text-decoration: none; font-weight: 600;">BillFlow</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// 5. Overdue Notice Template
export async function sendOverdueEmail(
  to: string,
  orgName: string,
  invoiceNumber: string,
  total: number,
  currency: string,
  dueDate: string,
  viewUrl: string
) {
  const subject = `URGENT: Invoice ${invoiceNumber} is OVERDUE`;
  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #ef4444; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #ef4444; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">BillFlow</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; color: #ef4444;">Overdue Invoice Notice</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">This is a formal notice that invoice <strong>${invoiceNumber}</strong> from <strong>${orgName}</strong> is now overdue. It was due on <strong>${dueDate}</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Invoice Number</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #ef4444; border-bottom: 1px solid #f3f4f6;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Overdue Amount</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #ef4444; border-bottom: 1px solid #f3f4f6;">${currency} ${total.toFixed(2)}</td>
            </tr>
          </table>

          <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin-bottom: 24px;">Please settle this payment as soon as possible to avoid disruption of services. Click the button below to view the invoice and pay.</p>

          <div style="text-align: center; margin: 32px 0 20px 0;">
            <a href="${viewUrl}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Pay Now</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          Powered by <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #7c3aed; text-decoration: none; font-weight: 600;">BillFlow</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
