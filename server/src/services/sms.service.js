export async function sendAccessCode({
    phoneNumber,
    accessCode,
}) {
    const smsMode = process.env.SMS_MODE || "console";

    if (smsMode === "console") {
        console.log(
            `[DEV SMS] Access code for ${phoneNumber}: ${accessCode}`,
        );

        return {
            provider: "console",
        };
    }

    throw new Error(
        "SMS provider has not been configured.",
    );
}