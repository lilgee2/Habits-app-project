import { Account, Client, Databases } from 'react-native-appwrite';

export const client = new Client()
.setEndpoint("https://fra.cloud.appwrite.io/v1")
.setProject("68384c55000705c735b4")
.setPlatform("co.gman.habitapp");

export const account = new Account(client);
export const databases = new Databases(client);

export const databaseId = '683995580015934875c2';
export const collectionId = '68399bfe00191384fb16';
export const completionsId = '683b0bab0006859ff8b8'

export interface RealtimeResponse{
    events: string[];
    palyload: any;
}