import nodemailer from "nodemailer";

function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
}

export async function sendStudentWelcomeEmail({ name, email, phone }) {
    const emailMode = process.env.EMAIL_MODE || "console";
    const appName = "Classroom Management System";
    const loginUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const subject = `Welcome to ${appName} - Your Student Account Credentials`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #1677ff;">Welcome to ${appName}, ${name}!</h2>
            <p>Your student account has been successfully created by your instructor.</p>
            
            <div style="background: #f4f6f8; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e6eb;">
                <h3 style="margin-top: 0; color: #1d2129;">Account Login Credentials & Info:</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Registered Phone:</strong> ${phone}</p>
                <p><strong>Registered Email:</strong> ${email}</p>
                <p><strong>Role:</strong> Student</p>
                <p><strong>Authentication Method:</strong> Passwordless OTP Access Code</p>
            </div>

            <p>To log in to your account:</p>
            <ol>
                <li>Open the portal at <a href="${loginUrl}">${loginUrl}</a></li>
                <li>Enter your registered phone number: <strong>${phone}</strong></li>
                <li>Enter the 6-digit access code sent to your phone to sign in.</li>
            </ol>

            <p style="color: #888; font-size: 12px; margin-top: 24px;">If you have any questions, please contact your instructor.</p>
        </div>
    `;

    if (emailMode === "console") {
        console.log("=================================================");
        console.log(`[DEV EMAIL] Sending Student Welcome Email to ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Student Name: ${name}`);
        console.log(`Registered Phone: ${phone}`);
        console.log(`Login URL: ${loginUrl}`);
        console.log("=================================================");
        return { provider: "console", success: true };
    }

    const transporter = getTransporter();
    if (!transporter) {
        console.log(`[DEV EMAIL - Fallback] SMTP credentials missing. Logged welcome email to console for ${email}`);
        return { provider: "console", success: true };
    }

    const mailOptions = {
        from: `"${appName}" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP EMAIL] Sent welcome email to ${email}. MessageId: ${info.messageId}`);
    return { provider: "smtp", messageId: info.messageId };
}

export async function sendStudentSetupEmail({
    name,
    email,
    setupUrl,
    expiresInHours,
}) {
    const emailMode = process.env.EMAIL_MODE || "console";
    const appName = "Classroom Management System";
    const subject = `Set up your ${appName} account`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #333;">
            <h2>Welcome, ${name}!</h2>
            <p>Your instructor has created a student account for you.</p>
            <p>Click the button below to create your username and password.</p>

            <p style="margin: 24px 0;">
                <a href="${setupUrl}" style="display: inline-block; padding: 12px 20px; background: #1677ff; color: white; text-decoration: none; border-radius: 6px;">
                    Set up account
                </a>
            </p>

            <p>This link expires in ${expiresInHours} hours.</p>
            <p>If you did not expect this email, you can safely ignore it.</p>
        </div>
    `;

    if (emailMode === "console") {
        console.log("========================================");
        console.log(`[DEV EMAIL] Student setup email: ${email}`);
        console.log(`Setup URL: ${setupUrl}`);
        console.log("========================================");
        return { provider: "console", success: true };
    }

    const transporter = getTransporter();
    if (!transporter) {
        console.log(`[DEV EMAIL - Fallback] SMTP credentials missing. Logged setup link to console for ${email}: ${setupUrl}`);
        return { provider: "console", success: true };
    }

    const info = await transporter.sendMail({
        from: `"${appName}" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: htmlContent,
    });

    console.log(`[SMTP EMAIL] Sent setup email to ${email}. MessageId: ${info.messageId}`);
    return { provider: "smtp", messageId: info.messageId };
}
