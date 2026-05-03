let vseMeropr = [];
let tekProfilSponsers = null;

function statusMeropriyatiya(m) {
    return m.sponsered
        ? { tip: 'metka_net', text: 'Спонсор найден' }
        : { tip: 'metka_ok', text: 'Ищет спонсора' };
}

function ekranirovatHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function estKoordinatyMeropr(m) {
    return Number.isFinite(Number(m.location)) && Number.isFinite(Number(m.location2));
}

function ssylkaNaPrezentaciyu(m, klass = 'sponsers_presentation_link') {
    if (!m.prezentation) {
        return '';
    }

    return `
        <div class="vzaimod_blok sponsers_presentation_section">
            <a class="${klass} knopka knopka_obv" href="${m.prezentation}" target="_blank" rel="noopener noreferrer">
                Открыть презентационный файл
            </a>
        </div>
    `;
}

function sozdatiBlokKarty(m, idKarty) {
    if (!estKoordinatyMeropr(m)) {
        return '';
    }

    return `
        <div class="vzaimod_blok sponsers_map_section">
            <div class="sponsers_section_title">Место на карте</div>
            <div id="${idKarty}" class="sponsers_modal_map"></div>
        </div>
    `;
}

function initKartaVModalke(idKarty, shir, dol) {
    if (!window.L) {
        return;
    }

    const blokKarty = document.getElementById(idKarty);
    if (!blokKarty) {
        return;
    }

    const coords = [Number(shir), Number(dol)];
    if (!coords.every(Number.isFinite)) {
        return;
    }

    const karta = window.L.map(blokKarty, {
        scrollWheelZoom: false
    }).setView(coords, 14);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(karta);

    window.L.marker(coords).addTo(karta);
    setTimeout(() => karta.invalidateSize(), 0);
}

async function poluchitTekProfil() {
    if (!tokenData.est()) {
        return null;
    }

    if (tekProfilSponsers) {
        return tekProfilSponsers;
    }

    try {
        tekProfilSponsers = await apiFetch.get('/profile/');
        return tekProfilSponsers;
    } catch (err) {
        return null;
    }
}

function pokazatKardMeropriyatiya(m) {
    const { tip, text } = statusMeropriyatiya(m);
    const nazv = ekranirovatHtml(m.title);
    const opis = ekranirovatHtml(m.description || 'Описание не указано');
    const foto = m.img
        ? `<img class="meropr_foto" src="${m.img}" onerror="this.src='/static/diplom/img/default.jpg'" alt="${nazv}" loading="lazy">`
        : `<div class="meropr_foto_zam">💡</div>`;

    return `
        <div class="kard meropr_kard" data-meropr-id="${m.id}">
            ${foto}
            <div class="meropr_telo">
                <div class="metka ${tip}">${text}</div>
                <div class="meropr_nazv">${nazv}</div>
                <div class="meropr_opis">${opis}</div>
                <div class="meropr_info">
                    <div class="info_punkt">${ikonki.kalendar} ${formatDatKorotko(m.data_start)} — ${formatDatKorotko(m.data_end)}</div>
                    <div class="info_punkt">${ikonki.lyudi} ${m.kolvo_people} участников</div>
                </div>
            </div>
        </div>
    `;
}

async function zagruzitSponsers() {
    const grid = document.getElementById('meropr_grid');
    if (!grid) {
        return;
    }

    try {
        vseMeropr = await apiFetch.get('/sponsers/');
        document.getElementById('kol_vsego').textContent = `(${vseMeropr.length})`;
        pokazatSpisok(vseMeropr);
    } catch (err) {
        grid.innerHTML = `
            <div class="zaglushka">
                <div class="ikona">⚠</div>
                <div>Не удалось загрузить</div>
                <button class="knopka knopka_obv sponsers_retry_knopka" data-action="reload-sponsers">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

function pokazatSpisok(spisok) {
    const grid = document.getElementById('meropr_grid');
    if (!grid) {
        return;
    }

    if (spisok.length === 0) {
        grid.innerHTML = `
            <div class="zaglushka">
                <div class="ikona">📋</div>
                <div>Ничего не найдено</div>
            </div>
        `;
        return;
    }

    grid.innerHTML = spisok.map(pokazatKardMeropriyatiya).join('');
}

function filtrovatSpisok() {
    const poiskPole = document.getElementById('poisk_pole');
    const filtrStatus = document.getElementById('filtr_status');

    if (!poiskPole || !filtrStatus) {
        return;
    }

    const poisk = poiskPole.value.toLowerCase();
    const status = filtrStatus.value;
    const rezultat = vseMeropr.filter((m) => {
        const nazv = (m.title || '').toLowerCase().includes(poisk);
        const stat = status === 'vse'
            || (status === 'ishchet' && !m.sponsered)
            || (status === 'nashel' && m.sponsered);

        return nazv && stat;
    });

    pokazatSpisok(rezultat);
}

async function otkritModalMeropriyatiya(id) {
    const m = vseMeropr.find((item) => item.id === id);
    if (!m) {
        return;
    }

    const modal = document.getElementById('modal_okno');
    const telo = document.getElementById('modal_telo');
    const { tip, text } = statusMeropriyatiya(m);
    const foto = m.img
        ? `<img class="modal_foto" src="${m.img}" onerror="this.src='/static/diplom/img/default.jpg'" alt="${ekranirovatHtml(m.title)}">`
        : `<div class="modal_foto_zam">💡</div>`;
    const idKarty = `karta_v_sobytii_${id}`;

    telo.innerHTML = `
        ${foto}
        <div class="modal_telo">
            <button class="modal_zakrit" data-close-modal="true">✕</button>
            <div class="metka ${tip} sponsers_modal_metka">${text}</div>
            <div class="modal_nazv">${ekranirovatHtml(m.title)}</div>
            <div class="modal_opis">${ekranirovatHtml(m.description || 'Описание не указано')}</div>
            <div class="modal_info">
                <div class="modal_info_punkt">
                    <span class="modal_info_metka">НАЧАЛО</span>
                    <span class="modal_info_val">${formatDat(m.data_start)}</span>
                </div>
                <div class="modal_info_punkt">
                    <span class="modal_info_metka">КОНЕЦ</span>
                    <span class="modal_info_val">${formatDat(m.data_end)}</span>
                </div>
                <div class="modal_info_punkt">
                    <span class="modal_info_metka">УЧАСТНИКОВ</span>
                    <span class="modal_info_val">${m.kolvo_people}</span>
                </div>
            </div>
            ${ssylkaNaPrezentaciyu(m)}
            ${sozdatiBlokKarty(m, idKarty)}
            <div class="vzaimod_blok" id="vzaimod_${id}">
                <div class="krujok_zagruz"></div>
            </div>
        </div>
    `;

    modal.classList.add('otkrit');
    document.body.classList.add('modal-open');

    if (estKoordinatyMeropr(m)) {
        initKartaVModalke(idKarty, m.location, m.location2);
    }

    await zagruzVzaimod(id);
}

function sozdatiHtmlOtlika({ meroprId, meropr, zaloginen, profil, mojOtklik }) {
    const sectionTitle = '<div class="sponsers_section_title">Отклик спонсора</div>';
    const deleteBtn = '';

    if (!zaloginen) {
        return `
            <div class="sponsers_otklik_blok">
                ${sectionTitle}
                <div class="net_avtorizacii">
                    <a href="/login/">Войди</a>, чтобы отправить отклик как спонсор
                </div>
                ${deleteBtn}
            </div>
        `;
    }

    if (!profil) {
        return `
            <div class="sponsers_otklik_blok">
                ${sectionTitle}
                <div class="sponsers_info_text">Не удалось загрузить профиль для отклика.</div>
            </div>
        `;
    }

    if (!etoSponser(profil)) {
        return `
            <div class="sponsers_otklik_blok">
                ${sectionTitle}
                <div class="sponsers_info_text">
                    Отклик могут отправлять только пользователи с ролью спонсора.
                </div>
            </div>
        `;
    }

    const company = ekranirovatHtml(profil.name_compani || '—');
    const phone = ekranirovatHtml(profil.number || '—');
    const site = ekranirovatHtml(profil.website || '—');
    const instagram = ekranirovatHtml(profil.instagram || '—');
    const telegram = ekranirovatHtml(profil.telegram || '—');

    const kontakty = `
        <div class="sponsers_otklik_grid">
            <div class="pole_gruppa sponsers_otklik_pole">
                <label>Компания</label>
                <input type="text" value="${company}" readonly>
            </div>
            <div class="pole_gruppa sponsers_otklik_pole">
                <label>Телефон</label>
                <input type="text" value="${phone}" readonly>
            </div>
            <div class="pole_gruppa sponsers_otklik_pole">
                <label>Сайт</label>
                <input type="text" value="${site}" readonly>
            </div>
            <div class="pole_gruppa sponsers_otklik_pole">
                <label>Instagram</label>
                <input type="text" value="${instagram}" readonly>
            </div>
            <div class="pole_gruppa sponsers_otklik_pole sponsers_otklik_full">
                <label>Telegram</label>
                <input type="text" value="${telegram}" readonly>
            </div>
        </div>
    `;

    if (meropr.sponsered) {
        return `
            <div class="sponsers_otklik_blok">
                ${sectionTitle}
                ${kontakty}
                <div class="sponsers_info_text">Для этого мероприятия спонсор уже найден.</div>
            </div>
        `;
    }

    if (mojOtklik) {
        const deleteBtn = mojOtklik.id
            ? `
                <div class="sponsers_otklik_action">
                    <button class="knopka knopka_obv sponsers_otklik_btn" data-otklik-delete="${mojOtklik.id}" data-meropr-id="${meroprId}">
                        Удалить отклик
                    </button>
                </div>
            `
            : '';

        return `
            <div class="sponsers_otklik_blok">
                ${sectionTitle}
                ${kontakty}
                <div class="sponsers_otklik_card">
                    <div class="sponsers_otklik_card_title">отклик уже отправлен</div>
                    <div class="sponsers_otklik_card_text">${ekranirovatHtml(mojOtklik.text)}</div>
                </div>
            </div>
        `;
    }

    return `
        <div class="sponsers_otklik_blok">
            ${sectionTitle}
            ${kontakty}
            <div class="sponsers_info_text">
                введите только сообщение
            </div>
            <div class="uvedoml uvedoml_err" id="otklik_err_${meroprId}"></div>
            <div class="pole_gruppa sponsers_otklik_pole">
                <label for="otklik_pole_${meroprId}">Сообщение организатору</label>
                <textarea id="otklik_pole_${meroprId}" class="sponsers_otklik_textarea"
                    placeholder="для организатора..."></textarea>
            </div>
            <div class="sponsers_otklik_action">
                <button class="knopka knopka_sin sponsers_otklik_btn" data-otklik-submit="${meroprId}">
                    Откликнуться
                </button>
            </div>
        </div>
    `;
}

async function zagruzVzaimod(meroprId) {
    const blok = document.getElementById(`vzaimod_${meroprId}`);
    if (!blok) {
        return;
    }

    const meropr = vseMeropr.find((item) => item.id === meroprId);
    const zaloginen = tokenData.est();

    try {
        const [kommentarii, lajki, otkliki, profil] = await Promise.all([
            apiFetch.get('/commenters_user/'),
            apiFetch.get('/likes/'),
            apiFetch.get('/sponserotklik/'),
            zaloginen ? poluchitTekProfil() : Promise.resolve(null)
        ]);

        const kommentariiMeropr = kommentarii.filter((k) => k.itsponser === meroprId);
        const mojLayk = profil
            ? lajki.find((l) => l.itsponser === meroprId && l.users === profil.id)
            : null;
        const mojOtklik = profil
            ? otkliki.find((o) => o.itsponser === meroprId && o.author_username === profil.username)
            : null;
        const kolLaykov = lajki.filter((l) => l.itsponser === meroprId).length;
        const laykAktiv = mojLayk ? 'aktivn' : '';
        const laykData = mojLayk ? ` data-like-id="${mojLayk.id}"` : '';
        const otklikHtml = sozdatiHtmlOtlika({
            meroprId,
            meropr,
            zaloginen,
            profil,
            mojOtklik
        });

        blok.innerHTML = `
            ${otklikHtml}
            <div class="sponsers_social_section">
                <div class="layk_ryad">
                    ${zaloginen
                        ? `<button class="layk_knopka ${laykAktiv}" id="layk_btn_${meroprId}"
                                data-like-toggle="true" data-meropr-id="${meroprId}"${laykData}>
                                ${ikonki.serdce} <span id="layk_kol_${meroprId}">${kolLaykov}</span>
                           </button>`
                        : `<div class="sponsers_static_like">${ikonki.serdce} ${kolLaykov}</div>`
                    }
                </div>
                <div class="komment_spisok" id="komm_spisok_${meroprId}">
                    ${kommentariiMeropr.length === 0
                        ? `<div class="sponsers_empty_text">Комментариев пока нет</div>`
                        : kommentariiMeropr.map((k) => `
                            <div class="komment_kard" data-comment-id="${k.id}">
                                <div class="komment_zag">
                                    <div class="komment_avtor">${ekranirovatHtml(k.author_username || 'Пользователь')}</div>
                                    ${profil && k.author_username === profil.username
                                        ? `<button class="komment_del_btn" data-delete-comment="${k.id}" title="Удалить комментарий">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                                                <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/>
                                            </svg>
                                        </button>`
                                        : ''
                                    }
                                </div>
                                <div class="komment_tekst">${ekranirovatHtml(k.text)}</div>
                            </div>`).join('')
                    }
                </div>
                ${zaloginen
                    ? `<div class="komment_forma">
                            <input type="text" id="komm_pole_${meroprId}" placeholder="Написать комментарий...">
                            <button class="knopka knopka_sin sponsers_comment_btn" data-comment-submit="${meroprId}">
                                Отправить
                            </button>
                       </div>`
                    : `<div class="net_avtorizacii"><a href="/login/">Войди</a>, чтобы оставить комментарий</div>`
                }
            </div>
        `;
    } catch (err) {
        blok.innerHTML = `<div class="sponsers_error_text">Не удалось загрузить данные</div>`;
    }
}

async function pereklLayk(meroprId, laykId) {
    if (!tokenData.est()) {
        window.location.href = '/login/';
        return;
    }

    const btn = document.getElementById(`layk_btn_${meroprId}`);
    const kolEl = document.getElementById(`layk_kol_${meroprId}`);

    if (!btn || !kolEl) {
        return;
    }

    try {
        if (laykId) {
            await apiFetch.udalit(`/like/del/${laykId}/`);
            btn.classList.remove('aktivn');
            kolEl.textContent = String(Math.max(0, parseInt(kolEl.textContent, 10) - 1));
            delete btn.dataset.likeId;
        } else {
            const nov = await apiFetch.post('/likes/', { itsponser: meroprId, like: true });
            btn.classList.add('aktivn');
            kolEl.textContent = String(parseInt(kolEl.textContent, 10) + 1);
            btn.dataset.likeId = String(nov.id);
        }
    } catch (err) {
        await zagruzVzaimod(meroprId);
    }
}

async function otpravitKomm(meroprId) {
    const pole = document.getElementById(`komm_pole_${meroprId}`);
    const spisok = document.getElementById(`komm_spisok_${meroprId}`);

    if (!pole || !spisok) {
        return;
    }

    const tekst = pole.value.trim();
    if (!tekst) {
        return;
    }

    try {
        await apiFetch.post('/commenters_user/', { itsponser: meroprId, text: tekst });

        const emptyState = spisok.querySelector('.sponsers_empty_text');
        if (emptyState) {
            emptyState.remove();
        }

        const nov = document.createElement('div');
        nov.className = 'komment_kard';

        const avtor = document.createElement('div');
        avtor.className = 'komment_avtor';
        avtor.textContent = 'Ты';

        const text = document.createElement('div');
        text.className = 'komment_tekst';
        text.textContent = tekst;

        nov.appendChild(avtor);
        nov.appendChild(text);
        spisok.appendChild(nov);
        pole.value = '';
    } catch (err) {
        console.log('ошибка комментария', err);
    }
}

async function udalitKomm(kommentariiId) {
    try {
        await apiFetch.udalit(`/commentdel/${kommentariiId}/`);
        const kommKard = document.querySelector(`[data-comment-id="${kommentariiId}"]`);
        if (kommKard) {
            kommKard.remove();
        }
    } catch (err) {
        console.log('Ошибка удаления комментария:', err);
    }
}

async function otpravitOtklik(meroprId) {
    if (!tokenData.est()) {
        window.location.href = '/login/';
        return;
    }

    const profil = await poluchitTekProfil();
    const pole = document.getElementById(`otklik_pole_${meroprId}`);
    const btn = document.querySelector(`[data-otklik-submit="${meroprId}"]`);
    const errId = `otklik_err_${meroprId}`;

    if (!profil || !pole || !btn) {
        return;
    }

    const text = pole.value.trim();
    skritUved(errId);

    if (!etoSponser(profil)) {
        pokazUved(errId, 'Отклик доступен только для роли спонсора');
        return;
    }

    if (!text) {
        pokazUved(errId, 'Напиши сообщение для организатора');
        return;
    }

    knopkaZagruz(btn, true, 'Отправляем...');

    try {
        await apiFetch.post(`/sponserotklik/${meroprId}/`, {
            itsponser: meroprId,
            text
        });

        await zagruzVzaimod(meroprId);
    } catch (err) {
        if (err && typeof err === 'object' && err.data) {
            const first = Object.values(err.data)[0];
            pokazUved(errId, Array.isArray(first) ? first[0] : first);
        } else {
            pokazUved(errId, 'Не удалось отправить отклик');
        }
    } finally {
        if (btn.isConnected) {
            knopkaZagruz(btn, false);
        }
    }
}

async function udalitOtklik(otklikId, meroprId) {
    try {
        await apiFetch.udalit(`/sponserotklik/${otklikId}/`);
        await zagruzVzaimod(meroprId);
    } catch (err) {
        pokazUved(`otklik_err_${meroprId}`, 'Не удалось удалить отклик');
    }
}

function zakritModalMeropriyatiya() {
    const modal = document.getElementById('modal_okno');
    if (!modal) {
        return;
    }

    modal.classList.remove('otkrit');
    document.body.classList.remove('modal-open');
}

function initSponsersPage() {
    const grid = document.getElementById('meropr_grid');
    const modal = document.getElementById('modal_okno');
    const poiskPole = document.getElementById('poisk_pole');
    const filtrStatus = document.getElementById('filtr_status');

    if (!grid || !modal || !poiskPole || !filtrStatus) {
        return;
    }

    poiskPole.addEventListener('input', filtrovatSpisok);
    filtrStatus.addEventListener('change', filtrovatSpisok);

    grid.addEventListener('click', (event) => {
        const reloadBtn = event.target.closest('[data-action="reload-sponsers"]');
        if (reloadBtn) {
            zagruzitSponsers();
            return;
        }

        const card = event.target.closest('[data-meropr-id]');
        if (card) {
            otkritModalMeropriyatiya(Number(card.dataset.meroprId));
        }
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.closest('[data-close-modal]')) {
            zakritModalMeropriyatiya();
            return;
        }

        const likeBtn = event.target.closest('[data-like-toggle]');
        if (likeBtn) {
            const meroprId = Number(likeBtn.dataset.meroprId);
            const laykId = likeBtn.dataset.likeId ? Number(likeBtn.dataset.likeId) : null;
            pereklLayk(meroprId, laykId);
            return;
        }

        const commentBtn = event.target.closest('[data-comment-submit]');
        if (commentBtn) {
            otpravitKomm(Number(commentBtn.dataset.commentSubmit));
            return;
        }

        const deleteCommentBtn = event.target.closest('[data-delete-comment]');
        if (deleteCommentBtn) {
            udalitKomm(Number(deleteCommentBtn.dataset.deleteComment));
            return;
        }

        const otklikBtn = event.target.closest('[data-otklik-submit]');
        if (otklikBtn) {
            otpravitOtklik(Number(otklikBtn.dataset.otklikSubmit));
            return;
        }

        const deleteOtklikBtn = event.target.closest('[data-otklik-delete]');
        if (deleteOtklikBtn) {
            udalitOtklik(Number(deleteOtklikBtn.dataset.otklikDelete), Number(deleteOtklikBtn.dataset.meroprId));
        }
    });

    zagruzitSponsers();
}

initSponsersPage();
