// "" ...
import mongo from "mongodb";
const { ObjectId } = mongo;
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const { genSalt, hash } = bcrypt;

import { createTokens } from "./tokens.js";
// Import JWT signature
const JWTSignature = process.env.JWT_SIGNATURE;

// Safari fix ("Cookies in Safari")
const { ROOT_DOMAIN } = process.env;

// "Get access & refresh tokens"
export async function getUserFromCookies(request, reply) {
	try {
		// "Get 'user' & 'session' collections (from database)"
		const { user } = await import("../user/user.js");
		const { session } = await import("../session/session.js");

		// "Check to make sure access token exists"
		if (request?.cookies?.accessToken) {
			// "Optional Chaining" - doesn't trigger errors
			// "If access token exists"
			const { accessToken } = request.cookies;
			// "Decode access token"
			const decodedAccessToken = jwt.verify(accessToken, JWTSignature);
			// "Return user from record"
			return user.findOne({
				_id: ObjectId(decodedAccessToken.userId),
			});
		}
		// "Check whether session is valid"
		if (request?.cookies?.refreshToken) {
			// "If refresh token exists"
			const { refreshToken } = request.cookies;
			console.log("refreshToken:", refreshToken);
			// "Decode refresh token & get sessionId"
			const { sessionId } = jwt.verify(refreshToken, JWTSignature);
			// const { sessionToken } = jwt.verify(refreshToken, JWTSignature);
			// console.log('sessionId:', sessionId);
			// console.log('sessionToken:', sessionToken);
			// "Look up session"
			const currentSession = await session.findOne({
				sessionToken: sessionId,
			}); // This works
			// const currentSession = await session.findOne({ sessionToken }) // This does not
			// const currentSession = session.findOne( sessionToken ) // This works
			console.log("currentSession", currentSession);
			if (currentSession.valid) {
				// "Look up current user"
				const currentUser = await user.findOne({
					_id: ObjectId(currentSession.userId),
				});
				console.log("currentUser:", currentUser);
				// "Refresh tokens"
				await refreshTokens(sessionId, currentUser._id, reply);
				// "Return current user"
				return currentUser;
			}
		}

		// "Else decode refresh token"

		// "If session is valid"
	} catch (e) {
		console.error(e);
	}
}

export async function refreshTokens(sessionToken, userId, reply) {
	try {
		// LATER MODULARIZE THIS FOR BOTH USER.JS AND LOGUSERIN.JS
		// "Create JWT"
		const { accessToken, refreshToken } = await createTokens(
			sessionToken,
			userId
		);
		// "Set current date"
		const now = new Date();
		// "Get date, 30 days in the future"
		const refreshExpires = now.setDate(now.getDate() + 30); // 30 day expiration
		// "Set Cookies"
		reply
			.setCookie("refreshToken", refreshToken, {
				path: "/",
				domain: ROOT_DOMAIN,
				httpOnly: true,
				expires: refreshExpires,
			})
			.setCookie("accessToken", accessToken, {
				path: "/",
				domain: ROOT_DOMAIN,
				httpOnly: true,
			});
	} catch (e) {
		console.error(e);
	}
}

export async function changePassword(userId, newPassword) {
	try {
		// "Get 'user' collection (from database)"
		const { user } = await import("../user/user.js");
		// "Generate salt"
		const salt = await genSalt(10); // Specifies how long the salt should be

		// "Generate encrypted pw w/ hash + salt"
		const hashedPassword = await hash(newPassword, salt);

		// Update User PW
		return user.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					password: hashedPassword,
				},
			}
		);
	} catch (e) {
		console.error(e);
	}
}

export async function register2FA(userId, secret) {
	try {
		// "Get 'user' collection (from database)"
		const { user } = await import("../user/user.js");

		// Update User PW
		return user.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					authenticator: secret,
				},
			}
		);
	} catch (e) {
		console.error(e);
	}
}
