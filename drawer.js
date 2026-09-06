// js/drawer.js

export function initDrawer() {
    // ড্রয়ারের জন্য প্রয়োজনীয় এইচটিএমএল স্ট্রাকচার তৈরি করা
    const drawerHTML = `
        <div id="appDrawerOverlay" class="drawer-overlay"></div>
        <nav id="appDrawer" class="app-drawer">
            <div class="drawer-header">
                <div class="drawer-logo-area">
                    <span class="drawer-icon">👮‍♂️</span>
                    <h3>আমার পুলিশ @ ফোনবুক</h3>
                </div>
                <button id="closeDrawerBtn" class="close-drawer-btn" type="button">✕</button>
            </div>
            
            <div class="drawer-body">
                <ul class="drawer-menu-list">
                    <li data-action="home">
                        <span class="menu-ico">📖</span> আমার পুলিশ @ ফোনবুক
                    </li>
                    <li data-action="search">
                        <span class="menu-ico">🔍</span> Search All Unit & Number
                    </li>
                    <li data-action="favorite">
                        <span class="menu-ico">❤️</span> Favorite Number
                    </li>
                    <li data-action="more-app">
                        <span class="menu-ico">📱</span> More Application
                    </li>
                </ul>

                <div class="drawer-section-title">Tools</div>
                <ul class="drawer-menu-list">
                    <li data-action="settings">
                        <span class="menu-ico">⚙️</span> Setting Menu
                    </li>
                    <li data-action="update-db">
                        <span class="menu-ico">🔄</span> Update App Database
                    </li>
                    <li data-action="delete-db">
                        <span class="menu-ico">🗑️</span> Delete Database
                    </li>
                    <li data-action="privacy">
                        <span class="menu-ico">🔒</span> Privacy Policy
                    </li>
                </ul>

                <div class="drawer-section-title">Communicate</div>
                <ul class="drawer-menu-list">
                    <li data-action="about">
                        <span class="menu-ico">ℹ️</span> About App
                    </li>
                    <li data-action="update-app">
                        <span class="menu-ico">📲</span> Update App
                    </li>
                    <li data-action="share">
                        <span class="menu-ico">🔗</span> Share App
                    </li>
                </ul>
            </div>
        </nav>
    `;

    // বডির শুরুতে ড্রয়ার যুক্ত করা
    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    const drawer = document.getElementById('appDrawer');
    const overlay = document.getElementById('appDrawerOverlay');
    const navToggleBtn = document.getElementById('navToggleBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');

    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('show');
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
    }

    // টগল বাটনে ক্লিক করলে ড্রয়ার খুলবে
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

    // ওভারলে বা ক্লোজ বাটনে ক্লিক করলে বন্ধ হবে
    overlay.addEventListener('click', closeDrawer);
    closeDrawerBtn.addEventListener('click', closeDrawer);

    // মেনু আইটেমগুলোতে ক্লিকের কার্যকারিতা (প্রয়োজন অনুযায়ী ফাংশন যুক্ত করতে পারেন)
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
