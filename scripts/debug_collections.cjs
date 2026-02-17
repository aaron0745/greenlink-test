const { Client, Databases } = require('node-appwrite');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

async function debug() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);

    try {
        console.log("Listing collections in DB:", databaseId);
        const collections = await databases.listCollections(databaseId);
        collections.collections.forEach(c => {
            console.log(`- Name: ${c.name}, ID: ${c.$id}`);
        });

        console.log("\nEnv Variables:");
        console.log(`VITE_APPWRITE_COLLECTION_HOUSEHOLDS=${process.env.VITE_APPWRITE_COLLECTION_HOUSEHOLDS}`);
        console.log(`VITE_APPWRITE_COLLECTION_COLLECTORS=${process.env.VITE_APPWRITE_COLLECTION_COLLECTORS}`);
        console.log(`VITE_APPWRITE_COLLECTION_TRANSACTIONS=${process.env.VITE_APPWRITE_COLLECTION_TRANSACTIONS}`);
        console.log(`VITE_APPWRITE_COLLECTION_ROUTES=${process.env.VITE_APPWRITE_COLLECTION_ROUTES}`);

    } catch (e) {
        console.error("Error:", e.message);
    }
}

debug();
