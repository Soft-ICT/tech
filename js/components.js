// এসকেপ করার সাধারণ ফাংশন (যদি না থাকে)
function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// ডাটা কার্ড এলিমেন্ট তৈরি করার ফাংশন
function createDataCardElement(item) {
    const card = document.createElement("div");
    card.className = "data-card";
    
    const isFav = isFavorite(item.id);
    const favIcon = isFav ? '❤️' : '🤍';
    const favActiveClass = isFav ? 'active-fav' : '';
    
    card.innerHTML = `
        <div class="card-info" style="flex-grow: 1;">
            <h4 style="margin: 0 0 5px 0;">${escapeHTML(item.name)}</h4>
            <p style="margin: 0; color: #555;">${escapeHTML(item.designation || item.phone || '')}</p>
        </div>
        <button class="fav-btn ${favActiveClass}" onclick="toggleFavorite('${item.id}')" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 5px;">
            ${favIcon}
        </button>
    `;
    
    return card;
}
