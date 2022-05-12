import mongo from "mongodb";

const { MongoClient } = mongo;

const url = process.env.MONGO_URL;

export const client = new MongoClient(url, { useNewUrlParser: true });

export async function connectDB() {
    try {
        await client.connect()
        
        // "Confirm Connection (to vanilla 'admin' DB)"
        await client.db("admin").command({ping: 1}) 
        console.log(`🗄 connected to Mongo_DB succesfully!`)
    } catch (e) {
        console.error(e)
        await client.close() // If there's an error, close connection to DB
    }
}