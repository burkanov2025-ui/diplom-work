async function zagruzProfil() {
    const zagruzBlok = document.getElementById('zagruz_blok');
    const profilKontent = document.getElementById('profil_kontent');

    if (!zagruzBlok || !profilKontent) {
        return;
    }

    try {
        const p = await apiFetch.get('/profile/');

        zagruzBlok.classList.add('is-hidden');
        profilKontent.classList.remove('is-hidden');

        document.getElementById('profil_bukva').textContent = (p.username || '?').charAt(0).toUpperCase();
        document.getElementById('profil_imya').textContent = p.username;

        document.getElementById('profil_tip_metka').textContent = nazvanieRoli(p);
        document.getElementById('profil_nomer').textContent = p.number || '—';

        const saytEl = document.getElementById('profil_sayt');
        if (p.website) {
            saytEl.innerHTML = `<a href="${p.website}" target="_blank" rel="noopener noreferrer">${p.website}</a>`;
        } else {
            saytEl.textContent = '—';
        }

        document.getElementById('profil_kompan').textContent = p.name_compani || '—';

        if (etoOrganizator(p)) {
            const vse = await apiFetch.get('/sponsers/');
            const moi = vse.filter((m) => m.organizer === p.id);
            const nashli = moi.filter((m) => m.sponsered).length;

            document.getElementById('stat_ryad').innerHTML = `
                <div class="stat_kard">
                    <div class="stat_chislo">${moi.length}</div>
                    <div class="stat_podpis">мероприятий</div>
                </div>
                <div class="stat_kard">
                    <div class="stat_chislo">${nashli}</div>
                    <div class="stat_podpis">нашли спонсора</div>
                </div>
                <div class="stat_kard">
                    <div class="stat_chislo">${moi.length - nashli}</div>
                    <div class="stat_podpis">ищут спонсора</div>
                </div>
            `;
        }
    } catch (err) {
        zagruzBlok.innerHTML = `
            <div class="ikona">⚠</div>
            <div>Не удалось загрузить профиль</div>
            <button class="knopka knopka_obv profil_retry_knopka" data-action="reload-profile">
                Попробовать снова
            </button>
        `;
        zagruzBlok.classList.remove('is-hidden');
        profilKontent.classList.add('is-hidden');
    }
}

function initProfilePage() {
    const zagruzBlok = document.getElementById('zagruz_blok');
    const profilKontent = document.getElementById('profil_kontent');

    if (!zagruzBlok || !profilKontent) {
        return;
    }

    if (!tokenData.est()) {
        window.location.href = '/login/';
        return;
    }

    zagruzBlok.addEventListener('click', (event) => {
        const retryBtn = event.target.closest('[data-action="reload-profile"]');
        if (retryBtn) {
            zagruzProfil();
        }
    });

    zagruzProfil();
}

initProfilePage();
