let profilMenu = null;
let moiMeropr = [];
let kartaMeropr = null;
let markerMeropr = null;
let redaktiruemoeId = null;
const START_KARTA_COORDS = [42.8746, 74.5698];

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

function ssylkaNaSayt(url) {
    if (!url) {
        return "—";
    }

    const safeUrl = ekranirovatHtml(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
}

function ssylkaNaKontakt(url) {
    if (!url) {
        return "—";
    }

    const safeUrl = ekranirovatHtml(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
}

function poluchitInputKoordinat() {
    return {
        lat: document.getElementById("f_location"),
        lng: document.getElementById("f_location2")
    };
}

function estChisloKoordinaty(value) {
    return value !== "" && Number.isFinite(Number(value));
}

function estKoordinatyMeropr(m) {
    return Number.isFinite(Number(m.location)) && Number.isFinite(Number(m.location2));
}

function ssylkaNaPrezentaciyu(m, className = "sponsor_presentation_link") {
    if (!m.prezentation) {
        return "";
    }

    return `<a class="${className} knopka knopka_obv" href="${m.prezentation}" target="_blank" rel="noopener noreferrer">Открыть презентацию</a>`;
}

function ustanovitKoordinaty(lat, lng) {
    const { lat: latInput, lng: lngInput } = poluchitInputKoordinat();
    if (!latInput || !lngInput) {
        return;
    }

    latInput.value = Number(lat).toFixed(6);
    lngInput.value = Number(lng).toFixed(6);
}

function ubratTochkuNaKarte() {
    if (markerMeropr) {
        markerMeropr.remove();
        markerMeropr = null;
    }
}

function obnovitTochkuNaKarte(lat, lng, centerMap = false) {
    if (!kartaMeropr || !window.L) {
        return;
    }

    const coords = [Number(lat), Number(lng)];
    if (!coords.every(Number.isFinite)) {
        ubratTochkuNaKarte();
        return;
    }

    if (!markerMeropr) {
        markerMeropr = window.L.marker(coords).addTo(kartaMeropr);
    } else {
        markerMeropr.setLatLng(coords);
    }

    if (centerMap) {
        kartaMeropr.setView(coords, 14);
    }
}

function synchronizirovatKartuSPolyami(centerMap = false) {
    const { lat: latInput, lng: lngInput } = poluchitInputKoordinat();
    if (!latInput || !lngInput) {
        return;
    }

    if (!estChisloKoordinaty(latInput.value) || !estChisloKoordinaty(lngInput.value)) {
        ubratTochkuNaKarte();
        return;
    }

    obnovitTochkuNaKarte(latInput.value, lngInput.value, centerMap);
}

function initKartaMeropr() {
    const kartaEl = document.getElementById("karta_meropr");
    const clearBtn = document.getElementById("karta_meropr_clear");
    const { lat: latInput, lng: lngInput } = poluchitInputKoordinat();

    if (!kartaEl || !clearBtn || !latInput || !lngInput || !window.L) {
        return;
    }

    kartaMeropr = window.L.map(kartaEl, {
        scrollWheelZoom: false
    }).setView(START_KARTA_COORDS, 12);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(kartaMeropr);

    kartaMeropr.on("click", (klikPoKarte) => {
        const { lat, lng } = klikPoKarte.latlng;
        ustanovitKoordinaty(lat, lng);
        obnovitTochkuNaKarte(lat, lng);
    });

    [latInput, lngInput].forEach((input) => {
        input.addEventListener("input", () => synchronizirovatKartuSPolyami());
        input.addEventListener("change", () => synchronizirovatKartuSPolyami(true));
    });

    clearBtn.addEventListener("click", () => {
        latInput.value = "";
        lngInput.value = "";
        ubratTochkuNaKarte();
        kartaMeropr.setView(START_KARTA_COORDS, 12);
    });

    synchronizirovatKartuSPolyami(true);

    setTimeout(() => {
        if (kartaMeropr) {
            kartaMeropr.invalidateSize();
        }
    }, 0);
}

function sozdatiOtklikiOrganizatora(meropr, otkliki) {
    if (otkliki.length === 0) {
        return `<div class="moi_otkliki_pust">Откликов от спонсоров пока нет</div>`;
    }

    const statusText = meropr.sponsered
        ? `<div class="moi_otkliki_status">Мероприятие уже отмечено как со спонсором</div>`
        : "";

    return `
        ${statusText}
        <div class="moi_otkliki_spisok">
            ${otkliki.map((otklik) => {
                const instagram = otklik.author_instagram || "";
                const telegram = otklik.author_telegram || "";

                return `
                    <div class="moi_otklik_kard">
                        <div class="moi_otklik_shapka">
                            <div class="moi_otklik_avtor">${ekranirovatHtml(otklik.author_name_compani || otklik.author_username || "Спонсор")}</div>
                            <div class="moi_otklik_data">${formatDat(otklik.created_at)}</div>
                        </div>
                        <div class="moi_otklik_kontakty">
                            <span>${ekranirovatHtml(otklik.author_number || "—")}</span>
                            <span>${ssylkaNaSayt(otklik.author_website)}</span>
                            <span>${ssylkaNaKontakt(instagram)}</span>
                            <span>${ssylkaNaKontakt(telegram)}</span>
                        </div>
                        <div class="moi_otklik_text">${ekranirovatHtml(otklik.text)}</div>
                        ${meropr.sponsered ? "" : `
                            <div class="moi_otklik_actions">
                                <button class="knopka knopka_sin moi_otklik_accept_btn"
                                    data-accept-sponsor="${meropr.id}"
                                    data-sponsor-label="${ekranirovatHtml(otklik.author_name_compani || otklik.author_username || "спонсора")}">
                                    Принять спонсора
                                </button>
                            </div>
                        `}
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

async function zagruzMoiMeropr() {
    const spisok = document.getElementById("moi_spisok");
    if (!spisok || !profilMenu) {
        return;
    }

    try {
        const [vse, otkliki] = await Promise.all([
            apiFetch.get("/sponsers/"),
            apiFetch.get("/sponserotklik/")
        ]);
        moiMeropr = vse.filter((m) => m.organizer === profilMenu.id);

        document.getElementById("moi_kol").textContent = `(${moiMeropr.length})`;

        if (moiMeropr.length === 0) {
            spisok.innerHTML = `
                <div class="pustoy_blok">
                    <div class="ikona">📋</div>
                    <div>Мероприятий пока нет</div>
                    <div class="sponser_menu_empty_help">Добавь первое</div>
                </div>
            `;
            return;
        }

        spisok.innerHTML = moiMeropr.map((m) => {
            const { tip, text } = statusMeropriyatiya(m);
            const otklikiMeropriyatiya = otkliki.filter((otklik) => otklik.itsponser === m.id);
            const foto = m.img
                ? `<img class="moi_foto" src="${m.img}" onerror="this.src='/static/diplom/img/default.jpg'" alt="${ekranirovatHtml(m.title)}">`
                : `<div class="moi_foto_zam">💡</div>`;

            return `
                <div class="moi_kard">
                    ${foto}
                    <div class="moi_info">
                        <div class="moi_nazv">${ekranirovatHtml(m.title)}</div>
                        <div class="moi_meta">
                            <div>${formatDatKorotko(m.data_start)} — ${formatDatKorotko(m.data_end)}</div>
                            <div>${m.kolvo_people} участников</div>
                            <div class="metka ${tip}">${text}</div>
                            <div class="metka metka_warn">Откликов: ${otklikiMeropriyatiya.length}</div>
                        </div>
                        <div class="moi_otkliki_blok">
                            <div class="moi_otkliki_zagol">Отклики спонсоров</div>
                            ${sozdatiOtklikiOrganizatora(m, otklikiMeropriyatiya)}
                        </div>
                        <div class="moi_kard_knopki">
                            <button class="knopka knopka_sin sponser_menu_edit_btn" data-edit-meropr="${m.id}">
                                ✎ Редактировать
                            </button>
                            <button class="knopka knopka_del sponser_menu_delete_btn" data-delete-meropr="${m.id}">
                                ${ikonki.korzina} Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        spisok.innerHTML = `<div>Ошибка загрузки</div>`;
    }
}

async function dobavitMeropr(e) {
    e.preventDefault();

    const knopka = document.getElementById("dobav_knopka");
    const nazv = document.getElementById("f_nazv").value.trim();
    const opis = document.getElementById("f_opis").value.trim();
    const nach = document.getElementById("f_data_nach").value;
    const kon = document.getElementById("f_data_kon").value;
    const kol = document.getElementById("f_kol").value;
    const sponsered = document.getElementById("f_sponsered").value;
    const fileInput = document.getElementById("f_foto");
    const prezentationInput = document.getElementById("f_prezentation");
    const location = document.getElementById("f_location").value.trim();
    const location2 = document.getElementById("f_location2").value.trim();

    skritUved("forma_oshibka");
    skritUved("forma_ok");

    if (!nazv || !nach || !kon || !kol) {
        pokazUved("forma_oshibka", "Заполни все обязательные поля");
        return;
    }

    if (new Date(nach) > new Date(kon)) {
        pokazUved("forma_oshibka", "Дата начала позже даты конца");
        return;
    }

    const formData = new FormData();
    formData.append("title", nazv);
    formData.append("description", opis);
    formData.append("data_start", nach);
    formData.append("data_end", kon);
    formData.append("kolvo_people", parseInt(kol, 10));
    formData.append("sponsered", sponsered);

    if (estChisloKoordinaty(location) && estChisloKoordinaty(location2)) {
        formData.append("location", Number(location));
        formData.append("location2", Number(location2));
    }

    if (fileInput.files.length > 0) {
        formData.append("img", fileInput.files[0]);
    }

    if (prezentationInput && prezentationInput.files.length > 0) {
        formData.append("prezentation", prezentationInput.files[0]);
    }

    knopkaZagruz(knopka, true, "Добавляем...");

    try {
        await apiFetch.postForm("/sponsers/", formData);
        pokazUved("forma_ok", "Мероприятие добавлено", "ok");
        sbrosFormu();
        zagruzMoiMeropr();
    } catch (err) {
        if (err && typeof err === "object" && err.data) {
            const first = Object.values(err.data)[0];
            pokazUved("forma_oshibka", Array.isArray(first) ? first[0] : first);
        } else {
            pokazUved("forma_oshibka", "Ошибка при добавлении");
        }
    } finally {
        knopkaZagruz(knopka, false);
    }
}

async function prinyatSponsora(meroprId, sponsorLabel) {
    if (!confirm(`Принять ${sponsorLabel} и отметить, что спонсор найден?`)) {
        return;
    }

    skritUved("forma_oshibka");
    skritUved("forma_ok");

    try {
        await apiFetch.obnovit(`/sponsers/${meroprId}/`, { sponsered: true });
        pokazUved("forma_ok", "Спонсор принят, статус мероприятия обновлен", "ok");
        zagruzMoiMeropr();
    } catch (err) {
        pokazUved("forma_oshibka", "Не удалось принять спонсора");
    }
}

async function udalitMeropr(id) {
    if (!confirm("Удалить?")) {
        return;
    }

    try {
        await apiFetch.udalit(`/sponsers/${id}/`);
        zagruzMoiMeropr();
    } catch (err) {
        alert("Ошибка удаления");
    }
}

function sbrosFormu() {
    ["f_nazv", "f_opis", "f_data_nach", "f_data_kon", "f_kol", "f_location", "f_location2"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = "";
        }
    });

    const statusEl = document.getElementById("f_sponsered");
    if (statusEl) {
        statusEl.value = "false";
    }

    const file = document.getElementById("f_foto");
    if (file) {
        file.value = "";
    }

    const prezentation = document.getElementById("f_prezentation");
    if (prezentation) {
        prezentation.value = "";
    }

    ubratTochkuNaKarte();
    if (kartaMeropr) {
        kartaMeropr.setView(START_KARTA_COORDS, 12);
    }
}

async function otkritModalRedaktirovaniya(id) {
    const meropr = moiMeropr.find((m) => m.id === id);
    if (!meropr) {
        console.error("Мероприятие не найдено с ID:", id);
        return;
    }

    redaktiruemoeId = id;

    document.getElementById("red_nazv").value = meropr.title || "";
    document.getElementById("red_opis").value = meropr.description || "";
    document.getElementById("red_data_nach").value = meropr.data_start || "";
    document.getElementById("red_data_kon").value = meropr.data_end || "";
    document.getElementById("red_kol").value = meropr.kolvo_people || "";
    document.getElementById("red_location").value = meropr.location || "";
    document.getElementById("red_location2").value = meropr.location2 || "";
    document.getElementById("red_sponsered").value = meropr.sponsered ? "true" : "false";

    const modal = document.getElementById("modal_redaktirovanie");
    if (modal) {
        modal.classList.add("otkrit");
        document.body.classList.add("modal-open");
    }
}

function zakritModalRedaktirovaniya() {
    const modal = document.getElementById("modal_redaktirovanie");
    if (modal) {
        modal.classList.remove("otkrit");
        document.body.classList.remove("modal-open");
    }
    redaktiruemoeId = null;
}

async function sohranitMeropriyatie(e) {
    if (e) {
        e.preventDefault();
    }

    if (!redaktiruemoeId) {
        return;
    }

    const knopka = document.getElementById("red_save_knopka");
    const nazv = document.getElementById("red_nazv").value.trim();
    const opis = document.getElementById("red_opis").value.trim();
    const nach = document.getElementById("red_data_nach").value;
    const kon = document.getElementById("red_data_kon").value;
    const kol = document.getElementById("red_kol").value;
    const sponsered = document.getElementById("red_sponsered").value;
    const location = document.getElementById("red_location").value.trim();
    const location2 = document.getElementById("red_location2").value.trim();

    skritUved("red_oshibka");
    skritUved("red_ok");

    if (!nazv || !nach || !kon || !kol) {
        pokazUved("red_oshibka", "Заполни все обязательные поля");
        return;
    }

    if (new Date(nach) > new Date(kon)) {
        pokazUved("red_oshibka", "Дата начала позже даты конца");
        return;
    }

    const dataToSend = {
        title: nazv,
        description: opis,
        data_start: nach,
        data_end: kon,
        kolvo_people: parseInt(kol, 10),
        sponsered: sponsered === "true"
    };

    if (estChisloKoordinaty(location) && estChisloKoordinaty(location2)) {
        dataToSend.location = Number(location);
        dataToSend.location2 = Number(location2);
    }

    knopkaZagruz(knopka, true, "Сохраняем...");

    try {
        await apiFetch.obnovit(`/sponsers/${redaktiruemoeId}/`, dataToSend);
        pokazUved("red_ok", "Мероприятие обновлено", "ok");
        setTimeout(() => {
            zakritModalRedaktirovaniya();
            zagruzMoiMeropr();
        }, 1000);
    } catch (err) {
        if (err && typeof err === "object" && err.data) {
            const first = Object.values(err.data)[0];
            pokazUved("red_oshibka", Array.isArray(first) ? first[0] : first);
        } else {
            pokazUved("red_oshibka", "Ошибка при обновлении");
        }
    } finally {
        knopkaZagruz(knopka, false);
    }
}

function initOrganizerView() {
    const organizerView = document.getElementById("organizer_view");
    const dobav = document.getElementById("dobav_knopka");
    const sbros = document.getElementById("sbros_knopka");
    const spisok = document.getElementById("moi_spisok");

    if (!organizerView || !dobav || !sbros || !spisok) {
        return;
    }

    organizerView.classList.remove("is-hidden");

    if (!kartaMeropr) {
        initKartaMeropr();
    }

    dobav.addEventListener("click", dobavitMeropr);
    sbros.addEventListener("click", sbrosFormu);

    spisok.addEventListener("click", (event) => {
        const deleteBtn = event.target.closest("[data-delete-meropr]");
        if (deleteBtn) {
            udalitMeropr(Number(deleteBtn.dataset.deleteMeropr));
            return;
        }

        const editBtn = event.target.closest("[data-edit-meropr]");
        if (editBtn) {
            otkritModalRedaktirovaniya(Number(editBtn.dataset.editMeropr));
            return;
        }

        const acceptBtn = event.target.closest("[data-accept-sponsor]");
        if (acceptBtn) {
            prinyatSponsora(Number(acceptBtn.dataset.acceptSponsor), acceptBtn.dataset.sponsorLabel || "спонсора");
        }
    });

    zagruzMoiMeropr();
}

async function initSponserMenuPage() {
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

    if (etoSponser(profilMenu)) {
        window.location.href = "/otklik/";
        return;
    }

    initOrganizerView();
}

initSponserMenuPage();
