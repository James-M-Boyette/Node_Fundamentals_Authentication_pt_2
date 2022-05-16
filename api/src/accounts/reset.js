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

function validateExpTimestamp(expirationTimestamp) {
	// One day (in miliseconds)
	const expiration = 24 * 60 * 60 * 1000;
	// Difference between *now* and expiration (if expiration is still in the future, the difference will be a positive, non-zero number)
	const dateDiff = Number(expirationTimestamp) - Date.now();
	// Note valid either if 1) it's in the past, OR 2) difference in time is less than allowed
	const isValid = dateDiff > 0 && dateDiff < expiration;
	console.log("isValid:", isValid);
	return isValid;
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

export async function validateResetEmail(token, email, expirationTimestamp) {
	try {
		// "(Re)Create the hash (using supplied token)"
		const resetToken = createResetToken(email, expirationTimestamp);
		// "Compare this re-created hash w/ what's stored on the server"
		const isTokenValid = resetToken === token;
		// "Has the *time* expired ?"
		const isTimestampValid = validateExpTimestamp(expirationTimestamp);
		console.log("isTimestampValid", isTimestampValid);
		return isTokenValid && isTimestampValid;
		// "Validate User's info ..."
		// "Is the email *token* invalid?"

		// "If succesful ...""
		if (isTokenValid && isTimestampValid) {
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
