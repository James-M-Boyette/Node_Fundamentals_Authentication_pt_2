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

import { getUserFromCookies } from "./accounts/user.js";

// Testing Email
import { sendEmail, mailInit } from "./mail/index.js";

import {
	createVerifyEmailLink,
	validateVerifyEmail,
} from "./accounts/verify.js";

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
				const { isAuthorized, userId } = await authorizeUser(
					request.body.email,
					request.body.password
				);

				if (isAuthorized) {
					await logUserIn(userId, request, reply);
					reply.send({
						data: {
							status: "SUCCESS! User logged in succesfully!",
							userId,
						},
					});
				}
				reply.send({
					data: {
						status: "Authentication failed ...",
						userId,
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

		// "Logout"
		app.post("/api/logout", {}, async (request, reply) => {
			try {
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
				console.log("token, email @ api", token, email);
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

		// "Start Server"
		await app.listen(PORT);
		console.log(`🚀 Server Listening at port: ${PORT}`);
	} catch (e) {
		console.error(e);
	}
}

connectDB().then(() => startApp());
