import {
    loginUser,
    watchAuth
} from "./auth.js";


const form =
    document.getElementById(
        "loginForm"
    );


const errorBox =
    document.getElementById(
        "loginError"
    );


/*
   আগে থেকেই Login করা থাকলে
   Dashboard-এ পাঠিয়ে দেবে।
*/

watchAuth(
    (user, role) => {

        if (user) {

            window.location.href =
                "index.html";

        }

    }
);


form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        errorBox.textContent = "";


        const email =
            document
                .getElementById(
                    "loginEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "loginPassword"
                )
                .value;


        try {

            await loginUser(
                email,
                password
            );


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(error);


            switch (error.code) {

                case "auth/invalid-credential":

                    errorBox.textContent =
                        "Email অথবা Password সঠিক নয়।";

                    break;


                case "auth/user-not-found":

                    errorBox.textContent =
                        "এই Email দিয়ে কোনো Account নেই।";

                    break;


                case "auth/wrong-password":

                    errorBox.textContent =
                        "Password সঠিক নয়।";

                    break;


                case "auth/invalid-email":

                    errorBox.textContent =
                        "সঠিক Email লিখুন।";

                    break;


                default:

                    errorBox.textContent =
                        "Login করা যায়নি। আবার চেষ্টা করুন।";

            }

        }

    }
);
