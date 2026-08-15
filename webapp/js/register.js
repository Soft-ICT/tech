import {
    registerUser
} from "./auth.js";


const form =
    document.getElementById(
        "registerForm"
    );


const errorBox =
    document.getElementById(
        "registerError"
    );


form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        errorBox.textContent = "";


        const name =
            document
                .getElementById(
                    "registerName"
                )
                .value
                .trim();


        const email =
            document
                .getElementById(
                    "registerEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "registerPassword"
                )
                .value;


        try {

            await registerUser(
                email,
                password,
                name
            );


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(error);


            switch (error.code) {

                case "auth/email-already-in-use":

                    errorBox.textContent =
                        "এই Email দিয়ে ইতিমধ্যে Account আছে।";

                    break;


                case "auth/invalid-email":

                    errorBox.textContent =
                        "সঠিক Email লিখুন।";

                    break;


                case "auth/weak-password":

                    errorBox.textContent =
                        "আরও শক্ত Password ব্যবহার করুন।";

                    break;


                default:

                    errorBox.textContent =
                        "Account তৈরি করা যায়নি। আবার চেষ্টা করুন।";

            }

        }

    }
);
