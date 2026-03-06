const { Client, Databases, Query } = require('node-appwrite');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const householdsId = process.env.VITE_APPWRITE_COLLECTION_HOUSEHOLDS;
const collectorsId = process.env.VITE_APPWRITE_COLLECTION_COLLECTORS;

async function check() {
    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const databases = new Databases(client);

    console.log("--- DATABASE CREDENTIALS CHECK ---");

    try {
        console.log("\n🏠 Households (First 3):");
        const hRes = await databases.listDocuments(databaseId, householdsId, [Query.limit(3)]);
        hRes.documents.forEach(d => {
            console.log(`- Email: ${d.email} | Password: ${d.password} | Name: ${d.residentName}`);
        });

        console.log("\n👥 Collectors (First 3):");
        const cRes = await databases.listDocuments(databaseId, collectorsId, [Query.limit(3)]);
        cRes.documents.forEach(d => {
            console.log(`- Email: ${d.email} | Password: ${d.password || 'password123'} | Name: ${d.name}`);
        });

    } catch (e) {
        console.error("Error querying database:", e.message);
    }
}

check();
