const { getTransporter } = require('../config/email');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Naaber <noreply@naaber.com>',
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const templates = {
  memberApproved: (name, communityName) => ({
    subject: 'Your registration has been approved!',
    html: `
      <h2>Welcome to ${communityName}!</h2>
      <p>Hello ${name},</p>
      <p>Your registration has been approved by the community president.</p>
      <p>You can now log in and access all community features.</p>
      <p>Best regards,<br>Naaber Team</p>
    `,
    text: `Welcome to ${communityName}! Hello ${name}, Your registration has been approved. You can now log in.`
  }),

  memberRejected: (name, communityName) => ({
    subject: 'Registration update',
    html: `
      <h2>Registration Update</h2>
      <p>Hello ${name},</p>
      <p>Unfortunately, your registration request for ${communityName} was not approved.</p>
      <p>Please contact the community president for more information.</p>
      <p>Best regards,<br>Naaber Team</p>
    `,
    text: `Hello ${name}, Your registration for ${communityName} was not approved. Please contact the president.`
  }),

  newAnnouncement: (recipientName, communityName, title, content, authorName) => ({
    subject: `New announcement: ${title}`,
    html: `
      <h2>New Announcement in ${communityName}</h2>
      <p>Hello ${recipientName},</p>
      <p><strong>${authorName}</strong> posted a new announcement:</p>
      <h3>${title}</h3>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        ${content}
      </div>
      <p><a href="${process.env.FRONTEND_URL}/announcements">View in app</a></p>
      <p>Best regards,<br>Naaber Team</p>
    `,
    text: `New announcement in ${communityName}: ${title} - ${content}`
  }),

  newEvent: (recipientName, communityName, title, date, location) => ({
    subject: `New event: ${title}`,
    html: `
      <h2>New Event in ${communityName}</h2>
      <p>Hello ${recipientName},</p>
      <p>A new event has been scheduled:</p>
      <h3>${title}</h3>
      <p><strong>Date:</strong> ${new Date(date).toLocaleString()}</p>
      <p><strong>Location:</strong> ${location || 'TBD'}</p>
      <p><a href="${process.env.FRONTEND_URL}/events">View in app</a></p>
      <p>Best regards,<br>Naaber Team</p>
    `,
    text: `New event in ${communityName}: ${title} on ${new Date(date).toLocaleString()}`
  }),

  resetPassword: (name, resetUrl) => ({
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Naaber Team</p>
    `,
    text: `Password reset link: ${resetUrl}. This link expires in 1 hour.`
  })
};

// Send templated emails
const sendTemplatedEmail = async (to, templateName, ...args) => {
  if (!templates[templateName]) {
    throw new Error(`Template ${templateName} not found`);
  }

  const { subject, html, text } = templates[templateName](...args);
  return sendEmail({ to, subject, html, text });
};

module.exports = {
  sendEmail,
  sendTemplatedEmail,
  templates
};
