// "Store a new user + their credentials" ...

import bcrypt from 'bcryptjs';
const { genSalt, hash } = bcrypt;

export async function registerUser(email, password) {
    // "Get 'user' collection (from database)"
    const { user } = await import("../user/user.js")

    // "Generate salt"
    const salt = await genSalt(10); // Specifies how long the salt should be

    // "Generate encrypted pw w/ hash + salt"
    const hashedPassword = await hash(password, salt)

    // "Store user's email & hashed-pw in DB"
    const result = await user.insertOne({
        email: {
            address: email,
            verified: false, // Future-proofing by anticipating company's future need to add "verify email" step in user sign-up
        },
        password: hashedPassword,
    })

    // "Return user from DB"
    return result.insertedId

}