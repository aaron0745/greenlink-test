const { Client, Databases, ID, Users, Query } = require('node-appwrite');
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

const collectorsData = [
  { name: "Sumesh V.", phone: "9847012345", email: "sumesh@panchayat.in", avatar: "SV" },
  { name: "Radhamani Amma", phone: "9446054321", email: "radhamani@panchayat.in", avatar: "RA" },
  { name: "Abdul Khader", phone: "9895098765", email: "abdul@panchayat.in", avatar: "AK" },
  { name: "Lissy Jacob", phone: "9745011223", email: "lissy@panchayat.in", avatar: "LJ" },
  { name: "Vijayan K.", phone: "9846011224", email: "vijayan@panchayat.in", avatar: "VK" },
  { name: "Saritha P.", phone: "9447011225", email: "saritha@panchayat.in", avatar: "SP" },
];

const houseNames = ["Sree Nilayam", "Baitul Noor", "Illathu Veedu", "Puthenpurayil", "Thangal's House", "Kizhakkethil", "Vrindavan", "Kalluvettil", "Bethany Villa", "Karthika", "Sivadam", "Shafi Manzil", "Krishna Kripa", "Pulimoottil", "Panickassery", "K.P. Niwas", "Udayam", "Deepam", "Souparnika", "Ashraya", "Peace Cottage", "Green Valley", "Rose Garden", "Hill View"];
const firstNames = ["Ramachandran", "Najeeb", "Savithri", "Thomas", "Khadija", "Sukumaran", "Ibrahim", "Mariamma", "Raghavan", "Sunitha", "Muhammed", "Leela", "George", "Bindu", "Siddharthan", "Anil", "Beena", "Chandran", "Devassy", "Ealias", "Faisal", "Gireesh", "Hamsa", "Indu"];
const lastNames = ["Pillai", "Khan", "Antharjanam", "Chacko", "Beevi", "Nair", "Kutty", "Varghese", "Kartha", "Shafi", "Ramakrishnan", "Panicker", "Menon", "Thomas", "Joseph", "Raj", "Babu", "Soman"];

async function resetAndSeed() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);
    const users = new Users(client);

    console.log("🔄 Starting Fresh Reset & Seed...");

    async function clearCollection(id, name) {
        if (!id) return;
        try {
            console.log(`  🗑️ Clearing ${name}...`);
            const docs = await databases.listDocuments(databaseId, id, [Query.limit(100)]);
            for (const doc of docs.documents) {
                await databases.deleteDocument(databaseId, id, doc.$id);
            }
        } catch (e) { console.log(`  ⚠️ Clear ${name} failed: ${e.message}`); }
    }

    // 1. Clear Data
    await clearCollection(HOUSEHOLDS_ID, 'Households');
    await clearCollection(COLLECTORS_ID, 'Collectors');
    await clearCollection(LOGS_ID, 'CollectionLogs');
    await clearCollection(ROUTES_ID, 'Routes');

    console.log("⏳ Waiting for DB to sync...");
    await new Promise(r => setTimeout(r, 3000));

    // 2. Seed Collectors
    console.log("👥 Seeding 6 Collectors...");
    const collectorIds = [];
    for (let i = 0; i < collectorsData.length; i++) {
        const c = collectorsData[i];
        let userId;
        try {
            const user = await users.create(ID.unique(), c.email, null, "password123", c.name);
            userId = user.$id;
        } catch (e) {
            const list = await users.list([Query.equal('email', c.email)]);
            userId = list.users[0].$id;
        }
        try {
            const doc = await databases.createDocument(databaseId, COLLECTORS_ID, userId, {
                name: c.name,
                phone: c.phone,
                ward: [i + 1, i + 2],
                status: "active",
                totalCollections: Math.floor(Math.random() * 200),
                avatar: c.avatar
            });
            collectorIds.push(doc.$id);
            console.log(`  ✅ Collector ${c.name} seeded.`);
        } catch (e) {
            if (e.message.includes('already exists')) collectorIds.push(userId);
            else console.log(`  ❌ Collector ${c.name} failed: ${e.message}`);
        }
    }

    // 3. Seed 50 Households
    console.log("🏠 Seeding 50 Households...");
    let houseCount = 0;
    const collectors = await databases.listDocuments(databaseId, COLLECTORS_ID);
    
    for (let i = 0; i < 50; i++) {
        const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const hName = houseNames[Math.floor(Math.random() * houseNames.length)];
        const ward = Math.floor(Math.random() * 8) + 1; // Wards 1-8
        
        // Find a collector who handles this ward
        const assignedCollector = collectors.documents.find(c => c.ward.includes(ward))?.$id || collectorIds[0];

        const household = {
            residentName: `${fName} ${lName}`,
            address: `${hName}, Ward ${ward}`,
            ward: ward,
            phone: `984${Math.floor(1000000 + Math.random() * 8999999)}`,
            paymentStatus: "pending",
            monthlyFee: 100.0,
            lastCollectionDate: "—",
            collectionStatus: "pending",
            assignedCollector: assignedCollector,
            lat: 10.85 + Math.random() * 0.1,
            lng: 76.27 + Math.random() * 0.1,
        };
        try {
            await databases.createDocument(databaseId, HOUSEHOLDS_ID, ID.unique(), household);
            houseCount++;
        } catch (e) {
            console.log(`  ❌ House ${i} failed: ${e.message}`);
        }
        if (i % 10 === 0) process.stdout.write('.');
    }

    console.log(`\n✨ Households seeded: ${houseCount}`);

    // 4. Seed sample Routes & Logs for Analytics
    console.log("📊 Generating historical logs and routes...");
    const days = [0, 1, 2]; // Today, Yesterday, Day before
    const statuses = ["collected", "collected", "not-available"];

    for (const d of days) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        const dateString = date.toISOString().split('T')[0];

        for (const cId of collectorIds) {
            const collector = collectorsData.find(c => true); // Just need a name reference or fetch from DB
            // We'll just use a generic name or fetch the real one if we wanted to be precise
            
            // Create a Route for each collector for each day
            await databases.createDocument(databaseId, ROUTES_ID, ID.unique(), {
                name: `Route - ${dateString}`,
                collectorId: cId,
                ward: Math.floor(Math.random() * 8) + 1,
                status: d === 0 ? "active" : "completed",
                startTime: `${dateString} 08:00 AM`,
                endTime: d === 0 ? null : `${dateString} 02:00 PM`,
                totalHouses: 10,
                collectedHouses: d === 0 ? 0 : 8
            });

            // Create some random logs for the past days to fill the charts
            if (d > 0) {
                const houses = await databases.listDocuments(databaseId, HOUSEHOLDS_ID, [Query.equal('assignedCollector', cId), Query.limit(5)]);
                for (const h of houses.documents) {
                    const status = statuses[Math.floor(Math.random() * statuses.length)];
                    await databases.createDocument(databaseId, LOGS_ID, ID.unique(), {
                        collectorId: cId,
                        collectorName: "Collector",
                        householdId: h.$id,
                        residentName: h.residentName,
                        timestamp: `${dateString} 09:${Math.floor(Math.random()*50)} AM`,
                        location: h.address,
                        status: status,
                        amountCollected: status === 'collected' ? 100 : 0,
                        paymentMode: status === 'collected' ? (Math.random() > 0.5 ? 'offline' : 'online') : 'none'
                    });
                }
            }
        }
    }

    console.log("\n✨ Reset & Seeding complete! Households, Collectors, Routes, and Logs are ready.");
}

resetAndSeed();
