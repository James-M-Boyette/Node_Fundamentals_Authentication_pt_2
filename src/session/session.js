// ~ Mongo Model
import { client } from "../db.js";

export const session = client.db("sessions").collection("sessions")

session.createIndex({ sessionToken: 1 })