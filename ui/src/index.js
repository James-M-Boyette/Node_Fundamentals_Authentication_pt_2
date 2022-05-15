import https from "https";
// "Server Library"
import { fastify } from "fastify";

// "Static File Directory Plugin"
import fastifyStatic from "@fastify/static";

// "ESM Work-Arounds for __dirname"
import path from "path";
import { fileURLToPath } from "url";

// ""
import fetch from "cross-fetch";
import { request } from "http";

// "Constants / Middleware"
const app = fastify();
const PORT = 5000;

// "ESM-specific syntax requirements for accessing static files"
const __filename = fileURLToPath(import.meta.url); // get metadata about files
const __dirname = path.dirname(__filename);

async function startApp() {
	try {
		app.register(fastifyStatic, {
			root: path.join(__dirname, "public"),
		});

		app.get("/verify/:email/:token", {}, async (request, reply) => {
			try {
				console.log(
					"request:",
					request.params.email,
					request.params.token
				);
				// Using 'fetch' from cross-fetch, we can make requests to the API server from our UI server:
				const { email, token } = request.params;
				const values = {
					email,
					token,
				};

				// "Turn off SSL checking for this specific query"
				const httpsAgent = new https.Agent({
					rejectUnauthorized: false,
				});

				const res = await fetch("https://api.nodeauth.dev/api/verify", {
					method: "POST",
					body: JSON.stringify(values),
					credentials: "include",
					agent: httpsAgent,
					headers: {
						"Content-type": "application/json; charset = UTF-8",
					},
				});
				console.log("response:", res);
				reply.code(200).send("Everything's working!");
			} catch (e) {
				console.log("Error:", e);
				reply.send({
					data: {
						status: "FAILED",
					},
				});
			}
		});

		// "Start Server"
		await app.listen(PORT);
		console.log(`🚀 Server Listening at port: ${PORT}`);
	} catch (e) {
		console.error("Error:", e);
	}
}

startApp();
