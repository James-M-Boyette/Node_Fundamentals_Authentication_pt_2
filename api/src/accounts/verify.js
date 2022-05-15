import crypto from 'crypto';
const { ROOT_DOMAIN, JWT_SIGNATURE } = process.env;

export async function createVerifyEmailToken(email) {
    try {
        // "Auth String, JWT Signature, E-mail"
        const authString = `${JWT_SIGNATURE}:${email}`
        return crypto.createHash(`sha256`).update(authString).digest("hex")
        
    } catch (e) {
        console.error('Error:', e)
    }
}

export async function createVerifyEmailLink(email) {
    try {
        // "Create the Token"
        const emailToken = await createVerifyEmailToken(email);
        // "Encode URL String"
        const URIencodedEmail = encodeURIComponent(email);
        // "Return Link for Verification"
        return `https://${ROOT_DOMAIN}/verify/${URIencodedEmail}/${emailToken}`
    } catch (e) {
        console.error('Error:', e)
    }
}