// "Create a 'session' (contemporary event)" ...

import { randomBytes } from "crypto";

export async function createSession(userId, connectionInfo) {
    try {
        // "Generate a session 'token' (a randomized / relatively-unique string)"
        const sessionToken = randomBytes(42).toString('hex');
        // "Store connection info (passed from logUserIn() )"
        const { ip, userAgent } = connectionInfo;
        // "Import 'sessions' collection (from database)"
        const { session } = await import("../session/session.js");
        // "Add session to database"
        await session.insertOne({
            sessionToken,
            userId,
            valid: true,
            userAgent,
            ip,
            updatedAt: new Date(),
            createdAt: new Date(),
        })
        // "Return session token"
        return sessionToken

    } catch (e) {
        console.error(e)
        throw new Error('Session Creation Failed')
    }
}