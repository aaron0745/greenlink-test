import { databases, DATABASE_ID, HOUSEHOLDS_COLLECTION_ID, ROUTES_COLLECTION_ID, TRANSACTIONS_COLLECTION_ID, COLLECTORS_COLLECTION_ID } from './appwrite';
import { Query, ID } from 'appwrite';

const getISTDate = () => {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
};

const formatIST = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const api = {
    async getHouseholds() {
        const response = await databases.listDocuments(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            [Query.limit(100)]
        );
        const today = formatIST(getISTDate());
        return response.documents.map((h: any) => {
            const isToday = h.lastCollectionDate === today;
            return {
                ...h,
                collectionStatus: isToday ? h.collectionStatus : 'pending',
                paymentStatus: isToday ? h.paymentStatus : 'pending'
            };
        });
    },

    async getHousehold(id: string) {
        const h: any = await databases.getDocument(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            id
        );
        const today = formatIST(getISTDate());
        const isToday = h.lastCollectionDate === today;

        return {
            ...h,
            collectionStatus: isToday ? h.collectionStatus : 'pending',
            paymentStatus: isToday ? h.paymentStatus : 'pending'
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
        
        const today = formatIST(getISTDate());
        const isToday = h.lastCollectionDate === today;

        return {
            ...h,
            collectionStatus: isToday ? h.collectionStatus : 'pending',
            paymentStatus: isToday ? h.paymentStatus : 'pending'
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
            [Query.equal('rawDate', date)]
        );
        return response.documents;
    },

    async getHouseholdsByWard(ward: number) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            [Query.equal('ward', ward), Query.limit(100)]
        );
        const today = formatIST(getISTDate());

        return response.documents.map((h: any) => {
            const isToday = h.lastCollectionDate === today;
            return {
                ...h,
                collectionStatus: isToday ? h.collectionStatus : 'pending',
                paymentStatus: isToday ? h.paymentStatus : 'pending'
            };
        });
    },

    async assignRoute(collectorId: string, collectorName: string, ward: number, date: string) {
        console.log(`API: Assigning Ward ${ward} to ${collectorName} on ${date}`);
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
                rawDate: date,
                totalHouses: 0, 
                collectedHouses: 0
            }
        );

        const houses = await this.getHouseholdsByWard(ward);
        for (const h of houses) {
            await databases.updateDocument(
                DATABASE_ID,
                HOUSEHOLDS_COLLECTION_ID,
                h.$id,
                { assignedCollector: collectorId }
            );
        }
        return route;
    },

    async getDailyAssignment(collectorId: string, date: string) {
        console.log(`API: Checking assignment for collector ${collectorId} on date ${date}`);
        const response = await databases.listDocuments(
            DATABASE_ID,
            ROUTES_COLLECTION_ID,
            [
                Query.equal('collectorId', collectorId),
                Query.equal('rawDate', date)
            ]
        );
        console.log('API: Assignment response total:', response.total);
        return response.documents[0] || null;
    },

    async deleteRoute(routeId: string, ward: number) {
        await databases.deleteDocument(DATABASE_ID, ROUTES_COLLECTION_ID, routeId);
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
        const datePart = formatIST(getISTDate());
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
        const now = getISTDate();
        const dateStr = formatIST(now);
        const timeStr = now.toLocaleTimeString("en-US", { hour12: false });

        const updateData: any = { 
            collectionStatus: status,
            lastCollectionDate: dateStr,
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
                    timestamp: `${dateStr} ${timeStr}`,
                    location,
                    status,
                    amountCollected: amount,
                    paymentMode: paymentMode || 'none'
                }
            );
        }

        if (status === 'collected' && collectorId !== 'SYSTEM') {
            try {
                const collector: any = await databases.getDocument(DATABASE_ID, COLLECTORS_COLLECTION_ID, collectorId);
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTORS_COLLECTION_ID,
                    collectorId,
                    { totalCollections: (collector.totalCollections || 0) + 1 }
                );
            } catch (e) {}
        }
    },

    async payOnline(houseId: string, residentName: string, amount: number) {
        const now = getISTDate();
        const dateStr = formatIST(now);
        const timeStr = now.toLocaleTimeString("en-US", { hour12: false });

        await databases.updateDocument(
            DATABASE_ID,
            HOUSEHOLDS_COLLECTION_ID,
            houseId,
            { 
                paymentStatus: 'paid',
                paymentMode: 'online',
                lastCollectionDate: dateStr
            }
        );

        let existingLog = null;
        try {
            existingLog = await this.getTodaysLogForHousehold(houseId);
        } catch (e) {}

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
                    timestamp: `${dateStr} ${timeStr}`,
                    location: 'Online Gateway',
                    status: 'paid',
                    amountCollected: amount,
                    paymentMode: 'online'
                }
            );
        }
    }
};
