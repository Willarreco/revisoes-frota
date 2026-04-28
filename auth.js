// Inicializar cliente Supabase
const supabase = supabasejs.createClient(window.supabaseConfig.url, window.supabaseConfig.key);

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('login-error');
    const btnRegister = document.getElementById('btn-register');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                showError(error.message);
            } else {
                window.location.href = 'index.html';
            }
        });

        btnRegister.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                showError('Preencha e-mail e senha para criar conta.');
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                showError(error.message);
            } else {
                alert('Conta criada! Verifique seu e-mail para confirmar (se necessário) ou tente logar.');
            }
        });
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
});

// Função global para verificar sessão
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
    return session;
}

// Função de logout
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

window.supabaseClient = supabase;
