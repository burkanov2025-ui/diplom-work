let tekushiyTip = '';

async function zagruzDannieProfilya() {
    const zagruzBlok = document.getElementById('zagruz_blok');
    const formaBlok = document.getElementById('forma_blok');
    const kompanBlok = document.getElementById('kompan_blok');

    if (!zagruzBlok || !formaBlok || !kompanBlok) {
        return;
    }

    try {
        const p = await apiFetch.get('/profile/');

        zagruzBlok.classList.add('is-hidden');
        formaBlok.classList.remove('is-hidden');

        document.getElementById('izm_login').value = p.username || '';
        document.getElementById('izm_nomer').value = p.number || '';
        document.getElementById('izm_sayt').value = p.website || '';
        document.getElementById('izm_instagram').value = p.instagram || '';
        document.getElementById('izm_telegram').value = p.telegram || '';
        document.getElementById('izm_kompan').value = p.name_compani || '';

        tekushiyTip = poluchitRolPolzovatelya(p);
        kompanBlok.classList.remove('is-hidden');
    } catch (err) {
        zagruzBlok.innerHTML = `
            <div class="ikona">⚠</div>
            <div>Не удалось загрузить данные</div>
            <button class="knopka knopka_obv izm_retry_knopka" data-action="reload-profile-update">
                Попробовать снова
            </button>
        `;
    }
}

function pereklParol() {
    const vkl = document.getElementById('menyat_parol').checked;
    document.getElementById('parol_blok').classList.toggle('vidno', vkl);

    if (!vkl) {
        document.getElementById('nov_parol').value = '';
        document.getElementById('nov_parol2').value = '';
    }
}

async function sohranitIzm() {
    const knopka = document.getElementById('sohranit_knopka');
    const login = document.getElementById('izm_login').value.trim();
    const nomer = document.getElementById('izm_nomer').value.trim();
    const sayt = document.getElementById('izm_sayt').value.trim();
    const instagram = document.getElementById('izm_instagram').value.trim();
    const telegram = document.getElementById('izm_telegram').value.trim();
    const kompan = document.getElementById('izm_kompan').value.trim();
    const menyat = document.getElementById('menyat_parol').checked;
    const novPar = document.getElementById('nov_parol').value.trim();
    const novPar2 = document.getElementById('nov_parol2').value.trim();

    skritUved('izm_oshibka');
    skritUved('izm_ok');

    if (!login) {
        pokazUved('izm_oshibka', 'Логин не может быть пустым');
        return;
    }

    if (menyat) {
        if (!novPar || !novPar2) {
            pokazUved('izm_oshibka', 'Заполни оба поля пароля');
            return;
        }

        if (novPar !== novPar2) {
            pokazUved('izm_oshibka', 'Пароли не совпадают');
            return;
        }

        if (novPar.length < 8) {
            pokazUved('izm_oshibka', 'Пароль должен быть минимум 8 символов');
            return;
        }
    }

    const dannie = {
        username: login,
        number: nomer,
        website: sayt,
        instagram,
        telegram,
        name_compani: kompan
    };

    if (menyat) {
        dannie.password = novPar;
    }

    knopkaZagruz(knopka, true, 'Сохраняем...');

    try {
        await apiFetch.obnovit('/profile/update/', dannie);
        pokazUved('izm_ok', 'Данные сохранены!', 'ok');
        setTimeout(() => {
            window.location.href = '/profile/';
        }, 1500);
    } catch (err) {
        if (err.data) {
            const pervaya = Object.values(err.data)[0];
            pokazUved('izm_oshibka', Array.isArray(pervaya) ? pervaya[0] : pervaya);
        } else {
            pokazUved('izm_oshibka', 'Ошибка при сохранении');
        }
    } finally {
        knopkaZagruz(knopka, false);
    }
}

function initProfileUpdatePage() {
    const zagruzBlok = document.getElementById('zagruz_blok');
    const menyatParol = document.getElementById('menyat_parol');
    const sohranitKnopka = document.getElementById('sohranit_knopka');

    if (!zagruzBlok || !menyatParol || !sohranitKnopka) {
        return;
    }

    if (!tokenData.est()) {
        window.location.href = '/login/';
        return;
    }

    zagruzBlok.addEventListener('click', (event) => {
        const retryBtn = event.target.closest('[data-action="reload-profile-update"]');
        if (retryBtn) {
            zagruzDannieProfilya();
        }
    });

    menyatParol.addEventListener('change', pereklParol);
    sohranitKnopka.addEventListener('click', sohranitIzm);

    zagruzDannieProfilya();
}

initProfileUpdatePage();
