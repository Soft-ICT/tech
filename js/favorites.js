// ফেভারিট টগল করা (যুক্ত বা বাদ দেওয়া)
function toggleFavorite(dataId) {
    const devId = getDeviceId();
    let favorites = getUserFavorites();
    
    const index = favorites.indexOf(dataId);
    if (index > -1) {
        // যদি আগে থেকেই থাকে, তবে বাদ দিন (আনফেভারিট)
        favorites.splice(index, 1);
        if (typeof showToast === 'function') {
            showToast("❤️ ফেভারিট থেকে সরানো হয়েছে");
        }
    } else {
        // না থাকলে যুক্ত করুন (ফেভারিট)
        favorites.push(dataId);
        if (typeof showToast === 'function') {
            showToast("❤️ ফেভারিটে যুক্ত করা হয়েছে");
        }
    }
    
    // শুধু এই ইউজারের লোকাল স্টোরেজে সেভ হবে
    localStorage.setItem(`favorites_${devId}`, JSON.stringify(favorites));
    
    // ভিউ রিফ্রেশ করুন যেন আইকনের পরিবর্তন সাথে সাথে দেখা যায়
    if (typeof refreshCurrentView === 'function') {
        refreshCurrentView();
    } else {
        // যদি রিফ্রেশ ফাংশন না থাকে, সরাসরি ফেভারিট ভিউ আপডেট করতে পারেন
        if (typeof showFavoriteView === 'function') {
            showFavoriteView();
        }
    }
}

// ফেভারিট ভিউ বা পেজ রেন্ডার করার ফাংশন
function showFavoriteView() {
    // আপনার অ্যাপের স্টেট অনুযায়ী এগুলো সেট করে নিন
    if (typeof isAllSearchActive !== 'undefined') isAllSearchActive = false;
    if (typeof currentCategoryId !== 'undefined') currentCategoryId = null;
    if (typeof currentDataId !== 'undefined') currentDataId = null;
    
    const container = document.getElementById("categoryList"); // অথবা আপনার ডাটা দেখানোর মূল কন্টেইনার
    if (!container) return;
    
    const favorites = getUserFavorites();
    
    // গ্লোবাল ডাটাবেজ থেকে শুধু ইউজারের ফেভারিট আইডিগুলোর ডাটা ফিল্টার করা
    // (নিশ্চিত করুন আপনার ডাটাবেজ ভেরিয়েবলটির নাম database বা অনুরূপ কিছু)
    const allData = (typeof database !== 'undefined' && database.data) ? database.data : [];
    const favoriteItems = allData.filter(item => favorites.includes(item.id));
    
    if (favoriteItems.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted, #777);">আপনার ফেভারিট লিস্টে কোনো নম্বর নেই</div>`;
        return;
    }
    
    container.innerHTML = "";
    favoriteItems.forEach(item => {
        if (typeof createDataCardElement === 'function') {
            container.appendChild(createDataCardElement(item));
        }
    });
}
