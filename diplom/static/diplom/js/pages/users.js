let vseUsery = [];
let vseMeroprUsers = [];

async function zagruzitUsersPage() {
    const grid = document.getElementById('users_grid');
    if (!grid) {
        return;
    }

    try {
        const [users, meropr] = await Promise.all([
            apiFetch.get('/users/'),
            apiFetch.get('/sponsers/')
        ]);

        vseUsery = users;
        vseMeroprUsers = meropr;

        document.getElementById('kol_vsego').textContent = `(${vseUsery.length})`;

        if (vseUsery.length === 0) {
            grid.innerHTML = `
                <div class="zaglushka">
                    <div class="ikona">�‍💼</div>
                    <div>Пользователей пока нет</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = vseUsery.map((u) => {
            const tip = etoOrganizator(u) ? 'metka_ok' : (etoSponser(u) ? 'metka_warn' : 'metka_net');
            const tipTxt = nazvanieRoli(u);
            const bukva = (u.username || '?').charAt(0).toUpperCase();

            return `
                <div class="kard user_kard" data-user-id="${u.id}">
                    <div class="user_avatar">${bukva}</div>
                    <div class="user_info">
                        <div class="user_imya">${u.username}</div>
                        <div class="user_kompan">${u.name_compani || u.website || '—'}</div>
                    </div>
                    <div class="metka ${tip}">${tipTxt}</div>
                </div>
            `;
        }).join('');
    } catch (err) {
        if (err.message === 'HTTP 401' || err.message === 'HTTP 403') {
            grid.innerHTML = `
                <div class="zaglushka">
                    <div class="ikona">🔒</div>
                    <div>Список пользователей доступен только после входа</div>
                    <a href="/login/" class="knopka knopka_sin users_retry_knopka">Войти</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = `
            <div class="zaglushka">
                <div class="ikona">⚠</div>
                <div>Не удалось загрузить</div>
                <button class="knopka knopka_obv users_retry_knopka" data-action="reload-users">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

function otkritUsersModal(id) {
    const u = vseUsery.find((item) => item.id === id);
    if (!u) {
        return;
    }

    const modal = document.getElementById('modal_okno');
    const telo = document.getElementById('modal_telo');
    const tip = etoOrganizator(u) ? 'metka_ok' : (etoSponser(u) ? 'metka_warn' : 'metka_net');
    const tipTxt = nazvanieRoli(u);
    const saytHtml = u.website
        ? `<a href="${u.website}" target="_blank" rel="noopener noreferrer">${u.website}</a>`
        : '—';

    let statHtml = '';
    if (etoOrganizator(u)) {
        const moi = vseMeroprUsers.filter((m) => m.organizer === u.id);
        const nashli = moi.filter((m) => m.sponsered).length;

        statHtml = `
            <div class="modal_info_zagol users_modal_stat_title">СТАТИСТИКА</div>
            <div class="stat_ryad">
                <div class="stat_kard">
                    <div class="stat_chislo">${moi.length}</div>
                    <div class="stat_podpis">мероприятий</div>
                </div>
                <div class="stat_kard">
                    <div class="stat_chislo">${nashli}</div>
                    <div class="stat_podpis">со спонсором</div>
                </div>
                <div class="stat_kard">
                    <div class="stat_chislo">${moi.length - nashli}</div>
                    <div class="stat_podpis">ищут</div>
                </div>
            </div>
        `;
    }

    telo.innerHTML = `
        <div class="modal_telo">
            <button class="modal_zakrit" data-close-modal="true">✕</button>

            <div class="modal_profil_shapka">
                <div class="modal_avatar">${(u.username || '?').charAt(0).toUpperCase()}</div>
                <div>
                    <div class="modal_imya">${u.username}</div>
                    <div class="metka ${tip}">${tipTxt}</div>
                </div>
            </div>

            <div class="modal_info_blok">
                <div class="modal_info_zagol">КОНТАКТЫ</div>
                <div class="modal_info_ryad">
                    <span class="modal_info_metka">Телефон</span>
                    <span class="modal_info_znach">${u.number || '—'}</span>
                </div>
                <div class="modal_info_ryad">
                    <span class="modal_info_metka">Сайт</span>
                    <span class="modal_info_znach">${saytHtml}</span>
                </div>
                <div class="modal_info_ryad">
                    <span class="modal_info_metka">Компания</span>
                    <span class="modal_info_znach">${u.name_compani || '—'}</span>
                </div>
            </div>

            ${statHtml}
        </div>
    `;

    modal.classList.add('otkrit');
    document.body.classList.add('modal-open');
}

function zakritUsersModal() {
    const modal = document.getElementById('modal_okno');
    if (!modal) {
        return;
    }

    modal.classList.remove('otkrit');
    document.body.classList.remove('modal-open');
}

function initUsersPage() {
    const grid = document.getElementById('users_grid');
    const modal = document.getElementById('modal_okno');

    if (!grid || !modal) {
        return;
    }

    grid.addEventListener('click', (event) => {
        const retryBtn = event.target.closest('[data-action="reload-users"]');
        if (retryBtn) {
            zagruzitUsersPage();
            return;
        }

        const card = event.target.closest('[data-user-id]');
        if (card) {
            otkritUsersModal(Number(card.dataset.userId));
        }
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.closest('[data-close-modal]')) {
            zakritUsersModal();
        }
    });

    zagruzitUsersPage();
}

initUsersPage();
