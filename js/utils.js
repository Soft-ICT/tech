// ইউনিক ডিভাইস আইডি তৈরি বা রিট্রিভ করার ফাংশন
function getDeviceId() {
    let devId = localStorage.getItem("police_pb_device_id");
    if (!devId) {
        devId = "DEV_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
        localStorage.setItem("police_pb_device_id", devId);
    }
    return devId;
}

// বর্তমান ইউজারের ফেভারিট আইডিগুলোর অ্যারে রিটার্ন করবে
function getUserFavorites() {
    const devId = getDeviceId();
    const favoritesJSON = localStorage.getItem(`favorites_${devId}`);
    try {
        return favoritesJSON ? JSON.parse(favoritesJSON) : [];
    } catch (e) {
        return [];
    }
}

// কোনো নির্দিষ্ট আইডি ফেভারিট আছে কি না চেক করার ফাংশন
function isFavorite(dataId) {
    const favorites = getUserFavorites();
    return favorites.includes(dataId);
}

