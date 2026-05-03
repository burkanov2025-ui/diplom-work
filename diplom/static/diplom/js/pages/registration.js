let vibranTip = 'organizer';

function vybratTip(tip) {
    vibranTip = tip;
    document.getElementById('btn_org').classList.toggle('aktiv', tip === 'organizer');
    document.getElementById('btn_spon').classList.toggle('aktiv', tip === 'sponser');
    document.getElementById('blok_kompan').classList.add('vidno');
}

async function zaregistr() {
    const knopka = document.getElementById('reg_knopka');
    const loginV = document.getElementById('reg_login').value.trim();
    const parolV = document.getElementById('reg_parol').value.trim();
    const parol2V = document.getElementById('reg_parol2').value.trim();
    const nomerV = document.getElementById('reg_nomer').value.trim();
    const saytV = document.getElementById('reg_sayt').value.trim();
    const instagramV = document.getElementById('reg_instagram').value.trim();
    const telegramV = document.getElementById('reg_telegram').value.trim();
    const kompanV = document.getElementById('reg_kompan').value.trim();

    skritUved('reg_oshibka');
    skritUved('reg_ok');

    if (!loginV || !parolV || !parol2V || !nomerV) {
        pokazUved('reg_oshibka', 'Заполни все обязательные поля');
        return;
    }

    if (parolV !== parol2V) {
        pokazUved('reg_oshibka', 'Пароли не совпадают');
        return;
    }

    if (parolV.length < 8) {
        pokazUved('reg_oshibka', 'Пароль должен быть минимум 8 символов');
        return;
    }

    const dannie = {
        username: loginV,
        password: parolV,
        number: nomerV,
        website: saytV,
        instagram: instagramV,
        telegram: telegramV,
        for_sponser_or_organizer: vibranTip,
        name_compani: kompanV
    };

    knopkaZagruz(knopka, true, 'Регистрируемся...');

    try {
        await apiFetch.post('/register/', dannie);
        pokazUved('reg_ok', 'Аккаунт создан! Переходим ко входу...', 'ok');
        setTimeout(() => {
            window.location.href = '/login/';
        }, 1500);
    } catch (err) {
        if (err.data) {
            const pervayaOshibka = Object.values(err.data)[0];
            const txt = Array.isArray(pervayaOshibka) ? pervayaOshibka[0] : pervayaOshibka;
            pokazUved('reg_oshibka', txt);
        } else {
            pokazUved('reg_oshibka', 'Ошибка при регистрации, попробуй снова');
        }
    } finally {
        knopkaZagruz(knopka, false);
    }
}

function initRegistrationPage() {
    const btnOrg = document.getElementById('btn_org');
    const btnSpon = document.getElementById('btn_spon');
    const regKnopka = document.getElementById('reg_knopka');

    if (!btnOrg || !btnSpon || !regKnopka) {
        return;
    }

    if (tokenData.est()) {
        window.location.href = '/sponsers/';
        return;
    }

    btnOrg.addEventListener('click', () => vybratTip('organizer'));
    btnSpon.addEventListener('click', () => vybratTip('sponser'));
    regKnopka.addEventListener('click', zaregistr);

    vybratTip('organizer');
}

initRegistrationPage();
