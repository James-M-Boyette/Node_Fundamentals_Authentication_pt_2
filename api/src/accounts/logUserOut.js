import jwt from "jsonwebtoken";

const { ROOT_DOMAIN, JWT_SIGNATURE } = process.env;

export async function logUserOut(request, reply) {
	try {
		// "Get 'session' collection (from database)"
		const { session } = await import("../session/session.js");
		// Get refresh Token
		// "If refresh token exists"
		console.log("Session (logout):", session);
		if (request?.cookies?.refreshToken) {
			// Store refresh token
			const { refreshToken } = request.cookies;
			console.log("refreshToken:", refreshToken);
			// "Decode refresh token & get sessionId"
			// Decode Session Token from Refresh
			const { sessionId } = jwt.verify(refreshToken, JWT_SIGNATURE);
			// const { sessionToken } = jwt.verify(refreshToken, JWT_SIGNATURE);
			console.log("sessionId:", sessionId);
			// console.log('sessionToken:', sessionToken);

			// Delete database record for session
			await session.deleteOne({ sessionToken: sessionId });
		}
		// Necessary bc now that we're doing cross-origin / two different urls, we need to make sure we're deleting cookies for nodeauth.dev *instead* or our api's api.nodeauth.dev
		const cookieOptions = {
			path: "/",
			domain: ROOT_DOMAIN,
			httpOnly: true,
			secure: true,
		};
		// Remove cookies
		reply
			.clearCookie("refreshToken", cookieOptions)
			.clearCookie("accessToken", cookieOptions);
	} catch (e) {
		console.error(e);
	}
}
