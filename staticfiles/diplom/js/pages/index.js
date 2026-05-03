function pokazMeroprNaGlavnoi(m) {
    const tip = m.sponsered ? 'metka_net' : 'metka_ok';
    const txt = m.sponsered ? 'Спонсор найден' : 'Ищет спонсора';

    const foto = (m.img || m.img_url)
        ? `<img class="meropr_foto" src="${m.img || m.img_url}" alt="${m.title}" loading="lazy">`
        : `<div class="meropr_foto_zam">💡</div>`;

    return `
        <div class="kard meropr_kard" data-go-sponsers="true">
            ${foto}
            <div class="meropr_telo">
                <div class="metka ${tip}">${txt}</div>
                <div class="meropr_nazv">${m.title}</div>
                <div class="meropr_opis">${m.description || 'Описание не указано'}</div>
                <div class="meropr_info">
                    <div class="info_punkt">
                        ${ikonki.kalendar}
                        ${formatDatKorotko(m.data_start)} — ${formatDatKorotko(m.data_end)}
                    </div>
                    <div class="info_punkt">
                        ${ikonki.lyudi}
                        ${m.kolvo_people} участников
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function zagruzMeropr() {
    const grid = document.getElementById('meropr_grid');
    if (!grid) {
        return;
    }

    try {
        const spisok = await apiFetch.get('/sponsers/');

        document.getElementById('kol_meropr').textContent = spisok.length;
        document.getElementById('kol_spons').textContent = spisok.filter((m) => m.sponsered).length;

        if (spisok.length === 0) {
            grid.innerHTML = `
                <div class="zaglushka">
                    <div class="ikona">📋</div>
                    <div>Мероприятий пока нет</div>
                    <a href="/register/" class="index_empty_link">
                        Зарегистрируйся и размести первое
                    </a>
                </div>
            `;
            return;
        }

        document.getElementById('skolko_vsego').textContent = `(${spisok.length})`;
        grid.innerHTML = spisok.slice(0, 6).map(pokazMeroprNaGlavnoi).join('');
    } catch (err) {
        grid.innerHTML = `
            <div class="zaglushka">
                <div class="ikona">⚠</div>
                <div>Не удалось загрузить мероприятия</div>
                <button class="knopka knopka_obv index_retry_knopka" data-action="retry-index">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

function initIndexPage() {
    const grid = document.getElementById('meropr_grid');
    if (!grid) {
        return;
    }

    grid.addEventListener('click', (event) => {
        const retryBtn = event.target.closest('[data-action="retry-index"]');
        if (retryBtn) {
            zagruzMeropr();
            return;
        }

        const card = event.target.closest('[data-go-sponsers]');
        if (card) {
            window.location.href = '/sponsers/';
        }
    });

    zagruzMeropr();
}

initIndexPage();
