import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut,
} from "firebase/auth";
import { firebaseAuth } from "../config/firebase";

let recaptchaVerifier = null;
let confirmationResult = null;

// Maps Firebase Auth error codes to user-friendly error messages
function mapFirebasePhoneError(error) {
    if (!error) return "Phone authentication failed.";
    const code = error.code || "";

    switch (code) {
        case "auth/invalid-phone-number":
            return "Invalid phone number format. Please enter a valid E.164 phone number.";
        case "auth/too-many-requests":
            return "Too many verification attempts. Please try again later.";
        case "auth/invalid-verification-code":
            return "Invalid verification code. Please check and try again.";
        case "auth/code-expired":
            return "Verification code has expired. Please request a new code.";
        case "auth/quota-exceeded":
            return "SMS quota exceeded. Please try again later or use test phone numbers.";
        case "auth/user-disabled":
            return "This user account has been disabled in Firebase.";
        case "auth/captcha-check-failed":
            return "reCAPTCHA verification failed. Please try again.";
        case "auth/billing-not-enabled":
            return "Firebase Phone Auth requires a Blaze billing plan for real SMS, or use test phone numbers in dev mode.";
        default:
            return error.message || "Phone authentication failed. Please try again.";
    }
}

// Retrieves or initializes the RecaptchaVerifier instance
function getOrCreateRecaptchaVerifier(containerId = "recaptcha-container") {
    if (recaptchaVerifier) {
        return recaptchaVerifier;
    }

    const containerEl = document.getElementById(containerId);
    if (!containerEl) {
        console.warn(`reCAPTCHA container '#${containerId}' was not found in DOM.`);
    }

    recaptchaVerifier = new RecaptchaVerifier(
        firebaseAuth,
        containerId,
        {
            size: "invisible",
            callback: () => {},
            "expired-callback": () => {
                resetPhoneVerification();
            },
        }
    );

    return recaptchaVerifier;
}

// Sends Firebase Phone SMS OTP code via signInWithPhoneNumber
export async function sendPhoneVerificationCode(phoneNumber) {
    try {
        const verifier = getOrCreateRecaptchaVerifier();
        confirmationResult = await signInWithPhoneNumber(
            firebaseAuth,
            phoneNumber,
            verifier
        );
        return confirmationResult;
    } catch (error) {
        resetPhoneVerification();
        throw new Error(mapFirebasePhoneError(error));
    }
}

// Confirms the 6-digit OTP code with Firebase
export async function confirmPhoneVerificationCode(code) {
    if (!confirmationResult) {
        throw new Error("No active verification session. Please request a new code.");
    }

    try {
        const result = await confirmationResult.confirm(code);
        return result.user;
    } catch (error) {
        throw new Error(mapFirebasePhoneError(error));
    }
}

// Resets recaptcha verifier and confirmation result state
export function resetPhoneVerification() {
    if (recaptchaVerifier) {
        try {
            recaptchaVerifier.clear();
        } catch (e) {
            console.warn("Failed to clear recaptcha verifier:", e);
        }
        recaptchaVerifier = null;
    }
    confirmationResult = null;
}

// Signs out from Firebase Client Authentication session
export async function signOutFirebase() {
    try {
        await signOut(firebaseAuth);
    } catch (error) {
        console.warn("Firebase signout error:", error);
    }
}
