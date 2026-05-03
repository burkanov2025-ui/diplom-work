function initLoginPage() {
    const loginPole = document.getElementById('login_pole');
    const parolPole = document.getElementById('parol_pole');
    const vhodKnopka = document.getElementById('vhod_knopka');

    if (!loginPole || !parolPole || !vhodKnopka) {
        return;
    }

    if (tokenData.est()) {
        window.location.href = '/sponsers/';
        return;
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            vhodit();
        }
    });

    vhodKnopka.addEventListener('click', vhodit);

    async function vhodit() {
        const loginVal = loginPole.value.trim();
        const parolVal = parolPole.value.trim();

        skritUved('oshibka_msg');

        if (!loginVal || !parolVal) {
            pokazUved('oshibka_msg', 'Заполни все поля');
            return;
        }

        knopkaZagruz(vhodKnopka, true, 'Входим...');

        try {
            const otvet = await apiFetch.post('/login/', {
                username: loginVal,
                password: parolVal
            });

            tokenData.sohranit(otvet.token);
            window.location.href = '/sponsers/';
        } catch (err) {
            if (err.status === 400) {
                pokazUved('oshibka_msg', 'Неверный логин или пароль');
            } else {
                pokazUved('oshibka_msg', 'Что-то пошло не так, попробуй снова');
            }
        } finally {
            knopkaZagruz(vhodKnopka, false);
        }
    }
}

initLoginPage();
