import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    ref,
    set,
    get
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import {
    auth,
    db
} from "./firebase.js";


const ADMIN_UID =
    "1nTNmVJZ2oQ7EcVruulZoQFXg7b2";


/* ================================
   REGISTER
================================ */

export async function registerUser(
    email,
    password,
    name
) {

    const credential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );


    const uid =
        credential.user.uid;


    /*
       Client থেকে কখনো admin role
       দেওয়া হচ্ছে না।
    */

    await set(
        ref(
            db,
            "webapp/users/" + uid
        ),
        {
            name: name,
            role: "user",
            createdAt: Date.now()
        }
    );


    return credential.user;
}


/* ================================
   LOGIN
================================ */

export async function loginUser(
    email,
    password
) {

    const credential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


    return credential.user;
}


/* ================================
   LOGOUT
================================ */

export async function logoutUser() {

    await signOut(auth);

}


/* ================================
   USER ROLE
================================ */

export async function getUserRole(uid) {

    /*
       Admin UID সরাসরি যাচাই করা হচ্ছে।
       Database-এর role-ও যাচাই করা হবে।
    */

    if (uid === ADMIN_UID) {

        return "admin";

    }


    const snapshot =
        await get(
            ref(
                db,
                "webapp/users/" + uid
            )
        );


    if (!snapshot.exists()) {

        return "user";

    }


    const userData =
        snapshot.val();


    return userData.role === "admin"
        ? "admin"
        : "user";

}


/* ================================
   AUTH STATE
================================ */

export function watchAuth(callback) {

    return onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                callback(
                    null,
                    "guest"
                );

                return;

            }


            const role =
                await getUserRole(
                    user.uid
                );


            callback(
                user,
                role
            );

        }
    );

}
