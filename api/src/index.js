// "Enivronment Variables"
import "./env.js"; // "Loads & runs file immediately"; clarify later

// "Server Library"
import { fastify } from "fastify";

// "Static File Directory Plugin"
import fastifyStatic from "@fastify/static";

// "ESM Work-Arounds for __dirname"
import path from "path";
import { fileURLToPath } from "url";

// "Cookie "
// import fastifyCookie from 'fastify-cookie';
import fastifyCookie from "@fastify/cookie";

// "CORS"
import fastifyCors from "@fastify/cors";

// "Salted user credentials"
import { registerUser } from "./accounts/register.js";

// "Database connection"
import { connectDB } from "./db.js";

// "Verify User Credentials"
import { authorizeUser } from "./accounts/authorize.js";

//
import { logUserIn } from "./accounts/logUserIn.js";
import { logUserOut } from "./accounts/logUserOut.js";

import {
	getUserFromCookies,
	changePassword,
	register2FA,
} from "./accounts/user.js";

// Testing Email
import { sendEmail, mailInit } from "./mail/index.js";

import {
	createVerifyEmailLink,
	validateVerifyEmail,
} from "./accounts/verify.js";

import { createResetLink, validateResetEmail } from "./accounts/reset.js";

import { authenticator } from "@otplib/preset-default";

// "Constants / Middleware"
// "ESM-specific syntax requirements for accessing static files"
const __filename = fileURLToPath(import.meta.url); // get metadata about files
const __dirname = path.dirname(__filename);
const app = fastify();
const PORT = 3000;

// console.log(process.env.MONGO_URL)
// console.log(process.env.COOKIE_SIGNATURE)

async function startApp() {
	try {
		// const transporter = await mailInit()
		await mailInit();

		app.register(fastifyCors, {
			origin: [/\.nodeauth.dev/, "https://nodeauth.dev"],
			credentials: true,
		});

		app.register(fastifyCookie, {
			// Import Cookie signature
			secret: process.env.COOKIE_SIGNATURE,
		});

		// "Root Directory"
		app.register(fastifyStatic, {
			root: path.join(__dirname, "public"),
		});

		app.get("/api/user", {}, async (request, reply) => {
			// "Get current user"
			const user = await getUserFromCookies(request, reply);
			if (user) {
				return reply.send({
					data: {
						user,
					},
				});
			}
			reply.send({});
		});

		// "Routes"
		app.get("/test", {}, async (request, reply) => {
			try {
				// "Verify user login"
				const user = await getUserFromCookies(request, reply);
				// "Return user email *if* it exists; else return 'unauthorized'"
				// console.log(request.headers['user-agent']);
				if (user?._id) {
					reply.send({
						data: user,
					});
				} else {
					reply.send({
						data: "User look-up failed ...",
					});
				}
			} catch (e) {
				throw new Error(e);
			}
		});

		app.post("/api/2fa-register", {}, async (request, reply) => {
			// "Verify user login"
			const user = await getUserFromCookies(request, reply);
			const { token, secret } = request.body;
			console.log("2FA REGISTER token, secret", token, secret);
			const isValid = authenticator.verify({ token, secret });
			console.log("2fa-register (api) isValid", isValid);
			if (user._id && isValid) {
				await register2FA(user._id, secret);
				reply.send("success 2fa register");
			}
			reply.code(401).send();
		});

		app.post("/api/2fa-verify", {}, async (request, reply) => {
			const { token, email, password } = request.body;

			const { isAuthorized, userId, authenticatorSecret } =
				await authorizeUser(email, password);

			console.log("2FA VERIFY token, secret", token, secret);
			const isValid = authenticator.verify({
				token,
				secret: authenticatorSecret,
			});
			console.log("2fa-verify (api) isValid", isValid);
			if (userId && isValid && isAuthorized) {
				await logUserIn(userId, request, reply);
				reply.send("success 2fa verified");
			}
			reply.code(401).send();
		});

		app.post("/api/register", {}, async (request, reply) => {
			try {
				const userId = await registerUser(
					request.body.email,
					request.body.password
				);
				// Generate auth tokens

				// "If account creation was succesful ..."
				// Set cookies
				if (userId) {
					const emailLink = await createVerifyEmailLink(
						request.body.email
					);

					// await sendEmail(transporter)
					await sendEmail({
						to: request.body.email,
						subject: "Please Verify Your Email 😉",
						html: `<h2> Please <a href="${emailLink}">verify</a> your email</h2>`,
					});

					await logUserIn(userId, request, reply);
					reply.send({
						data: {
							status: "SUCCESS!",
							userId,
						},
					});
				}
			} catch (e) {
				console.error(e);
				reply.send({
					data: {
						status: "FAILED",
						userId,
					},
				});
			}
			reply.send({
				data: "Hello World!",
			});
		});

		app.post("/api/authorize", {}, async (request, reply) => {
			try {
				console.log(
					"email:",
					request.body.email,
					"password:",
					request.body.password
				);
				const { isAuthorized, userId, authenticatorSecret } =
					await authorizeUser(
						request.body.email,
						request.body.password
					);

				console.log(
					"api/authorize, isAuthorized, userId, authenticatorSecret:",
					isAuthorized,
					", ",
					userId,
					", ",
					authenticatorSecret
				);
				if (isAuthorized && !authenticatorSecret) {
					await logUserIn(userId, request, reply);
					return reply.code(200).send({
						data: {
							status: "SUCCESS! User logged in succesfully!",
							userId,
						},
					});
					// reply.send({
					// 	data: {
					// 		status: "SUCCESS! User logged in succesfully!",
					// 		userId,
					// 	},
					// });
				} else if (isAuthorized && authenticatorSecret) {
					return reply.send({
						data: {
							status: "2FA",
						},
					});
				}
				return reply.code(401).send({
					data: {
						status: "Authentication failed ...",
						userId,
					},
				});
				// reply.send({
				// 	data: {
				// 		status: "Authentication failed ...",
				// 		userId,
				// 	},
				// });
			} catch (e) {
				console.error(e);
				reply.send({
					data: {
						status: "FAILED",
						userId,
					},
				});
			}
		});

		// "Logout"
		app.post("/api/logout", {}, async (request, reply) => {
			try {
				console.log("attempting logUserOut()");
				await logUserOut(request, reply);
				reply.send({
					data: {
						status: "User logged out",
					},
				});
			} catch (e) {
				console.error(e);
				reply.send({
					data: {
						status: "FAILED",
						userId,
					},
				});
			}
		});

		// "Verify email"
		app.post("/api/verify", {}, async (request, reply) => {
			try {
				const { token, email } = request.body;
				console.log("Verify token, email @ api", token, email);
				const isValid = await validateVerifyEmail(token, email);
				if (isValid) {
					return reply.code(200).send();
				}
				return reply.code(401).send(); // 401 = unauthorized
			} catch (e) {
				console.log("Error:", e);
				return reply.code(401).send(); // 401 = unauthorized
			}
		});

		app.post("/api/change-password", {}, async (request, reply) => {
			try {
				// const {['old-pass']}
				console.log("Change PW REQUEST: ", request);
				// "Verify User Logged-in"
				const user = await getUserFromCookies(request, reply);
				console.log("Cookie User:", user);
				if (user?.email?.address) {
					// "Compare currently-logged-in user to re-auth"
					const { isAuthorized, userId } = await authorizeUser(
						user.email.address,
						request.body["old-password"]
					);
					const newPassword = request.body["new-password"];
					console.log(
						"Change PW REQUEST - email & old PW:",
						user.email.address,
						request.body["old-password"]
					);
					console.log(
						"Change PW isAuthorized & userId results ...",
						isAuthorized,
						userId
					);
					// "If user is who they say they are ..."
					if (isAuthorized) {
						// "Update pw in database"
						await changePassword(userId, newPassword);
					}
					return reply.code(200).send("All Good");
				}
				return reply.code(401).send();
			} catch (e) {
				console.error(e);
				return reply.code(401).send(); // We want to send back minimal info to potential hackers
			}
		});

		// "Reset Password - verify & send email"
		app.post("/api/forgot-password", {}, async (request, reply) => {
			try {
				const { email } = request.body;
				console.log("Reset PW email @ api", email);
				// "Check whether a user with this email exists in DB"
				const link = await createResetLink(email);
				// "If they do, return a 'reset pw' link"
				if (link) {
					// "...send an email (to the saved email) with the 'reset pw' link"
					// await sendEmail(transporter)
					await sendEmail({
						to: email,
						subject: "Please Reset Your Password 😉",
						html: `<h2> Please <a href="${link}">reset</a> your password</h2>`,
					});
				}

				return reply.code(200).send(); // apparently a security concern is a bot hitting this route to find out whether users exist or not ... so we want to send this message no matter what
			} catch (e) {
				console.log("Error:", e);
				return reply.code(401).send(); // 401 = unauthorized
			}
		});

		// "Reset Password - save to Database"
		app.post("/api/reset", {}, async (request, reply) => {
			try {
				const { email, password, token, time } = request.body;
				console.log(
					"Reset PW save to DB @ api ...",
					"email:",
					email,
					"pw:",
					password,
					"token:",
					token,
					"time:",
					time
				);
				const isValid = await validateResetEmail(token, email, time);
				// "Check to see if user exists - if "yes" ..."
				if (isValid) {
					const { user } = await import("./user/user.js");
					const foundUser = await user.findOne({
						"email.address": email,
					});
					console.log("if is valid, foundUser", foundUser, password);
					if (foundUser._id) {
						await changePassword(foundUser._id, password);
						return reply
							.code(200)
							.send("Password succesfully updated!");
					}
				}
				// "Create hash of new password"
				// "Update DB with new password"

				// const valid = await validateResetEmail(
				// 	token,
				// 	email,
				// 	expirationTimestamp
				// );
				// console.log(valid);

				return reply.code(400).send("Reset failed ..."); // apparently a security concern is a bot hitting this route to find out whether users exist or not ... so we want to send this message no matter what
			} catch (e) {
				console.log("Error:", e);
				return reply.code(401).send(); // 401 = unauthorized
			}
		});

		// "Start Server"
		await app.listen(PORT);
		console.log(`🚀 Server Listening at port: ${PORT}`);
	} catch (e) {
		console.error(e);
	}
}

connectDB().then(() => startApp());
