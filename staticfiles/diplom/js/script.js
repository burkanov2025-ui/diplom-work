const tokenData = {
    vzat: () => localStorage.getItem('token'),
    sohranit: (t) => localStorage.setItem('token', t),
    udalit: () => localStorage.removeItem('token'),
    est: () => !!localStorage.getItem('token'),

    zagolovki() {
        const t = this.vzat();
        const h = { 'Content-Type': 'application/json' };
        if (t) {
            h.Authorization = `Token ${t}`;
        }
        return h;
    }
};

const apiFetch = {
    base: '/api',

    async get(put) {
        const otvet = await fetch(this.base + put, {
            headers: tokenData.zagolovki()
        });
        if (!otvet.ok) {
            throw new Error(`HTTP ${otvet.status}`);
        }
        return otvet.json();
    },

    async post(put, telo) {
        const otvet = await fetch(this.base + put, {
            method: 'POST',
            headers: tokenData.zagolovki(),
            body: JSON.stringify(telo)
        });
        const data = await otvet.json();
        if (!otvet.ok) {
            throw { status: otvet.status, data };
        }
        return data;
    },

    async postForm(put, formData) {
        const t = tokenData.vzat();
        const h = {};
        if (t) {
            h.Authorization = `Token ${t}`;
        }

        const otvet = await fetch(this.base + put, {
            method: 'POST',
            headers: h,
            body: formData
        });

        const data = await otvet.json();
        if (!otvet.ok) {
            throw { status: otvet.status, data };
        }
        return data;
    },

    async udalit(put) {
        const otvet = await fetch(this.base + put, {
            method: 'DELETE',
            headers: tokenData.zagolovki()
        });
        if (!otvet.ok) {
            throw new Error(`HTTP ${otvet.status}`);
        }
        return otvet.status;
    },

    async obnovit(put, telo) {
        const otvet = await fetch(this.base + put, {
            method: 'PUT',
            headers: tokenData.zagolovki(),
            body: JSON.stringify(telo)
        });
        const data = await otvet.json();
        if (!otvet.ok) {
            throw { status: otvet.status, data };
        }
        return data;
    }
};

function poluchitRolPolzovatelya(user) {
    return user?.for_sponser_or_organizer || '';
}

function etoOrganizator(user) {
    return poluchitRolPolzovatelya(user) === 'organizer';
}

function etoSponser(user) {
    return poluchitRolPolzovatelya(user) === 'sponser';
}

function nazvanieRoli(user) {
    if (etoOrganizator(user)) {
        return 'Организатор';
    }

    if (etoSponser(user)) {
        return 'Спонсор';
    }

    return 'Пользователь';
}

function formatDat(stroka) {
    if (!stroka) {
        return '—';
    }

    const d = new Date(stroka);
    return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDatKorotko(stroka) {
    if (!stroka) {
        return '—';
    }

    const d = new Date(stroka);
    return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
    });
}

function pokazUved(idEl, txt, tip = 'err') {
    const el = document.getElementById(idEl);
    if (!el) {
        return;
    }

    el.className = `uvedoml uvedoml_${tip}`;
    el.textContent = txt;
    el.style.display = 'block';

    if (tip === 'ok') {
        setTimeout(() => {
            el.style.display = 'none';
        }, 4000);
    }
}

function skritUved(idEl) {
    const el = document.getElementById(idEl);
    if (el) {
        el.style.display = 'none';
    }
}

function knopkaZagruz(el, vkl, txt = 'Загрузка...') {
    if (!el) {
        return;
    }

    el.disabled = vkl;
    if (vkl) {
        el._old = el.textContent;
        el.textContent = txt;
        return;
    }

    el.textContent = el._old || el.textContent;
}

const ikonki = {
    kalendar: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1v4M11 1v4M2 7h12"/>
    </svg>`,

    lyudi: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2-5 5-5s5 2 5 5"/>
        <circle cx="12" cy="5" r="2"/><path d="M12 10c1.5 0 3 1 3 4"/>
    </svg>`,

    serdce: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M8 13s-5-3.5-5-7a3 3 0 0 1 5-2.2A3 3 0 0 1 13 6c0 3.5-5 7-5 7z"/>
    </svg>`,

    komment: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
    </svg>`,

    korzina: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/>
    </svg>`
};

function pokazNezaloginNab(blok, tekStr) {
    const naStranVhoda = tekStr === '/login/' || tekStr === '/register/';

    blok.innerHTML = `
        <a href="/sponsers/" class="prostor ${tekStr === '/sponsers/' ? 'aktiv' : ''}">Мероприятия</a>
        ${naStranVhoda ? '' : `
            <a href="/login/" class="prostor">Войти</a>
            <a href="/register/" class="glavnaya">Регистрация</a>
        `}
    `;
}

async function initNav() {
    const blok = document.getElementById('nav_ssylki');
    if (!blok) {
        return;
    }

    const tekStr = window.location.pathname;

    if (tokenData.est()) {
        try {
            const res = await apiFetch.get('/loginsession/');
            const profil = await apiFetch.get('/profile/');
            const imya = res.users;
            const isOrganizer = etoOrganizator(profil);
            const isSponsor = etoSponser(profil);
            const menuLinkText = isOrganizer ? 'Мои события' : (isSponsor ? 'Отклики' : 'Кабинет');

            blok.innerHTML = `
                <a href="/" class="prostor ${tekStr === '/' ? 'aktiv' : ''}">О сайте</a>
                <a href="/sponsers/" class="prostor ${tekStr === '/sponsers/' ? 'aktiv' : ''}">Мероприятия</a>
                <a href="/users/" class="prostor ${tekStr === '/users/' ? 'aktiv' : ''}">Пользователи</a>
                <a href="/sponser_menu/" class="prostor ${tekStr === '/sponser_menu/' ? 'aktiv' : ''}">${menuLinkText}</a>
                <a href="/profile/" class="prostor ${tekStr === '/profile/' ? 'aktiv' : ''}">${imya}</a>
                <a href="#" class="prostor" id="vyhod_btn">Выйти</a>
            `;

            const vyhodBtn = document.getElementById('vyhod_btn');
            if (vyhodBtn) {
                vyhodBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    tokenData.udalit();
                    window.location.href = '/login/';
                });
            }
            return;
        } catch (err) {
            tokenData.udalit();
        }
    }

    pokazNezaloginNab(blok, tekStr);
}

initNav();

// Логика гамбургер меню
const navBurger = document.getElementById('nav_burger');
const navSsylki = document.getElementById('nav_ssylki');

if (navBurger && navSsylki) {
    navBurger.addEventListener('click', () => {
        navBurger.classList.toggle('aktiv');
        navSsylki.classList.toggle('otkryto');
    });

    // Закрыть меню при клике на ссылку
    navSsylki.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            navBurger.classList.remove('aktiv');
            navSsylki.classList.remove('otkryto');
        }
    });

    // Закрыть меню при клике снаружи
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav')) {
            navBurger.classList.remove('aktiv');
            navSsylki.classList.remove('otkryto');
        }
    });
}
