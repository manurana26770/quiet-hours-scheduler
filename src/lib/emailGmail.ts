import nodemailer from 'nodemailer'

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER!, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD! // Gmail App Password
  }
})

// Email template for quiet block reminders
export function createReminderEmailTemplate({
  userName,
  blockName,
  startTime,
  endTime,
  description,
  location,
  category,
  reminderMinutes,
}: {
  userName: string
  blockName: string
  startTime: Date
  endTime: Date
  description?: string
  location?: string
  category?: string
  reminderMinutes: number
}) {
  const startTimeFormatted = startTime.toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  const endTimeFormatted = endTime.toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  return {
    subject: `Quiet Block Reminder: ${blockName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quiet Block Reminder</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
              Quiet Block Reminder
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hello <strong>${userName}</strong>,
            </p>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              This is a friendly reminder that your quiet block is starting soon:
            </p>
            
            <!-- Block Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 20px 0;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">
                ${blockName}
              </h2>
              
              <div style="margin-bottom: 15px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Start Time</span>
                <p style="color: #1f2937; font-size: 16px; margin: 5px 0 0 0; font-weight: 600;">
                  ${startTimeFormatted}
                </p>
              </div>
              
              <div style="margin-bottom: 15px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">End Time</span>
                <p style="color: #1f2937; font-size: 16px; margin: 5px 0 0 0; font-weight: 600;">
                  ${endTimeFormatted}
                </p>
              </div>
              
              ${description ? `
              <div style="margin-bottom: 15px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Description</span>
                <p style="color: #374151; font-size: 15px; margin: 5px 0 0 0; line-height: 1.5;">
                  ${description}
                </p>
              </div>
              ` : ''}
              
              ${location ? `
              <div style="margin-bottom: 15px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Location</span>
                <p style="color: #374151; font-size: 15px; margin: 5px 0 0 0;">
                  ${location}
                </p>
              </div>
              ` : ''}
              
              ${category ? `
              <div style="margin-bottom: 15px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Category</span>
                <p style="color: #374151; font-size: 15px; margin: 5px 0 0 0;">
                  ${category.charAt(0).toUpperCase() + category.slice(1)}
                </p>
              </div>
              ` : ''}
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
                Time to prepare for your quiet time! 🧘‍♀️
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Find a quiet space and get ready to focus.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
              This reminder was sent ${reminderMinutes} minutes before your quiet block starts.<br>
              Sent by Quiet Hours Scheduler
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Quiet Block Reminder: ${blockName}
      
      Hello ${userName},
      
      This is a friendly reminder that your quiet block is starting soon:
      
      ${blockName}
      Start Time: ${startTimeFormatted}
      End Time: ${endTimeFormatted}
      ${description ? `Description: ${description}` : ''}
      ${location ? `Location: ${location}` : ''}
      ${category ? `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}` : ''}
      
      Time to prepare for your quiet time! 🧘‍♀️
      Find a quiet space and get ready to focus.
      
      This reminder was sent ${reminderMinutes} minutes before your quiet block starts.
      Sent by Quiet Hours Scheduler
    `
  }
}

// Send email using Gmail SMTP
export async function sendReminderEmail({
  to,
  userName,
  blockName,
  startTime,
  endTime,
  description,
  location,
  category,
  reminderMinutes,
}: {
  to: string
  userName: string
  blockName: string
  startTime: Date
  endTime: Date
  description?: string
  location?: string
  category?: string
  reminderMinutes: number
}) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.')
    }

    const emailTemplate = createReminderEmailTemplate({
      userName,
      blockName,
      startTime,
      endTime,
      description,
      location,
      category,
      reminderMinutes,
    })

    const info = await transporter.sendMail({
      from: `"Quiet Hours Scheduler" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`❌ Failed to send email via Gmail SMTP to ${to}:`, error)
    throw error
  }
}

// Fallback email service (for development/testing)
export async function sendEmailFallback({
  to: _to,
  subject: _subject,
  html: _html,
  text: _text,
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  // For development/testing - just log the email
  
  return { success: true, fallback: true }
}
