const { Client, Databases, ID, Users, Query } = require('node-appwrite');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

const HOUSEHOLDS_ID = process.env.VITE_APPWRITE_COLLECTION_HOUSEHOLDS;
const COLLECTORS_ID = process.env.VITE_APPWRITE_COLLECTION_COLLECTORS;

const collectorsData = [
  { name: "Sumesh V.", phone: "9847012345", email: "sumesh@panchayat.in", ward: [1, 2], status: "active", totalCollections: 142, avatar: "SV" },
  { name: "Radhamani Amma", phone: "9446054321", email: "radhamani@panchayat.in", ward: [3, 4], status: "active", totalCollections: 128, avatar: "RA" },
  { name: "Abdul Khader", phone: "9895098765", email: "abdul@panchayat.in", ward: [5, 6], status: "active", totalCollections: 135, avatar: "AK" },
  { name: "Lissy Jacob", phone: "9745011223", email: "lissy@panchayat.in", ward: [7, 8], status: "active", totalCollections: 98, avatar: "LJ" },
];

const keralaNamesAndAddresses = [
  { name: "Ramachandran Pillai", address: "Sree Nilayam, Ward 1" },
  { name: "Najeeb Khan", address: "Baitul Noor, Ward 1" },
  { name: "Savithri Antharjanam", address: "Illathu Veedu, Ward 1" },
  { name: "Thomas Chacko", address: "Puthenpurayil, Ward 2" },
  { name: "Khadija Beevi", address: "Thangal's House, Ward 2" },
  { name: "Sukumaran K.", address: "Kizhakkethil, Ward 2" },
  { name: "Saritha Nair", address: "Vrindavan, Ward 3" },
  { name: "Ibrahim Kutty", address: "Kalluvettil House, Ward 3" },
  { name: "Mariamma Varghese", address: "Bethany Villa, Ward 4" },
  { name: "Raghavan Kartha", address: "Karthika, Ward 4" },
  { name: "Sunitha S.", address: "Sivadam, Ward 5" },
  { name: "Muhammed Shafi", address: "Shafi Manzil, Ward 5" },
  { name: "Leela Ramakrishnan", address: "Krishna Kripa, Ward 6" },
  { name: "George Kutty", address: "Pulimoottil, Ward 6" },
  { name: "Bindu Panicker", address: "Panickassery, Ward 7" },
  { name: "Siddharthan K.P.", address: "K.P. Niwas, Ward 8" },
];

async function seed() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);
    const users = new Users(client);

    console.log("🌱 Seeding Green-link Auth & Data...");

    try {
        // Seed Collectors
        console.log("Creating Collector Auth Accounts & Documents...");
        const collectorIds = [];
        for (const c of collectorsData) {
            let userId;
            try {
                // 1. Create Appwrite Auth User
                const user = await users.create(ID.unique(), c.email, null, "password123", c.name);
                userId = user.$id;
                console.log(`  ✅ Auth user created: ${c.email}`);
            } catch (e) {
                if (e.message.includes('already exists')) {
                    const list = await users.list([Query.equal('email', c.email)]);
                    userId = list.users[0].$id;
                    console.log(`  ℹ️ Auth user already exists: ${c.email}`);
                } else throw e;
            }

            // 2. Create Collector Document (Using Auth ID as Doc ID)
            const collectorDoc = {
                name: c.name,
                phone: c.phone,
                ward: c.ward,
                status: c.status,
                totalCollections: c.totalCollections,
                avatar: c.avatar
            };
            
            try {
                const doc = await databases.createDocument(databaseId, COLLECTORS_ID, userId, collectorDoc);
                collectorIds.push(doc.$id);
            } catch (e) {
                if (e.message.includes('already exists')) collectorIds.push(userId);
                else throw e;
            }
        }

        // Seed Households
        console.log("Seeding Households...");
        for (let i = 0; i < keralaNamesAndAddresses.length; i++) {
            const h = keralaNamesAndAddresses[i];
            const wardMatch = h.address.match(/Ward (\d+)/);
            const ward = wardMatch ? parseInt(wardMatch[1]) : 1;
            
            let collectorId;
            if (ward <= 2) collectorId = collectorIds[0];
            else if (ward <= 4) collectorId = collectorIds[1];
            else if (ward <= 6) collectorId = collectorIds[2];
            else collectorId = collectorIds[3];

            const household = {
                residentName: h.name,
                address: h.address,
                ward: ward,
                phone: `98470${54300 + i}`,
                paymentStatus: i % 5 === 0 ? "pending" : (i % 7 === 0 ? "overdue" : "paid"),
                monthlyFee: 100.0,
                lastCollectionDate: "2026-02-16",
                segregationCompliance: i % 4 === 0 ? "partial" : (i % 6 === 0 ? "non-compliant" : "compliant"),
                wetWaste: parseFloat((2.0 + Math.random() * 2).toFixed(2)),
                dryWaste: parseFloat((1.0 + Math.random() * 1.5).toFixed(2)),
                rejectWaste: parseFloat((0.1 + Math.random() * 0.2).toFixed(2)),
                collectionStatus: i % 10 === 0 ? "pending" : "collected",
                assignedCollector: collectorId,
                lat: 10.85 + Math.random() * 0.05,
                lng: 76.27 + Math.random() * 0.05,
            };
            try {
                await databases.createDocument(databaseId, HOUSEHOLDS_ID, ID.unique(), household);
            } catch (e) {
                // Skip if duplicate (unlikely with ID.unique())
            }
        }
        console.log(`✅ Seeded ${keralaNamesAndAddresses.length} households.`);
        console.log("✨ Seeding complete!");

    } catch (error) {
        console.error("❌ Error seeding:", error.message);
    }
}

seed();
