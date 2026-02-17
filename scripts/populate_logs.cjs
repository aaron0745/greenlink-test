const { Client, Databases, ID, Query } = require('node-appwrite');
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

async function populate() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);

    console.log("📊 Populating Collection Logs and Routes...");

    try {
        // 1. Fetch Collectors and Households
        const collectors = await databases.listDocuments(databaseId, COLLECTORS_ID);
        const households = await databases.listDocuments(databaseId, HOUSEHOLDS_ID);

        if (collectors.documents.length === 0 || households.documents.length === 0) {
            console.log("⚠️ No collectors or households found. Please seed data first.");
            return;
        }

        console.log(`Found ${collectors.documents.length} collectors and ${households.documents.length} households.`);

        // 2. Generate Logs for the last 3 days
        const statuses = ["collected", "collected", "collected", "not-available", "skipped"];
        const today = new Date();

        for (let d = 0; d < 3; d++) {
            const date = new Date();
            date.setDate(today.getDate() - d);
            const dateString = date.toISOString().split('T')[0];
            
            console.log(`Generating logs for ${dateString}...`);

            for (const collector of collectors.documents) {
                const assignedHouses = households.documents.filter(h => h.assignedCollector === collector.$id);
                
                if (assignedHouses.length > 0) {
                    // Create a Route for this collector today
                    const route = await databases.createDocument(databaseId, ROUTES_ID, ID.unique(), {
                        name: `Route - ${collector.name} - ${dateString}`,
                        collectorId: collector.$id,
                        ward: collector.ward[0],
                        status: d === 0 ? "active" : "completed",
                        startTime: `${dateString} 08:30 AM`,
                        endTime: d === 0 ? null : `${dateString} 02:30 PM`,
                        totalHouses: assignedHouses.length,
                        collectedHouses: Math.floor(assignedHouses.length * 0.8)
                    });

                    for (const house of assignedHouses) {
                        // Skip some houses randomly to make it realistic
                        if (Math.random() > 0.9) continue;

                        const status = statuses[Math.floor(Math.random() * statuses.length)];
                        const amount = status === "collected" ? 100 : 0;

                        await databases.createDocument(databaseId, LOGS_ID, ID.unique(), {
                            collectorId: collector.$id,
                            collectorName: collector.name,
                            householdId: house.$id,
                            residentName: house.residentName,
                            timestamp: `${dateString} ${8 + Math.floor(Math.random() * 6)}:${10 + Math.floor(Math.random() * 40)} AM`,
                            location: house.address,
                            status: status,
                            amountCollected: parseFloat(amount.toFixed(2))
                        });
                    }
                }
            }
        }

        console.log("✨ Population complete!");

    } catch (error) {
        console.error("❌ Error populating logs:", error.message);
    }
}

populate();
