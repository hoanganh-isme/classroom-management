import twilio from "twilio";

let twilioClientInstance = null;

// Validates and retrieves the Twilio configuration and SDK client
function getTwilioClient() {
    if (twilioClientInstance) {
        return twilioClientInstance;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhoneNumber) {
        const error = new Error("Twilio SMS is not configured.");
        error.statusCode = 500;
        throw error;
    }

    twilioClientInstance = twilio(accountSid, authToken);
    return twilioClientInstance;
}

// Sends an SMS access code via Console (Dev) or Twilio API
export async function sendAccessCode({
    phoneNumber,
    accessCode,
    expiresInSeconds = 300,
}) {
    const smsMode = process.env.SMS_MODE || "console";

    const ttlMinutes = Math.ceil(expiresInSeconds / 60);
    const messageBody = `Your Classroom Management verification code is ${accessCode}. This code expires in ${ttlMinutes} minutes.`;

    // 1. Console Mode (Development)
    if (smsMode === "console") {
        console.log(
            `[DEV SMS] Access code for ${phoneNumber}: ${accessCode}`,
        );

        return {
            provider: "console",
            messageId: null,
            status: "logged",
        };
    }

    // 2. Unsupported SMS Mode Validation
    if (smsMode !== "twilio") {
        const error = new Error(`Unsupported SMS_MODE: ${smsMode}`);
        error.statusCode = 500;
        throw error;
    }

    // 3. Twilio Mode (Production Delivery)
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const client = getTwilioClient();

    try {
        const message = await client.messages.create({
            body: messageBody,
            from: fromPhoneNumber,
            to: phoneNumber,
        });

        return {
            provider: "twilio",
            messageId: message.sid,
            status: message.status,
        };
    } catch (error) {
        // Safe diagnostic server logging (never exposes authToken, secrets, or full credentials)
        console.error("Twilio SMS delivery failed:", {
            code: error.code,
            status: error.status,
            message: error.message,
        });

        const deliveryError = new Error("Unable to send SMS access code.");
        deliveryError.statusCode = error.status || 502;
        throw deliveryError;
    }
}