export class FirebaseConfig {
    public static config = {
        apiKey: process.env.API_KEY || "<API_KEY>",
        authDomain: process.env.PROJECT_ID || "<PROJECT_ID>.firebaseapp.com",
        databaseURL: process.env.DB_NAME || "https://<DATABASE_NAME>.firebaseio.com",
        storageBucket: process.env.BUCKET_STORAGE || "<BUCKET>.appspot.com",
    }    
}
