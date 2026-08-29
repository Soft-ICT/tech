document.getElementById("logoutBtn")?.addEventListener("click", async () => {

    const logoutBtn = document.getElementById("logoutBtn");

    // একাধিকবার চাপা বন্ধ
    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.textContent = "লগআউট হচ্ছে...";
    }

    try {

        const result = await logoutAdmin();

        if (!result.success) {
            showToast("লগআউট ব্যর্থ হয়েছে: " + result.error);

            if (logoutBtn) {
                logoutBtn.disabled = false;
                logoutBtn.textContent = "লগআউট";
            }

            return;
        }

        // Local admin state reset
        window.currentUser = null;
        window.currentUserRole = "guest";

        // Admin UI সঙ্গে সঙ্গে আপডেট
        updateAdminUI();

        // Login modal বন্ধ
        closeModal("loginModal");

        // Admin verification modal থাকলে সেটিও বন্ধ
        closeModal("adminVerifyRequestsModal");

        // অন্যান্য admin modal থাকলে বন্ধ
        closeModal("categoryModal");
        closeModal("headerModal");
        closeModal("dataModal");
        closeModal("moveDataModal");

        // Home page-এ ফিরিয়ে দাও
        currentCategoryId = null;
        currentDataId = null;
        isAllSearchActive = false;
        isSearchMode = false;

        closeAllSearchUI();
        showMainDashboardView(false);

        showToast("✅ অ্যাডমিন সফলভাবে লগআউট হয়েছে");

    } catch (error) {

        console.error("Logout Error:", error);

        showToast("❌ লগআউট করতে সমস্যা হয়েছে");

        if (logoutBtn) {
            logoutBtn.disabled = false;
            logoutBtn.textContent = "লগআউট";
        }
    }
});
