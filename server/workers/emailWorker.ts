import { Worker, Job } from "bullmq";
import { queueConnection } from "../redis";

interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  priority?: number;
}

// Email worker - processes email sending jobs
export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    const { to, subject, template, data } = job.data;
    
    console.log(`📧 Processing email job ${job.id}: ${subject} to ${to}`);
    
    try {
      // TODO: Integrate with SendGrid or other email service
      // For now, we'll simulate email sending
      await simulateEmailSend(job.data);
      
      // Log success
      console.log(`✅ Email sent successfully: ${job.id}`);
      
      return { success: true, messageId: `msg_${job.id}` };
    } catch (error) {
      console.error(`❌ Email job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: queueConnection,
    concurrency: 5,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

async function simulateEmailSend(data: EmailJobData): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, replace with actual email service call:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: data.to,
  //   from: 'noreply@thefloridalocal.com',
  //   subject: data.subject,
  //   html: renderTemplate(data.template, data.data),
  // });
}

// Email templates
export const emailTemplates = {
  welcome: (data: any) => `
    <h1>Welcome to The Florida Local, ${data.name}!</h1>
    <p>We're excited to have you join our community.</p>
  `,
  
  orderConfirmation: (data: any) => `
    <h1>Order Confirmed!</h1>
    <p>Order #${data.orderId} has been confirmed.</p>
    <p>Total: $${data.total}</p>
  `,
  
  businessVerified: (data: any) => `
    <h1>Congratulations!</h1>
    <p>Your business "${data.businessName}" has been verified.</p>
  `,
  
  spotlightNotification: (data: any) => `
    <h1>You're in the Spotlight!</h1>
    <p>Your business has been selected for the ${data.type} spotlight.</p>
  `,
};

// Queue email helper
export async function queueEmail(
  to: string,
  subject: string,
  template: keyof typeof emailTemplates,
  data: Record<string, any>,
  options?: { delay?: number; priority?: number }
) {
  const { emailQueue } = await import("../redis");
  
  await emailQueue.add(
    "send-email",
    {
      to,
      subject,
      template,
      data,
      priority: options?.priority,
    },
    {
      delay: options?.delay,
      priority: options?.priority || 0,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    }
  );
}

// Worker event handlers
emailWorker.on("completed", (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Email job ${job?.id} failed:`, err);
});
