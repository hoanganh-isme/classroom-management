import twilio from "twilio";

function getTwilioConfiguration() {
    const accountSid =
        process.env.TWILIO_ACCOUNT_SID;

    const authToken =
        process.env.TWILIO_AUTH_TOKEN;

    const fromPhoneNumber =
        process.env.TWILIO_PHONE_NUMBER;

    if (
        !accountSid ||
        !authToken ||
        !fromPhoneNumber
    ) {
        throw new Error(
            "Twilio environment variables are missing.",
        );
    }

    return {
        accountSid,
        authToken,
        fromPhoneNumber,
    };
}

export async function sendAccessCode({
    phoneNumber,
    accessCode,
}) {
    const smsMode =
        process.env.SMS_MODE || "console";

    const messageBody = "sms_2fa";

    if (smsMode === "console") {
        console.log(
            `[DEV SMS] Access code for ${phoneNumber}: ${accessCode}`,
        );

        return {
            provider: "console",
            messageId: null,
        };
    }

    if (smsMode !== "twilio") {
        throw new Error(
            `Unsupported SMS_MODE: ${smsMode}`,
        );
    }

    const {
        accountSid,
        authToken,
        fromPhoneNumber,
    } = getTwilioConfiguration();

    const twilioClient = twilio(
        accountSid,
        authToken,
    );

    const message =
        await twilioClient.messages.create({
            body: messageBody,
            from: fromPhoneNumber,
            to: phoneNumber,
        });

    return {
        provider: "twilio",
        messageId: message.sid,
        status: message.status,
    };
}