const { Client, Databases } = require('node-appwrite');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const LOGS_ID = process.env.VITE_APPWRITE_COLLECTION_TRANSACTIONS;

async function check() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);

    try {
        console.log("Checking logs in collection:", LOGS_ID);
        const response = await databases.listDocuments(databaseId, LOGS_ID);
        console.log(`Total logs found: ${response.total}`);
        if (response.documents.length > 0) {
            console.log("Latest 3 logs:");
            response.documents.slice(0, 3).forEach(doc => {
                console.log(`- Resident: ${doc.residentName}, Timestamp: "${doc.timestamp}", Status: ${doc.status}`);
            });
        } else {
            console.log("No logs found in the database.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

check();
