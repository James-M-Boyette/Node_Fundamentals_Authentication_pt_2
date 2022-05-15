import jwt from "jsonwebtoken";

// Import JWT signature
const JWTSignature = process.env.JWT_SIGNATURE

export async function logUserOut(request, reply) {
    try {
        // "Get 'session' collection (from database)"
        const { session } = await import("../session/session.js");
        // Get refresh Token
        // "If refresh token exists"
        if (request?.cookies?.refreshToken) {
            // Store refresh token
            const { refreshToken } = request.cookies;
            // console.log('refreshToken:', refreshToken)
            // "Decode refresh token & get sessionId"
            // Decode Session Token from Refresh
            const { sessionId } = jwt.verify(refreshToken, JWTSignature);
            // const { sessionToken } = jwt.verify(refreshToken, JWTSignature);
            // console.log('sessionId:', sessionId);
            // console.log('sessionToken:', sessionToken);

            // Delete database record for session
            await session.deleteOne({ sessionToken: sessionId }) 
    }
    // Remove cookies
      reply.clearCookie('refreshToken').clearCookie('accessToken')
    } catch (e) {
        console.error(e)
    }
}