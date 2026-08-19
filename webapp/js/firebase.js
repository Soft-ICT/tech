const firebaseConfig = {
    apiKey: "AIzaSyCSirbiyWf7WQn9UqoZghAfph2U5jwJbPI",[span_2](start_span)[span_2](end_span)
    authDomain: "qrt-team.firebaseapp.com",[span_3](start_span)[span_3](end_span)
    databaseURL: "https://qrt-team-default-rtdb.firebaseio.com",[span_4](start_span)[span_4](end_span)
    projectId: "qrt-team",[span_5](start_span)[span_5](end_span)
    storageBucket: "qrt-team.firebasestorage.app",[span_6](start_span)[span_6](end_span)
    messagingSenderId: "855875068920",[span_7](start_span)[span_7](end_span)
    appId: "1:855875068920:web:df1a2218ee083000b8ec0d",[span_8](start_span)[span_8](end_span)
    measurementId: "G-BKNYLRYSGS[span_9](start_span)"[span_9](end_span)
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.database();
