// js/drawer.js

export function initDrawer() {
    // ড্রয়ারের আধুনিক এইচটিএমএল স্ট্রাকচার
    const drawerHTML = `
        <div id="appDrawerOverlay" class="drawer-overlay"></div>
        <nav id="appDrawer" class="app-drawer">
            <div class="drawer-header">
                <div class="drawer-header-bg-glow"></div>
                <div class="drawer-profile-area">
                    <div class="drawer-avatar">
                        <span class="drawer-icon">👮‍♂️</span>
                    </div>
                    <div class="drawer-title-texts">
                        <h3>আমার পুলিশ</h3>
                        <p>@ ফোনবুক</p>
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
                        <span class="menu-text">আমার পুলিশ @ ফোনবুক</span>
                    </li>
                    <li data-action="search">
                        <span class="menu-ico">🔍</span> 
                        <span class="menu-text">Search All Unit & Number</span>
                    </li>
                    <li data-action="favorite">
                        <span class="menu-ico">❤️</span> 
                        <span class="menu-text">Favorite Number</span>
                    </li>
                    <li data-action="more-app">
                        <span class="menu-ico">📱</span> 
                        <span class="menu-text">More Application</span>
                    </li>
                </ul>

                <div class="drawer-divider"></div>
                <div class="drawer-section-title">Tools</div>
                <ul class="drawer-menu-list">
                    <li data-action="settings">
                        <span class="menu-ico">⚙️</span> 
                        <span class="menu-text">Setting Menu</span>
                    </li>
                    <li data-action="update-db">
                        <span class="menu-ico">🔄</span> 
                        <span class="menu-text">Update App Database</span>
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
                <span>Version 1.1.0 • Secure</span>
            </div>
        </nav>
    `;

    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    const drawer = document.getElementById('appDrawer');
    const overlay = document.getElementById('appDrawerOverlay');
    const navToggleBtn = document.getElementById('navToggleBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');

    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // ব্যাকগ্রাউন্ড স্ক্রোল লক করা
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
            console.log('Search clicked');
            break;
        case 'favorite':
            console.log('Favorite clicked');
            break;
        case 'settings':
            console.log('Settings clicked');
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
