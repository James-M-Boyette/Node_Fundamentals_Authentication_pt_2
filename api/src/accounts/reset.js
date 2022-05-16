import crypto from "crypto";
const { ROOT_DOMAIN, JWT_SIGNATURE } = process.env;

function createResetToken(email, expirationTimestamp) {
	try {
		// "Create Auth String Token: JWT Signature, E-mail, & Expiration Timestamp"
		const authString = `${JWT_SIGNATURE}:${email}:${expirationTimestamp}`;
		return crypto.createHash(`sha256`).update(authString).digest("hex");
	} catch (e) {
		console.error("Error:", e);
	}
}

export async function createResetEmailLink(email) {
	try {
		// "Encode URL String"
		const URIencodedEmail = encodeURIComponent(email);
		// "Create Time Stamp (24hrs from now)"
		const expirationTimestamp = Date.now() + 24 * 60 * 60 * 1000; // 1000 = miliseconds
		// "Create Token"
		const token = createResetToken(email, expirationTimestamp);
		// "Return Link for Verification"
		// Note: Email link should contain user email, token, and expiration date
		return `https://${ROOT_DOMAIN}/reset/${URIencodedEmail}/${expirationTimestamp}/${token}`;
	} catch (e) {
		console.error("Error:", e);
	}
}

export async function createResetLink(email) {
	try {
		// "Search for the user"
		const { user } = await import("../user/user.js");
		const foundUser = await user.findOne({
			"email.address": email,
		});
		console.log("CreateResetLink, foundUser:", foundUser);

		if (foundUser) {
			// "... Create an email link"
			const link = await createResetEmailLink(email);
			return link;
		}
		return "";
	} catch (e) {
		console.log("Error:", e);
		return false;
	}
}
