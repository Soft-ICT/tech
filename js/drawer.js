// js/drawer.js

export function initDrawer() {
    // ড্রয়ারের আল্ট্রা-মডার্ন এইচটিএমএল স্ট্রাকচার
    const drawerHTML = `
        <div id="appDrawerOverlay" class="drawer-overlay"></div>
        <nav id="appDrawer" class="app-drawer">
            <div class="drawer-header">
                <div class="drawer-header-bg-glow"></div>
                <div class="drawer-profile-area">
                    <div class="drawer-avatar">
                        <span class="drawer-icon">🛡️</span>
                    </div>
                    <div class="drawer-title-texts">
                        <h3>Police Phonebook</h3>
                        <p>Bangladesh Police</p>
                    </div>
                </div>
                <button id="closeDrawerBtn" class="close-drawer-btn" type="button" title="বন্ধ করুন">
                    <span>✕</span>
                </button>
            </div>
            
            <div class="drawer-body">
                <ul class="drawer-menu-list">
                    <li data-action="home" class="active">
                        <span class="menu-ico">📖</span> 
                        <span class="menu-text">Police Phonebook</span>
                    </li>
                    <li data-action="search">
                        <span class="menu-ico">🔍</span> 
                        <span class="menu-text">Search All Unit & Number</span>
                    </li>
                    <li data-action="favorite">
                        <span class="menu-ico">❤️</span> 
                        <span class="menu-text">Favorite Number</span>
                    </li>
                    <li data-action="notice-box">
                        <span class="menu-ico">📢</span> 
                        <span class="menu-text">Notice Box</span>
                    </li>
                </ul>

                <div class="drawer-divider"></div>
                <div class="drawer-section-title">Tools</div>
                <ul class="drawer-menu-list">
                    <li data-action="settings">
                        <span class="menu-ico">⚙️</span> 
                        <span class="menu-text">Setting Menu</span>
                    </li>
                    <li data-action="delete-db" class="text-danger">
                        <span class="menu-ico">🗑️</span> 
                        <span class="menu-text">Delete Database</span>
                    </li>
                    <li data-action="privacy">
                        <span class="menu-ico">🔒</span> 
                        <span class="menu-text">Privacy Policy</span>
                    </li>
                </ul>

                <div class="drawer-divider"></div>
                <div class="drawer-section-title">Communicate</div>
                <ul class="drawer-menu-list">
                    <li data-action="about">
                        <span class="menu-ico">ℹ️</span> 
                        <span class="menu-text">About App</span>
                    </li>
                    <li data-action="update-app">
                        <span class="menu-ico">📲</span> 
                        <span class="menu-text">Update App</span>
                    </li>
                    <li data-action="share">
                        <span class="menu-ico">🔗</span> 
                        <span class="menu-text">Share App</span>
                    </li>
                </ul>
            </div>
            
            <div class="drawer-footer">
                <span>Secure • Version 1.1.0</span>
            </div>
        </nav>
    `;

// ড্রয়ার মেনু বা সিলেকশন হ্যান্ডলারের ভেতর এভাবে কেস হ্যান্ডেল করুন:
function handleDrawerAction(actionType) {
    switch (actionType) {
        case 'home':
            // হোম পেজ লোড করার কোড
            break;
            
        case 'favorite': // অথবা আপনার ড্রয়ারে ফেভারিটের জন্য নির্ধারিত অ্যাকশন নেম
            showFavoriteView();
            break;
            
        case 'about':
            // অ্যাবাউট পেজ
            break;
            
        default:
            break;
    }
}
    

    
    // যদি আগে কোনো ড্রয়ার থেকে থাকে তবে তা রিমूव করে নতুনটি যুক্ত করা
    const existingDrawer = document.getElementById('appDrawer');
    const existingOverlay = document.getElementById('appDrawerOverlay');
    if (existingDrawer) existingDrawer.remove();
    if (existingOverlay) existingOverlay.remove();

    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    const drawer = document.getElementById('appDrawer');
    const overlay = document.getElementById('appDrawerOverlay');
    const navToggleBtn = document.getElementById('navToggleBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');

    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    if (navToggleBtn) {
        navToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (drawer.classList.contains('open')) {
                closeDrawer();
            } else {
                openDrawer();
            }
        });
    }

    overlay.addEventListener('click', closeDrawer);
    closeDrawerBtn.addEventListener('click', closeDrawer);

    const menuItems = drawer.querySelectorAll('.drawer-menu-list li');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            handleDrawerAction(action);
            closeDrawer();
        });
    });
}

function handleDrawerAction(action) {
    switch (action) {
        case 'home':
            console.log('Home clicked');
            break;
        case 'search':
            // যদি আপনার অ্যাপে অল সার্চ বাটন থাকে সেটি ট্রিগার করতে পারেন
            const allSearchBtn = document.getElementById('allSearchBtn');
            if (allSearchBtn) allSearchBtn.click();
            break;
        case 'notice-box':
            console.log('Notice Box clicked');
            break;
        case 'share':
            if (navigator.share) {
                navigator.share({
                    title: 'Police Phonebook',
                    url: window.location.href
                }).catch(console.error);
            } else {
                alert('Sharing not supported on this browser.');
            }
            break;
        default:
            console.log(action + ' clicked');
    }
}
