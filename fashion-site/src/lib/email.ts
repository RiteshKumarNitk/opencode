import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type EmailType = 
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'return_requested'
  | 'return_approved'
  | 'return_rejected'
  | 'password_reset'
  | 'welcome';

interface EmailData {
  orderNumber?: string;
  customerName?: string;
  email?: string;
  totalAmount?: number;
  items?: any[];
  trackingNumber?: string;
  returnNumber?: string;
  resetToken?: string;
}

const emailTemplates: Record<EmailType, { subject: string; body: string }> = {
  order_confirmation: {
    subject: 'Order Confirmed - {{orderNumber}}',
    body: `
      <h1>Order Confirmed!</h1>
      <p>Dear {{customerName}},</p>
      <p>Your order <strong>{{orderNumber}}</strong> has been confirmed.</p>
      <p>Total Amount: ₹{{totalAmount}}</p>
      <p>We'll notify you when your order is shipped.</p>
      <p>Thank you for shopping with us!</p>
    `,
  },
  order_shipped: {
    subject: 'Your Order Has Been Shipped - {{orderNumber}}',
    body: `
      <h1>Order Shipped!</h1>
      <p>Dear {{customerName}},</p>
      <p>Your order <strong>{{orderNumber}}</strong> has been shipped.</p>
      <p>Tracking Number: {{trackingNumber}}</p>
      <p>Expected delivery: 3-5 business days</p>
    `,
  },
  order_delivered: {
    subject: 'Order Delivered - {{orderNumber}}',
    body: `
      <h1>Order Delivered!</h1>
      <p>Dear {{customerName}},</p>
      <p>Your order <strong>{{orderNumber}}</strong> has been delivered.</p>
      <p>We hope you love your purchase!</p>
      <p>Don't forget to leave a review.</p>
    `,
  },
  order_cancelled: {
    subject: 'Order Cancelled - {{orderNumber}}',
    body: `
      <h1>Order Cancelled</h1>
      <p>Dear {{customerName}},</p>
      <p>Your order <strong>{{orderNumber}}</strong> has been cancelled.</p>
      <p>If you paid online, your refund will be processed within 5-7 business days.</p>
    `,
  },
  return_requested: {
    subject: 'Return Request Received - {{returnNumber}}',
    body: `
      <h1>Return Request Received</h1>
      <p>Dear {{customerName}},</p>
      <p>We've received your return request for order <strong>{{orderNumber}}</strong>.</p>
      <p>Return Number: {{returnNumber}}</p>
      <p>We'll review your request within 2-3 business days.</p>
    `,
  },
  return_approved: {
    subject: 'Return Approved - {{returnNumber}}',
    body: `
      <h1>Return Approved!</h1>
      <p>Dear {{customerName}},</p>
      <p>Your return request <strong>{{returnNumber}}</strong> has been approved.</p>
      <p>Refund will be processed within 5-7 business days.</p>
    `,
  },
  return_rejected: {
    subject: 'Return Request Rejected - {{returnNumber}}',
    body: `
      <h1>Return Request Update</h1>
      <p>Dear {{customerName}},</p>
      <p>Unfortunately, your return request <strong>{{returnNumber}}</strong> has been rejected.</p>
      <p>For more details, please contact our support team.</p>
    `,
  },
  password_reset: {
    subject: 'Reset Your Password',
    body: `
      <h1>Reset Your Password</h1>
      <p>Dear {{customerName}},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="{{resetToken}}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  },
  welcome: {
    subject: 'Welcome to Fashion Store!',
    body: `
      <h1>Welcome!</h1>
      <p>Dear {{customerName}},</p>
      <p>Thank you for joining Fashion Store.</p>
      <p>Get ready for exclusive deals and the latest fashion trends!</p>
      <p>Happy Shopping!</p>
    `,
  },
};

export async function sendEmail(
  to: string,
  type: EmailType,
  data: EmailData
) {
  if (!process.env.SMTP_USER) {
    console.log('Email not configured. Would send:', { to, type, data });
    return { success: true, simulated: true };
  }

  try {
    const template = emailTemplates[type];
    let subject = template.subject;
    let body = template.body;

    // Replace placeholders
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value || ''));
      body = body.replace(regex, String(value || ''));
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Fashion Store" <noreply@fashionstore.com>',
      to,
      subject,
      html: body,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  body: string
) {
  if (!process.env.SMTP_USER) {
    console.log('Bulk email not configured. Would send to:', recipients.length, 'recipients');
    return { success: true, simulated: true };
  }

  const results = await Promise.allSettled(
    recipients.map(email => 
      transporter.sendMail({
        from: process.env.SMTP_FROM || '"Fashion Store" <noreply@fashionstore.com>',
        to: email,
        subject,
        html: body,
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  return { success: true, sent: successful, failed: recipients.length - successful };
}