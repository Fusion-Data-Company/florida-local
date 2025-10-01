import { Worker, Job } from "bullmq";
import * as sgMail from "@sendgrid/mail";
import { queueConnection } from "../redis";
import { logger } from "../monitoring";

interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  priority?: number;
}

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@thefloridalocal.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  logger.info("SendGrid API key configured");
} else {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SENDGRID_API_KEY is required in production environment");
  }
  logger.warn("SENDGRID_API_KEY not set - emails will not be sent");
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

function renderTemplate(template: string, data: Record<string, any>): string {
  const templateFn = emailTemplates[template as keyof typeof emailTemplates];
  
  if (!templateFn) {
    throw new Error(`Unknown email template: ${template}`);
  }
  
  return templateFn(data);
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendEmail(jobData: EmailJobData): Promise<string | null> {
  if (!SENDGRID_API_KEY) {
    logger.warn("Skipping email send - SENDGRID_API_KEY not configured", {
      to: jobData.to,
      subject: jobData.subject,
      template: jobData.template,
    });
    return null;
  }

  try {
    const html = renderTemplate(jobData.template, jobData.data);
    const text = stripHtmlTags(html);
    
    const msg = {
      to: jobData.to,
      from: EMAIL_FROM,
      subject: jobData.subject,
      html,
      text,
    };

    logger.info("Sending email via SendGrid", {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      template: jobData.template,
    });

    const response = await sgMail.send(msg);
    
    const messageId = (response[0]?.headers?.["x-message-id"] as string) || 
                      `sg_${Date.now()}`;

    logger.info("Email sent successfully via SendGrid", {
      to: msg.to,
      subject: msg.subject,
      messageId,
    });

    return messageId;
  } catch (error: any) {
    logger.error("Failed to send email via SendGrid", {
      to: jobData.to,
      subject: jobData.subject,
      template: jobData.template,
      error: error.message,
      statusCode: error.code,
      response: error.response?.body,
    });

    if (error.response?.statusCode === 429) {
      logger.warn("SendGrid rate limit hit - job will be retried");
    }

    throw error;
  }
}

// Email worker - processes email sending jobs
export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    const { to, subject, template, data } = job.data;
    
    logger.info("Processing email job", {
      jobId: job.id,
      to,
      subject,
      template,
      attemptsMade: job.attemptsMade,
    });
    
    try {
      const messageId = await sendEmail(job.data);
      
      logger.info("Email job completed successfully", {
        jobId: job.id,
        messageId,
      });
      
      return { 
        success: true, 
        messageId: messageId || `skipped_${job.id}`,
        skipped: !messageId,
      };
    } catch (error: any) {
      logger.error("Email job failed", {
        jobId: job.id,
        to,
        subject,
        template,
        error: error.message,
        attemptsMade: job.attemptsMade,
      });
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

// Queue email helper
export async function queueEmail(
  to: string,
  subject: string,
  template: keyof typeof emailTemplates,
  data: Record<string, any>,
  options?: { delay?: number; priority?: number }
) {
  const { emailQueue } = await import("../redis");
  
  if (!emailQueue) {
    throw new Error("Email queue is not available");
  }
  
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
  
  logger.info("Email queued", {
    to,
    subject,
    template,
    delay: options?.delay,
    priority: options?.priority,
  });
}

// Worker event handlers
emailWorker.on("completed", (job) => {
  logger.info("Email worker job completed", { jobId: job.id });
});

emailWorker.on("failed", (job, err) => {
  logger.error("Email worker job failed", {
    jobId: job?.id,
    error: err.message,
    stack: err.stack,
  });
});
