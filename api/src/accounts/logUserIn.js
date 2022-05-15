// "Log user in: 
// - create a session, 
// - create access & refresh tokens, and
// - store cookie" ...

import { createSession } from "./createSession.js";
// import { createTokens } from './tokens.js';
import { refreshTokens } from './user.js';

export async function logUserIn(userId, request, reply) {
    // "Get user connection info (ip, headers)"
    const connectionInfo = {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
    }
    // "Create a unique 'session' in the database (based on connection info)"
    const sessionToken = await createSession(userId, connectionInfo)
    // console.log('sessionToken:', sessionToken)
    // "Create JWT"
    // const { accessToken, refreshToken } = await createTokens(sessionToken, userId)
    // "Set current date"
    // const now = new Date();
    // "Get date, 30 days in the future"
    // const refreshExpires = now.setDate(now.getDate() + 30) // 30 day expiration
    // "Set Cookies"
    // reply.setCookie('refreshToken', refreshToken, {
    //     path: "/",
    //     domain: "localhost",
    //     httpOnly: true,
    //     expires: refreshExpires,
    // }).setCookie('accessToken', accessToken, {
    //     path: "/",
    //     domain: "localhost",
    //     httpOnly: true,
    // })
    await refreshTokens(sessionToken, userId, reply)
}