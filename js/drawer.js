// js/drawer.js

export function initDrawer() {
    const drawerHTML = `
        <div id="appDrawerOverlay" class="drawer-overlay"></div>
        <nav id="appDrawer" class="app-drawer">
            <div class="drawer-header">
                <div class="drawer-header-bg-glow"></div>
                <div class="drawer-profile-area">
                    <div class="drawer-avatar" style="overflow: hidden; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #fff;">
                      <img src="icon/icon-192.png" alt="" style="width: 100%; height: 100%; object-fit: cover;">
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
                    <li data-action="favorite" id="drawerFavoriteItem">
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

            const menuIcon = document.getElementById('menuIcon');
            const backIcon = document.getElementById('backIcon');
            const searchBox = document.getElementById('searchBox');

            const isMenuVisible = menuIcon && !menuIcon.classList.contains('hidden');
            const isBackVisible = backIcon && !backIcon.classList.contains('hidden');
            const isSearchOpen = searchBox && !searchBox.classList.contains('hidden');

            if (isSearchOpen || isBackVisible || !isMenuVisible) {
                return;
            }

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

// স্ক্রিনশটের স্টাইল অনুযায়ী কাস্টম কনফার্মেশন মোডাল
function showCustomDeleteModal(onConfirm) {
    const existingModal = document.getElementById('customDeleteModal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="customDeleteModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 20px;">
            <div style="background: #fff; width: 100%; max-width: 380px; border-radius: 20px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative; font-family: inherit; animation: scaleUp 0.2s ease;">
                
                <!-- ক্লোজ বাটন -->
                <button id="modalCloseBtn" style="position: absolute; top: 18px; right: 18px; background: none; border: none; font-size: 20px; cursor: pointer; color: #333;">✕</button>
                
                <!-- শিরোনাম -->
                <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #f44336;">সতর্কীকরণ❗</h3>
                
                <!-- মেসেজ -->
                <p style="margin: 0 0 25px 0; font-size: 15px; color: #444; line-height: 1.5;">
                    আপনি কি নিশ্চিত সমস্ত ডাটা ও লগইন তথ্য মুছে ফেলতে চান? (এর ফলে অ্যাপটি একদম প্রথম ইন্সটলের অবস্থার মতো হয়ে যাবে এবং পুনরায় পাসওয়ার্ড দিয়ে প্রবেশ করতে হবে।)
                </p>
                
                <!-- বাটনগুলো -->
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="modalCancelBtn" style="padding: 8px 18px; border: 1px solid #ccc; background: #fff; color: #333; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">বাতিল</button>
                    <button id="modalConfirmBtn" style="padding: 8px 18px; border: none; background: #f44336; color: #fff; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">হ্যাঁ, মুছুন</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('customDeleteModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const confirmBtn = document.getElementById('modalConfirmBtn');

    function closeModal() {
        modal.remove();
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    confirmBtn.addEventListener('click', () => {
        closeModal();
        onConfirm();
    });
}

function handleDrawerAction(action) {
    switch (action) {
        case 'home':
            if (typeof showMainDashboardView === 'function') {
                history.pushState({ page: "home" }, "");
                showMainDashboardView();
            }
            break;
        case 'search':
            const allSearchBtn = document.getElementById('allSearchBtn');
            if (allSearchBtn) allSearchBtn.click();
            break;
        case 'favorite':
            if (typeof renderFavoriteView === 'function') {
                renderFavoriteView(true);
            }
            break;
        case 'delete-db':
            showCustomDeleteModal(() => {
                // অ্যাপের সমস্ত লোকাল ডাটা, ফেভারিট এবং লগইন/পাসওয়ার্ড সংক্রান্ত তথ্য সম্পূর্ণ মুছে ফেলা হবে
                localStorage.clear();
                
                // অথবা যদি আপনার অ্যাপে লোকালস্টোরেজ ছাড়াও কুকি বা সেশনস্টোরেজ থাকে, তাও ক্লিয়ার করে দিতে পারেন:
                sessionStorage.clear();

                // পেজ রিলোড করলে অ্যাপটি একদম প্রথম বারের মতো পাসওয়ার্ড বা লগইন স্ক্রিন চাইবে
                window.location.reload();
            });
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
