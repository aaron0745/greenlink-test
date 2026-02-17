import { Client, Account, Databases, Storage } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

console.log('Appwrite Init:', { endpoint, projectId });

if (!endpoint || !projectId) {
  console.error('Appwrite endpoint or project ID is missing in environment variables');
}

export const client = new Client();

client
    .setEndpoint(endpoint || 'https://cloud.appwrite.io/v1')
    .setProject(projectId || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const HOUSEHOLDS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_HOUSEHOLDS;
export const COLLECTORS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_COLLECTORS;
export const ROUTES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ROUTES;
export const TRANSACTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_TRANSACTIONS;
