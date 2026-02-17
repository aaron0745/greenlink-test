import { databases, DATABASE_ID, HOUSEHOLDS_COLLECTION_ID, ROUTES_COLLECTION_ID, TRANSACTIONS_COLLECTION_ID, COLLECTORS_COLLECTION_ID } from './appwrite';
import { Query, ID } from 'appwrite';

export const api = {
    async getHouseholds() {
        const response = await databases.listDocuments(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID
        );
        return response.documents;
    },

    async getHousehold(id: string) {
        const response = await databases.getDocument(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            id
        );
        return response;
    },

    async getHouseholdByPhone(phone: string) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            [Query.equal('phone', phone)]
        );
        return response.documents[0];
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

    async getRoutes() {
        const response = await databases.listDocuments(
            DATABASE_ID,
            ROUTES_COLLECTION_ID
        );
        return response.documents;
    },

    async getCollectionLogs() {
        const response = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [Query.orderDesc('timestamp')]
        );
        return response.documents;
    },

    async getStats() {
        const households = await this.getHouseholds();
        const logs = await this.getCollectionLogs();

        const total = households.length;
        const covered = households.filter((h: any) => h.collectionStatus === "collected").length;
        const pending = households.filter((h: any) => h.collectionStatus === "pending").length;
        
        // In a real app, you'd probably use an aggregation or a separate stats collection
        const revenue = logs.filter((l: any) => l.status === "collected").reduce((a: number, l: any) => a + l.amountCollected, 0);
        
        const totalWet = households.reduce((a: number, h: any) => a + (h.wetWaste || 0), 0);
        const totalDry = households.reduce((a: number, h: any) => a + (h.dryWaste || 0), 0);
        const totalReject = households.reduce((a: number, h: any) => a + (h.rejectWaste || 0), 0);

        return { 
            total, 
            covered, 
            pending, 
            revenue, 
            totalWet: Math.round(totalWet), 
            totalDry: Math.round(totalDry), 
            totalReject: Math.round(totalReject * 10) / 10 
        };
    },

    async updateHouseholdStatus(houseId: string, status: string, amount: number = 0, collectorId: string, collectorName: string, residentName: string, location: string, paymentMode?: string, paymentStatus?: string) {
        // Update household
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

        // Create log entry
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
    },

    async payOnline(houseId: string, amount: number) {
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

        // 2. Log the online payment
        return await databases.createDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            ID.unique(),
            {
                collectorId: 'SYSTEM',
                collectorName: 'Online Payment',
                householdId: houseId,
                residentName: 'Self-Paid',
                timestamp: new Date().toLocaleString(),
                location: 'Gateway',
                status: 'paid',
                amountCollected: amount,
                paymentMode: 'online'
            }
        );
    }
};
