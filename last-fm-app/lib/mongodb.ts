import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Set it in your .env file.",
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export const clientPromise =
  global._mongoClientPromise ??
  new MongoClient(uri).connect().then((client) => {
    if (dbName) {
      client.db(dbName);
    }
    return client;
  });

if (process.env.NODE_ENV !== "production") {
  global._mongoClientPromise = clientPromise;
}


