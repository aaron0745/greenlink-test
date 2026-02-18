import { databases, DATABASE_ID, HOUSEHOLDS_COLLECTION_ID, ROUTES_COLLECTION_ID, TRANSACTIONS_COLLECTION_ID, COLLECTORS_COLLECTION_ID } from './appwrite';
import { Query, ID } from 'appwrite';

export const api = {
    async getHouseholds() {
        const response = await databases.listDocuments(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            [Query.limit(100)]
        );
        const today = new Date().toISOString().split('T')[0];
        return response.documents.map((h: any) => ({
            ...h,
            // If the last collection was on a previous day, reset statuses to pending for the UI
            collectionStatus: h.lastCollectionDate === today ? h.collectionStatus : 'pending',
            paymentStatus: h.lastCollectionDate === today ? h.paymentStatus : 'pending'
        }));
    },

    async getHousehold(id: string) {
        const h: any = await databases.getDocument(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            id
        );
        const today = new Date().toISOString().split('T')[0];
        return {
            ...h,
            collectionStatus: h.lastCollectionDate === today ? h.collectionStatus : 'pending',
            paymentStatus: h.lastCollectionDate === today ? h.paymentStatus : 'pending'
        };
    },

    async getHouseholdByPhone(phone: string) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            [Query.equal('phone', phone)]
        );
        const h = response.documents[0];
        if (!h) return null;
        const today = new Date().toISOString().split('T')[0];
        return {
            ...h,
            collectionStatus: h.lastCollectionDate === today ? h.collectionStatus : 'pending',
            paymentStatus: h.lastCollectionDate === today ? h.paymentStatus : 'pending'
        };
    },

    async createHousehold(data: any) {
        return await databases.createDocument(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            ID.unique(),
            data
        );
    },

    async updateHousehold(id: string, data: any) {
        return await databases.updateDocument(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            id,
            data
        );
    },

    async deleteHousehold(id: string) {
        return await databases.deleteDocument(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            id
        );
    },

    async getCollectors() {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTORS_COLLECTION_ID
        );
        return response.documents;
    },

    async getCollectorByPhone(phone: string) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTORS_COLLECTION_ID,
            [Query.equal('phone', phone)]
        );
        return response.documents[0];
    },

    async createCollector(data: any) {
        return await databases.createDocument(
            DATABASE_ID,
            COLLECTORS_COLLECTION_ID,
            ID.unique(),
            data
        );
    },

    async deleteCollector(id: string) {
        return await databases.deleteDocument(
            DATABASE_ID,
            COLLECTORS_COLLECTION_ID,
            id
        );
    },

    async getRoutes() {
        const response = await databases.listDocuments(
            DATABASE_ID,
            ROUTES_COLLECTION_ID,
            [Query.orderDesc('startTime')]
        );
        return response.documents;
    },

    async getRoutesByDate(date: string) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            ROUTES_COLLECTION_ID,
            [Query.startsWith('startTime', date)]
        );
        return response.documents;
    },

    async getHouseholdsByWard(ward: number) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            [Query.equal('ward', ward), Query.limit(100)]
        );
        const today = new Date().toISOString().split('T')[0];
        return response.documents.map((h: any) => ({
            ...h,
            collectionStatus: h.lastCollectionDate === today ? h.collectionStatus : 'pending',
            paymentStatus: h.lastCollectionDate === today ? h.paymentStatus : 'pending'
        }));
    },

    async assignRoute(collectorId: string, collectorName: string, ward: number, date: string) {
        console.log(`API: Assigning Ward ${ward} to ${collectorName} on ${date}`);
        // 1. Create the route record
        const route = await databases.createDocument(
            DATABASE_ID,
            ROUTES_COLLECTION_ID,
            ID.unique(),
            {
                name: `Route - ${collectorName} - ${date}`,
                collectorId: collectorId,
                ward: ward,
                status: 'active',
                startTime: `${date} 08:00 AM`,
                totalHouses: 0, 
                collectedHouses: 0
            }
        );
        console.log('API: Route document created:', route.$id);

        // 2. Update all households in this ward to point to this collector
        const houses = await this.getHouseholdsByWard(ward);
        console.log(`API: Found ${houses.length} houses in Ward ${ward} to update.`);
        for (const h of houses) {
            await databases.updateDocument(
                DATABASE_ID,
                HOUSEHOLDS_COLLECTION_ID,
                h.$id,
                { assignedCollector: collectorId }
            );
        }
        console.log('API: All households updated.');

        return route;
    },

    async getDailyAssignment(collectorId: string, date: string) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            ROUTES_COLLECTION_ID,
            [
                Query.equal('collectorId', collectorId),
                Query.startsWith('startTime', date)
            ]
        );
        return response.documents[0] || null;
    },

    async deleteRoute(routeId: string, ward: number) {
        // 1. Delete the route document
        await databases.deleteDocument(DATABASE_ID, ROUTES_COLLECTION_ID, routeId);

        // 2. Reset all households in this ward to 'unassigned'
        const houses = await this.getHouseholdsByWard(ward);
        for (const h of houses) {
            await databases.updateDocument(
                DATABASE_ID,
                HOUSEHOLDS_COLLECTION_ID,
                h.$id,
                { assignedCollector: 'unassigned' }
            );
        }
    },

    async getCollectionLogs() {
        const response = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [Query.orderDesc('timestamp'), Query.limit(100)]
        );
        return response.documents;
    },

    async getTodaysLogForHousehold(houseId: string) {
        const datePart = new Date().toLocaleDateString('en-GB');
        const response = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [
                Query.equal('householdId', houseId),
                Query.startsWith('timestamp', datePart)
            ]
        );
        return response.documents[0];
    },

    async updateHouseholdStatus(houseId: string, status: string, amount: number = 0, collectorId: string, collectorName: string, residentName: string, location: string, paymentMode?: string, paymentStatus?: string) {
        const updateData: any = { 
            collectionStatus: status,
            lastCollectionDate: new Date().toISOString().split('T')[0],
            paymentMode: paymentMode || 'none'
        };

        if (paymentStatus) {
            updateData.paymentStatus = paymentStatus;
        } else if (paymentMode === 'offline') {
            updateData.paymentStatus = 'paid';
        }

        await databases.updateDocument(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            houseId,
            updateData
        );

        // Check if a log already exists for today
        const existingLog = await this.getTodaysLogForHousehold(houseId);

        if (existingLog) {
            await databases.updateDocument(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                existingLog.$id,
                {
                    collectorId,
                    collectorName,
                    status,
                    amountCollected: amount,
                    paymentMode: paymentMode || 'none'
                }
            );
        } else {
            await databases.createDocument(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                ID.unique(),
                {
                    collectorId,
                    collectorName,
                    householdId: houseId,
                    residentName,
                    timestamp: new Date().toLocaleString(),
                    location,
                    status,
                    amountCollected: amount,
                    paymentMode: paymentMode || 'none'
                }
            );
        }
    },

    async payOnline(houseId: string, residentName: string, amount: number) {
        console.log('API: Processing Online Payment for', houseId);
        // 1. Update household status
        await databases.updateDocument(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            houseId,
            { 
                paymentStatus: 'paid',
                paymentMode: 'online'
            }
        );

        // 2. Log the online payment - Update existing log if found
        let existingLog = null;
        try {
            existingLog = await this.getTodaysLogForHousehold(houseId);
        } catch (e) {
            console.warn('API: Could not search for existing log (permissions), fallback to create.');
        }

        if (existingLog) {
            return await databases.updateDocument(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                existingLog.$id,
                {
                    status: 'paid',
                    amountCollected: amount,
                    paymentMode: 'online'
                }
            );
        } else {
            return await databases.createDocument(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                ID.unique(),
                {
                    collectorId: 'SYSTEM',
                    collectorName: 'Resident Portal',
                    householdId: houseId,
                    residentName: residentName,
                    timestamp: new Date().toLocaleString(),
                    location: 'Online Gateway',
                    status: 'paid',
                    amountCollected: amount,
                    paymentMode: 'online'
                }
            );
        }
    }
};
