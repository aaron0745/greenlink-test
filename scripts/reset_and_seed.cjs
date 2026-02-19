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

const collectorsList = [
  { name: "Sumesh V.", phone: "9847012345", email: "sumesh@panchayat.in", wards: [1, 2] },
  { name: "Radhamani Amma", phone: "9446054321", email: "radhamani@panchayat.in", wards: [1, 3] },
  { name: "Abdul Khader", phone: "9895098765", email: "abdul@panchayat.in", wards: [2, 4] },
  { name: "Lissy Jacob", phone: "9745011223", email: "lissy@panchayat.in", wards: [3, 5] },
  { name: "Vijayan K.", phone: "9846011224", email: "vijayan@panchayat.in", wards: [4, 6] },
  { name: "Saritha P.", phone: "9447011225", email: "saritha@panchayat.in", wards: [5, 7] },
  { name: "Ramesh Babu", phone: "9847011226", email: "ramesh@panchayat.in", wards: [6, 8] },
  { name: "Priya Nair", phone: "9447011227", email: "priya@panchayat.in", wards: [7, 1] },
  { name: "Jose Mathew", phone: "9847011228", email: "jose@panchayat.in", wards: [8, 2] },
  { name: "Deepa S.", phone: "9447011229", email: "deepa@panchayat.in", wards: [3, 6] },
  { name: "Anil Kumar", phone: "9847011230", email: "anil@panchayat.in", wards: [4, 8] },
  { name: "Mini Thomas", phone: "9447011231", email: "mini@panchayat.in", wards: [5, 2] },
];

const houseNames = ["Sree Nilayam", "Baitul Noor", "Illathu Veedu", "Puthenpurayil", "Thangal's House", "Kizhakkethil", "Vrindavan", "Kalluvettil", "Bethany Villa", "Karthika", "Sivadam", "Shafi Manzil", "Krishna Kripa", "Pulimoottil", "Panickassery"];
const firstNames = ["Ramachandran", "Najeeb", "Savithri", "Thomas", "Khadija", "Sukumaran", "Ibrahim", "Mariamma", "Raghavan", "Sunitha", "Muhammed", "Leela", "George", "Bindu", "Siddharthan"];
const lastNames = ["Pillai", "Khan", "Antharjanam", "Chacko", "Beevi", "Nair", "Kutty", "Varghese", "Kartha", "Shafi", "Ramakrishnan", "Panicker"];

async function resetAndSeed() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);
    const users = new Users(client);

    console.log("🔄 Starting System Reset (Equal Workload)...");

    async function clearCollection(id, name) {
        if (!id) return;
        console.log(`  🗑️ Clearing ${name}...`);
        try {
            let hasMore = true;
            while (hasMore) {
                const docs = await databases.listDocuments(databaseId, id, [Query.limit(100)]);
                for (const doc of docs.documents) {
                    try {
                        await databases.deleteDocument(databaseId, id, doc.$id);
                        await new Promise(r => setTimeout(r, 50));
                    } catch (e) {}
                }
                hasMore = docs.documents.length === 100;
            }
        } catch (e) {}
    }

    // 1. Wipe everything
    await clearCollection(HOUSEHOLDS_ID, 'Households');
    await clearCollection(COLLECTORS_ID, 'Collectors');
    await clearCollection(LOGS_ID, 'CollectionLogs');
    await clearCollection(ROUTES_ID, 'Routes');

    console.log("⏳ Syncing...");
    await new Promise(r => setTimeout(r, 2000));

    // 2. Seed Collectors
    console.log("👥 Seeding 12 Collectors...");
    for (const c of collectorsList) {
        let userId;
        try {
            const authUser = await users.create(ID.unique(), c.email, null, "password123", c.name);
            userId = authUser.$id;
        } catch (e) {
            const list = await users.list([Query.equal('email', c.email)]);
            userId = list.users[0].$id;
        }
        try {
            await databases.createDocument(databaseId, COLLECTORS_ID, userId, {
                name: c.name,
                email: c.email,
                phone: c.phone,
                ward: c.wards, 
                status: "active",
                totalCollections: 0,
                avatar: c.name.substring(0,2).toUpperCase()
            });
        } catch (dbErr) {}
        await new Promise(r => setTimeout(r, 100));
    }

    // 3. Seed Households (Equally distributed: 8 houses per ward)
    console.log("🏠 Seeding 64 Households (8 per ward)...");
    const totalWards = 8;
    const housesPerWard = 8;

    for (let ward = 1; ward <= totalWards; ward++) {
        console.log(`  Ward ${ward}: seeding houses...`);
        for (let i = 1; i <= housesPerWard; i++) {
            const hName = houseNames[Math.floor(Math.random() * houseNames.length)];
            const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
            
            const household = {
                residentName: `${fName} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
                address: `${hName}, Ward ${ward}`,
                ward: ward,
                phone: `984${Math.floor(1000000 + Math.random() * 8999999)}`,
                paymentStatus: "pending",
                monthlyFee: 100.0,
                lastCollectionDate: "—",
                collectionStatus: "pending",
                assignedCollector: "unassigned",
                paymentMode: "none",
                lat: 10.85 + Math.random() * 0.1,
                lng: 76.27 + Math.random() * 0.1,
            };

            try {
                await databases.createDocument(databaseId, HOUSEHOLDS_ID, ID.unique(), household);
            } catch (e) {}
            await new Promise(r => setTimeout(r, 100));
        }
    }

    console.log("\n\n✅ System Ready. 64 houses balanced perfectly across 8 wards.");
}

resetAndSeed();
