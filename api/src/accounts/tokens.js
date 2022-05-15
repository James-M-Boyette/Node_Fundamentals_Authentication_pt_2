// "Create refresh & access tokens" ...

import jwt from "jsonwebtoken";

// Import JWT signature
const JWTSignature = process.env.JWT_SIGNATURE

export async function createTokens(sessionToken, userId) {
    try {
        // "Create 'refresh' token"
            // Requires *session id*
        const refreshToken = jwt.sign({
            sessionId: sessionToken
        }, JWTSignature)
        // "Create 'access' token"
            // Session Id, User Id
        const accessToken = jwt.sign({
            // sessionId: sessionToken,
            sessionToken,
            userId,
        }, JWTSignature)
        // "Return Refresh Token & Access Token"
        return { refreshToken, accessToken }
    } catch (e) {
        console.error(e)
    }
}