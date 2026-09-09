// Inicializar cliente Supabase com nome diferente para evitar conflito
const supabaseClient = supabase.createClient(window.supabaseConfig.url, window.supabaseConfig.key);

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

            const { data, error } = await supabaseClient.auth.signInWithPassword({
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

            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
            });

            if (error) {
                showError(error.message);
            } else {
                showSuccess('Conta criada com sucesso! Agora clique em "Entrar".');
            }
        });
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.color = '#ef4444';
        errorMsg.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        errorMsg.style.background = 'rgba(239, 68, 68, 0.1)';
        errorMsg.style.display = 'block';
    }

    function showSuccess(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.color = '#10b981';
        errorMsg.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        errorMsg.style.background = 'rgba(16, 185, 129, 0.1)';
        errorMsg.style.display = 'block';
    }
});

// Função global para verificar sessão
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
    return session;
}

// Função de logout
async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}

window.supabaseClient = supabaseClient;
