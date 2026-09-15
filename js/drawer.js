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

// কাস্টম কনফার্মেশন মোডাল (ডাটা ডিলিট)
function showCustomDeleteModal(onConfirm) {
    const existingModal = document.getElementById('customDeleteModal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="customDeleteModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 20px;">
            <div style="background: #fff; width: 100%; max-width: 380px; border-radius: 20px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative; font-family: inherit;">
                
                <button id="modalCloseBtn" style="position: absolute; top: 18px; right: 18px; background: none; border: none; font-size: 20px; cursor: pointer; color: #333;">✕</button>
                
                <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #f44336;">সতর্কীকরণ❗</h3>
                
                <p style="margin: 0 0 25px 0; font-size: 15px; color: #444; line-height: 1.5;">
                    আপনি কি নিশ্চিত সমস্ত ডাটা ও লগইন তথ্য মুছে ফেলতে চান? (এর ফলে অ্যাপটি একদম প্রথম ইন্সটলের অবস্থার মতো হয়ে যাবে এবং পুনরায় পাসওয়ার্ড দিয়ে প্রবেশ করতে হবে।)
                </p>
                
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="modalCancelBtn" style="padding: 8px 18px; border: 1px solid #ccc; background: #fff; color: #333; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">বাতিল</button>
                    <button id="modalConfirmBtn" style="padding: 8px 18px; border: none; background: #f44336; color: #fff; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">হ্যাঁ, মুছুন</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('customDeleteModal');
    document.getElementById('modalCloseBtn').addEventListener('click', () => modal.remove());
    document.getElementById('modalCancelBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
        modal.remove();
        onConfirm();
    });
}

// অ্যাডভান্সড সেটিংস মেনু মোডাল (থিম, ব্যাকগ্রাউন্ড, টেক্সট কালার, ডার্ক মোড ও ল্যাঙ্গুয়েজ)
function initSettingsModal() {
    const existingModal = document.getElementById('settingsModal');
    if (existingModal) existingModal.remove();

    // বর্তমান মান লোকালস্টোরেজ থেকে লোড করা
    const themeColor = localStorage.getItem('app_theme_color') || '#ff0000';
    const bgColor = localStorage.getItem('app_bg_color') || '#3f51b5';
    const textColor = localStorage.getItem('app_text_color') || '#ffffff';
    const language = localStorage.getItem('app_language') || 'bn';
    const isDarkMode = localStorage.getItem('app_dark_mode') === 'true';

    const modalHTML = `
        <div id="settingsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 20px;">
            <div style="background: #fff; width: 100%; max-width: 420px; border-radius: 20px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative; font-family: inherit; max-height: 90vh; overflow-y: auto;">
                
                <button id="settingsCloseBtn" style="position: absolute; top: 18px; right: 18px; background: none; border: none; font-size: 20px; cursor: pointer; color: #333;">✕</button>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #111;">
                        ⚙️ Setting
                    </h3>
                    <!-- ডার্ক/লাইট মোড টগল আইকন -->
                    <button id="darkModeToggleBtn" type="button" title="Dark/Light Mode" style="background: none; border: 1px solid #ddd; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">
                        ${isDarkMode ? '🌞' : '🌙'}
                    </button>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    
                    <!-- Theme Color -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <label style="font-size: 15px; font-weight: 600; color: #333;">Theme</label>
                        <input type="color" id="themeColorInput" value="${themeColor}" style="width: 40px; height: 40px; border: none; border-radius: 50%; cursor: pointer; background: none;">
                    </div>

                    <!-- Background Color -->
                    <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <label style="font-size: 15px; font-weight: 600; color: #333;">Background Color</label>
                        <input type="color" id="bgColorInput" value="${bgColor}" style="width: 40px; height: 40px; border: none; border-radius: 50%; cursor: pointer; background: none;">
                    </div>

                    <!-- Text Color -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <label style="font-size: 15px; font-weight: 600; color: #333;">Text Color</label>
                        <input type="color" id="textColorInput" value="${textColor}" style="width: 40px; height: 40px; border: none; border-radius: 50%; cursor: pointer; background: none;">
                    </div>

                    <!-- Apps Data View Mode (Language) -->
                    <div style="display: flex; flex-direction: column; gap: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <label style="font-size: 15px; font-weight: 600; color: #333; text-align: center;">Apps Data View Mode</label>
                        <div style="display: flex; justify-content: space-around; align-items: center;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                                <input type="radio" name="appLang" value="en" ${language === 'en' ? 'checked' : ''} style="cursor: pointer;"> English 🇬🇧
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                                <input type="radio" name="appLang" value="bn" ${language === 'bn' ? 'checked' : ''} style="cursor: pointer;"> Bangla 🇧🇩
                            </label>
                        </div>
                    </div>

                </div>

                <!-- Action Buttons -->
                <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                    <button id="resetSettingsBtn" style="width: 100%; background: #2196F3; color: #fff; border: none; padding: 12px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer;">Reset Settings</button>
                    <button id="clearDataBtn" style="width: 100%; background: #2196F3; color: #fff; border: none; padding: 12px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer;">Clear Apps Data</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('settingsModal');

    // ডার্ক মোড টগল বাটন ফাংশনালিটি
    const darkModeToggleBtn = document.getElementById('darkModeToggleBtn');
    darkModeToggleBtn.addEventListener('click', () => {
        const currentDarkState = localStorage.getItem('app_dark_mode') === 'true';
        const newDarkState = !currentDarkState;
        localStorage.setItem('app_dark_mode', newDarkState);
        
        if (newDarkState) {
            document.body.classList.add('dark-mode');
            darkModeToggleBtn.innerHTML = '🌞';
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggleBtn.innerHTML = '🌙';
        }
    });

    // ক্লোজ বাটন
    document.getElementById('settingsCloseBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Reset Settings বাটন ক্লিক করলে ডিফল্ট মান ফিরিয়ে আনা
    document.getElementById('resetSettingsBtn').addEventListener('click', () => {
        localStorage.removeItem('app_theme_color');
        localStorage.removeItem('app_bg_color');
        localStorage.removeItem('app_text_color');
        localStorage.removeItem('app_bg_image');
        localStorage.removeItem('app_language');
        localStorage.removeItem('app_dark_mode');
        alert("সেটিংস রিসেট করা হয়েছে!");
        modal.remove();
        window.location.reload();
    });

    // Clear Apps Data বাটন ক্লিক করলে ডাটা ও লগইন ক্লিয়ার করা
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        modal.remove();
        showCustomDeleteModal(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        });
    });

    // ব্যাকগ্রাউন্ড ইমেজ আপলোড গ্যালারি ইউআই ইনিট করা
    if (typeof window.createBackgroundImageUI === 'function') {
        window.createBackgroundImageUI();
    }
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
        case 'settings':
            initSettingsModal();
            break;
        case 'delete-db':
            showCustomDeleteModal(() => {
                localStorage.clear();
                sessionStorage.clear();
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
