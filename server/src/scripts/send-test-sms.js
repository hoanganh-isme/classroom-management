import "dotenv/config";

import {
    sendAccessCode,
} from "../services/sms.service.js";

const phoneNumber = "+84818528799";
const accessCode = "123456";

try {
    const result = await sendAccessCode({
        phoneNumber,
        accessCode,
    });

    console.log("SMS request succeeded.");
    console.log(result);
} catch (error) {
    console.error("SMS request failed.");

    console.error({
        code: error.code,
        status: error.status,
        message: error.message,
        moreInfo: error.moreInfo,
    });
}