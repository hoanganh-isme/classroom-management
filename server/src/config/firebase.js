import { readFileSync } from "node:fs";
import {
    cert,
    getApps,
    initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountPath = new URL(
    "../../serviceAccountKey.json",
    import.meta.url,
);

let serviceAccount;

try {
    const serviceAccountContent = readFileSync(
        serviceAccountPath,
        "utf8",
    );

    serviceAccount = JSON.parse(serviceAccountContent);
} catch (error) {
    console.error("Cannot read Firebase service account key.");
    console.error(error.message);

    process.exit(1);
}


const firebaseApp =
    getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert(serviceAccount),
        });

export const db = getFirestore(firebaseApp);