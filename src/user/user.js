// ~ Mongo Model
import { client } from "../db.js";

export const user = client.db("users").collection("users")
