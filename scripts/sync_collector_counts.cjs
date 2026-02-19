const { Client, Databases, Query } = require('node-appwrite');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

const COLLECTORS_ID = process.env.VITE_APPWRITE_COLLECTION_COLLECTORS;
const LOGS_ID = process.env.VITE_APPWRITE_COLLECTION_TRANSACTIONS;

async function sync() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);

    console.log("📊 Syncing Collector counts with actual logs...");

    try {
        const collectors = await databases.listDocuments(databaseId, COLLECTORS_ID);
        const logs = await databases.listDocuments(databaseId, LOGS_ID, [
            Query.limit(100)
        ]);

        console.log(`Found ${collectors.total} collectors and ${logs.total} total logs.`);

        for (const collector of collectors.documents) {
            const count = logs.documents.filter(l => {
                const s = (l.status || '').toLowerCase();
                return l.collectorId === collector.$id && (s === 'collected' || s === 'paid');
            }).length;
            
            console.log(`  Syncing ${collector.name}: ${count} collections found.`);
            await databases.updateDocument(databaseId, COLLECTORS_ID, collector.$id, {
                totalCollections: count
            });
        }

        console.log("\n✅ Sync complete!");
    } catch (e) {
        console.error("❌ Sync failed:", e.message);
    }
}

sync();
