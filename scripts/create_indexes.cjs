const { Client, Databases } = require('node-appwrite');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

const HOUSEHOLDS_ID = process.env.VITE_APPWRITE_COLLECTION_HOUSEHOLDS;
const COLLECTORS_ID = process.env.VITE_APPWRITE_COLLECTION_COLLECTORS;
const LOGS_ID = process.env.VITE_APPWRITE_COLLECTION_TRANSACTIONS;
const ROUTES_ID = process.env.VITE_APPWRITE_COLLECTION_ROUTES;

async function createIndexes() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);

    console.log("⚡ Starting Index Creation (Optimization)...");

    async function addIndex(collId, name, type, attributes) {
        try {
            console.log(`  🔍 Adding index "${name}" to collection ${collId}...`);
            await databases.createIndex(databaseId, collId, name, type, attributes);
            console.log(`  ✅ Index "${name}" created.`);
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log(`  ℹ️ Index "${name}" already exists, skipping.`);
            } else {
                console.log(`  ❌ Index "${name}" failed: ${e.message}`);
            }
        }
    }

    // 1. Households Indexes
    if (HOUSEHOLDS_ID) {
        await addIndex(HOUSEHOLDS_ID, 'idx_phone', 'key', ['phone']);
        await addIndex(HOUSEHOLDS_ID, 'idx_ward', 'key', ['ward']);
        await addIndex(HOUSEHOLDS_ID, 'idx_collector', 'key', ['assignedCollector']);
    }

    // 2. Collectors Indexes
    if (COLLECTORS_ID) {
        await addIndex(COLLECTORS_ID, 'idx_phone', 'key', ['phone']);
        await addIndex(COLLECTORS_ID, 'idx_email', 'key', ['email']);
    }

    // 3. CollectionLogs Indexes
    if (LOGS_ID) {
        await addIndex(LOGS_ID, 'idx_household', 'key', ['householdId']);
        await addIndex(LOGS_ID, 'idx_timestamp', 'key', ['timestamp']);
    }

    // 4. Routes Indexes
    if (ROUTES_ID) {
        await addIndex(ROUTES_ID, 'idx_collector', 'key', ['collectorId']);
        await addIndex(ROUTES_ID, 'idx_start', 'key', ['startTime']);
        await addIndex(ROUTES_ID, 'idx_ward', 'key', ['ward']);
    }

    console.log("\n✨ Index optimization complete!");
}

createIndexes();
