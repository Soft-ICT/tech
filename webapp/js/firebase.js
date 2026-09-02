import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";

const firebaseConfig = {
apiKey: "AIzaSyCSirbiyWf7WQn9UqoZghAfph2U5jwJbPI",
authDomain: "qrt-team.firebaseapp.com",
databaseURL: "https://qrt-team-default-rtdb.firebaseio.com",
projectId: "qrt-team",
storageBucket: "qrt-team.firebasestorage.app",
messagingSenderId: "855875068920",
appId: "1:855875068920:web:df1a2218ee083000b8ec0d",
measurementId: "G-BKNYLRYSGS"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);
const messaging = getMessaging(app);

export { app, auth, db, messaging };
