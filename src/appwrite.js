import { Databases, Query, ID, Client } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

console.log("Appwrite Env:", COLLECTION_ID, PROJECT_ID, DATABASE_ID);

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID);

const database = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
  try {
    // 1. Check if the search term already exists
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("searchTerm", searchTerm),
    ]);

    // 2. If found, update count
    if (result.documents.length > 0) {
      const doc = result.documents[0];
      await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        count: (doc.count || 0) + 1,
      });
    }
    // 3. If not found, create a new document
    else {
      await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm: searchTerm.trim().toLowerCase(), // normalize
        count: 1,
        movie_id: movie.id,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Appwrite update error:", error);
  }
};

export const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderDesc("count"),
      Query.limit(20), // increase if needed
    ]);

    // Deduplicate by movie_id
    const seen = new Set();
    const uniqueMovies = [];

    for (const doc of result.documents) {
      if (!seen.has(doc.movie_id)) {
        seen.add(doc.movie_id);
        uniqueMovies.push(doc);
      }
    }

    return uniqueMovies;
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};
