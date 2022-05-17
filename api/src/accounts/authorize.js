// "Verify a user" ...

import bcrypt from "bcryptjs";
const { compare } = bcrypt;

export async function authorizeUser(email, password) {
	// "Import 'user' collection (from database)"
	console.log("Email & PW passed to authorizeUser()", email, password);
	const { user } = await import("../user/user.js");
	// "Find current user by matching supplied-email"
	const userData = await user.findOne({
		"email.address": email,
	});
	if (userData) {
		console.log("userData", userData);
		// "Get *stored* pw"
		const savedPassword = userData.password;
		console.log("savedPassword:", savedPassword);
		// "Compare *user-supplied* pw with stored pw"
		const isAuthorized = await compare(password, savedPassword);
		console.log("isAuthorized", isAuthorized);
		// "Return boolean of 'if' for pw"
		return {
			isAuthorized,
			userId: userData._id,
			authenticatorSecret: userData.authenticator,
		};
	} else {
		console.log("email & pw:", email, password);
		console.log("User does not exist ...");
		return {
			isAuthorized: false,
			userId: null,
			authenticatorSecret: null,
		};
	}
}
