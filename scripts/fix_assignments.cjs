const { Client, Databases, Query } = require('node-appwrite');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

const HOUSEHOLDS_ID = process.env.VITE_APPWRITE_COLLECTION_HOUSEHOLDS;
const COLLECTORS_ID = process.env.VITE_APPWRITE_COLLECTION_COLLECTORS;

async function fix() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);

    console.log("🛠️  Syncing household assignments by ward...");

    try {
        const collectors = await databases.listDocuments(databaseId, COLLECTORS_ID);
        const households = await databases.listDocuments(databaseId, HOUSEHOLDS_ID, [Query.limit(100)]);

        console.log(`Found ${collectors.documents.length} collectors and ${households.documents.length} households.`);

        let updatedCount = 0;

        for (const house of households.documents) {
            const currentWard = house.ward;
            // Find a matching collector for this ward
            const matchingCollector = collectors.documents.find(c => c.ward.includes(currentWard));

            if (matchingCollector && house.assignedCollector !== matchingCollector.$id) {
                console.log(`  Updating House ${house.residentName} (Ward ${currentWard}): -> assigned to ${matchingCollector.name}`);
                await databases.updateDocument(databaseId, HOUSEHOLDS_ID, house.$id, {
                    assignedCollector: matchingCollector.$id
                });
                updatedCount++;
            } else if (!matchingCollector) {
                console.log(`  ⚠️ No collector found for Ward ${currentWard} (House: ${house.residentName})`);
            }
        }

        console.log(`
✅ Assignment sync complete! ${updatedCount} households re-assigned.`);

    } catch (e) {
        console.error("❌ Fix failed:", e.message);
    }
}

fix();
