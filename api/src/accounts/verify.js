import crypto from "crypto";
const { ROOT_DOMAIN, JWT_SIGNATURE } = process.env;

export async function createVerifyEmailToken(email) {
	try {
		// "Auth String, JWT Signature, E-mail"
		const authString = `${JWT_SIGNATURE}:${email}`;
		return crypto.createHash(`sha256`).update(authString).digest("hex");
	} catch (e) {
		console.error("Error:", e);
	}
}

export async function createVerifyEmailLink(email) {
	try {
		// "Create the Token"
		const emailToken = await createVerifyEmailToken(email);
		// "Encode URL String"
		const URIencodedEmail = encodeURIComponent(email);
		// "Return Link for Verification"
		return `https://${ROOT_DOMAIN}/verify/${URIencodedEmail}/${emailToken}`;
	} catch (e) {
		console.error("Error:", e);
	}
}

export async function validateVerifyEmail(token, email) {
	try {
		// "(Re)Create the hash (using supplied token)"
		const emailToken = await createVerifyEmailToken(email);
		// "Compare this re-created hash w/ what's stored on the server"
		const isValid = emailToken === token;
		// "If succesful ...""
		if (isValid) {
			// "... update user to 'verified'"
			const { user } = await import("../user/user.js");
			await user.updateOne(
				{
					"email.address": email,
				},
				{
					// $set:{} solves 'atomic value' requirement of MongoDB
					$set: { "email.verified": true },
				}
			);
			// "return 'true'/success"
			return true;
		}
		return false;
	} catch (e) {
		console.log("Error:", e);
		return false;
	}
}
