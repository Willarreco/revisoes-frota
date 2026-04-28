document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sessão antes de carregar dados
    const session = await checkSession();
    if (!session) return;

    const supabase = window.supabaseClient;
    const user = session.user;

    const loanForm = {
        nome: document.getElementById('cliente-nome'),
        telefone: document.getElementById('cliente-telefone'),
        valor: document.getElementById('valor-pego'),
        juros: document.getElementById('valor-juros'),
        data: document.getElementById('data-pagamento')
    };
    const addBtn = document.getElementById('add-client-btn');
    const loanList = document.getElementById('loan-list');
    const emptyState = document.getElementById('empty-state');
    const themeSelect = document.getElementById('theme-select');
    const reportBtn = document.getElementById('generate-report-btn');
    const alertsBar = document.getElementById('expiration-alerts');

    const ADMIN_PHONE = '027997200333';

    let loans = [];

    // Initialize
    loadLoans();

    // Event Listeners
    addBtn.addEventListener('click', addLoan);
    themeSelect.addEventListener('change', toggleTheme);
    reportBtn.addEventListener('click', () => alert('Funcionalidade de Relatório PDF em desenvolvimento.'));

    async function loadLoans() {
        const { data, error } = await supabase
            .from('loans')
            .select('*')
            .order('data_pagamento', { ascending: true });

        if (error) {
            console.error('Erro ao carregar empréstimos:', error.message);
        } else {
            loans = data.map(l => ({
                id: l.id,
                nome: l.nome,
                telefone: l.telefone,
                valor: parseFloat(l.valor),
                juros: parseFloat(l.juros),
                totalAPagar: parseFloat(l.total_a_pagar),
                data: l.data_pagamento
            }));
            renderLoans();
            checkExpirations();
        }
    }

    async function addLoan() {
        const nome = loanForm.nome.value.trim();
        const telefone = loanForm.telefone.value.trim();
        const valor = parseFloat(loanForm.valor.value);
        const juros = parseFloat(loanForm.juros.value);
        const data = loanForm.data.value;

        if (!nome || !telefone || isNaN(valor) || isNaN(juros) || !data) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        const totalAPagar = valor + (valor * (juros / 100));

        const { data: newEntry, error } = await supabase
            .from('loans')
            .insert([{
                user_id: user.id,
                nome,
                telefone,
                valor,
                juros,
                total_a_pagar: totalAPagar,
                data_pagamento: data
            }])
            .select();

        if (error) {
            alert('Erro ao salvar no banco de dados: ' + error.message);
        } else {
            loadLoans();
            clearForm();
        }
    }

    async function deleteLoan(id) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            const { error } = await supabase
                .from('loans')
                .delete()
                .eq('id', id);

            if (error) {
                alert('Erro ao excluir: ' + error.message);
            } else {
                loadLoans();
            }
        }
    }

    function renderLoans() {
        loanList.innerHTML = '';
        
        if (loans.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        loans.forEach(loan => {
            const status = getLoanStatus(loan.data);
            const tr = document.createElement('tr');
            
            if (status === 'overdue') tr.classList.add('row-overdue');
            if (status === 'today') tr.classList.add('row-due-today');

            tr.innerHTML = `
                <td><strong>${loan.nome}</strong></td>
                <td>${loan.telefone}</td>
                <td>R$ ${loan.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>${loan.juros}%</td>
                <td style="color: #4facfe; font-weight: bold;">R$ ${loan.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>
                    ${formatDate(loan.data)} 
                    <span class="status-badge status-${status}">${statusText(status)}</span>
                </td>
                <td>
                    <button class="whatsapp-btn" onclick="notifyClient('${loan.id}')">Notificar</button>
                    <button class="danger-btn" onclick="deleteLoan('${loan.id}')">Excluir</button>
                </td>
            `;
            loanList.appendChild(tr);
        });
    }

    function checkExpirations() {
        alertsBar.innerHTML = '';
        const today = new Date().toISOString().split('T')[0];
        const dueToday = loans.filter(loan => loan.data === today);
        const overdue = loans.filter(loan => loan.data < today);

        if (dueToday.length > 0 || overdue.length > 0) {
            alertsBar.style.display = 'block';
            
            if (overdue.length > 0) {
                const item = document.createElement('div');
                item.className = 'alert-item';
                item.innerHTML = `<span>⚠️ Você tem ${overdue.length} cobrança(s) ATRASADA(S)!</span> <button class="primary-btn" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" onclick="notifyAdmin('overdue')">Me Notificar</button>`;
                alertsBar.appendChild(item);
            }

            if (dueToday.length > 0) {
                const item = document.createElement('div');
                item.className = 'alert-item';
                item.style.color = '#ffc107';
                item.innerHTML = `<span>📅 ${dueToday.length} empréstimo(s) vencem HOJE!</span> <button class="primary-btn" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" onclick="notifyAdmin('today')">Me Notificar</button>`;
                alertsBar.appendChild(item);
            }
        } else {
            alertsBar.style.display = 'none';
        }
    }

    window.notifyClient = (id) => {
        const loan = loans.find(l => l.id == id);
        const message = `Olá ${loan.nome}, lembrete de que seu pagamento de R$ ${loan.totalAPagar.toLocaleString('pt-BR')} vence em ${formatDate(loan.data)}.`;
        const url = `https://wa.me/${loan.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    window.notifyAdmin = (type) => {
        const message = type === 'overdue' 
            ? `Aviso de Cobrança: Existem clientes com pagamentos atrasados no sistema.`
            : `Lembrete: Existem pagamentos vencendo hoje. Confira o painel!`;
        const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    function getLoanStatus(dateStr) {
        const today = new Date().toISOString().split('T')[0];
        if (dateStr < today) return 'overdue';
        if (dateStr === today) return 'today';
        return 'upcoming';
    }

    function statusText(status) {
        if (status === 'overdue') return 'ATRASADO';
        if (status === 'today') return 'VENCE HOJE';
        return 'NO PRAZO';
    }

    window.deleteLoan = deleteLoan;

    function clearForm() {
        loanForm.nome.value = '';
        loanForm.telefone.value = '';
        loanForm.valor.value = '';
        loanForm.juros.value = '';
        loanForm.data.value = '';
        loanForm.nome.focus();
    }

    function formatDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function toggleTheme() {
        const theme = themeSelect.value;
        document.body.setAttribute('data-theme', theme);
    }
});
