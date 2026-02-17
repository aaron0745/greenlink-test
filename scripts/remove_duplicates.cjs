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

async function removeDuplicates() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);

    console.log("🧹 Starting duplicate cleanup...");

    async function cleanupCollection(collectionId, uniqueKeyFn, collectionName) {
        try {
            console.log(`\nProcessing ${collectionName}...`);
            let documents = [];
            let offset = 0;
            let limit = 100;
            
            // Fetch all docs
            while (true) {
                const response = await databases.listDocuments(databaseId, collectionId, [
                    require('node-appwrite').Query.limit(limit),
                    require('node-appwrite').Query.offset(offset)
                ]);
                documents = documents.concat(response.documents);
                if (response.documents.length < limit) break;
                offset += limit;
            }

            console.log(`  Found ${documents.length} total documents.`);

            const seen = new Set();
            let deletedCount = 0;

            for (const doc of documents) {
                const key = uniqueKeyFn(doc);
                if (seen.has(key)) {
                    // Duplicate found, delete it
                    try {
                        await databases.deleteDocument(databaseId, collectionId, doc.$id);
                        deletedCount++;
                        process.stdout.write('.'); // Progress indicator
                    } catch (e) {
                        console.error(`  Failed to delete ${doc.$id}: ${e.message}`);
                    }
                } else {
                    seen.add(key);
                }
            }
            console.log(`\n  ✅ Removed ${deletedCount} duplicates from ${collectionName}.`);

        } catch (error) {
            console.error(`❌ Error processing ${collectionName}:`, error.message);
        }
    }

    // 1. Collectors: Unique by 'phone'
    if (COLLECTORS_ID) {
        await cleanupCollection(COLLECTORS_ID, (doc) => doc.phone, 'Collectors');
    }

    // 2. Households: Unique by 'residentName' + 'address'
    if (HOUSEHOLDS_ID) {
        await cleanupCollection(HOUSEHOLDS_ID, (doc) => `${doc.residentName}|${doc.address}`, 'Households');
    }

    // 3. Routes: Unique by 'collectorId' + 'name'
    if (ROUTES_ID) {
        await cleanupCollection(ROUTES_ID, (doc) => `${doc.collectorId}|${doc.name}`, 'Routes');
    }

    // 4. Logs: Unique by 'householdId' + 'timestamp' + 'status'
    if (LOGS_ID) {
        await cleanupCollection(LOGS_ID, (doc) => `${doc.householdId}|${doc.timestamp}|${doc.status}`, 'CollectionLogs');
    }

    console.log("\n✨ Cleanup complete!");
}

removeDuplicates();
