let profilMenu = null;
let sponsorMeropr = [];
let sponsorOtkliki = [];
let aktivnoeMeropriyatieId = null;
let aktivnayaKartaModal = null;

function ekranirovatHtml(text) {
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function statusMeropriyatiya(m) {
    return m.sponsered
        ? { tip: "metka_net", text: "Спонсор найден" }
        : { tip: "metka_ok", text: "Ищет спонсора" };
}

function naytiMoiOtklik(meroprId) {
    if (!profilMenu) {
        return null;
    }

    return sponsorOtkliki.find((otklik) =>
        otklik.itsponser === meroprId && otklik.author_username === profilMenu.username
    ) || null;
}

function knopkaOtlikaTekst(m) {
    if (m.sponsered) {
        return "Набор закрыт";
    }

    return naytiMoiOtklik(m.id) ? "Отклик отправлен" : "Откликнуться";
}

function ssylkaNaPrezentaciyu(m, className = "sponsor_presentation_link") {
    if (!m.prezentation) {
        return "";
    }
    return `<a class="${className} knopka knopka_obv" href="${m.prezentation}" target="_blank" rel="noopener noreferrer">Открыть презентацию</a>`;
}

function estKoordinatyMeropr(m) {
    return Number.isFinite(Number(m.location)) && Number.isFinite(Number(m.location2));
}

function blokKartyMeropr(m, idKarty) {
    if (!estKoordinatyMeropr(m)) {
        return "";
    }
    return `
        <div class="vzaimod_blok sponsor_modal_section">
            <div class="sponsor_modal_section_title">Место на карте</div>
            <div id="${idKarty}" class="karta_v_modal"></div>
        </div>
    `;
}

function initKartaVModalke(idKarty, shir, dol) {
    if (!window.L) {
        return;
    }

    if (aktivnayaKartaModal) {
        aktivnayaKartaModal.remove();
        aktivnayaKartaModal = null;
    }

    const blokKarty = document.getElementById(idKarty);
    if (!blokKarty) {
        return;
    }

    const coords = [Number(shir), Number(dol)];
    if (!coords.every(Number.isFinite)) {
        return;
    }

    aktivnayaKartaModal = window.L.map(blokKarty, {
        scrollWheelZoom: false
    }).setView(coords, 14);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(aktivnayaKartaModal);

    window.L.marker(coords).addTo(aktivnayaKartaModal);
    setTimeout(() => aktivnayaKartaModal.invalidateSize(), 0);
}

function pokazatSpisokDlyaSponsora() {
    const spisok = document.getElementById("sponsor_spisok");
    const kol = document.getElementById("sponsor_kol");
    if (!spisok || !kol) {
        return;
    }

    kol.textContent = `(${sponsorMeropr.length})`;

    if (sponsorMeropr.length === 0) {
        spisok.innerHTML = `
            <div class="pustoy_blok">
                <div class="ikona">📭</div>
                <div>Пока нет мероприятий для отклика</div>
            </div>
        `;
        return;
    }

    spisok.innerHTML = sponsorMeropr.map((m) => {
        const { tip, text } = statusMeropriyatiya(m);
        const mojOtklik = naytiMoiOtklik(m.id);
        const foto = m.img
            ? `<img class="sponsor_kard_foto" src="${m.img}" onerror="this.src='/static/diplom/img/default.jpg'" alt="${ekranirovatHtml(m.title)}">`
            : `<div class="sponsor_kard_foto_zam">💡</div>`;
        const dopMetka = mojOtklik
            ? '<div class="metka metka_warn">Отклик уже отправлен</div>'
            : "";
        const disabledClass = m.sponsered ? " sponsor_kard_knopka_disabled" : "";
        const prezentaciya = m.prezentation
            ? `<div class="sponsor_kard_presentation">${ssylkaNaPrezentaciyu(m)}</div>`
            : "";

        return `
            <div class="kard sponsor_kard">
                ${foto}
                <div class="sponsor_kard_telo">
                    <div class="sponsor_kard_metki">
                        <div class="metka ${tip}">${text}</div>
                        ${dopMetka}
                    </div>
                    <div class="sponsor_kard_nazv">${ekranirovatHtml(m.title)}</div>
                    <div class="sponsor_kard_opis">${ekranirovatHtml(m.description || "Описание не указано")}</div>
                    <div class="sponsor_kard_info">
                        <div>${formatDatKorotko(m.data_start)} — ${formatDatKorotko(m.data_end)}</div>
                        <div>${m.kolvo_people} участников</div>
                    </div>
                    ${prezentaciya}
                    <div class="sponsor_kard_knopki">
                        <button class="knopka ${m.sponsered ? "knopka_obv" : "knopka_sin"} sponsor_kard_knopka${disabledClass}"
                            data-open-otklik="${m.id}">
                            ${knopkaOtlikaTekst(m)}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

async function zagruzitDannyeSponsora() {
    const spisok = document.getElementById("sponsor_spisok");
    if (!spisok) {
        return;
    }

    spisok.innerHTML = `
        <div class="zaglushka sponsor_spisok_loading">
            <div class="krujok_zagruz"></div>
            <div>Загружаем мероприятия...</div>
        </div>
    `;

    try {
        const [meropr, otkliki] = await Promise.all([
            apiFetch.get("/sponsers/"),
            apiFetch.get("/sponserotklik/")
        ]);

        sponsorMeropr = meropr;
        sponsorOtkliki = otkliki;
        pokazatSpisokDlyaSponsora();
    } catch (err) {
        spisok.innerHTML = `
            <div class="pustoy_blok">
                <div class="ikona">⚠</div>
                <div>Не удалось загрузить мероприятия</div>
                <button class="knopka knopka_obv sponsor_retry_btn" data-action="reload-sponsor-list">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

function sozdatiKontaktnyePolya() {
    return `
        <div class="forma_ryad sponsor_modal_contact_grid">
            <div class="pole_gruppa sponsor_modal_pole">
                <label>Компания</label>
                <input type="text" value="${ekranirovatHtml(profilMenu.name_compani || "—")}" readonly>
            </div>
            <div class="pole_gruppa sponsor_modal_pole">
                <label>Телефон</label>
                <input type="text" value="${ekranirovatHtml(profilMenu.number || "—")}" readonly>
            </div>
        </div>
        <div class="forma_ryad sponsor_modal_contact_grid">
            <div class="pole_gruppa sponsor_modal_pole">
                <label>Сайт</label>
                <input type="text" value="${ekranirovatHtml(profilMenu.website || "—")}" readonly>
            </div>
            <div class="pole_gruppa sponsor_modal_pole">
                <label>Instagram</label>
                <input type="text" value="${ekranirovatHtml(profilMenu.instagram || "—")}" readonly>
            </div>
        </div>
        <div class="pole_gruppa sponsor_modal_pole">
            <label>Telegram</label>
            <input type="text" value="${ekranirovatHtml(profilMenu.telegram || "—")}" readonly>
        </div>
    `;
}

function sozdatiStatusOtlika(m, mojOtklik) {
    if (m.sponsered) {
        return '<div class="sponsor_modal_info_text">Для этого мероприятия спонсор уже найден.</div>';
    }

    if (mojOtklik) {
        const deleteBtn = mojOtklik.id
            ? `<button class="knopka knopka_obv sponsor_modal_submit" data-delete-otklik="${mojOtklik.id}" data-meropr-id="${m.id}">Удалить отклик</button>`
            : "";

        return `
            <div class="sponsor_modal_info_text">Ты уже отправил отклик на это мероприятие.</div>
            <div class="sponsor_modal_otklik_kard">
                <div class="sponsor_modal_otklik_zagol">Твой отклик</div>
                <div class="sponsor_modal_otklik_text">${ekranirovatHtml(mojOtklik.text)}</div>
            </div>
            ${deleteBtn}
        `;
    }

    return '<div class="sponsor_modal_info_text">Контакты уже подставлены из профиля. Нужно только сообщение для организатора.</div>';
}

function otkritModalOtlika(meroprId) {
    const modal = document.getElementById("sponsor_modal_okno");
    const telo = document.getElementById("sponsor_modal_telo");
    const m = sponsorMeropr.find((item) => item.id === meroprId);

    if (!modal || !telo || !m || !profilMenu) {
        return;
    }

    aktivnoeMeropriyatieId = meroprId;

    const { tip, text } = statusMeropriyatiya(m);
    const mojOtklik = naytiMoiOtklik(meroprId);
    const foto = m.img
        ? `<img class="modal_foto" src="${m.img}" onerror="this.src='/static/diplom/img/default.jpg'" alt="${ekranirovatHtml(m.title)}">`
        : `<div class="modal_foto_zam">💡</div>`;
    const idKarty = `karta_modal_${meroprId}`;
    const forma = !m.sponsered && !mojOtklik
        ? `
            <div class="uvedoml uvedoml_err" id="otklik_oshibka"></div>
            <div class="uvedoml uvedoml_ok" id="otklik_ok"></div>
            <div class="pole_gruppa sponsor_modal_pole">
                <label for="otklik_text">Сообщение организатору *</label>
                <textarea id="otklik_text" class="sponser_menu_textarea sponsor_modal_textarea"
                    placeholder="Опиши условия, формат сотрудничества и что ты готов предложить..."></textarea>
            </div>
            <button class="knopka knopka_sin sponsor_modal_submit" data-submit-otklik="${meroprId}">
                Откликнуться
            </button>
        `
        : "";

    telo.innerHTML = `
        ${foto}
        <div class="modal_telo">
            <button class="modal_zakrit" data-close-modal="true">✕</button>
            <div class="metka ${tip} sponsor_modal_status">${text}</div>
            <div class="modal_nazv">${ekranirovatHtml(m.title)}</div>
            <div class="modal_opis">${ekranirovatHtml(m.description || "Описание не указано")}</div>
            <div class="modal_info sponsor_modal_info">
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
            ${m.prezentation ? `<div class="vzaimod_blok sponsor_modal_section">${ssylkaNaPrezentaciyu(m, "sponsor_modal_presentation_link")}</div>` : ""}
            ${blokKartyMeropr(m, idKarty)}
            <div class="vzaimod_blok sponsor_modal_section">
                <div class="sponsor_modal_section_title">Контакты из профиля</div>
                ${sozdatiKontaktnyePolya()}
                <div class="sponsor_modal_podskazka">
                    Эти данные придут организатору автоматически вместе с откликом.
                </div>
            </div>

            <div class="vzaimod_blok sponsor_modal_section">
                <div class="sponsor_modal_section_title">Отклик</div>
                ${sozdatiStatusOtlika(m, mojOtklik)}
                ${forma}
            </div>
        </div>
    `;

    modal.classList.add("otkrit");
    document.body.classList.add("modal-open");

    if (estKoordinatyMeropr(m)) {
        initKartaVModalke(idKarty, m.location, m.location2);
    }
}

function zakritModalOtlika() {
    const modal = document.getElementById("sponsor_modal_okno");
    if (!modal) {
        return;
    }

    modal.classList.remove("otkrit");
    document.body.classList.remove("modal-open");
    aktivnoeMeropriyatieId = null;

    if (aktivnayaKartaModal) {
        aktivnayaKartaModal.remove();
        aktivnayaKartaModal = null;
    }
}

async function otpravitOtklik(meroprId) {
    const pole = document.getElementById("otklik_text");
    const knopka = document.querySelector(`[data-submit-otklik="${meroprId}"]`);

    if (!pole || !knopka) {
        return;
    }

    const text = pole.value.trim();
    skritUved("otklik_oshibka");
    skritUved("otklik_ok");

    if (!text) {
        pokazUved("otklik_oshibka", "Напиши сообщение для организатора");
        return;
    }

    if (naytiMoiOtklik(meroprId)) {
        pokazUved("otklik_oshibka", "Ты уже отправил отклик на это мероприятие");
        return;
    }

    knopkaZagruz(knopka, true, "Отправляем...");

    try {
        const noviyOtklik = await apiFetch.post(`/sponserotklik/${meroprId}/`, {
            itsponser: meroprId,
            text
        });

        sponsorOtkliki.unshift({
            ...noviyOtklik,
            author_username: noviyOtklik.author_username || profilMenu.username,
            author_name_compani: noviyOtklik.author_name_compani || profilMenu.name_compani,
            author_website: noviyOtklik.author_website || profilMenu.website,
            author_telegram: noviyOtklik.author_telegram || profilMenu.telegram,
            author_instagram: noviyOtklik.author_instagram || profilMenu.instagram,
            author_number: noviyOtklik.author_number || profilMenu.number
        });

        pokazatSpisokDlyaSponsora();
        pokazUved("otklik_ok", "Отклик отправлен", "ok");

        if (aktivnoeMeropriyatieId === meroprId) {
            setTimeout(() => {
                otkritModalOtlika(meroprId);
            }, 250);
        }
    } catch (err) {
        if (err && typeof err === "object" && err.data) {
            const first = Object.values(err.data)[0];
            pokazUved("otklik_oshibka", Array.isArray(first) ? first[0] : first);
        } else {
            pokazUved("otklik_oshibka", "Не удалось отправить отклик");
        }
    } finally {
        if (knopka.isConnected) {
            knopkaZagruz(knopka, false);
        }
    }
}

async function udalitOtklik(otklikId, meroprId) {
    try {
        await apiFetch.udalit(`/sponserotklik/${otklikId}/`);
        sponsorOtkliki = sponsorOtkliki.filter((otklik) => otklik.id !== otklikId);
        pokazatSpisokDlyaSponsora();

        if (aktivnoeMeropriyatieId === meroprId) {
            otkritModalOtlika(meroprId);
        }
    } catch (err) {
        pokazUved("otklik_oshibka", "Не удалось удалить отклик");
    }
}

function initOtklikView() {
    const sponsorView = document.getElementById("sponsor_view");
    const spisok = document.getElementById("sponsor_spisok");
    const modal = document.getElementById("sponsor_modal_okno");

    if (!sponsorView || !spisok || !modal) {
        return;
    }

    sponsorView.classList.remove("is-hidden");

    spisok.addEventListener("click", (event) => {
        const retryBtn = event.target.closest('[data-action="reload-sponsor-list"]');
        if (retryBtn) {
            zagruzitDannyeSponsora();
            return;
        }

        const btn = event.target.closest("[data-open-otklik]");
        if (btn) {
            otkritModalOtlika(Number(btn.dataset.openOtklik));
        }
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest("[data-close-modal]")) {
            zakritModalOtlika();
            return;
        }

        const submitBtn = event.target.closest("[data-submit-otklik]");
        if (submitBtn) {
            otpravitOtklik(Number(submitBtn.dataset.submitOtklik));
            return;
        }

        const deleteBtn = event.target.closest("[data-delete-otklik]");
        if (deleteBtn) {
            udalitOtklik(Number(deleteBtn.dataset.deleteOtklik), Number(deleteBtn.dataset.meroprId));
        }
    });

    zagruzitDannyeSponsora();
}

async function initOtklikPage() {
    if (!tokenData.est()) {
        window.location.href = "/login/";
        return;
    }

    try {
        profilMenu = await apiFetch.get("/profile/");
    } catch (err) {
        tokenData.udalit();
        window.location.href = "/login/";
        return;
    }

    if (etoOrganizator(profilMenu)) {
        window.location.href = "/sponser-menu/";
        return;
    }

    initOtklikView();
}

initOtklikPage();