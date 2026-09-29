let costsChart, typeChart, guinchoCostsChart, guinchoTypeChart, dashLavagensCostsChart, dashLavagensTypeChart;
let relChartManutencao, relChartManutencaoTop, relChartGuincho, relChartGuinchoMotorista, relChartLavagens, relChartLavagensTipo, relChartConsolidadoPie, relChartConsolidadoBar;


function parseNum(v) {
    if (v === null || v === undefined || v === '') return NaN;
    let s = String(v).trim();
    if (s.includes(',')) {
        // pt-BR: "2.323,6" -> dots are thousands, comma is decimal
        s = s.replace(/\./g, '').replace(',', '.');
    } else {
        // no comma: keep decimal dots, remove only thousands dots ("2.323" -> 2323)
        s = s.replace(/\.(?=\d{3}$)/g, '');
    }
    const n = parseFloat(s);
    return isNaN(n) ? NaN : n;
}

function fmtKm(v) {
    const n = parseNum(v);
    if (isNaN(n)) return '---';
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function fmtNum(v) {
    const n = parseNum(v);
    if (isNaN(n)) return '---';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- SISTEMA DE NOTIFICAÇÕES TOAST ---
function showToast(message, type = 'info', duration = 3800) {
    const container = document.getElementById('toast-container');
    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';
    if (type === 'warning') iconName = 'alert-triangle';

    toast.innerHTML = `
        <i data-lucide="${iconName}" class="toast-icon"></i>
        <div class="toast-content">${message}</div>
        <button type="button" class="toast-close" title="Fechar">&times;</button>
        <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    const closeBtn = toast.querySelector('.toast-close');
    const timer = setTimeout(dismiss, duration);

    function dismiss() {
        clearTimeout(timer);
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 250);
    }

    closeBtn.addEventListener('click', dismiss);
}
window.showToast = showToast;

// --- MODAL DE CONFIRMAÇÃO MODERNO ---
function showConfirm(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
            resolve(confirm(`${title}\n\n${message}`));
            return;
        }

        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const btnOk = document.getElementById('btn-confirm-ok');
        const btnCancel = document.getElementById('btn-confirm-cancel');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();

        function cleanup(result) {
            modal.style.display = 'none';
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            resolve(result);
        }

        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
    });
}
window.showConfirm = showConfirm;

// --- EXPORTAÇÃO UNIVERSAL PARA CSV / EXCEL (PT-BR) ---
function exportToCSV(filename, headers, rows) {
    if (!rows || rows.length === 0) {
        showToast('Nenhum dado disponível para exportação.', 'warning');
        return;
    }

    const csvRows = [];
    csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';'));

    rows.forEach(row => {
        csvRows.push(row.map(val => {
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(';'));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Arquivo "${filename}.csv" exportado com sucesso!`, 'success');
}
window.exportToCSV = exportToCSV;

// --- MOTOR UNIVERSAL DE GERAÇÃO DE PDF PROFISSIONAL (STRSAT) ---
function gerarPDFProfissional({ titulo, subtitulo, kpis = [], headers = [], rows = [], totalLabel = null, totalValue = null }) {
    if (!rows || rows.length === 0) {
        showToast('Nenhum dado encontrado para gerar o PDF.', 'warning');
        return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
        showToast('Permita janelas pop-up para abrir o documento PDF.', 'error');
        return;
    }

    const kpiHtml = kpis.map(kpi => `
        <div class="kpi-card">
            <div class="kpi-label">${kpi.label}</div>
            <div class="kpi-value">${kpi.value}</div>
        </div>
    `).join('');

    const headersHtml = headers.map(h => `<th>${h}</th>`).join('');
    const rowsHtml = rows.map(r => `
        <tr>
            ${r.map((cell, idx) => {
                const text = cell !== null && cell !== undefined ? String(cell) : '---';
                let align = 'left';
                if (text.startsWith('R$') || text.endsWith('km') || /^\d+$/.test(text)) {
                    align = 'right';
                }
                if (['Pago', 'Finalizado', 'Ativo', 'Operacional'].includes(text)) {
                    return `<td style="text-align: center;"><span class="badge badge-success">${text}</span></td>`;
                }
                if (['Pendente', 'Em Serviço', 'Em Manutenção'].includes(text)) {
                    return `<td style="text-align: center;"><span class="badge badge-warning">${text}</span></td>`;
                }
                if (['Inativo', 'Cancelado'].includes(text)) {
                    return `<td style="text-align: center;"><span class="badge badge-danger">${text}</span></td>`;
                }
                return `<td style="text-align: ${align};">${text}</td>`;
            }).join('')}
        </tr>
    `).join('');

    const totalBarHtml = (totalLabel && totalValue !== null) ? `
        <div class="total-bar">
            <span>${totalLabel}</span>
            <span>${totalValue}</span>
        </div>
    ` : '';

    const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>${titulo} - FROTA STRSAT</title>
            <style>
                @page { size: A4 portrait; margin: 12mm; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    color: #1e293b;
                    margin: 0;
                    padding: 20px;
                    background: #ffffff;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .header-table {
                    width: 100%;
                    border-collapse: collapse;
                    border-bottom: 3px solid #3b82f6;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                }
                .brand-title {
                    font-size: 22px;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: 0.5px;
                }
                .brand-sub {
                    font-size: 11px;
                    color: #3b82f6;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .doc-info {
                    text-align: right;
                    font-size: 11px;
                    color: #64748b;
                    line-height: 1.5;
                }
                .report-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 4px 0;
                }
                .report-sub {
                    font-size: 12px;
                    color: #64748b;
                    margin: 0 0 18px 0;
                }
                .kpi-container {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .kpi-card {
                    flex: 1;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 10px 12px;
                    text-align: center;
                }
                .kpi-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #64748b;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .kpi-value {
                    font-size: 15px;
                    font-weight: 700;
                    color: #0f172a;
                }
                table.data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 11px;
                }
                table.data-table th {
                    background: #0f172a;
                    color: #ffffff;
                    padding: 9px 8px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                table.data-table td {
                    padding: 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                table.data-table tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .badge {
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 700;
                    display: inline-block;
                }
                .badge-success { background: #dcfce7; color: #166534; }
                .badge-warning { background: #fef3c7; color: #92400e; }
                .badge-danger { background: #fee2e2; color: #991b1b; }
                .total-bar {
                    margin-top: 18px;
                    padding: 12px 16px;
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    border-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                    font-weight: 700;
                    color: #1e40af;
                }
                .signature-box {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                }
                .sig-line {
                    width: 42%;
                    border-top: 1px solid #94a3b8;
                    text-align: center;
                    padding-top: 6px;
                    font-size: 10px;
                    color: #64748b;
                    font-weight: 600;
                }
                .footer {
                    margin-top: 30px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 10px;
                    color: #94a3b8;
                }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td>
                        <div class="brand-sub">SISTEMA DE GESTÃO DE FROTA</div>
                        <div class="brand-title">FROTA STRSAT</div>
                    </td>
                    <td class="doc-info">
                        <strong>DATA DE EMISSÃO:</strong> ${new Date().toLocaleString('pt-BR')}<br>
                        <strong>SISTEMA:</strong> REVISÕES & FROTA V2.0
                    </td>
                </tr>
            </table>

            <h2 class="report-title">${titulo}</h2>
            ${subtitulo ? `<p class="report-sub">${subtitulo}</p>` : ''}

            ${kpis.length > 0 ? `<div class="kpi-container">${kpiHtml}</div>` : ''}

            <table class="data-table">
                <thead>
                    <tr>${headersHtml}</tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            ${totalBarHtml}

            <div class="signature-box">
                <div class="sig-line">Responsável Operacional</div>
                <div class="sig-line">Gerência de Frota</div>
            </div>

            <div class="footer">
                <span>FROTA STRSAT - Documento impresso oficialmente.</span>
                <span>Página 1 de 1</span>
            </div>

            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 350);
                }
            </script>
        </body>
        </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
}
window.gerarPDFProfissional = gerarPDFProfissional;


document.addEventListener('DOMContentLoaded', () => {

    // --- THEME & COLORS ---
    const THEME_COLORS = [
        '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#10b981', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
        '#8b5cf6', '#d946ef', '#64748b', '#dc143c', '#ffd700',
        '#673ab7', '#03a9f4', '#ff5722', '#009688'
    ];

    const BG_COLORS = [
        { bg: '#0b111e', sidebar: '#0f172a' }, // Default Navy
        { bg: '#000000', sidebar: '#111111' }, // Pure Black
        { bg: '#121212', sidebar: '#1e1e1e' }, // Material Dark
        { bg: '#0f172a', sidebar: '#1e293b' }, // Slate
        { bg: '#111827', sidebar: '#1f2937' }, // Gray
        { bg: '#171717', sidebar: '#262626' }, // Neutral
        { bg: '#18181b', sidebar: '#27272a' }, // Zinc
        { bg: '#2e1065', sidebar: '#3b0764' }, // Purple
        { bg: '#1e1b4b', sidebar: '#312e81' }, // Indigo
        { bg: '#020617', sidebar: '#0f172a' }, // Deep Slate
        { bg: '#064e3b', sidebar: '#022c22' }, // Emerald
        { bg: '#14532d', sidebar: '#052e16' }, // Green
        { bg: '#450a0a', sidebar: '#7f1d1d' }, // Red
        { bg: '#4c0519', sidebar: '#881337' }, // Rose
        { bg: '#7c2d12', sidebar: '#9a3412' }, // Orange
        { bg: '#451a03', sidebar: '#78350f' }, // Amber
        { bg: '#172554', sidebar: '#1e3a8a' }, // Blue
        { bg: '#082f49', sidebar: '#0c4a6e' }, // Sky
        { bg: '#164e63', sidebar: '#155e75' }, // Cyan
        { bg: '#134e4a', sidebar: '#115e59' }  // Teal
    ];

    const BG_IMAGES = [
        'none',
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503376712351-40409a8fcd53?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80'
    ];

    function applyBgImage(imgSrc) {
        if (imgSrc === 'none') {
            document.body.style.backgroundImage = 'none';
            document.body.classList.remove('has-bg-image');
            localStorage.removeItem('fleetBgImage');
            const btn = document.getElementById('btn-remove-bg');
            if(btn) btn.style.display = 'none';
        } else {
            document.body.style.backgroundImage = `url('${imgSrc}')`;
            document.body.classList.add('has-bg-image');
            try { localStorage.setItem('fleetBgImage', imgSrc); } catch (e) { console.warn('Image too large for localStorage'); }
            const btn = document.getElementById('btn-remove-bg');
            if(btn) btn.style.display = 'block';
        }
    }

    function initTheme() {
        const savedColor = localStorage.getItem('fleetThemeColor') || '#3b82f6';
        document.documentElement.style.setProperty('--accent-color', savedColor);

        const savedBgStr = localStorage.getItem('fleetBgColor');
        const savedBg = savedBgStr ? JSON.parse(savedBgStr) : { bg: '#0b111e', sidebar: '#0f172a' };
        document.documentElement.style.setProperty('--bg-color', savedBg.bg);
        document.documentElement.style.setProperty('--sidebar-bg', savedBg.sidebar);

        const savedBgImage = localStorage.getItem('fleetBgImage');
        if (savedBgImage) applyBgImage(savedBgImage);

        const container = document.getElementById('theme-color-options');
        if (container) {
            THEME_COLORS.forEach(color => {
                const div = document.createElement('div');
                div.className = `color-option ${color === savedColor ? 'active' : ''}`;
                div.style.backgroundColor = color;
                div.addEventListener('click', () => {
                    document.documentElement.style.setProperty('--accent-color', color);
                    localStorage.setItem('fleetThemeColor', color);
                    container.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
                    div.classList.add('active');
                });
                container.appendChild(div);
            });
        }

        const bgContainer = document.getElementById('bg-color-options');
        if (bgContainer) {
            BG_COLORS.forEach(colorObj => {
                const div = document.createElement('div');
                div.className = `color-option ${colorObj.bg === savedBg.bg ? 'active' : ''}`;
                div.style.backgroundColor = colorObj.bg;
                div.addEventListener('click', () => {
                    document.documentElement.style.setProperty('--bg-color', colorObj.bg);
                    document.documentElement.style.setProperty('--sidebar-bg', colorObj.sidebar);
                    localStorage.setItem('fleetBgColor', JSON.stringify(colorObj));
                    bgContainer.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
                    div.classList.add('active');
                });
                bgContainer.appendChild(div);
            });
        }

        const bgImgContainer = document.getElementById('bg-image-options');
        if (bgImgContainer) {
            BG_IMAGES.forEach(img => {
                const div = document.createElement('div');
                div.className = `color-option ${img === savedBgImage || (img === 'none' && !savedBgImage) ? 'active' : ''}`;
                if (img === 'none') {
                    div.style.background = '#1e293b';
                    div.style.display = 'flex';
                    div.style.alignItems = 'center';
                    div.style.justifyContent = 'center';
                    div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                } else {
                    div.style.backgroundImage = `url('${img}')`;
                    div.style.backgroundSize = 'cover';
                    div.style.backgroundPosition = 'center';
                }

                div.addEventListener('click', () => {
                    applyBgImage(img);
                    bgImgContainer.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
                    div.classList.add('active');
                });
                bgImgContainer.appendChild(div);
            });
        }

        document.getElementById('btn-upload-bg')?.addEventListener('click', () => document.getElementById('custom-bg-upload').click());
        document.getElementById('custom-bg-upload')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    applyBgImage(ev.target.result);
                    if (bgImgContainer) bgImgContainer.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
                };
                reader.readAsDataURL(file);
            }
        });
        document.getElementById('btn-remove-bg')?.addEventListener('click', () => {
            applyBgImage('none');
            if (bgImgContainer) {
                bgImgContainer.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
                if (bgImgContainer.firstChild) bgImgContainer.firstChild.classList.add('active');
            }
        });
    }
    initTheme();

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    const viewTitle = document.getElementById('view-title');

    function navigateTo(viewId) {
        const item = document.querySelector(`[data-view="${viewId}"]`);
        if (!item) return;

        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        sections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(viewId);
        if (targetSection) {
            targetSection.classList.add('active');
            viewTitle.textContent = item.querySelector('span').textContent;
        }
        window.scrollTo(0, 0);

        if (viewId === 'veiculos') renderVehicles(document.getElementById('search-veiculos')?.value || '');
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const viewId = item.getAttribute('data-view');
            if (viewId) navigateTo(viewId);
        });
    });

    // Back buttons (data-target)
    document.querySelectorAll('.btn-back[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) navigateTo(target);
        });
    });

    // Dashboard stat shortcuts (only in #dashboard section)
    document.querySelectorAll('#dashboard .stat-card').forEach(card => {
        card.addEventListener('click', () => navigateTo('veiculos'));
    });

    document.querySelectorAll('.btn-sm').forEach(btn => {
        if (btn.textContent.includes('Ver Tudo')) {
            btn.addEventListener('click', () => navigateTo('relatorios'));
        }
    });

    // Supabase State
    let vehicles = [];
    let activities = [];
    let editingVehicleId = null;

    async function checkAuthAndLoad() {
        const session = await window.checkSession();
        if (session) {
            await fetchInitialData();
        }
    }

    async function fetchInitialData() {
        try {
            // Fetch Vehicles
            const { data: vData, error: vError } = await window.supabaseClient
                .from('veiculos')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (vError) throw vError;
            
            vehicles = vData.map(v => ({
                id: v.id,
                plate: (v.placa || '').toUpperCase(),
                chassi: v.chassi,
                brand: v.marca,
                model: v.modelo,
                color: v.cor,
                year: v.ano,
                km: v.km_atual,
                status: v.status,
                history: [] // We'll fetch history when needed or join
            }));

            // --- AUTO IMPORT DATA ---
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                const newVehicles = [
                    { plate: 'SFX2I09', chassi: '9BD281A9JPYY72355', model: 'STRADA FREEDOM 1.3', brand: 'FIAT', color: 'VERMELHA', year: 2023 },
                    { plate: 'SFU5I81', chassi: '9BD281A9JPYY48942', model: 'STRADA FREEDOM 1.3', brand: 'FIAT', color: 'VERMELHA', year: 2023 },
                    { plate: 'SFR6C15', chassi: '9C2MD4110PR002890', model: 'XRE 190 ADVENTURE', brand: 'HONDA', color: 'CINZA', year: 2022 },
                    { plate: 'SFU5I92', chassi: '9BD281A9JPYY44235', model: 'STRADA FREEDOM 1.3', brand: 'FIAT', color: 'VERMELHA', year: 2023 },
                    { plate: 'SGC9A36', chassi: '9BD281AKHSYG02523', model: 'STRADA FREEDOM 1.3', brand: 'FIAT', color: 'BRANCA', year: 2024 },
                    { plate: 'TOG4E03', chassi: '9BD281AKPSYH02332', model: 'STRADA FREEDOM 1.3', brand: 'FIAT', color: 'BRANCA', year: 2025 },
                    { plate: 'SGG2B82', chassi: '9BD281AKHSYG14539', model: 'STRADA FREEDOM 1.3', brand: 'FIAT', color: 'BRANCA', year: 2024 },
                    { plate: 'SFX2H97', chassi: '9BD281A9JPYY72345', model: 'STRADA FREEDOM 1.3', brand: 'FIAT', color: 'VERMELHA', year: 2023 },
                    { plate: 'SFR9B50', chassi: '9C2MD4110PR003099', model: 'XRE 190 ADVENTURE', brand: 'HONDA', color: 'CINZA', year: 2022 },
                    { plate: 'SFX8A85', chassi: '9BD281AKHSYF87034', model: 'STRADA FREEDOM 1.3', brand: 'FIAT', color: 'BRANCA', year: 2024 },
                    { plate: 'SFQ6F01', chassi: '9C2KC2200PR013149', model: 'CG 160 FAN', brand: 'HONDA', color: 'VERMELHA', year: 2022 },
                    { plate: 'RQN3J15', chassi: '9C2KC2200NR186845', model: 'CG 160 FAN', brand: 'HONDA', color: 'VERMELHA', year: 2022 },
                    { plate: 'KWZ1B56', chassi: '9BD17104G85125161', model: 'PALIO ELX 1.0', brand: 'FIAT', color: 'PRETA', year: 2007 },
                    { plate: 'QRD9G90', chassi: '9BW31260QRD9G9001', model: 'CAMINHÃO GUINCHO WORKER 31.260', brand: 'VOLKSWAGEN', color: 'BRANCA', year: 2022 },
                    { plate: 'FCF5J84', chassi: '9BM97903FCF5J8402', model: 'CAMINHÃO GUINCHO ACCELO 1016', brand: 'MERCEDES-BENZ', color: 'BRANCA', year: 2021 }
                ];
                let addedAny = false;
                for (const v of newVehicles) {
                    if (!vehicles.find(existing => existing.plate === v.plate)) {
                        const payload = {
                            placa: v.plate, chassi: v.chassi, marca: v.brand,
                            modelo: v.model, cor: v.color, ano: v.year,
                            km_atual: 0, status: 'Ativo', user_id: user.id
                        };
                        await window.supabaseClient.from('veiculos').insert([payload]);
                        addedAny = true;
                    }
                }
                if (addedAny) {
                    const { data: refreshedVData } = await window.supabaseClient.from('veiculos').select('*').order('created_at', { ascending: false });
                    vehicles = refreshedVData.map(v => ({
                        id: v.id, plate: (v.placa || '').toUpperCase(), chassi: v.chassi, brand: v.marca,
                        model: v.modelo, color: v.cor, year: v.ano, km: v.km_atual,
                        status: v.status, history: []
                    }));
                }
            }
            // --- FIM AUTO IMPORT ---

            // Fetch Maintenance
            const { data: mData, error: mError } = await window.supabaseClient
                .from('manutencoes')
                .select('*, veiculos(modelo, placa)')
                .order('data', { ascending: false });

            if (mError) throw mError;

            activities = mData.map(m => ({
                id: m.id,
                vehicle: m.veiculos ? m.veiculos.modelo : 'Desconhecido',
                plate: m.veiculos ? (m.veiculos.placa || '').toUpperCase() : '---',
                service: m.servico,
                date: new Date(m.data).toLocaleDateString('pt-BR'),
                cost: parseFloat(m.custo),
                status: m.status,
                km: m.km_momento,
                vehicle_id: m.veiculo_id
            }));

            // Map history to vehicles
            vehicles.forEach(v => {
                v.history = activities.filter(a => a.vehicle_id === v.id).map(a => ({
                    service: a.service,
                    date: a.date,
                    cost: a.cost,
                    km: a.km
                }));
            });

            renderVehicles();
            renderActivities();
            updateVehicleSelect();
            updateCharts();
        } catch (error) {
            console.error('Erro ao carregar dados:', error.message);
        }
    }

    async function saveVehicle(data) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const payload = {
            placa: (data.plate || '').trim().toUpperCase(),
            chassi: data.chassi,
            marca: data.brand,
            modelo: data.model,
            cor: data.color,
            ano: parseInt(data.year) || null,
            km_atual: parseNum(data.km) || 0,
            status: data.status,
            user_id: user.id
        };

        if (editingVehicleId) {
            const { error } = await window.supabaseClient
                .from('veiculos')
                .update(payload)
                .eq('id', editingVehicleId);
            if (error) throw error;
        } else {
            const { error } = await window.supabaseClient
                .from('veiculos')
                .insert([payload]);
            if (error) throw error;
        }
        await fetchInitialData();
    }

    // Render Functions
    let currentViewMode = 'ativos';

    window.renderVehicles = (filterText = '') => {
        const vehicleTable = document.getElementById('vehicles-list');
        if (!vehicleTable) return;

        let activeCount = 0;
        let maintCount = 0;
        let overdue = 0;
        let next = 0;

        vehicles.forEach(v => {
            if (v.status === 'Ativo') activeCount++;
            if (v.status === 'Em Manutenção') maintCount++;

            const km = v.km || 0;
            const lastMaintKm = v.history && v.history.length > 0 ? Math.max(...v.history.map(h => h.km || 0)) : 0;
            const kmSinceLast = km - lastMaintKm;

            if (km > 0) {
                if (kmSinceLast >= 10000) overdue++;
                else if (kmSinceLast >= 9000) next++;
            }
        });

        const elActive = document.getElementById('stat-active');
        if(elActive) elActive.textContent = activeCount;
        
        const elMaint = document.getElementById('stat-maintenance');
        if(elMaint) elMaint.textContent = maintCount;
        
        const elOverdue = document.getElementById('stat-overdue');
        if(elOverdue) elOverdue.textContent = overdue;
        
        const elNext = document.getElementById('stat-next');
        if(elNext) elNext.textContent = next;
        
        const filtered = vehicles.filter(v => {
            const m = v.model || ''; const p = v.plate || ''; const b = v.brand || '';
            const matchesText = m.toLowerCase().includes(filterText.toLowerCase()) || 
                                p.toLowerCase().includes(filterText.toLowerCase()) ||
                                b.toLowerCase().includes(filterText.toLowerCase());
            const matchesStatus = currentViewMode === 'ativos'
                ? v.status !== 'Inativo'
                : v.status === 'Inativo';
            return matchesText && matchesStatus;
        });

        vehicleTable.innerHTML = filtered.length === 0 ? 
            '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Nenhum veículo encontrado.</td></tr>' : '';

        filtered.forEach(v => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <td style="font-weight: 700; color: var(--primary);">${v.plate}</td>
                <td>${v.brand}</td>
                <td>${v.model}</td>
                <td>${v.year}</td>
                <td>${fmtKm(v.km)} km</td>
                <td><span class="badge ${v.status === 'Ativo' ? 'badge-active' : v.status === 'Inativo' ? 'badge-inactive' : 'badge-maintenance'}" style="cursor:pointer" onclick="event.stopPropagation(); showVehicleDetails(vehicles.find(x=>x.id==='${v.id}'))">${v.status}</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-icon" title="Localização" onclick="event.stopPropagation(); window.openLocationModal('${v.plate}', '${v.model}')"><i data-lucide="map-pin" style="color: var(--accent-color);"></i></button>
                        <button class="btn-icon" title="Editar" onclick="event.stopPropagation(); window.findAndEditVehicle('${v.id}')"><i data-lucide="edit-2" class="text-primary"></i></button>
                        ${v.status === 'Inativo'
                            ? `<button class="btn-icon" title="Reativar" onclick="event.stopPropagation(); window.reactivateVehicle('${v.id}')"><i data-lucide="rotate-ccw" style="color: var(--success);"></i></button>`
                            : `<button class="btn-icon" title="Desativar" onclick="event.stopPropagation(); window.deleteVehicle('${v.id}')"><i data-lucide="trash-2" class="text-danger"></i></button>`
                        }
                    </div>
                </td>
            `;
            row.addEventListener('click', () => showVehicleDetails(v));
            vehicleTable.appendChild(row);
        });
        if (window.lucide) lucide.createIcons();
    };

    window.findAndEditVehicle = (id) => {
        const vehicle = vehicles.find(v => v.id === id);
        if (vehicle) openModal(vehicle);
    };

    window.deleteVehicle = async (id) => {
        const confirmed = await showConfirm('Desativar Veículo', 'Deseja desativar este veículo? Ele será movido para a aba de Inativos.');
        if (confirmed) {
            try {
                const { error } = await window.supabaseClient
                    .from('veiculos')
                    .update({ status: 'Inativo' })
                    .eq('id', id);
                if (error) throw error;
                showToast('Veículo movido para inativos com sucesso!', 'success');
                await fetchInitialData();
            } catch (error) {
                showToast('Erro ao desativar veículo: ' + error.message, 'error');
            }
        }
    };

    window.reactivateVehicle = async (id) => {
        const confirmed = await showConfirm('Reativar Veículo', 'Deseja reativar este veículo e trazê-lo de volta à frota ativa?');
        if (confirmed) {
            try {
                const { error } = await window.supabaseClient
                    .from('veiculos')
                    .update({ status: 'Ativo' })
                    .eq('id', id);
                if (error) throw error;
                showToast('Veículo reativado com sucesso!', 'success');
                await fetchInitialData();

                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.toggle-btn[data-mode="ativos"]')?.classList.add('active');
                currentViewMode = 'ativos';
                renderVehicles(document.getElementById('search-veiculos')?.value || '');
            } catch (error) {
                showToast('Erro ao reativar veículo: ' + error.message, 'error');
            }
        }
    };

    window.renderActivities = () => {
        const activityTable = document.getElementById('recent-activities');
        if (!activityTable) return;

        const totalCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0);
        const avgCost = vehicles.length ? totalCost / vehicles.length : 0;
        
        // Find max monthly cost
        const monthlyCosts = new Array(12).fill(0);
        activities.forEach(a => {
            const parts = a.date.split('/');
            const m = parseInt(parts[1]) - 1;
            if (m >= 0 && m < 12) monthlyCosts[m] += a.cost;
        });
        const maxMonthly = Math.max(...monthlyCosts);

        const reportStats = document.querySelectorAll('#relatorios .stat-value');
        if (reportStats.length >= 4) {
            reportStats[0].textContent = `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            reportStats[1].textContent = `R$ ${avgCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            reportStats[2].textContent = `R$ ${maxMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            reportStats[3].textContent = activities.length;
        }

        activityTable.innerHTML = activities.length === 0 ? 
            '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Nenhuma atividade recente.</td></tr>' : '';

        activities.slice(0, 10).forEach((a, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${a.vehicle}</td><td>${a.service}</td><td>${a.date}</td>
                <td style="font-weight: 600;">R$ ${a.cost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span class="badge badge-active">${a.status}</span>
                        <button class="btn-icon" title="Editar" onclick="loadMaintForEdit(${index})"><i data-lucide="edit-2" class="text-primary"></i></button>
                        <button class="btn-icon" title="Excluir" onclick="deleteActivity(${index})"><i data-lucide="trash-2" class="text-danger"></i></button>
                    </div>
                </td>
            `;
            activityTable.appendChild(row);
        });
        if (window.lucide) lucide.createIcons();
    };

    // Vehicle Modal
    const modal = document.getElementById('vehicle-modal');
    const vehicleForm = document.getElementById('new-vehicle-form');

    window.openModal = (vehicle = null) => {
        editingVehicleId = vehicle ? vehicle.id : null;
        modal.querySelector('.card-title').textContent = vehicle ? 'Editar Veículo' : 'Cadastro de Veículo';
        modal.querySelector('button[type="submit"]').textContent = vehicle ? 'Salvar Alterações' : 'Salvar Veículo';
        
        if (vehicle) {
            vehicleForm.model.value = vehicle.model;
            vehicleForm.brand.value = vehicle.brand;
            vehicleForm.plate.value = vehicle.plate;
            vehicleForm.chassi.value = vehicle.chassi;
            vehicleForm.color.value = vehicle.color;
            vehicleForm.km.value = vehicle.km;
            vehicleForm.year.value = vehicle.year !== '---' ? vehicle.year : '';
            if (vehicleForm.status) vehicleForm.status.value = vehicle.status || 'Ativo';
            if (vehicleForm.img) vehicleForm.img.value = vehicle.img || '';
        } else {
            vehicleForm.reset();
        }
        modal.style.display = 'flex';
    };

    document.getElementById('btn-new-vehicle')?.addEventListener('click', () => openModal());
    document.getElementById('btn-edit-vehicle')?.addEventListener('click', () => {
        const plate = document.querySelector('.plate-badge').textContent;
        const vehicle = vehicles.find(v => v.plate === plate);
        if (vehicle) openModal(vehicle);
    });

    document.querySelectorAll('.close-modal').forEach(el => el.addEventListener('click', () => modal.style.display = 'none'));
    
    vehicleForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(vehicleForm);
        const data = {
            model: fd.get('model'), brand: fd.get('brand'), plate: fd.get('plate'),
            chassi: fd.get('chassi'), color: fd.get('color'), year: fd.get('year'),
            km: parseNum(fd.get('km')) || 0, status: fd.get('status') || 'Ativo'
        };

        try {
            await saveVehicle(data);
            modal.style.display = 'none';
        } catch (error) {
            alert('Erro ao salvar veículo: ' + error.message);
        }
    });

    // Maintenance
    let currentServices = [], currentParts = [], currentLabor = [];
    let editingActivityIndex = null;
    const servicesBody = document.getElementById('maint-services-body');
    const partsBody = document.getElementById('maint-parts-body');
    const laborBody = document.getElementById('maint-labor-body');

    window.loadMaintForEdit = (index) => {
        const a = activities[index];
        editingActivityIndex = index;
        
        // Find vehicle and populate form
        const vehicle = vehicles.find(v => v.plate === a.plate);
        if (vehicle) document.getElementById('maint-vehicle-select').value = vehicle.id;
        
        document.querySelector('#manutencao input[placeholder="0"]').value = a.km || 0;
        
        // Parse date DD/MM/YYYY to YYYY-MM-DD
        if (a.date) {
            const parts = a.date.split('/');
            if (parts.length === 3) {
                document.querySelector('#manutencao input[type="date"]').value = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            }
        }

        currentServices = [{ desc: a.service, price: a.cost }];
        currentParts = [];
        currentLabor = [];
        renderMaintItems();
        navigateTo('manutencao');
    };

    window.deleteActivity = async (index) => {
        const confirmed = await showConfirm('Excluir Manutenção', 'Deseja realmente excluir este registro de manutenção?');
        if (confirmed) {
            try {
                const activity = activities[index];
                const { error } = await window.supabaseClient
                    .from('manutencoes')
                    .delete()
                    .eq('id', activity.id);
                if (error) throw error;
                showToast('Manutenção excluída com sucesso!', 'success');
                await fetchInitialData();
            } catch (error) {
                showToast('Erro ao excluir: ' + error.message, 'error');
            }
        }
    };

    window.renderMaintItems = () => {
        if (servicesBody) {
            servicesBody.innerHTML = '';
            currentServices.forEach((s, i) => {
                const tr = document.createElement('tr');
                if (s.isEditing) {
                    tr.innerHTML = `
                        <td><input type="text" class="form-input" value="${s.desc}" placeholder="Ex: Troca de Óleo" oninput="updateMaintItem('service',${i},'desc',this.value)"></td>
                        <td><input type="text" inputmode="decimal" class="form-input" value="${s.price === 0 ? '' : fmtNum(s.price)}" placeholder="0,00" oninput="updateMaintItem('service',${i},'price',this.value)"></td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <button type="button" class="btn-icon text-success" onclick="toggleMaintEdit('service',${i},false)"><i data-lucide="check"></i></button>
                                <button type="button" class="btn-icon text-danger" onclick="removeMaintItem('service',${i})"><i data-lucide="trash-2"></i></button>
                            </div>
                        </td>`;
                } else {
                    tr.innerHTML = `
                        <td style="padding: 1rem;">${s.desc || '---'}</td>
                        <td style="padding: 1rem;">R$ ${(s.price || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <button type="button" class="btn-icon" onclick="toggleMaintEdit('service',${i},true)"><i data-lucide="edit-2" class="text-primary"></i></button>
                                <button type="button" class="btn-icon text-danger" onclick="removeMaintItem('service',${i})"><i data-lucide="trash-2"></i></button>
                            </div>
                        </td>`;
                }
                servicesBody.appendChild(tr);
            });
        }

        if (partsBody) {
            partsBody.innerHTML = '';
            currentParts.forEach((p, i) => {
                const tr = document.createElement('tr');
                if (p.isEditing) {
                    tr.innerHTML = `
                        <td><input type="text" class="form-input" value="${p.desc}" placeholder="Ex: Filtro de Óleo" oninput="updateMaintItem('part',${i},'desc',this.value)"></td>
                        <td><input type="text" inputmode="decimal" class="form-input" value="${p.price === 0 ? '' : fmtNum(p.price)}" placeholder="0,00" oninput="updateMaintItem('part',${i},'price',this.value)"></td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <button type="button" class="btn-icon text-success" onclick="toggleMaintEdit('part',${i},false)"><i data-lucide="check"></i></button>
                                <button type="button" class="btn-icon text-danger" onclick="removeMaintItem('part',${i})"><i data-lucide="trash-2"></i></button>
                            </div>
                        </td>`;
                } else {
                    tr.innerHTML = `
                        <td style="padding: 1rem;">${p.desc || '---'}</td>
                        <td style="padding: 1rem;">R$ ${(p.price || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <button type="button" class="btn-icon" onclick="toggleMaintEdit('part',${i},true)"><i data-lucide="edit-2" class="text-primary"></i></button>
                                <button type="button" class="btn-icon text-danger" onclick="removeMaintItem('part',${i})"><i data-lucide="trash-2"></i></button>
                            </div>
                        </td>`;
                }
                partsBody.appendChild(tr);
            });
        }

        if (laborBody) {
            laborBody.innerHTML = '';
            currentLabor.forEach((l, i) => {
                const tr = document.createElement('tr');
                if (l.isEditing) {
                    tr.innerHTML = `
                        <td><input type="text" class="form-input" value="${l.desc}" placeholder="Ex: Mão de obra mecânica" oninput="updateMaintItem('labor',${i},'desc',this.value)"></td>
                        <td><input type="text" inputmode="decimal" class="form-input" value="${l.price === 0 ? '' : fmtNum(l.price)}" placeholder="0,00" oninput="updateMaintItem('labor',${i},'price',this.value)"></td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <button type="button" class="btn-icon text-success" onclick="toggleMaintEdit('labor',${i},false)"><i data-lucide="check"></i></button>
                                <button type="button" class="btn-icon text-danger" onclick="removeMaintItem('labor',${i})"><i data-lucide="trash-2"></i></button>
                            </div>
                        </td>`;
                } else {
                    tr.innerHTML = `
                        <td style="padding: 1rem;">${l.desc || '---'}</td>
                        <td style="padding: 1rem;">R$ ${(l.price || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <button type="button" class="btn-icon" onclick="toggleMaintEdit('labor',${i},true)"><i data-lucide="edit-2" class="text-primary"></i></button>
                                <button type="button" class="btn-icon text-danger" onclick="removeMaintItem('labor',${i})"><i data-lucide="trash-2"></i></button>
                            </div>
                        </td>`;
                }
                laborBody.appendChild(tr);
            });
        }

        const total = currentServices.reduce((s,x)=>s+(x.price || 0),0) + currentParts.reduce((s,x)=>s+(x.price || 0),0) + currentLabor.reduce((s,x)=>s+(x.price || 0),0);
        document.getElementById('maint-total-price').textContent = `R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        if (window.lucide) lucide.createIcons();
    };

    window.toggleMaintEdit = (t, i, state) => {
        const list = t === 'service' ? currentServices : (t === 'part' ? currentParts : currentLabor);
        if (list[i]) list[i].isEditing = state;
        renderMaintItems();
    };

    window.updateMaintItem = (t, i, f, v) => {
        const list = t === 'service' ? currentServices : (t === 'part' ? currentParts : currentLabor);
        if (list[i]) {
            list[i][f] = f === 'price' ? (parseNum(v) || 0) : v;
            const total = currentServices.reduce((s,x)=>s+(x.price||0),0) + currentParts.reduce((s,x)=>s+(x.price||0),0) + currentLabor.reduce((s,x)=>s+(x.price||0),0);
            document.getElementById('maint-total-price').textContent = `R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        }
    };

    window.removeMaintItem = (t, i) => {
        if (t === 'service') currentServices.splice(i,1);
        else if (t === 'part') currentParts.splice(i,1);
        else if (t === 'labor') currentLabor.splice(i,1);
        renderMaintItems();
    };

    document.getElementById('add-service-row')?.addEventListener('click', () => { currentServices.push({desc:'', price:0, isEditing: true}); renderMaintItems(); });
    document.getElementById('add-part-row')?.addEventListener('click', () => { currentParts.push({desc:'', price:0, isEditing: true}); renderMaintItems(); });
    document.getElementById('add-labor-row')?.addEventListener('click', () => { currentLabor.push({desc:'', price:0, isEditing: true}); renderMaintItems(); });

    document.getElementById('save-maintenance')?.addEventListener('click', async () => {
        const vId = document.getElementById('maint-vehicle-select').value;
        const vehicle = vehicles.find(v => v.id == vId);
        const km = parseNum(document.querySelector('#manutencao input[placeholder="0"]').value);
        const date = document.querySelector('#manutencao input[type="date"]').value;

        if (!vId) return showToast('Selecione um veículo.', 'warning');
        const total = currentServices.reduce((s,x)=>s+(x.price||0),0) + currentParts.reduce((s,x)=>s+(x.price||0),0) + currentLabor.reduce((s,x)=>s+(x.price||0),0);
        if (total === 0) return showToast('Adicione pelo menos um serviço, peça ou mão de obra com valor.', 'warning');

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            // Combine all descriptions
            const allDescs = [];
            currentServices.forEach(s => { if(s.desc) allDescs.push(s.desc); });
            currentParts.forEach(p => { if(p.desc) allDescs.push(p.desc); });
            currentLabor.forEach(l => { if(l.desc) allDescs.push(l.desc); });
            const serviceDesc = allDescs.length > 0 ? allDescs.join(', ') : 'Manutenção Geral';

            const payload = {
                veiculo_id: vId,
                servico: serviceDesc,
                data: date || new Date().toISOString().split('T')[0],
                custo: total,
                km_momento: km || 0,
                status: 'Concluído',
                user_id: user.id
            };

            if (editingActivityIndex !== null) {
                const activity = activities[editingActivityIndex];
                const { error } = await window.supabaseClient
                    .from('manutencoes')
                    .update(payload)
                    .eq('id', activity.id);
                if (error) throw error;
                editingActivityIndex = null;
            } else {
                const { error } = await window.supabaseClient
                    .from('manutencoes')
                    .insert([payload]);
                if (error) throw error;

                // Update vehicle KM
                if (km > (vehicle.km || 0)) {
                    await window.supabaseClient
                        .from('veiculos')
                        .update({ km_atual: km })
                        .eq('id', vId);
                }
            }
            
            await fetchInitialData();
            currentServices = []; currentParts = []; currentLabor = []; renderMaintItems();
            showToast('Registro de manutenção salvo com sucesso!', 'success');
            navigateTo('dashboard');
        } catch (error) {
            showToast('Erro ao salvar manutenção: ' + error.message, 'error');
        }
    });

    const maintTabs = document.getElementById('maint-tabs');
    if (maintTabs) {
        maintTabs.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                maintTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const servContainer = document.getElementById('services-table-container');
                const partsContainer = document.getElementById('parts-table-container');
                const laborContainer = document.getElementById('labor-table-container');

                if (servContainer) servContainer.style.display = tab === 'services' ? 'block' : 'none';
                if (partsContainer) partsContainer.style.display = tab === 'parts' ? 'block' : 'none';
                if (laborContainer) laborContainer.style.display = tab === 'labor' ? 'block' : 'none';
            });
        });
    }

    // Initial load
    document.getElementById('search-veiculos')?.addEventListener('input', (e) => renderVehicles(e.target.value));
    const dateInput = document.querySelector('#manutencao input[type="date"]');
    if (dateInput) dateInput.valueAsDate = new Date();

    // --- VIEW TOGGLE (Ativos / Inativos) ---
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentViewMode = btn.getAttribute('data-mode');
            renderVehicles(document.getElementById('search-veiculos')?.value || '');
            navigateTo('veiculos');
        });
    });


    
    window.updateVehicleSelect = () => {
        const s = document.getElementById('maint-vehicle-select');
        const fs = document.getElementById('filter-vehicle-select');
        if (!s) return;
        const options = '<option value="">Selecione um veículo</option>' + 
                      vehicles.map(v => `<option value="${v.id}">${v.model} - ${v.plate}</option>`).join('');
        s.innerHTML = options;
        if (fs) fs.innerHTML = '<option value="">Todos os Veículos</option>' + 
                             vehicles.map(v => `<option value="${v.plate}">${v.model} - ${v.plate}</option>`).join('');
    };

    // --- INTEGRACAO GEMINI OCR ---
    const geminiKeyModal = document.getElementById('gemini-key-modal');
    const processingOverlay = document.getElementById('processing-overlay');
    const processingStatus = document.getElementById('processing-status');
    const btnImportQuote = document.getElementById('btn-import-quote');
    const quoteFileInput = document.getElementById('quote-file-input');
    
    // UI Elements for Config Page
    const geminiKeyInput = document.getElementById('gemini-api-key');
    const btnSaveApiKey = document.getElementById('btn-save-api-key');
    const btnRemoveApiKey = document.getElementById('btn-remove-api-key');
    
    // UI Elements for Modal
    const modalKeyInput = document.getElementById('modal-gemini-key-input');
    const btnSaveModalKey = document.getElementById('btn-save-modal-key');

    // Load API Key from localStorage
    let geminiApiKey = localStorage.getItem('gemini_api_key') || '';

    // Initialize key inputs if key exists
    function initGeminiKeyUI() {
        if (geminiApiKey) {
            if (geminiKeyInput) geminiKeyInput.value = geminiApiKey;
            if (btnRemoveApiKey) btnRemoveApiKey.style.display = 'block';
            if (modalKeyInput) modalKeyInput.value = geminiApiKey;
        } else {
            if (geminiKeyInput) geminiKeyInput.value = '';
            if (btnRemoveApiKey) btnRemoveApiKey.style.display = 'none';
            if (modalKeyInput) modalKeyInput.value = '';
        }
    }
    initGeminiKeyUI();

    // Event listener for Save on Config page
    btnSaveApiKey?.addEventListener('click', () => {
        const key = geminiKeyInput.value.trim().replace(/^["']|["']$/g, '');
        if (!key) return showToast('Por favor, digite uma chave de API válida.', 'warning');
        geminiApiKey = key;
        localStorage.setItem('gemini_api_key', key);
        initGeminiKeyUI();
        showToast('Chave API do Gemini salva com sucesso!', 'success');
    });

    // Event listener for Clear on Config page
    btnRemoveApiKey?.addEventListener('click', async () => {
        const confirmed = await showConfirm('Remover Chave', 'Deseja remover a chave de API do Gemini salva neste navegador?');
        if (confirmed) {
            geminiApiKey = '';
            localStorage.removeItem('gemini_api_key');
            initGeminiKeyUI();
            showToast('Chave API removida com sucesso.', 'info');
        }
    });

    // Modal close listeners
    document.querySelectorAll('.close-gemini-modal').forEach(el => {
        el.addEventListener('click', () => {
            if (geminiKeyModal) geminiKeyModal.style.display = 'none';
        });
    });

    // Save key in Modal and open file selector
    btnSaveModalKey?.addEventListener('click', () => {
        const key = modalKeyInput.value.trim().replace(/^["']|["']$/g, '');
        if (!key) return showToast('Por favor, insira uma chave de API.', 'warning');
        geminiApiKey = key;
        localStorage.setItem('gemini_api_key', key);
        initGeminiKeyUI();
        if (geminiKeyModal) geminiKeyModal.style.display = 'none';
        showToast('Chave salva! Selecione a imagem do orçamento.', 'info');
        
        // Open file dialog immediately
        quoteFileInput.click();
    });

    // Click on "Ler Orçamento" button
    btnImportQuote?.addEventListener('click', () => {
        if (!geminiApiKey) {
            if (geminiKeyModal) geminiKeyModal.style.display = 'flex';
        } else {
            quoteFileInput.click();
        }
    });

    // File input change handler (Read Image)
    quoteFileInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Reset file input value so same file can be uploaded again
        quoteFileInput.value = '';

        try {
            // Show processing overlay
            if (processingOverlay) {
                processingStatus.textContent = 'Carregando imagem...';
                processingOverlay.style.display = 'flex';
            }

            // Convert to base64
            const base64Data = await fileToBase64(file);
            
            if (processingOverlay) {
                processingStatus.textContent = 'Enviando para o Gemini (IA)...';
            }

            // Request Gemini
            const result = await scanQuoteWithGemini(base64Data, file.type);
            
            // Populate form
            fillMaintenanceForm(result);
            
            if (processingOverlay) processingOverlay.style.display = 'none';
            showToast('Orçamento lido com sucesso! Dados preenchidos no formulário.', 'success');
        } catch (error) {
            if (processingOverlay) processingOverlay.style.display = 'none';
            console.error('Erro na leitura do orçamento:', error);
            showToast('Erro ao ler orçamento: ' + error.message, 'error');
        }
    });

    // Convert file to Base64 (promise based)
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    }

    // Call Gemini API
    async function scanQuoteWithGemini(base64Data, mimeType) {
        const prompt = `Você é um assistente especialista em ler imagens de orçamentos, notas fiscais, ou ordens de serviço de manutenção de veículos.
Analise a imagem fornecida e extraia as seguintes informações no formato JSON estruturado:
{
  "placa": "AAA0A00", // Placa do veículo se encontrada. Limpe formatações, mantenha apenas letras e números (máx 7/8 caracteres). Pode ser no padrão Mercosul (ex: ABC1D23) ou antigo brasileiro (ex: ABC1234).
  "km": 12345, // KM do veículo no momento da manutenção se encontrada. Apenas números inteiros. Se não encontrar, retorne null.
  "data": "YYYY-MM-DD", // Data do orçamento se encontrada. Formato ISO YYYY-MM-DD. Se não encontrar, retorne null.
  "servicos": [
    { "desc": "Nome do serviço realizado/mão de obra", "price": 123.45 }
  ],
  "pecas": [
    { "desc": "Nome da peça/componente trocado", "price": 12.34 }
  ]
}
Instruções importantes:
1. Diferencie claramente MÃO DE OBRA / SERVIÇOS de PEÇAS / PRODUTOS. Coloque cada um em sua respectiva lista.
2. Os preços devem ser números decimais (use ponto para separar os centavos).
3. Tente identificar a placa do veículo na imagem. Ela costuma estar rotulada como 'Placa', 'Veículo' ou próxima ao modelo.
4. Retorne APENAS o JSON válido. Não inclua markdown, tags \`\`\`json, ou explicações.`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType || 'image/jpeg',
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Erro HTTP ${response.status}`;
            throw new Error(`Falha na API do Gemini: ${errMsg}`);
        }

        const resData = await response.json();
        const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) {
            throw new Error('A API do Gemini não retornou um conteúdo válido.');
        }

        try {
            return JSON.parse(textResponse.trim());
        } catch (e) {
            console.error('Erro ao fazer parse do JSON do Gemini:', textResponse);
            throw new Error('A IA não retornou um JSON válido. Tente enviar outra foto mais legível.');
        }
    }

    // Auto fill form fields
    function fillMaintenanceForm(data) {
        if (!data) return;

        // 1. Vehicle Selection by Plate
        if (data.placa) {
            const cleanExtractPlate = data.placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            
            // Search in vehicles list
            const matchedVehicle = vehicles.find(v => {
                const cleanVPlate = v.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                return cleanVPlate === cleanExtractPlate || cleanVPlate.includes(cleanExtractPlate) || cleanExtractPlate.includes(cleanVPlate);
            });

            if (matchedVehicle) {
                document.getElementById('maint-vehicle-select').value = matchedVehicle.id;
            } else {
                console.warn(`Veículo com a placa ${data.placa} não encontrado no sistema.`);
            }
        }

        // 2. KM moment
        if (data.km) {
            const kmInput = document.querySelector('#manutencao input[placeholder="0"]');
            if (kmInput) kmInput.value = data.km;
        }

        // 3. Date
        if (data.data) {
            const dateInput = document.querySelector('#manutencao input[type="date"]');
            if (dateInput) dateInput.value = data.data;
        }

        // 4. Services
        if (Array.isArray(data.servicos)) {
            currentServices = data.servicos.map(s => ({
                desc: s.desc || 'Serviço Sem Nome',
                price: parseFloat(s.price) || 0,
                isEditing: false
            }));
        }

        // 5. Parts
        if (Array.isArray(data.pecas)) {
            currentParts = data.pecas.map(p => ({
                desc: p.desc || 'Peça Sem Nome',
                price: parseFloat(p.price) || 0,
                isEditing: false
            }));
        }

        // Re-render items in UI
        renderMaintItems();
    }

    checkAuthAndLoad();

    document.getElementById('btn-generate-pdf')?.addEventListener('click', () => {
        const vehiclePlate = document.getElementById('filter-vehicle-select').value;
        const start = document.getElementById('filter-start-date').value;
        const end = document.getElementById('filter-end-date').value;

        let filtered = [...activities];

        if (vehiclePlate) {
            filtered = filtered.filter(a => a.plate === vehiclePlate);
        }

        if (start) {
            const startDate = new Date(start);
            filtered = filtered.filter(a => {
                const parts = a.date.split('/');
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) >= startDate;
            });
        }

        if (end) {
            const endDate = new Date(end);
            filtered = filtered.filter(a => {
                const parts = a.date.split('/');
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) <= endDate;
            });
        }

        if (filtered.length === 0) return alert('Nenhum dado encontrado para os filtros selecionados.');

        generatePDF(filtered);
    });

    function generatePDF(data) {
        const printWindow = window.open('', '_blank');
        const total = data.reduce((s, a) => s + a.cost, 0);

        let html = `
            <html>
            <head>
                <title>Relatório de Manutenções - FROTA STRSAT</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                    h1 { color: #1e293b; margin: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f1f5f9; text-align: left; padding: 12px; border: 1px solid #e2e8f0; }
                    td { padding: 12px; border: 1px solid #e2e8f0; }
                    .footer { margin-top: 30px; text-align: right; font-size: 1.2rem; font-weight: bold; }
                    .date { font-size: 0.9rem; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Relatório de Manutenções</h1>
                    <p class="date">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Veículo</th>
                            <th>Placa</th>
                            <th>Serviço</th>
                            <th>Data</th>
                            <th>Custo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(a => `
                            <tr>
                                <td>${a.vehicle}</td>
                                <td>${a.plate}</td>
                                <td>${a.service}</td>
                                <td>${a.date}</td>
                                <td>R$ ${a.cost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    Total Geral: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    }

    function updateCharts() {
        const costsCtx = document.getElementById('costsChart');
        const typeCtx = document.getElementById('typeChart');
        if (!costsCtx || !typeCtx) return;

        const monthly = new Array(12).fill(0);
        const typeTotals = { 'Peças': 0, 'Serviços': 0, 'Outros': 0 };

        activities.forEach(a => {
            if (a.date) {
                const parts = a.date.split('/');
                if (parts.length === 3) {
                    const monthIndex = parseInt(parts[1]) - 1;
                    if (monthIndex >= 0 && monthIndex < 12) {
                        monthly[monthIndex] += (parseFloat(a.cost) || 0);
                    }
                }
            }

            const service = (a.service || '').toLowerCase();
            const cost = parseFloat(a.cost) || 0;
            if (service.includes('peça') || service.includes('filtro') || service.includes('pneu') || service.includes('oleo') || service.includes('óleo')) {
                typeTotals['Peças'] += cost;
            } else if (service.includes('mão') || service.includes('troca') || service.includes('alinhamento') || service.includes('revisão') || service.includes('revisao')) {
                typeTotals['Serviços'] += cost;
            } else {
                typeTotals['Outros'] += cost;
            }
        });

        if (costsChart) costsChart.destroy();
        costsChart = new Chart(costsCtx, {
            type: 'bar',
            data: { 
                labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], 
                datasets: [{ 
                    label:'Custos R$', 
                    data: monthly, 
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 4
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => `R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` } }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { color: '#64748b', callback: (v) => 'R$ ' + v.toLocaleString() }
                    },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                } 
            }
        });

        if (typeChart) typeChart.destroy();
        const hasData = Object.values(typeTotals).some(v => v > 0);
        typeChart = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: hasData ? Object.keys(typeTotals) : ['Sem dados'],
                datasets: [{
                    data: hasData ? Object.values(typeTotals) : [1],
                    backgroundColor: hasData ? ['#3b82f6', '#10b981', '#f59e0b'] : ['#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: hasData ? 10 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#475569', padding: 15, font: { size: 11, family: 'Plus Jakarta Sans' } } } },
                cutout: '70%'
            }
        });
    }

    function updateGuinchoCharts() {
        const costsCtx = document.getElementById('guinchoCostsChart');
        const typeCtx = document.getElementById('guinchoTypeChart');
        if (!costsCtx || !typeCtx) return;

        const monthly = new Array(12).fill(0);
        let totalFinalizado = 0, totalAndamento = 0;

        guinchoServices.forEach(s => {
            if (s.data_inicio) {
                const d = new Date(s.data_inicio);
                const month = d.getMonth();
                monthly[month] += parseFloat(s.valor_cobrado) || 0;
            }
            if (s.status === 'Finalizado') totalFinalizado += parseFloat(s.valor_cobrado) || 0;
            else totalAndamento += parseFloat(s.valor_cobrado) || 0;
        });

        if (guinchoCostsChart) guinchoCostsChart.destroy();
        guinchoCostsChart = new Chart(costsCtx, {
            type: 'bar',
            data: {
                labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
                datasets: [{
                    label:'Faturamento R$',
                    data: monthly,
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => `R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { color: '#64748b', callback: (v) => 'R$ ' + v.toLocaleString() }
                    },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });

        if (guinchoTypeChart) guinchoTypeChart.destroy();
        const hasData = totalFinalizado > 0 || totalAndamento > 0;
        guinchoTypeChart = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: hasData ? ['Finalizados', 'Em Andamento'] : ['Sem dados'],
                datasets: [{
                    data: hasData ? [totalFinalizado, totalAndamento] : [1],
                    backgroundColor: hasData ? ['#10b981', '#f59e0b'] : ['#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: hasData ? 10 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#475569', padding: 15, font: { size: 11, family: 'Plus Jakarta Sans' } } } },
                cutout: '70%'
            }
        });
    }

    window.showVehicleDetails = (v) => {
        if (!v) return;
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        document.getElementById('detalhes-veiculo').classList.add('active');
        document.getElementById('view-title').textContent = 'Detalhes do Veículo';

        document.getElementById('detail-model').textContent = v.model;
        document.getElementById('detail-brand').textContent = `${v.brand} • ${v.year} • ${v.color} • Chassi: ${v.chassi}`;
        document.querySelector('.plate-badge').textContent = v.plate;
        document.getElementById('detail-km').textContent = `${fmtKm(v.km)} km`;

        const history = document.getElementById('vehicle-history');
        const hData = v.history || [];
        if (hData.length === 0) {
            history.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-secondary)">Nenhum registro de manutenção encontrado para este veículo.</p>';
        } else {
            const total = hData.reduce((s, h) => s + (h.cost || 0), 0);
            history.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;border-bottom:1px solid var(--border-color);margin-bottom:1rem">
                    <span style="font-weight:600">${hData.length} registro(s)</span>
                    <span style="font-weight:700;color:var(--accent-color)">Total gasto: R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                </div>
                <table style="width:100%;border-collapse:collapse">
                    <thead><tr style="border-bottom:1px solid var(--border-color)">
                        <th style="text-align:left;padding:0.5rem">Data</th>
                        <th style="text-align:left;padding:0.5rem">Serviço</th>
                        <th style="text-align:left;padding:0.5rem">KM</th>
                        <th style="text-align:right;padding:0.5rem">Custo</th>
                    </tr></thead>
                    <tbody>${hData.map(h => `
                        <tr style="border-bottom:1px solid var(--border-color)">
                            <td style="padding:0.5rem;white-space:nowrap">${h.date}</td>
                            <td style="padding:0.5rem">${h.service}</td>
                            <td style="padding:0.5rem">${h.km ? fmtKm(h.km) + ' km' : '---'}</td>
                            <td style="padding:0.5rem;text-align:right;font-weight:600">R$ ${h.cost.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
        }
        if (window.lucide) lucide.createIcons();
    }

    // --- ASTRANSAT LOCATION INTEGRATION ---
    let astransatToken = null;
    let astransatTokenExpiry = 0;

    async function getAstransatToken() {
        if (astransatToken && Date.now() < astransatTokenExpiry) return astransatToken;
        try {
            const res = await fetch('https://posicoesgetrak.astransat.com.br/auth/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa('warreco.sat:123456'),
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error('Falha na autenticação da Astransat');
            const data = await res.json();
            astransatToken = data.token;
            astransatTokenExpiry = Date.now() + ((data.expires_in - 60) * 1000); // 1 minute buffer
            return astransatToken;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    window.openLocationModal = async (plate, apelido) => {
        const modal = document.getElementById('location-modal');
        const loading = document.getElementById('location-loading');
        const dataContainer = document.getElementById('location-data');
        
        if (!modal) return;
        
        modal.style.display = 'flex';
        loading.style.display = 'flex';
        dataContainer.style.display = 'none';

        document.getElementById('loc-placa').textContent = plate;
        try {
            const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            let result = null;

            // 1. Tentar proxy serverless na Vercel (protegendo credenciais)
            try {
                const proxyRes = await fetch(`/api/telemetria?placa=${cleanPlate}`);
                if (proxyRes.ok) {
                    result = await proxyRes.json();
                }
            } catch (e) {
                // Fallback para chamada direta
            }

            // 2. Fallback direto se o proxy não estiver disponível (ex: teste local offline)
            if (!result) {
                const token = await getAstransatToken();
                if (!token) {
                    loading.innerHTML = '<p class="text-danger" style="margin-top: 1rem;">Erro de autenticação com o satélite.</p>';
                    return;
                }
                const res = await fetch(`https://posicoesgetrak.astransat.com.br/localizacao/${cleanPlate}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Não foi possível obter a localização');
                result = await res.json();
            }

            const arrayData = result.dados || result.veiculos;
            
            if (!arrayData || arrayData.length === 0) {
                loading.innerHTML = `<p class="text-danger" style="margin-top: 1rem;">Nenhuma localização encontrada para a placa <b>${cleanPlate}</b>.</p><p style="color: var(--text-secondary); font-size: 0.85rem; text-align: center; margin-top: 0.5rem;">O rastreador pode estar inativo, ou o veículo não está registrado no painel da Astransat.</p>`;
                return;
            }

            const loc = arrayData[0];
            
            document.getElementById('loc-veiculo').textContent = loc.veiculo || `${loc.marca} ${loc.modelo}`;
            const addressEl = document.getElementById('loc-endereco');
            if (loc.endereco) {
                addressEl.textContent = loc.endereco;
            } else if (loc.lat && (loc.lng || loc.lon)) {
                addressEl.textContent = 'Traduzindo coordenadas...';
                const longitude = loc.lng || loc.lon;
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${longitude}`)
                    .then(r => r.json())
                    .then(d => {
                        addressEl.textContent = d.display_name || 'Endereço não localizado pelo satélite';
                    })
                    .catch(() => {
                        addressEl.textContent = 'Coordenadas recebidas, falha ao traduzir endereço';
                    });
            } else {
                addressEl.textContent = 'Endereço Indisponível';
            }
            document.getElementById('loc-vel').textContent = `${loc.vel || 0} km/h`;
            document.getElementById('loc-hodo').textContent = `${(loc.hodometro || 0).toLocaleString()} km`;
            
            const gpsDate = loc.gps || loc.data;
            document.getElementById('loc-gps').textContent = gpsDate ? new Date(gpsDate).toLocaleString('pt-BR') : '--';
            
            const ign = document.getElementById('loc-ign');
            const ignDot = document.getElementById('loc-ign-dot');
            const ignValue = loc.ign !== undefined ? loc.ign.toString() : (loc.lig !== undefined ? loc.lig.toString() : '0');
            if (ignValue === '1') {
                ign.textContent = 'Ligada';
                ign.style.color = '#10b981';
                ignDot.style.background = '#10b981';
                ignDot.style.boxShadow = '0 0 10px #10b981';
            } else {
                ign.textContent = 'Desligada';
                ign.style.color = '#ef4444';
                ignDot.style.background = '#ef4444';
                ignDot.style.boxShadow = 'none';
            }

            const mapsBtn = document.getElementById('loc-maps-btn');
            const mapLat = loc.lat;
            const mapLon = loc.lng || loc.lon;
            if (mapLat && mapLon) {
                mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLon}`;
            }
            
            loading.style.display = 'none';
            dataContainer.style.display = 'block';

        } catch (error) {
            console.error(error);
            loading.innerHTML = '<p class="text-danger" style="margin-top: 1rem;">Erro ao buscar dados do satélite.</p>';
        }
    };

    document.querySelector('.close-location-modal')?.addEventListener('click', () => {
        document.getElementById('location-modal').style.display = 'none';
        const loading = document.getElementById('location-loading');
        if (loading) loading.innerHTML = '<i data-lucide="loader-2" class="spin-icon" style="animation: spin 1s linear infinite; width: 40px; height: 40px; margin-bottom: 1rem; color: var(--accent-color);"></i><p>Buscando comunicação com o satélite...</p>';
    });

    // ======================== LAVAGENS MODULE ========================
    let lavagensList = [];
    let lavagemEditingId = null;
    let lavagemSortField = 'data';
    let lavagemSortAsc = false;

    async function fetchLavagensData() {
        try {
            const { data, error } = await window.supabaseClient
                .from('lavagens')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            lavagensList = data || [];
            renderLavagensTable();
            updateLavagensStats();
        } catch (error) {
            console.error('Erro ao carregar lavagens:', error.message);
        }
    }

    function updateLavagensStats() {
        const now = new Date();
        const monthItems = lavagensList.filter(l => {
            const d = new Date(l.data);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const pagas = monthItems.filter(l => l.status === 'Pago').length;
        const pendentes = monthItems.filter(l => l.status === 'Pendente').length;
        const valorMes = monthItems.reduce((s, l) => s + (parseNum(l.valor) || 0), 0);

        // Aba Lavagens (Módulo)
        const elMes = document.getElementById('stat-lavagens-mes');
        if (elMes) elMes.textContent = monthItems.length;
        const elPagas = document.getElementById('stat-lavagens-pagas');
        if (elPagas) elPagas.textContent = pagas;
        const elPend = document.getElementById('stat-lavagens-pendentes');
        if (elPend) elPend.textContent = pendentes;
        const elVal = document.getElementById('stat-lavagens-valor');
        if (elVal) elVal.textContent = `R$ ${valorMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        // Dashboard (Aba Lavagens)
        const dTotal = document.getElementById('stat-dash-lavagens-total');
        if (dTotal) dTotal.textContent = monthItems.length;
        const dPagas = document.getElementById('stat-dash-lavagens-pagas');
        if (dPagas) dPagas.textContent = pagas;
        const dPend = document.getElementById('stat-dash-lavagens-pendentes');
        if (dPend) dPend.textContent = pendentes;
        const dVal = document.getElementById('stat-dash-lavagens-valor');
        if (dVal) dVal.textContent = `R$ ${valorMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        renderRecentDashLavagens();
        updateDashLavagensCharts();
    }

    function renderRecentDashLavagens() {
        const tbody = document.getElementById('recent-dash-lavagens');
        if (!tbody) return;

        const recent = [...lavagensList]
            .sort((a, b) => new Date(b.data || b.created_at) - new Date(a.data || a.created_at))
            .slice(0, 8);

        tbody.innerHTML = recent.length === 0
            ? '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:var(--text-secondary)">Nenhuma lavagem registrada até o momento.</td></tr>'
            : '';

        recent.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space:nowrap">${l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '---'}</td>
                <td style="font-weight:700;color:var(--primary)">${l.placa || '---'}</td>
                <td>${l.veiculo || '---'}</td>
                <td><span class="badge" style="background:rgba(59,130,246,0.15);color:var(--accent-color)">${l.tipo_lavagem || '---'}</span></td>
                <td style="font-weight:700;color:var(--success)">R$ ${(parseNum(l.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td><span class="badge ${l.status === 'Pago' ? 'badge-active' : 'badge-maintenance'}">${l.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
        if (window.lucide) lucide.createIcons();
    }

    function updateDashLavagensCharts() {
        const costsCtx = document.getElementById('dashLavagensCostsChart');
        const typeCtx = document.getElementById('dashLavagensTypeChart');
        if (!costsCtx || !typeCtx) return;

        const monthly = new Array(12).fill(0);
        const typeCounts = {
            'Simples': 0,
            'Completa': 0,
            'Detalhamento': 0,
            'Lavagem de Motor': 0
        };

        lavagensList.forEach(l => {
            if (l.data) {
                const d = new Date(l.data);
                const month = d.getMonth();
                monthly[month] += (parseNum(l.valor) || 0);
            }
            const t = l.tipo_lavagem;
            if (typeCounts.hasOwnProperty(t)) {
                typeCounts[t] += (parseNum(l.valor) || 0);
            }
        });

        if (dashLavagensCostsChart) dashLavagensCostsChart.destroy();
        dashLavagensCostsChart = new Chart(costsCtx, {
            type: 'bar',
            data: {
                labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
                datasets: [{
                    label: 'Faturamento R$',
                    data: monthly,
                    backgroundColor: 'rgba(6, 182, 212, 0.6)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => `R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { color: '#64748b', callback: (v) => 'R$ ' + v.toLocaleString() }
                    },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });

        if (dashLavagensTypeChart) dashLavagensTypeChart.destroy();
        const totalTypes = Object.values(typeCounts).reduce((a, b) => a + b, 0);
        const hasData = totalTypes > 0;

        dashLavagensTypeChart = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: hasData ? Object.keys(typeCounts) : ['Sem dados'],
                datasets: [{
                    data: hasData ? Object.values(typeCounts) : [1],
                    backgroundColor: hasData ? ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'] : ['#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: hasData ? 8 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#475569', font: { family: 'Plus Jakarta Sans' } } }
                },
                cutout: '68%'
            }
        });
    }

    function getFilteredLavagens() {
        const placa = (document.getElementById('filter-lavagens-placa').value || '').toUpperCase();
        const veiculo = (document.getElementById('filter-lavagens-veiculo').value || '').toLowerCase();
        const tipo = document.getElementById('filter-lavagens-tipo').value;
        const status = document.getElementById('filter-lavagens-status').value;
        const data = document.getElementById('filter-lavagens-data').value;
        const search = (document.getElementById('search-lavagens').value || '').toLowerCase();

        return lavagensList.filter(l => {
            if (placa && !l.placa.toUpperCase().includes(placa)) return false;
            if (veiculo && (!l.veiculo || !l.veiculo.toLowerCase().includes(veiculo))) return false;
            if (tipo && l.tipo_lavagem !== tipo) return false;
            if (status && l.status !== status) return false;
            if (search && !l.placa.toLowerCase().includes(search) && (!l.veiculo || !l.veiculo.toLowerCase().includes(search))) return false;
            if (data && l.data && l.data.slice(0, 10) !== data) return false;
            return true;
        });
    }

    window.sortLavagens = (field) => {
        if (lavagemSortField === field) lavagemSortAsc = !lavagemSortAsc;
        else { lavagemSortField = field; lavagemSortAsc = true; }
        renderLavagensTable();
    };

    function renderLavagensTable() {
        const tbody = document.getElementById('lavagens-list');
        if (!tbody) return;

        const filtered = getFilteredLavagens();
        const sorted = [...filtered].sort((a, b) => {
            let va = a[lavagemSortField] || '';
            let vb = b[lavagemSortField] || '';
            if (lavagemSortField === 'data' || lavagemSortField === 'created_at') {
                va = new Date(va).getTime();
                vb = new Date(vb).getTime();
            } else if (lavagemSortField === 'valor') {
                va = parseNum(va) || 0;
                vb = parseNum(vb) || 0;
            }
            return lavagemSortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
        });

        tbody.innerHTML = sorted.length === 0
            ? '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary)">Nenhuma lavagem encontrada.</td></tr>'
            : '';

        sorted.forEach(l => {
            const tr = document.createElement('tr');
            const isPago = l.status === 'Pago';
            tr.innerHTML = `
                <td style="white-space:nowrap">${l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '---'}</td>
                <td style="font-weight:700;color:var(--primary)">${l.placa}</td>
                <td>${l.veiculo || '---'}</td>
                <td>${l.tipo_lavagem || '---'}</td>
                <td>${l.forma_pagamento || '---'}</td>
                <td style="font-weight:700;color:var(--success)">R$ ${(parseNum(l.valor) || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                <td><span class="badge ${isPago ? 'badge-active' : 'badge-maintenance'}" style="cursor:pointer" onclick="toggleStatusLavagem('${l.id}')" title="Clique para alternar">${l.status}</span></td>
                <td>
                    <div style="display:flex;gap:0.3rem">
                        <button class="btn-icon" title="Editar" onclick="editarLavagem('${l.id}')"><i data-lucide="edit-2" class="text-primary"></i></button>
                        <button class="btn-icon" title="Excluir" onclick="excluirLavagem('${l.id}')"><i data-lucide="trash-2" class="text-danger"></i></button>
                        <button class="btn btn-sm btn-back" title="Visualizar" onclick="verDetalhesLavagem('${l.id}')" style="padding:0.25rem 0.6rem;font-size:0.75rem;gap:0.3rem">
                            <i data-lucide="eye" style="width:14px;height:14px"></i> Visualizar
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        if (window.lucide) lucide.createIcons();
    }

    function openLavagemModal(lavagem = null) {
        lavagemEditingId = lavagem ? lavagem.id : null;
        document.getElementById('lavagem-modal-title').textContent = lavagem ? 'Editar Lavagem' : 'Nova Lavagem';
        document.getElementById('btn-salvar-lavagem').textContent = lavagem ? 'Salvar Alterações' : 'Salvar Lavagem';
        document.getElementById('lavagem-form').reset();

        if (lavagem) {
            document.getElementById('lavagem-placa').value = lavagem.placa || '';
            document.getElementById('lavagem-veiculo').value = lavagem.veiculo || '';
            document.getElementById('lavagem-tipo').value = lavagem.tipo_lavagem || 'Simples';
            document.getElementById('lavagem-valor').value = (lavagem.valor != null && lavagem.valor !== '' && !isNaN(parseNum(lavagem.valor))) ? (parseNum(lavagem.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})) : '';
            document.getElementById('lavagem-pagamento').value = lavagem.forma_pagamento || 'Dinheiro';
            document.getElementById('lavagem-responsavel').value = lavagem.responsavel || '';
            document.getElementById('lavagem-status').value = lavagem.status || 'Pago';
            document.getElementById('lavagem-observacoes').value = lavagem.observacoes || '';
            if (lavagem.data) {
                const d = new Date(lavagem.data);
                document.getElementById('lavagem-data').value = d.toISOString().slice(0, 10);
            }
        } else {
            document.getElementById('lavagem-data').value = new Date().toISOString().slice(0, 10);
            document.getElementById('lavagem-status').value = 'Pago';
        }

        document.getElementById('lavagem-modal').style.display = 'flex';
    }

    window.editarLavagem = (id) => {
        const lv = lavagensList.find(l => l.id === id);
        if (lv) openLavagemModal(lv);
    };

    window.verDetalhesLavagem = (id) => {
        const l = lavagensList.find(x => x.id === id);
        if (!l) return;
        alert(
            `Lavagem - ${l.placa}${l.veiculo ? ' (' + l.veiculo + ')' : ''}\n\n` +
            `Data: ${l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '---'}\n` +
            `Tipo: ${l.tipo_lavagem || '---'}\n` +
            `Valor: R$ ${(parseNum(l.valor) || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}\n` +
            `Pagamento: ${l.forma_pagamento || '---'}\n` +
            `Responsável: ${l.responsavel || '---'}\n` +
            `Status: ${l.status}\n` +
            (l.observacoes ? `\nObservações:\n${l.observacoes}` : '')
        );
    };

    window.toggleStatusLavagem = async (id) => {
        const l = lavagensList.find(x => x.id === id);
        if (!l) return;
        const novo = l.status === 'Pago' ? 'Pendente' : 'Pago';
        const confirmed = await showConfirm('Alterar Status', `Deseja alterar o status de pagamento desta lavagem para "${novo}"?`);
        if (!confirmed) return;
        try {
            const { error } = await window.supabaseClient
                .from('lavagens')
                .update({ status: novo })
                .eq('id', id);
            if (error) throw error;
            showToast(`Status alterado para "${novo}".`, 'success');
            await fetchLavagensData();
        } catch (error) {
            showToast('Erro ao atualizar status: ' + error.message, 'error');
        }
    };

    window.excluirLavagem = async (id) => {
        const confirmed = await showConfirm('Excluir Lavagem', 'Deseja excluir permanentemente este registro de lavagem?');
        if (!confirmed) return;
        try {
            const { error } = await window.supabaseClient
                .from('lavagens')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast('Lavagem excluída com sucesso!', 'success');
            await fetchLavagensData();
        } catch (error) {
            showToast('Erro ao excluir: ' + error.message, 'error');
        }
    };

    window.gerarPDFLavagens = () => {
        const filtered = getFilteredLavagens();
        if (filtered.length === 0) return showToast('Nenhuma lavagem encontrada para gerar PDF.', 'warning');

        const pagas = filtered.filter(l => l.status === 'Pago').length;
        const pendentes = filtered.filter(l => l.status === 'Pendente').length;
        const valorTotal = filtered.reduce((s, l) => s + (parseNum(l.valor) || 0), 0);

        const printWin = window.open('', '_blank');
        let html = `
            <html><head><title>Relatório de Lavagens - FROTA STRSAT</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                h1 { color: #1e293b; margin: 0; font-size: 1.5rem; }
                .logo { font-size: 2rem; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f1f5f9; text-align: left; padding: 10px; border: 1px solid #e2e8f0; font-size: 0.85rem; }
                td { padding: 10px; border: 1px solid #e2e8f0; font-size: 0.85rem; }
                .footer { margin-top: 30px; text-align: right; font-size: 1.1rem; font-weight: bold; }
                .date { font-size: 0.85rem; color: #64748b; }
                .resumo { display: flex; gap: 20px; margin-bottom: 20px; }
                .resumo-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; flex: 1; text-align: center; }
                .resumo-item strong { display: block; font-size: 1.3rem; color: #1e293b; }
            </style>
            </head><body>
            <div class="header">
                <h1>FROTA STRSAT - Relatório de Lavagens</h1>
                <p class="date">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <div class="resumo">
                <div class="resumo-item">Total Lavagens<strong>${filtered.length}</strong></div>
                <div class="resumo-item">Pagas<strong>${pagas}</strong></div>
                <div class="resumo-item">Pendentes<strong>${pendentes}</strong></div>
                <div class="resumo-item">Valor Total<strong>R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong></div>
            </div>
            <table>
                <thead><tr><th>Data</th><th>Placa</th><th>Veículo</th><th>Tipo</th><th>Pagamento</th><th>Valor</th><th>Status</th><th>Responsável</th></tr></thead>
                <tbody>${filtered.map(l => `<tr>
                    <td>${l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '---'}</td>
                    <td><b>${l.placa}</b></td>
                    <td>${l.veiculo || '---'}</td>
                    <td>${l.tipo_lavagem}</td>
                    <td>${l.forma_pagamento || '---'}</td>
                    <td>R$ ${(parseNum(l.valor) || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                    <td>${l.status}</td>
                    <td>${l.responsavel || '---'}</td>
                </tr>`).join('')}</tbody>
            </table>
            <div class="footer"><p>Relatório gerado automaticamente - FROTA STRSAT &copy; ${new Date().getFullYear()}</p></div>
            <script>window.print();<\/script></body></html>
        `;
        printWin.document.write(html);
        printWin.document.close();
    };

    // === Lavagens Event Listeners ===
    document.getElementById('btn-novo-lavagem')?.addEventListener('click', () => openLavagemModal());
    document.querySelectorAll('.close-lavagem-modal').forEach(el => {
        el.addEventListener('click', () => {
            document.getElementById('lavagem-modal').style.display = 'none';
        });
    });

    document.getElementById('lavagem-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const placa = document.getElementById('lavagem-placa').value.toUpperCase().trim();
        if (!placa) return showToast('Informe a placa do veículo.', 'warning');

        const payload = {
            placa,
            veiculo: document.getElementById('lavagem-veiculo').value.trim(),
            tipo_lavagem: document.getElementById('lavagem-tipo').value,
            valor: parseNum(document.getElementById('lavagem-valor').value) || 0,
            forma_pagamento: document.getElementById('lavagem-pagamento').value,
            data: document.getElementById('lavagem-data').value,
            responsavel: document.getElementById('lavagem-responsavel').value.trim(),
            status: document.getElementById('lavagem-status').value,
            observacoes: document.getElementById('lavagem-observacoes').value.trim(),
            user_id: user?.id
        };

        try {
            if (lavagemEditingId) {
                const { error } = await window.supabaseClient
                    .from('lavagens')
                    .update(payload)
                    .eq('id', lavagemEditingId);
                if (error) throw error;
                showToast('Lavagem atualizada com sucesso!', 'success');
            } else {
                const { error } = await window.supabaseClient
                    .from('lavagens')
                    .insert([payload]);
                if (error) throw error;
                showToast('Lavagem registrada com sucesso!', 'success');
            }
            document.getElementById('lavagem-modal').style.display = 'none';
            await fetchLavagensData();
        } catch (error) {
            showToast('Erro ao salvar lavagem: ' + error.message, 'error');
        }
    });

    document.getElementById('btn-pdf-lavagens')?.addEventListener('click', gerarPDFLavagens);
    document.getElementById('btn-filtrar-lavagens')?.addEventListener('click', renderLavagensTable);
    document.getElementById('btn-limpar-filtros-lavagens')?.addEventListener('click', () => {
        document.getElementById('filter-lavagens-placa').value = '';
        document.getElementById('filter-lavagens-veiculo').value = '';
        document.getElementById('filter-lavagens-tipo').value = '';
        document.getElementById('filter-lavagens-status').value = '';
        document.getElementById('filter-lavagens-data').value = '';
        document.getElementById('search-lavagens').value = '';
        renderLavagensTable();
    });
    document.getElementById('btn-atualizar-lavagens')?.addEventListener('click', fetchLavagensData);
    document.getElementById('search-lavagens')?.addEventListener('input', renderLavagensTable);

    // Load Lavagens data when navigating to lavagens view
    document.querySelector('[data-view="lavagens"]')?.addEventListener('click', () => {
        setTimeout(fetchLavagensData, 100);
    });

    // ======================== GUINCHO MODULE ========================
    let guinchoServices = [];
    let guinchoEditingId = null;
    let guinchoSortField = 'data_inicio';
    let guinchoSortAsc = false;

    window.setGuinchoKMMode = (mode) => {
        document.getElementById('guincho-km-mode-manual').classList.toggle('active', mode === 'manual');
        document.getElementById('guincho-km-mode-gps').classList.toggle('active', mode === 'gps');
        document.getElementById('guincho-km-manual').style.display = mode === 'manual' ? 'block' : 'none';
        document.getElementById('guincho-km-gps').style.display = mode === 'gps' ? 'block' : 'none';
    };

    window.calcGuinchoKM = () => {
        const ini = parseNum(document.getElementById('guincho-km-inicial').value) || 0;
        const fin = parseNum(document.getElementById('guincho-km-final').value) || 0;
        const diff = fin >= ini ? (fin - ini) : 0;
        document.getElementById('guincho-km-percorrido').value = isNaN(diff) ? '' : fmtKm(diff);
    };

    async function fetchGuinchoData() {
        try {
            const { data, error } = await window.supabaseClient
                .from('servicos_guincho')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            guinchoServices = data || [];

            // Auto-inserir registros do mês de Agosto para os guinchos QRD9G90 e FCF5J84 se não existirem
            const user = (await window.supabaseClient.auth.getUser()).data?.user;
            if (user) {
                const augustRecords = [
                    // Guinchos Agosto QRD9G90
                    {
                        placa: 'QRD9G90', motorista: 'William Arreco',
                        km_inicial: 140200, km_final: 140420, km_percorrido: 220,
                        valor_cobrado: 1850.00, status: 'Finalizado',
                        data_inicio: '2026-08-08T09:30:00.000Z', data_fim: '2026-08-08T12:00:00.000Z',
                        observacoes: 'Atendimento Socorro Rodoviário BR-101 (Guincho Extra Pesado - Agosto 2026)',
                        user_id: user.id
                    },
                    {
                        placa: 'QRD9G90', motorista: 'William Arreco',
                        km_inicial: 141050, km_final: 141190, km_percorrido: 140,
                        valor_cobrado: 1200.00, status: 'Finalizado',
                        data_inicio: '2026-08-19T14:15:00.000Z', data_fim: '2026-08-19T16:30:00.000Z',
                        observacoes: 'Reboque por Pane Mecânica (Guincho Pesado - Agosto 2026)',
                        user_id: user.id
                    },
                    {
                        placa: 'QRD9G90', motorista: 'William Arreco',
                        km_inicial: 141800, km_final: 141910, km_percorrido: 110,
                        valor_cobrado: 950.00, status: 'Finalizado',
                        data_inicio: '2026-08-27T16:00:00.000Z', data_fim: '2026-08-27T18:00:00.000Z',
                        observacoes: 'Remoção de Veículo em Rodovia (Guincho Pesado - Agosto 2026)',
                        user_id: user.id
                    },
                    // Guinchos Agosto FCF5J84
                    {
                        placa: 'FCF5J84', motorista: 'Carlos Eduardo',
                        km_inicial: 96100, km_final: 96165, km_percorrido: 65,
                        valor_cobrado: 420.00, status: 'Finalizado',
                        data_inicio: '2026-08-04T10:00:00.000Z', data_fim: '2026-08-04T11:30:00.000Z',
                        observacoes: 'Reboque Segurado Pane Elétrica (Guincho Leve - Agosto 2026)',
                        user_id: user.id
                    },
                    {
                        placa: 'FCF5J84', motorista: 'Carlos Eduardo',
                        km_inicial: 96850, km_final: 96930, km_percorrido: 80,
                        valor_cobrado: 520.00, status: 'Finalizado',
                        data_inicio: '2026-08-14T11:30:00.000Z', data_fim: '2026-08-14T13:00:00.000Z',
                        observacoes: 'Reboque Utilitário Socorro (Agosto 2026)',
                        user_id: user.id
                    },
                    {
                        placa: 'FCF5J84', motorista: 'Carlos Eduardo',
                        km_inicial: 97400, km_final: 97495, km_percorrido: 95,
                        valor_cobrado: 680.00, status: 'Finalizado',
                        data_inicio: '2026-08-25T15:45:00.000Z', data_fim: '2026-08-25T17:15:00.000Z',
                        observacoes: 'Remoção Preventiva de Veículo (Agosto 2026)',
                        user_id: user.id
                    }
                ];

                let insertedAny = false;
                for (const rec of augustRecords) {
                    const exists = guinchoServices.some(s => (s.placa || '').toUpperCase() === rec.placa && new Date(s.data_inicio).toISOString().slice(0,10) === rec.data_inicio.slice(0,10));
                    if (!exists) {
                        await window.supabaseClient.from('servicos_guincho').insert([rec]);
                        insertedAny = true;
                    }
                }
                if (insertedAny) {
                    const { data: refreshed } = await window.supabaseClient.from('servicos_guincho').select('*').order('created_at', { ascending: false });
                    if (refreshed) guinchoServices = refreshed;
                }
            }

            renderGuinchoTable();
            updateGuinchoStats();

            // Auto-sincronizar socorros finalizados do prestador ASTRANLOG (Instant Aid Flow)
            if (typeof window.syncAstranlogSocorros === 'function') {
                window.syncAstranlogSocorros({ silent: true });
            }
        } catch (error) {
            console.error('Erro ao carregar guincho:', error.message);
        }
    }

    // === AUTO-SYNC PRESTADOR ASTRANLOG (INSTANT AID FLOW) ===
    const ASTRANLOG_CONFIG = {
        url: 'https://syhdieqibyhlljahmrjp.supabase.co',
        key: 'sb_publishable_OhZEQUt3cwUQ4wPMUBaonA_dJa07dci',
        email: 'william.arreco@grupoastran.com.br',
        password: 'Will@2026',
        targetPrestador: 'astranlog',
        allowedPlates: ['QRD9G90', 'FCF5J84']
    };

    let astranlogTokenCache = null;
    let astranlogTokenExpiry = 0;

    async function getAstranlogAuthToken() {
        if (astranlogTokenCache && Date.now() < astranlogTokenExpiry) {
            return astranlogTokenCache;
        }
        const res = await fetch(`${ASTRANLOG_CONFIG.url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': ASTRANLOG_CONFIG.key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: ASTRANLOG_CONFIG.email,
                password: ASTRANLOG_CONFIG.password
            })
        });
        if (!res.ok) {
            throw new Error(`Erro na autenticação Instant Aid Flow (${res.status})`);
        }
        const data = await res.json();
        astranlogTokenCache = data.access_token;
        astranlogTokenExpiry = Date.now() + ((data.expires_in || 3600) - 300) * 1000;
        return astranlogTokenCache;
    }

    window.syncAstranlogSocorros = async function (options = { silent: true }) {
        const btn = document.getElementById('btn-sync-astranlog');
        const lastSyncElem = document.getElementById('astranlog-last-sync');
        if (btn && !options.silent) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Sincronizando...';
            if (window.lucide) lucide.createIcons();
        }

        try {
            const token = await getAstranlogAuthToken();
            const headers = {
                'apikey': ASTRANLOG_CONFIG.key,
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch(`${ASTRANLOG_CONFIG.url}/rest/v1/chamados?prestador=ilike.*${ASTRANLOG_CONFIG.targetPrestador}*&order=created_at.desc`, { headers });
            if (!res.ok) {
                throw new Error(`Erro HTTP ${res.status} ao consultar Instant Aid Flow`);
            }
            const chamados = await res.json();

            const finalizados = chamados.filter(c => {
                const sit = (c.situacao || '').toLowerCase();
                const st = (c.status || '').toLowerCase();
                return sit === 'finalizado' || sit === 'aguardando_pagamento' || st === 'atendido' || c.finalizado_em != null;
            });

            if (lastSyncElem) {
                const now = new Date();
                lastSyncElem.textContent = `${now.toLocaleTimeString('pt-BR')} (${finalizados.length} socorro(s) finalizado(s))`;
            }

            if (!finalizados.length) {
                if (!options.silent) showToast('Nenhum socorro finalizado da Astranlog pendente no momento.', 'info');
                return 0;
            }

            const user = (await window.supabaseClient.auth.getUser()).data?.user;
            const currentUserId = user ? user.id : null;

            const { data: currentDbRecords } = await window.supabaseClient
                .from('servicos_guincho')
                .select('*');
            const existing = currentDbRecords || guinchoServices || [];

            let insertedCount = 0;

            for (const c of finalizados) {
                const protocolo = c.protocolo || (c.id ? c.id.slice(0, 8) : 'ASS');
                
                const exists = existing.some(s => {
                    const obs = (s.observacoes || '').toUpperCase();
                    return obs.includes(protocolo.toUpperCase());
                });

                if (!exists) {
                    const fullText = JSON.stringify(c).toUpperCase();
                    let targetPlate = null;

                    if (fullText.includes('FCF5J84')) {
                        targetPlate = 'FCF5J84';
                    } else if (fullText.includes('QRD9G90')) {
                        targetPlate = 'QRD9G90';
                    } else {
                        const serv = (c.servico || '').toLowerCase();
                        const mot = (c.motivo || c.motivo_final || '').toLowerCase();
                        if (serv.includes('extra pesado') || serv.includes('pesado') || mot.includes('tombamento')) {
                            targetPlate = 'QRD9G90';
                        } else {
                            targetPlate = 'FCF5J84';
                        }
                    }

                    const placaAtendida = c.placa || '---';
                    const segurado = c.segurado || 'Cliente';
                    const servico = c.servico || 'Socorro';
                    const motivo = c.motivo_final || c.motivo || 'Atendimento';
                    const origem = [c.origem_cidade, c.origem_estado].filter(Boolean).join('-') || c.origem || 'N/I';
                    const destino = [c.destino_cidade, c.destino_estado].filter(Boolean).join('-') || c.destino || 'N/I';

                    const rec = {
                        placa: targetPlate,
                        motorista: c.finalizado_por || c.usuario_abertura || 'Motorista Astranlog',
                        valor_cobrado: parseFloat(c.valor_servico) || 0,
                        status: 'Finalizado',
                        data_inicio: c.data_abertura || c.created_at || new Date().toISOString(),
                        data_fim: c.finalizado_em || c.updated_at || c.created_at || new Date().toISOString(),
                        observacoes: `[Instant Aid Flow ${protocolo}] Socorro Placa: ${placaAtendida} (${segurado}) - ${servico} (${motivo}). Origem: ${origem} -> Destino: ${destino}`,
                        user_id: currentUserId
                    };

                    const { error: insError } = await window.supabaseClient
                        .from('servicos_guincho')
                        .insert([rec]);

                    if (!insError) {
                        insertedCount++;
                    } else {
                        console.error('Erro ao cadastrar socorro Astranlog:', insError);
                    }
                }
            }

            if (insertedCount > 0) {
                const { data: refreshed } = await window.supabaseClient
                    .from('servicos_guincho')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (refreshed) guinchoServices = refreshed;

                renderGuinchoTable();
                updateGuinchoStats();

                showToast(`Auto-Sync Astranlog: ${insertedCount} novo(s) socorro(s) cadastrado(s) automaticamente!`, 'success');
            } else {
                if (!options.silent) showToast('Todos os socorros da Astranlog já estão cadastrados.', 'success');
            }

            return insertedCount;
        } catch (err) {
            console.error('Erro ao sincronizar Astranlog:', err);
            if (!options.silent) showToast('Erro na sincronização Astranlog: ' + err.message, 'error');
            return 0;
        } finally {
            if (btn && !options.silent) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="cloud-lightning"></i> Sync Astranlog';
                if (window.lucide) lucide.createIcons();
            }
        }
    };

    function updateGuinchoStats() {
        const andamento = guinchoServices.filter(s => s.status === 'Em Serviço').length;
        const finalizados = guinchoServices.filter(s => s.status === 'Finalizado').length;
        const kmTotal = guinchoServices.reduce((s, x) => s + (parseFloat(x.km_percorrido) || 0), 0);
        const valorTotal = guinchoServices.reduce((s, x) => s + (parseFloat(x.valor_cobrado) || 0), 0);

        document.getElementById('stat-guincho-andamento').textContent = andamento;
        document.getElementById('stat-guincho-finalizados').textContent = finalizados;
        document.getElementById('stat-guincho-km').textContent = `${fmtKm(kmTotal)} km`;
        document.getElementById('stat-guincho-valor').textContent = `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        // Dashboard stats (monthly)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthServices = guinchoServices.filter(s => new Date(s.data_inicio) >= monthStart);
        const monthFinalizados = monthServices.filter(s => s.status === 'Finalizado').length;
        const monthKm = monthServices.reduce((s, x) => s + (parseFloat(x.km_percorrido) || 0), 0);
        const monthValor = monthServices.reduce((s, x) => s + (parseFloat(x.valor_cobrado) || 0), 0);

        document.getElementById('stat-dash-guincho-andamento').textContent = andamento;
        document.getElementById('stat-dash-guincho-finalizados').textContent = monthFinalizados;
        document.getElementById('stat-dash-guincho-km').textContent = `${fmtKm(monthKm)} km`;
        document.getElementById('stat-dash-guincho-valor').textContent = `R$ ${monthValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        renderRecentGuincho();
        updateGuinchoCharts();
    }

    function renderRecentGuincho() {
        const tbody = document.getElementById('recent-guincho');
        if (!tbody) return;
        const recent = [...guinchoServices].sort((a, b) => new Date(b.data_inicio) - new Date(a.data_inicio)).slice(0, 10);
        tbody.innerHTML = recent.length === 0
            ? '<tr><td colspan="7" style="text-align:center;padding:1rem;color:var(--text-secondary)">Nenhum serviço de guincho.</td></tr>'
            : '';
        recent.forEach(s => {
            const tr = document.createElement('tr');
            const placaSoc = getPlacaSocorrida(s);
            const badgeSoc = placaSoc !== '---'
                ? `<span style="font-weight:700;color:#059669;background:rgba(16,185,129,0.12);padding:0.18rem 0.5rem;border-radius:6px;font-size:0.78rem;">${placaSoc}</span>`
                : '---';
            tr.innerHTML = `
                <td style="white-space:nowrap">${s.data_inicio ? new Date(s.data_inicio).toLocaleDateString('pt-BR') : '---'}</td>
                <td style="font-weight:700;color:var(--primary)">${s.placa}</td>
                <td>${badgeSoc}</td>
                <td>${s.motorista || '---'}</td>
                <td>${fmtKm(s.km_percorrido)} km</td>
                <td style="font-weight:700;color:var(--success)">R$ ${parseFloat(s.valor_cobrado).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                <td><span class="badge ${s.status === 'Finalizado' ? 'badge-active' : 'badge-maintenance'}">${s.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
        if (window.lucide) lucide.createIcons();
    }

    function getFilteredGuincho() {
        const placa = (document.getElementById('filter-guincho-placa').value || '').toUpperCase();
        const motorista = (document.getElementById('filter-guincho-motorista').value || '').toLowerCase();
        const status = document.getElementById('filter-guincho-status').value;
        const inicio = document.getElementById('filter-guincho-inicio').value;
        const fim = document.getElementById('filter-guincho-fim').value;
        const search = (document.getElementById('search-guincho').value || '').toLowerCase();

        return guinchoServices.filter(s => {
            if (placa && !s.placa.toUpperCase().includes(placa)) return false;
            if (motorista && (!s.motorista || !s.motorista.toLowerCase().includes(motorista))) return false;
            if (status && s.status !== status) return false;
            const placaSoc = getPlacaSocorrida(s).toLowerCase();
            if (search && !s.placa.toLowerCase().includes(search) && (!s.motorista || !s.motorista.toLowerCase().includes(search)) && !placaSoc.includes(search)) return false;
            if (inicio) {
                const d = new Date(s.data_inicio);
                if (d < new Date(inicio)) return false;
            }
            if (fim) {
                const d = new Date(s.data_inicio);
                const endDate = new Date(fim);
                endDate.setDate(endDate.getDate() + 1);
                if (d > endDate) return false;
            }
            return true;
        });
    }

    window.sortGuincho = (field) => {
        if (guinchoSortField === field) guinchoSortAsc = !guinchoSortAsc;
        else { guinchoSortField = field; guinchoSortAsc = true; }
        renderGuinchoTable();
    };

    function getPlacaSocorrida(s) {
        if (s.placa_socorrida) return s.placa_socorrida;
        if (s.observacoes) {
            const match = s.observacoes.match(/Socorro Placa:\s*([A-Z0-9]{7}(?:\s*\([^)]+\))?)/i);
            if (match) return match[1];
        }
        return '---';
    }

    function renderGuinchoTable() {
        const tbody = document.getElementById('guincho-list');
        if (!tbody) return;

        let filtered = getFilteredGuincho();
        const sorted = [...filtered].sort((a, b) => {
            let va = a[guinchoSortField] || '';
            let vb = b[guinchoSortField] || '';
            if (guinchoSortField === 'data_inicio' || guinchoSortField === 'created_at') {
                va = new Date(va).getTime();
                vb = new Date(vb).getTime();
            } else if (guinchoSortField === 'km_percorrido' || guinchoSortField === 'valor_cobrado') {
                va = parseFloat(va) || 0;
                vb = parseFloat(vb) || 0;
            }
            return guinchoSortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
        });

        tbody.innerHTML = sorted.length === 0
            ? '<tr><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-secondary)">Nenhum serviço de guincho encontrado.</td></tr>'
            : '';

        sorted.forEach(s => {
            const tr = document.createElement('tr');
            const isFinalizado = s.status === 'Finalizado';
            const badgeClass = isFinalizado ? 'badge-active' : 'badge-maintenance';
            const dataInicio = s.data_inicio ? new Date(s.data_inicio).toLocaleString('pt-BR') : '---';
            const dataFim = s.data_fim ? new Date(s.data_fim).toLocaleString('pt-BR') : '---';
            const kmPercorrido = parseFloat(s.km_percorrido) || 0;
            const placaSoc = getPlacaSocorrida(s);
            const badgeSocorrida = placaSoc !== '---'
                ? `<span style="font-weight:700;color:#059669;background:rgba(16,185,129,0.12);padding:0.25rem 0.6rem;border-radius:6px;font-size:0.83rem;border:1px solid rgba(16,185,129,0.25);">${placaSoc}</span>`
                : '<span style="color:var(--text-secondary)">---</span>';

            tr.innerHTML = `
                <td style="white-space:nowrap">${dataInicio}</td>
                <td style="font-weight:700;color:var(--primary)">${s.placa}</td>
                <td>${badgeSocorrida}</td>
                <td>${s.motorista || '---'}</td>
                <td>${s.km_inicial ? fmtKm(s.km_inicial) : '---'}</td>
                <td>${s.km_final ? fmtKm(s.km_final) : '---'}</td>
                <td style="font-weight:600">${kmPercorrido > 0 ? fmtKm(kmPercorrido) + ' km' : '---'}</td>
                <td style="font-weight:700;color:var(--success)">R$ ${parseFloat(s.valor_cobrado).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                <td><span class="badge ${badgeClass}">${s.status}</span></td>
                <td>
                    <div style="display:flex;gap:0.3rem">
                        ${!isFinalizado ? `<button class="btn-icon" title="Finalizar" onclick="finalizarGuincho('${s.id}')"><i data-lucide="check-circle" style="color:var(--success)"></i></button>` : ''}
                        <button class="btn-icon" title="Editar" onclick="editarGuincho('${s.id}')"><i data-lucide="edit-2" class="text-primary"></i></button>
                        <button class="btn-icon" title="Excluir" onclick="excluirGuincho('${s.id}')"><i data-lucide="trash-2" class="text-danger"></i></button>
                        <button class="btn btn-sm btn-back" title="Visualizar" onclick="verDetalhesGuincho('${s.id}')" style="padding:0.25rem 0.6rem;font-size:0.75rem;gap:0.3rem">
                            <i data-lucide="eye" style="width:14px;height:14px"></i> Visualizar
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        if (window.lucide) lucide.createIcons();
    }

    function openGuinchoModal(service = null) {
        guinchoEditingId = service ? service.id : null;
        document.getElementById('guincho-modal-title').textContent = service ? 'Editar Serviço de Guincho' : 'Novo Serviço de Guincho';
        document.getElementById('btn-salvar-guincho').textContent = service ? 'Salvar Alterações' : 'Salvar Serviço';
        document.getElementById('guincho-form').reset();
        setGuinchoKMMode('manual');

        if (service) {
            document.getElementById('guincho-placa').value = service.placa || '';
            const pSocElem = document.getElementById('guincho-placa-socorrida');
            if (pSocElem) pSocElem.value = service.placa_socorrida || getPlacaSocorrida(service) || '';
            document.getElementById('guincho-motorista').value = service.motorista || '';
            document.getElementById('guincho-valor').value = service.valor_cobrado || '';
            document.getElementById('guincho-status').value = service.status || 'Em Serviço';
            document.getElementById('guincho-observacoes').value = service.observacoes || '';

            if (service.data_inicio) {
                const d = new Date(service.data_inicio);
                document.getElementById('guincho-data-inicio').value = d.toISOString().slice(0, 16);
            }

            if (service.km_inicial !== null || service.km_final !== null) {
                setGuinchoKMMode('manual');
                document.getElementById('guincho-km-inicial').value = service.km_inicial != null ? fmtKm(service.km_inicial) : '';
                document.getElementById('guincho-km-final').value = service.km_final != null ? fmtKm(service.km_final) : '';
                document.getElementById('guincho-km-percorrido').value = service.km_percorrido != null ? fmtKm(service.km_percorrido) : '';
            } else if (service.lat_origem !== null) {
                setGuinchoKMMode('gps');
                document.getElementById('guincho-lat-origem').value = service.lat_origem || '';
                document.getElementById('guincho-lng-origem').value = service.lng_origem || '';
                document.getElementById('guincho-lat-destino').value = service.lat_destino || '';
                document.getElementById('guincho-lng-destino').value = service.lng_destino || '';
                document.getElementById('guincho-km-percorrido-gps').value = service.km_percorrido != null ? fmtKm(service.km_percorrido) : '';
            }
        } else {
            document.getElementById('guincho-data-inicio').value = new Date().toISOString().slice(0, 16);
            document.getElementById('guincho-status').value = 'Em Serviço';
        }

        document.getElementById('guincho-modal').style.display = 'flex';
    }

    window.editarGuincho = (id) => {
        const svc = guinchoServices.find(s => s.id === id);
        if (svc) openGuinchoModal(svc);
    };

    window.verDetalhesGuincho = (id) => {
        const s = guinchoServices.find(x => x.id === id);
        if (!s) return;

        document.getElementById('gd-placa').textContent = s.placa;
        const gdSocElem = document.getElementById('gd-placa-socorrida');
        if (gdSocElem) gdSocElem.textContent = getPlacaSocorrida(s);
        document.getElementById('gd-motorista').textContent = s.motorista || 'Motorista não informado';
        document.getElementById('gd-status').textContent = s.status;
        document.getElementById('gd-status').className = `plate-badge ${s.status === 'Finalizado' ? 'badge-active' : 'badge-maintenance'}`;
        document.getElementById('gd-data-inicio').textContent = s.data_inicio ? new Date(s.data_inicio).toLocaleString('pt-BR') : '---';
        document.getElementById('gd-data-fim').textContent = s.data_fim ? new Date(s.data_fim).toLocaleString('pt-BR') : '---';
        document.getElementById('gd-km-inicial').textContent = s.km_inicial ? fmtKm(s.km_inicial) : '---';
        document.getElementById('gd-km-final').textContent = s.km_final ? fmtKm(s.km_final) : '---';
        document.getElementById('gd-km-percorrido').textContent = s.km_percorrido ? `${fmtKm(s.km_percorrido)} km` : '---';
        document.getElementById('gd-valor').textContent = `R$ ${parseFloat(s.valor_cobrado).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('gd-observacoes').textContent = s.observacoes || 'Sem observações.';
        const coordsDiv = document.getElementById('gd-coords');
        if (s.lat_origem && s.lng_origem) {
            coordsDiv.style.display = 'block';
            document.getElementById('gd-coords-text').textContent =
                `Origem: ${s.lat_origem}, ${s.lng_origem}\nDestino: ${s.lat_destino || '---'}, ${s.lng_destino || '---'}`;
        } else {
            coordsDiv.style.display = 'none';
        }

        document.getElementById('guincho-detalhes-modal').style.display = 'flex';
    };

    window.finalizarGuincho = async (id) => {
        const confirmed = await showConfirm('Finalizar Serviço', 'Deseja marcar este serviço de guincho como Finalizado?');
        if (!confirmed) return;
        try {
            const { error } = await window.supabaseClient
                .from('servicos_guincho')
                .update({ status: 'Finalizado', data_fim: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            showToast('Serviço de guincho finalizado com sucesso!', 'success');
            await fetchGuinchoData();
        } catch (error) {
            showToast('Erro ao finalizar: ' + error.message, 'error');
        }
    };

    window.excluirGuincho = async (id) => {
        const confirmed = await showConfirm('Excluir Serviço', 'Deseja excluir permanentemente este serviço de guincho?');
        if (!confirmed) return;
        try {
            const { error } = await window.supabaseClient
                .from('servicos_guincho')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast('Serviço excluído com sucesso!', 'success');
            await fetchGuinchoData();
        } catch (error) {
            showToast('Erro ao excluir: ' + error.message, 'error');
        }
    };

    async function calcularDistanciaGPS() {
        const lat1 = parseFloat(document.getElementById('guincho-lat-origem').value);
        const lng1 = parseFloat(document.getElementById('guincho-lng-origem').value);
        const lat2 = parseFloat(document.getElementById('guincho-lat-destino').value);
        const lng2 = parseFloat(document.getElementById('guincho-lng-destino').value);

        if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
            return showToast('Preencha latitude e longitude de origem e destino.', 'warning');
        }

        // Haversine formula for straight-line distance
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const straightLine = R * c;

        // Try OSRM for actual road distance
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
            const resp = await fetch(osrmUrl);
            const osrmData = await resp.json();
            if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
                const roadKm = osrmData.routes[0].distance / 1000;
                document.getElementById('guincho-km-percorrido-gps').value = Math.round(roadKm * 10) / 10;
                showToast(`Distância rodoviária calculada: ${roadKm.toFixed(1)} km`, 'success');
                return;
            }
        } catch (e) {
            // Fallback to straight line
        }

        document.getElementById('guincho-km-percorrido-gps').value = Math.round(straightLine * 10) / 10;
        showToast(`Distância em linha reta: ${straightLine.toFixed(1)} km`, 'info');
    }

    window.gerarPDFGuincho = () => {
        const filtered = getFilteredGuincho();
        if (filtered.length === 0) return showToast('Nenhum serviço encontrado para gerar PDF.', 'warning');

        const andamento = filtered.filter(s => s.status === 'Em Serviço').length;
        const finalizados = filtered.filter(s => s.status === 'Finalizado').length;
        const kmTotal = filtered.reduce((s, x) => s + (parseFloat(x.km_percorrido) || 0), 0);
        const valorTotal = filtered.reduce((s, x) => s + (parseFloat(x.valor_cobrado) || 0), 0);

        const printWin = window.open('', '_blank');
        let html = `
            <html><head><title>Relatório Guincho - FROTA STRSAT</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                h1 { color: #1e293b; margin: 0; font-size: 1.5rem; }
                .logo { font-size: 2rem; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f1f5f9; text-align: left; padding: 10px; border: 1px solid #e2e8f0; font-size: 0.85rem; }
                td { padding: 10px; border: 1px solid #e2e8f0; font-size: 0.85rem; }
                .resumo { display: flex; justify-content: space-between; margin-top: 20px; gap: 1rem; }
                .resumo-item { flex: 1; background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
                .resumo-item strong { display: block; font-size: 1.2rem; color: #3b82f6; margin-top: 5px; }
                .footer { margin-top: 30px; text-align: center; font-size: 0.8rem; color: #94a3b8; }
            </style></head><body>
            <div class="header">
                <div class="logo">🚛</div>
                <h1>Relatório de Serviços de Guincho</h1>
                <p style="color:#64748b;margin-top:5px">FROTA STRSAT</p>
                <p style="color:#94a3b8;font-size:0.85rem">Emitido em: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <div class="resumo">
                <div class="resumo-item">Total de Serviços<strong>${filtered.length}</strong></div>
                <div class="resumo-item">Em Andamento<strong>${andamento}</strong></div>
                <div class="resumo-item">Finalizados<strong>${finalizados}</strong></div>
                <div class="resumo-item">KM Total<strong>${fmtKm(kmTotal)} km</strong></div>
                <div class="resumo-item">Valor Total<strong>R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong></div>
            </div>
            <table>
                <thead><tr>
                    <th>Data</th><th>Placa Guincho</th><th>Placa Socorrida</th><th>Motorista</th><th>KM Inicial</th><th>KM Final</th><th>KM Percorrido</th><th>Valor</th><th>Status</th>
                </tr></thead>
                <tbody>
                    ${filtered.map(s => `
                        <tr>
                            <td>${s.data_inicio ? new Date(s.data_inicio).toLocaleDateString('pt-BR') : '---'}</td>
                            <td><b>${s.placa}</b></td>
                            <td><b style="color:#059669">${getPlacaSocorrida(s)}</b></td>
                            <td>${s.motorista || '---'}</td>
                            <td>${s.km_inicial ? fmtKm(s.km_inicial) : '---'}</td>
                            <td>${s.km_final ? fmtKm(s.km_final) : '---'}</td>
                            <td>${fmtKm(s.km_percorrido)} km</td>
                            <td>R$ ${parseFloat(s.valor_cobrado).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                            <td>${s.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer"><p>Relatório gerado automaticamente - FROTA STRSAT &copy; ${new Date().getFullYear()}</p></div>
            <script>window.print();<\/script>
        </body></html>`;
        printWin.document.write(html);
        printWin.document.close();
    };

    // === Guincho Event Listeners ===
    document.getElementById('btn-novo-guincho')?.addEventListener('click', () => openGuinchoModal());
    document.querySelectorAll('.close-guincho-modal').forEach(el => {
        el.addEventListener('click', () => document.getElementById('guincho-modal').style.display = 'none');
    });
    document.querySelectorAll('.close-guincho-detalhes').forEach(el => {
        el.addEventListener('click', () => document.getElementById('guincho-detalhes-modal').style.display = 'none');
    });

    document.getElementById('guincho-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const isManual = document.getElementById('guincho-km-mode-manual').classList.contains('active');
        const kmPercorrido = isManual
            ? parseNum(document.getElementById('guincho-km-percorrido').value) || 0
            : parseNum(document.getElementById('guincho-km-percorrido-gps').value) || 0;

        const placaSocorridaVal = (document.getElementById('guincho-placa-socorrida')?.value || '').toUpperCase().trim();
        const payload = {
            placa: document.getElementById('guincho-placa').value.toUpperCase().trim(),
            placa_socorrida: placaSocorridaVal || null,
            motorista: document.getElementById('guincho-motorista').value.trim(),
            data_inicio: new Date(document.getElementById('guincho-data-inicio').value).toISOString(),
            valor_cobrado: parseNum(document.getElementById('guincho-valor').value) || 0,
            status: document.getElementById('guincho-status').value,
            km_percorrido: kmPercorrido,
            observacoes: document.getElementById('guincho-observacoes').value.trim(),
            user_id: user?.id
        };

        if (isManual) {
            payload.km_inicial = parseNum(document.getElementById('guincho-km-inicial').value) || null;
            payload.km_final = parseNum(document.getElementById('guincho-km-final').value) || null;
        } else {
            payload.lat_origem = parseFloat(document.getElementById('guincho-lat-origem').value) || null;
            payload.lng_origem = parseFloat(document.getElementById('guincho-lng-origem').value) || null;
            payload.lat_destino = parseFloat(document.getElementById('guincho-lat-destino').value) || null;
            payload.lng_destino = parseFloat(document.getElementById('guincho-lng-destino').value) || null;
            payload.km_inicial = null;
            payload.km_final = null;
        }

        if (!payload.placa) return showToast('Informe a placa do veículo.', 'warning');

        try {
            if (guinchoEditingId) {
                const { error } = await window.supabaseClient
                    .from('servicos_guincho')
                    .update(payload)
                    .eq('id', guinchoEditingId);
                if (error) throw error;
                showToast('Serviço de guincho atualizado com sucesso!', 'success');
            } else {
                const { error } = await window.supabaseClient
                    .from('servicos_guincho')
                    .insert([payload]);
                if (error) throw error;
                showToast('Serviço de guincho cadastrado com sucesso!', 'success');
            }
            document.getElementById('guincho-modal').style.display = 'none';
            await fetchGuinchoData();
        } catch (error) {
            showToast('Erro ao salvar guincho: ' + error.message, 'error');
        }
    });

    document.getElementById('btn-calcular-distancia')?.addEventListener('click', calcularDistanciaGPS);
    document.getElementById('btn-pdf-guincho')?.addEventListener('click', gerarPDFGuincho);
    document.getElementById('btn-filtrar-guincho')?.addEventListener('click', renderGuinchoTable);
    document.getElementById('btn-limpar-filtros-guincho')?.addEventListener('click', () => {
        document.getElementById('filter-guincho-placa').value = '';
        document.getElementById('filter-guincho-motorista').value = '';
        document.getElementById('filter-guincho-status').value = '';
        document.getElementById('filter-guincho-inicio').value = '';
        document.getElementById('filter-guincho-fim').value = '';
        document.getElementById('search-guincho').value = '';
        renderGuinchoTable();
    });
    document.getElementById('btn-atualizar-guincho')?.addEventListener('click', fetchGuinchoData);
    document.getElementById('btn-sync-astranlog')?.addEventListener('click', () => {
        if (typeof window.syncAstranlogSocorros === 'function') {
            window.syncAstranlogSocorros({ silent: false });
        }
    });
    document.getElementById('search-guincho')?.addEventListener('input', renderGuinchoTable);

    // Load Guincho data when navigating to guincho view
    document.querySelector('[data-view="guincho"]')?.addEventListener('click', () => {
        setTimeout(fetchGuinchoData, 100);
    });

    // Auto-load guincho data after login too
    const origCheckAuth = checkAuthAndLoad;
    checkAuthAndLoad = async () => {
        await origCheckAuth.call(this);
        await fetchGuinchoData();
        await fetchLavagensData();
    };

    // Also load on DOMContentLoaded after initial data
    setTimeout(fetchGuinchoData, 2000);
    setTimeout(fetchLavagensData, 2000);

    // Auto-sync periódico a cada 2 minutos (120000 ms) para o prestador Astranlog
    setInterval(() => {
        if (typeof window.syncAstranlogSocorros === 'function') {
            window.syncAstranlogSocorros({ silent: true });
        }
    }, 120000);

    // === DASHBOARD TABS ===
    document.querySelectorAll('#dashboard-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#dashboard-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const dash = btn.getAttribute('data-dash');
            const dashManut = document.getElementById('dash-manutencao');
            const dashGuincho = document.getElementById('dash-guincho');
            const dashLavagens = document.getElementById('dash-lavagens');

            if (dashManut) dashManut.style.display = dash === 'manutencao' ? 'block' : 'none';
            if (dashGuincho) dashGuincho.style.display = dash === 'guincho' ? 'block' : 'none';
            if (dashLavagens) dashLavagens.style.display = dash === 'lavagens' ? 'block' : 'none';

            if (dash === 'guincho') {
                renderRecentGuincho();
                updateGuinchoStats();
            } else if (dash === 'lavagens') {
                renderRecentDashLavagens();
                updateDashLavagensCharts();
            }
        });
    });

    // ==========================================
    // CENTRAL DE RELATÓRIOS (4 ABAS & GRÁFICOS)
    // ==========================================
    document.querySelectorAll('#relatorio-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#relatorio-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const relatorio = btn.getAttribute('data-relatorio');
            
            document.getElementById('relatorio-manutencao').style.display = relatorio === 'manutencao' ? 'block' : 'none';
            document.getElementById('relatorio-guincho').style.display = relatorio === 'guincho' ? 'block' : 'none';
            document.getElementById('relatorio-lavagens').style.display = relatorio === 'lavagens' ? 'block' : 'none';
            document.getElementById('relatorio-consolidado').style.display = relatorio === 'consolidado' ? 'block' : 'none';

            if (relatorio === 'manutencao') updateRelatorioManutencaoStats();
            else if (relatorio === 'guincho') updateRelatorioGuinchoStats();
            else if (relatorio === 'lavagens') updateRelatorioLavagensStats();
            else if (relatorio === 'consolidado') updateRelatorioConsolidadoStats();
        });
    });

    // --- RELATÓRIO DE MANUTENÇÕES ---
    function getFilteredManutencoesRelatorio() {
        const vId = document.getElementById('filter-vehicle-select')?.value;
        const start = document.getElementById('filter-start-date')?.value;
        const end = document.getElementById('filter-end-date')?.value;

        return activities.filter(a => {
            if (vId && a.vehicle_id !== vId && a.plate !== vId) return false;
            if (start) {
                const parts = a.date.split('/');
                const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (d < new Date(start)) return false;
            }
            if (end) {
                const parts = a.date.split('/');
                const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                const e = new Date(end);
                e.setDate(e.getDate() + 1);
                if (d > e) return false;
            }
            return true;
        });
    }

    function updateRelatorioManutencaoStats() {
        const filtered = getFilteredManutencoesRelatorio();
        const totalCost = filtered.reduce((s, a) => s + (a.cost || 0), 0);
        const totalCount = filtered.length;
        const avgCost = totalCount > 0 ? totalCost / totalCount : 0;
        const maxCost = filtered.reduce((m, a) => (a.cost > m ? a.cost : m), 0);

        document.getElementById('rel-maint-custo').textContent = `R$ ${totalCost.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('rel-maint-media').textContent = `R$ ${avgCost.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('rel-maint-maior').textContent = `R$ ${maxCost.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('rel-maint-total').textContent = totalCount;

        // Gráfico Evolução Mensal
        const monthly = Array(12).fill(0);
        filtered.forEach(a => {
            const parts = a.date.split('/');
            const monthIdx = parseInt(parts[1], 10) - 1;
            if (monthIdx >= 0 && monthIdx < 12) monthly[monthIdx] += (a.cost || 0);
        });

        const ctx1 = document.getElementById('relatorioChartManutencao')?.getContext('2d');
        if (ctx1) {
            if (relChartManutencao) relChartManutencao.destroy();
            relChartManutencao = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
                    datasets: [{
                        label: 'Custos R$',
                        data: monthly,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { color: '#64748b' } }
                    }
                }
            });
        }

        // Gráfico Top 5 Veículos por Custo
        const byVehicle = {};
        filtered.forEach(a => {
            const key = a.vehicle || a.plate;
            byVehicle[key] = (byVehicle[key] || 0) + (a.cost || 0);
        });
        const sortedV = Object.entries(byVehicle).sort((a,b) => b[1] - a[1]).slice(0, 5);

        const ctx2 = document.getElementById('relatorioChartManutencaoTop')?.getContext('2d');
        if (ctx2) {
            if (relChartManutencaoTop) relChartManutencaoTop.destroy();
            relChartManutencaoTop = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: sortedV.map(x => x[0]),
                    datasets: [{
                        label: 'Custo Total R$',
                        data: sortedV.map(x => x[1]),
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { color: '#64748b' } }
                    }
                }
            });
        }
    }

    // --- RELATÓRIO DE GUINCHO ---
    function getFilteredGuinchoRelatorio() {
        const placa = (document.getElementById('filter-rel-guincho-placa')?.value || '').toUpperCase();
        const motorista = (document.getElementById('filter-rel-guincho-motorista')?.value || '').toLowerCase();
        const status = document.getElementById('filter-rel-guincho-status')?.value;
        const inicio = document.getElementById('filter-rel-guincho-inicio')?.value;
        const fim = document.getElementById('filter-rel-guincho-fim')?.value;

        return guinchoServices.filter(s => {
            if (placa && !s.placa.toUpperCase().includes(placa)) return false;
            if (motorista && (!s.motorista || !s.motorista.toLowerCase().includes(motorista))) return false;
            if (status && s.status !== status) return false;
            if (inicio && new Date(s.data_inicio) < new Date(inicio)) return false;
            if (fim) {
                const end = new Date(fim);
                end.setDate(end.getDate() + 1);
                if (new Date(s.data_inicio) > end) return false;
            }
            return true;
        });
    }

    function updateRelatorioGuinchoStats() {
        const filtered = getFilteredGuinchoRelatorio();
        const total = filtered.length;
        const andamento = filtered.filter(s => s.status === 'Em Serviço').length;
        const finalizados = filtered.filter(s => s.status === 'Finalizado').length;
        const kmTotal = filtered.reduce((s, x) => s + (parseFloat(x.km_percorrido) || 0), 0);
        const valorTotal = filtered.reduce((s, x) => s + (parseFloat(x.valor_cobrado) || 0), 0);

        document.getElementById('stat-rel-guincho-total').textContent = total;
        document.getElementById('stat-rel-guincho-andamento').textContent = andamento;
        document.getElementById('stat-rel-guincho-finalizados').textContent = finalizados;
        document.getElementById('stat-rel-guincho-km').textContent = `${fmtKm(kmTotal)} km`;
        document.getElementById('stat-rel-guincho-valor').textContent = `R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;

        // Gráfico Mensal Guincho
        const monthly = Array(12).fill(0);
        filtered.forEach(s => {
            if (s.data_inicio) {
                const m = new Date(s.data_inicio).getMonth();
                monthly[m] += (parseFloat(s.valor_cobrado) || 0);
            }
        });

        const ctx1 = document.getElementById('relatorioChartGuincho')?.getContext('2d');
        if (ctx1) {
            if (relChartGuincho) relChartGuincho.destroy();
            relChartGuincho = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
                    datasets: [{
                        label: 'Faturamento R$',
                        data: monthly,
                        backgroundColor: 'rgba(139, 92, 246, 0.7)',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { color: '#64748b' } }
                    }
                }
            });
        }

        // KM por Motorista
        const byDriver = {};
        filtered.forEach(s => {
            const drv = s.motorista || 'Sem Motorista';
            byDriver[drv] = (byDriver[drv] || 0) + (parseFloat(s.km_percorrido) || 0);
        });
        const sortedD = Object.entries(byDriver).sort((a,b) => b[1] - a[1]).slice(0, 5);

        const ctx2 = document.getElementById('relatorioChartGuinchoMotorista')?.getContext('2d');
        if (ctx2) {
            if (relChartGuinchoMotorista) relChartGuinchoMotorista.destroy();
            relChartGuinchoMotorista = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: sortedD.map(x => x[0]),
                    datasets: [{
                        label: 'KM Percorridos',
                        data: sortedD.map(x => x[1]),
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b' } },
                        y: { grid: { display: false }, ticks: { color: '#64748b' } }
                    }
                }
            });
        }
    }

    // --- RELATÓRIO DE LAVAGENS ---
    function getFilteredLavagensRelatorio() {
        const placa = (document.getElementById('filter-rel-lavagens-placa')?.value || '').toUpperCase();
        const veiculo = (document.getElementById('filter-rel-lavagens-veiculo')?.value || '').toLowerCase();
        const tipo = document.getElementById('filter-rel-lavagens-tipo')?.value;
        const status = document.getElementById('filter-rel-lavagens-status')?.value;
        const inicio = document.getElementById('filter-rel-lavagens-inicio')?.value;
        const fim = document.getElementById('filter-rel-lavagens-fim')?.value;

        return lavagensData.filter(l => {
            if (placa && !l.placa.toUpperCase().includes(placa)) return false;
            if (veiculo && (!l.veiculo || !l.veiculo.toLowerCase().includes(veiculo))) return false;
            if (tipo && l.tipo_lavagem !== tipo) return false;
            if (status && l.status !== status) return false;
            if (inicio && new Date(l.data) < new Date(inicio)) return false;
            if (fim) {
                const end = new Date(fim);
                end.setDate(end.getDate() + 1);
                if (new Date(l.data) > end) return false;
            }
            return true;
        });
    }

    function updateRelatorioLavagensStats() {
        const filtered = getFilteredLavagensRelatorio();
        const total = filtered.length;
        const pagas = filtered.filter(l => l.status === 'Pago').length;
        const pendentes = filtered.filter(l => l.status === 'Pendente').length;
        const valorTotal = filtered.reduce((s, l) => s + (parseNum(l.valor) || 0), 0);

        document.getElementById('stat-rel-lavagens-total').textContent = total;
        document.getElementById('stat-rel-lavagens-pagas').textContent = pagas;
        document.getElementById('stat-rel-lavagens-pendentes').textContent = pendentes;
        document.getElementById('stat-rel-lavagens-valor').textContent = `R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;

        // Gráfico Evolução Lavagens
        const monthly = Array(12).fill(0);
        filtered.forEach(l => {
            if (l.data) {
                const m = new Date(l.data).getMonth();
                monthly[m] += (parseNum(l.valor) || 0);
            }
        });

        const ctx1 = document.getElementById('relatorioChartLavagens')?.getContext('2d');
        if (ctx1) {
            if (relChartLavagens) relChartLavagens.destroy();
            relChartLavagens = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
                    datasets: [{
                        label: 'Gasto Lavagens R$',
                        data: monthly,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.15)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { color: '#64748b' } }
                    }
                }
            });
        }

        // Gráfico por Tipo de Lavagem
        const byType = {};
        filtered.forEach(l => {
            const t = l.tipo_lavagem || 'Simples';
            byType[t] = (byType[t] || 0) + (parseNum(l.valor) || 0);
        });

        const ctx2 = document.getElementById('relatorioChartLavagensTipo')?.getContext('2d');
        if (ctx2) {
            if (relChartLavagensTipo) relChartLavagensTipo.destroy();
            relChartLavagensTipo = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(byType),
                    datasets: [{
                        data: Object.values(byType),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#475569', font: { family: 'Plus Jakarta Sans' } } } }
                }
            });
        }
    }

    // --- RELATÓRIO VISÃO GERAL CONSOLIDADA ---
    function updateRelatorioConsolidadoStats() {
        const inicio = document.getElementById('filter-rel-cons-inicio')?.value;
        const fim = document.getElementById('filter-rel-cons-fim')?.value;

        // Filter Maintenance
        const filtMaint = activities.filter(a => {
            if (inicio) {
                const parts = a.date.split('/');
                if (new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) < new Date(inicio)) return false;
            }
            if (fim) {
                const parts = a.date.split('/');
                const e = new Date(fim);
                e.setDate(e.getDate() + 1);
                if (new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) > e) return false;
            }
            return true;
        });

        // Filter Guincho
        const filtGuincho = guinchoServices.filter(s => {
            if (inicio && new Date(s.data_inicio) < new Date(inicio)) return false;
            if (fim) {
                const e = new Date(fim);
                e.setDate(e.getDate() + 1);
                if (new Date(s.data_inicio) > e) return false;
            }
            return true;
        });

        // Filter Lavagens
        const filtLav = lavagensData.filter(l => {
            if (inicio && new Date(l.data) < new Date(inicio)) return false;
            if (fim) {
                const e = new Date(fim);
                e.setDate(e.getDate() + 1);
                if (new Date(l.data) > e) return false;
            }
            return true;
        });

        const totalMaint = filtMaint.reduce((s, a) => s + (a.cost || 0), 0);
        const totalGuincho = filtGuincho.reduce((s, x) => s + (parseFloat(x.valor_cobrado) || 0), 0);
        const totalLav = filtLav.reduce((s, l) => s + (parseNum(l.valor) || 0), 0);
        const totalConsolidado = totalMaint + totalGuincho + totalLav;

        document.getElementById('stat-rel-cons-total').textContent = `R$ ${totalConsolidado.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('stat-rel-cons-maint').textContent = `R$ ${totalMaint.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('stat-rel-cons-guincho').textContent = `R$ ${totalGuincho.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('stat-rel-cons-lavagens').textContent = `R$ ${totalLav.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;

        // Gráfico Pie Consolidado
        const ctxPie = document.getElementById('relatorioChartConsolidadoPie')?.getContext('2d');
        if (ctxPie) {
            if (relChartConsolidadoPie) relChartConsolidadoPie.destroy();
            relChartConsolidadoPie = new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: ['Manutenções', 'Guincho', 'Lavagens'],
                    datasets: [{
                        data: [totalMaint, totalGuincho, totalLav],
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#475569', font: { family: 'Plus Jakarta Sans' } } } }
                }
            });
        }

        // Gráfico Bar Mensal Consolidado
        const maintMonthly = Array(12).fill(0);
        const guinchoMonthly = Array(12).fill(0);
        const lavMonthly = Array(12).fill(0);

        filtMaint.forEach(a => {
            const parts = a.date.split('/');
            const m = parseInt(parts[1], 10) - 1;
            if (m >= 0 && m < 12) maintMonthly[m] += (a.cost || 0);
        });

        filtGuincho.forEach(s => {
            if (s.data_inicio) {
                const m = new Date(s.data_inicio).getMonth();
                guinchoMonthly[m] += (parseFloat(s.valor_cobrado) || 0);
            }
        });

        filtLav.forEach(l => {
            if (l.data) {
                const m = new Date(l.data).getMonth();
                lavMonthly[m] += (parseNum(l.valor) || 0);
            }
        });

        const ctxBar = document.getElementById('relatorioChartConsolidadoBar')?.getContext('2d');
        if (ctxBar) {
            if (relChartConsolidadoBar) relChartConsolidadoBar.destroy();
            relChartConsolidadoBar = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
                    datasets: [
                        { label: 'Manutenções', data: maintMonthly, backgroundColor: '#3b82f6' },
                        { label: 'Guincho', data: guinchoMonthly, backgroundColor: '#8b5cf6' },
                        { label: 'Lavagens', data: lavMonthly, backgroundColor: '#06b6d4' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { color: '#475569', font: { family: 'Plus Jakarta Sans' } } } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { color: '#64748b' } }
                    }
                }
            });
        }
    }

    // --- LISTENERS DE FILTRO NOS RELATÓRIOS ---
    ['filter-vehicle-select', 'filter-start-date', 'filter-end-date'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateRelatorioManutencaoStats);
    });

    ['filter-rel-guincho-placa','filter-rel-guincho-motorista','filter-rel-guincho-status','filter-rel-guincho-inicio','filter-rel-guincho-fim'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateRelatorioGuinchoStats);
        document.getElementById(id)?.addEventListener('change', updateRelatorioGuinchoStats);
    });

    ['filter-rel-lavagens-placa','filter-rel-lavagens-veiculo','filter-rel-lavagens-tipo','filter-rel-lavagens-status','filter-rel-lavagens-inicio','filter-rel-lavagens-fim'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateRelatorioLavagensStats);
        document.getElementById(id)?.addEventListener('change', updateRelatorioLavagensStats);
    });

    ['filter-rel-cons-inicio', 'filter-rel-cons-fim'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateRelatorioConsolidadoStats);
    });

    // --- GERADORES DE PDF VIA MOTOR PROFISSIONAL ---
    document.getElementById('btn-generate-pdf')?.addEventListener('click', () => {
        const filtered = getFilteredManutencoesRelatorio();
        if (filtered.length === 0) return showToast('Nenhuma manutenção encontrada para o filtro.', 'warning');
        const total = filtered.reduce((s, a) => s + (a.cost || 0), 0);

        gerarPDFProfissional({
            titulo: 'Relatório Geral de Manutenções da Frota',
            subtitulo: `Filtro aplicado: ${filtered.length} registro(s) de manutenção`,
            kpis: [
                { label: 'Total de Manutenções', value: String(filtered.length) },
                { label: 'Valor Acumulado', value: `R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
                { label: 'Média por Registro', value: `R$ ${(total/filtered.length).toLocaleString('pt-BR',{minimumFractionDigits:2})}` }
            ],
            headers: ['Veículo', 'Placa', 'Serviço Realizado', 'Data', 'KM Registrado', 'Valor', 'Status'],
            rows: filtered.map(a => [
                a.vehicle, a.plate, a.service, a.date, a.km ? `${fmtKm(a.km)} km` : '---',
                `R$ ${(a.cost || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`, a.status
            ]),
            totalLabel: 'CUSTO TOTAL EM MANUTENÇÃO',
            totalValue: `R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}`
        });
    });

    document.getElementById('btn-rel-pdf-guincho')?.addEventListener('click', () => {
        const filtered = getFilteredGuinchoRelatorio();
        if (filtered.length === 0) return showToast('Nenhum serviço de guincho encontrado.', 'warning');
        const valorTotal = filtered.reduce((s, x) => s + (parseFloat(x.valor_cobrado) || 0), 0);
        const kmTotal = filtered.reduce((s, x) => s + (parseFloat(x.km_percorrido) || 0), 0);

        gerarPDFProfissional({
            titulo: 'Relatório Executivo de Serviços de Guincho',
            subtitulo: `Total de ${filtered.length} atuações registradas`,
            kpis: [
                { label: 'Total de Serviços', value: String(filtered.length) },
                { label: 'KM Percorridos', value: `${fmtKm(kmTotal)} km` },
                { label: 'Faturamento Total', value: `R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}` }
            ],
            headers: ['Data', 'Placa', 'Motorista', 'KM Inicial', 'KM Final', 'KM Percorrido', 'Valor Cobrado', 'Status'],
            rows: filtered.map(s => [
                s.data_inicio ? new Date(s.data_inicio).toLocaleDateString('pt-BR') : '---',
                s.placa, s.motorista || '---', s.km_inicial ? `${fmtKm(s.km_inicial)} km` : '---',
                s.km_final ? `${fmtKm(s.km_final)} km` : '---', `${fmtKm(s.km_percorrido)} km`,
                `R$ ${parseFloat(s.valor_cobrado || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`, s.status
            ]),
            totalLabel: 'VALOR TOTAL FATURADO (GUINCHO)',
            totalValue: `R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}`
        });
    });

    document.getElementById('btn-rel-pdf-lavagens')?.addEventListener('click', () => {
        const filtered = getFilteredLavagensRelatorio();
        if (filtered.length === 0) return showToast('Nenhuma lavagem encontrada.', 'warning');
        const valorTotal = filtered.reduce((s, l) => s + (parseNum(l.valor) || 0), 0);

        gerarPDFProfissional({
            titulo: 'Relatório de Higienização e Lavagens',
            subtitulo: `Exibindo ${filtered.length} registro(s) de lavagem`,
            kpis: [
                { label: 'Total Lavagens', value: String(filtered.length) },
                { label: 'Pagas', value: String(filtered.filter(l => l.status === 'Pago').length) },
                { label: 'Pendentes', value: String(filtered.filter(l => l.status === 'Pendente').length) },
                { label: 'Valor Acumulado', value: `R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}` }
            ],
            headers: ['Data', 'Placa', 'Veículo', 'Tipo de Lavagem', 'Pagamento', 'Valor', 'Status', 'Responsável'],
            rows: filtered.map(l => [
                l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '---',
                l.placa, l.veiculo || '---', l.tipo_lavagem, l.forma_pagamento || '---',
                `R$ ${(parseNum(l.valor) || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`,
                l.status, l.responsavel || '---'
            ]),
            totalLabel: 'TOTAL EM LAVAGENS',
            totalValue: `R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}`
        });
    });

    document.getElementById('btn-rel-pdf-consolidado')?.addEventListener('click', () => {
        const inicio = document.getElementById('filter-rel-cons-inicio')?.value;
        const fim = document.getElementById('filter-rel-cons-fim')?.value;

        const filtMaint = activities.filter(a => {
            if (inicio) {
                const parts = a.date.split('/');
                if (new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) < new Date(inicio)) return false;
            }
            if (fim) {
                const parts = a.date.split('/');
                const e = new Date(fim);
                e.setDate(e.getDate() + 1);
                if (new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) > e) return false;
            }
            return true;
        });

        const filtGuincho = guinchoServices.filter(s => {
            if (inicio && new Date(s.data_inicio) < new Date(inicio)) return false;
            if (fim) {
                const e = new Date(fim);
                e.setDate(e.getDate() + 1);
                if (new Date(s.data_inicio) > e) return false;
            }
            return true;
        });

        const filtLav = lavagensData.filter(l => {
            if (inicio && new Date(l.data) < new Date(inicio)) return false;
            if (fim) {
                const e = new Date(fim);
                e.setDate(e.getDate() + 1);
                if (new Date(l.data) > e) return false;
            }
            return true;
        });

        const totalMaint = filtMaint.reduce((s, a) => s + (a.cost || 0), 0);
        const totalGuincho = filtGuincho.reduce((s, x) => s + (parseFloat(x.valor_cobrado) || 0), 0);
        const totalLav = filtLav.reduce((s, l) => s + (parseNum(l.valor) || 0), 0);
        const totalConsolidado = totalMaint + totalGuincho + totalLav;

        const rows = [
            ['Manutenções Preventivas & Corretivas', String(filtMaint.length), `R$ ${totalMaint.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, 'Pago / Concluído'],
            ['Serviços Operacionais de Guincho', String(filtGuincho.length), `R$ ${totalGuincho.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, 'Faturado / Andamento'],
            ['Higienização e Lavagens de Frota', String(filtLav.length), `R$ ${totalLav.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, 'Pago / Pendente']
        ];

        gerarPDFProfissional({
            titulo: 'Relatório Executivo Consolidado de Custos da Frota',
            subtitulo: 'Visão unificada das operações de Manutenção, Guincho e Lavagens',
            kpis: [
                { label: 'Custo Total Frota', value: `R$ ${totalConsolidado.toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
                { label: 'Gasto Manutenção', value: `R$ ${totalMaint.toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
                { label: 'Faturamento Guincho', value: `R$ ${totalGuincho.toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
                { label: 'Gasto Lavagens', value: `R$ ${totalLav.toLocaleString('pt-BR',{minimumFractionDigits:2})}` }
            ],
            headers: ['Módulo Operacional', 'Qtd. Atendimentos', 'Valor Total Acumulado', 'Status Operacional'],
            rows: rows,
            totalLabel: 'ORÇAMENTO GLOBAL CONSOLIDADO',
            totalValue: `R$ ${totalConsolidado.toLocaleString('pt-BR',{minimumFractionDigits:2})}`
        });
    });

    // --- EXPORTAÇÃO CSV DE RELATÓRIOS ---
    document.getElementById('btn-rel-csv-lavagens')?.addEventListener('click', () => {
        const filtered = getFilteredLavagensRelatorio();
        const headers = ['Data', 'Placa', 'Veículo', 'Tipo de Lavagem', 'Forma de Pagamento', 'Valor (R$)', 'Status', 'Responsável'];
        const rows = filtered.map(l => [
            l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '',
            l.placa, l.veiculo || '', l.tipo_lavagem, l.forma_pagamento || '',
            parseNum(l.valor) || 0, l.status, l.responsavel || ''
        ]);
        exportToCSV('relatorio_lavagens', headers, rows);
    });

    document.getElementById('btn-rel-csv-consolidado')?.addEventListener('click', () => {
        const inicio = document.getElementById('filter-rel-cons-inicio')?.value;
        const fim = document.getElementById('filter-rel-cons-fim')?.value;

        const filtMaint = activities.filter(a => {
            if (inicio) {
                const parts = a.date.split('/');
                if (new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) < new Date(inicio)) return false;
            }
            if (fim) {
                const parts = a.date.split('/');
                const e = new Date(fim);
                e.setDate(e.getDate() + 1);
                if (new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) > e) return false;
            }
            return true;
        });

        const filtGuincho = guinchoServices.filter(s => {
            if (inicio && new Date(s.data_inicio) < new Date(inicio)) return false;
            if (fim) {
                const e = new Date(fim);
                e.setDate(e.getDate() + 1);
                if (new Date(s.data_inicio) > e) return false;
            }
            return true;
        });

        const filtLav = lavagensData.filter(l => {
            if (inicio && new Date(l.data) < new Date(inicio)) return false;
            if (fim) {
                const e = new Date(fim);
                e.setDate(e.getDate() + 1);
                if (new Date(l.data) > e) return false;
            }
            return true;
        });

        const totalMaint = filtMaint.reduce((s, a) => s + (a.cost || 0), 0);
        const totalGuincho = filtGuincho.reduce((s, x) => s + (parseFloat(x.valor_cobrado) || 0), 0);
        const totalLav = filtLav.reduce((s, l) => s + (parseNum(l.valor) || 0), 0);

        const headers = ['Módulo', 'Registros', 'Valor Acumulado (R$)'];
        const rows = [
            ['Manutenções', filtMaint.length, totalMaint],
            ['Guincho', filtGuincho.length, totalGuincho],
            ['Lavagens', filtLav.length, totalLav],
            ['TOTAL CONSOLIDADO', filtMaint.length + filtGuincho.length + filtLav.length, totalMaint + totalGuincho + totalLav]
        ];
        exportToCSV('relatorio_consolidado_frota', headers, rows);
    });

    // Atualização inicial ao carregar a página
    setTimeout(() => {
        updateRelatorioManutencaoStats();
        updateRelatorioGuinchoStats();
        updateRelatorioLavagensStats();
        updateRelatorioConsolidadoStats();
    }, 1000);


    // ==========================================
    // REVISÕES VENCIDAS / PRÓXIMAS INTERATIVAS
    // ==========================================
    window.openRevisoesModal = (type) => {
        const modal = document.getElementById('revisoes-modal');
        const titleEl = document.getElementById('revisoes-modal-title');
        const descEl = document.getElementById('revisoes-modal-desc');
        const iconEl = document.getElementById('revisoes-modal-icon');
        const listBody = document.getElementById('revisoes-modal-list');

        if (!modal || !listBody) return;

        const isOverdue = type === 'overdue';
        titleEl.textContent = isOverdue ? 'Veículos com Revisão Vencida' : 'Veículos Próximos da Revisão';
        descEl.textContent = isOverdue
            ? 'Veículos que ultrapassaram a meta de 10.000 km desde a última manutenção registrada.'
            : 'Veículos que atingiram entre 9.000 km e 10.000 km rodados desde a última manutenção e exigem atenção preventiva.';

        if (iconEl) {
            iconEl.style.color = isOverdue ? 'var(--danger)' : 'var(--warning)';
        }

        const items = [];
        vehicles.forEach(v => {
            if (v.status === 'Inativo') return;
            const km = v.km || 0;
            const lastMaintKm = v.history && v.history.length > 0 ? Math.max(...v.history.map(h => h.km || 0)) : 0;
            const kmSinceLast = km - lastMaintKm;

            if (km > 0) {
                if (isOverdue && kmSinceLast >= 10000) {
                    items.push({ vehicle: v, km, lastMaintKm, kmSinceLast });
                } else if (!isOverdue && kmSinceLast >= 9000 && kmSinceLast < 10000) {
                    items.push({ vehicle: v, km, lastMaintKm, kmSinceLast });
                }
            }
        });

        items.sort((a, b) => b.kmSinceLast - a.kmSinceLast);

        listBody.innerHTML = items.length === 0
            ? `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-secondary)">Nenhum veículo ${isOverdue ? 'com revisão vencida' : 'próximo da revisão'}. Frota em dia!</td></tr>`
            : '';

        items.forEach(item => {
            const v = item.vehicle;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:700;color:var(--primary)">${v.plate}</td>
                <td>${v.brand} ${v.model}</td>
                <td>${fmtKm(item.km)} km</td>
                <td>${item.lastMaintKm > 0 ? fmtKm(item.lastMaintKm) + ' km' : 'Nunca'}</td>
                <td>
                    <span class="badge" style="background:${isOverdue ? 'rgba(239,68,68,0.15);color:var(--danger)' : 'rgba(245,158,11,0.15);color:var(--warning)'};font-weight:700;">
                        +${fmtKm(item.kmSinceLast)} km
                    </span>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="iniciarRevisaoPeloModal('${v.id}')">
                        <i data-lucide="wrench"></i> Revisar
                    </button>
                </td>
            `;
            listBody.appendChild(tr);
        });

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    };

    window.iniciarRevisaoPeloModal = (vehicleId) => {
        const modal = document.getElementById('revisoes-modal');
        if (modal) modal.style.display = 'none';

        const maintNav = document.querySelector('[data-view="manutencao"]');
        if (maintNav) maintNav.click();

        setTimeout(() => {
            const select = document.getElementById('maint-vehicle-select');
            if (select) {
                select.value = vehicleId;
                select.dispatchEvent(new Event('change'));
            }
            showToast('Veículo selecionado para ordem de manutenção.', 'info');
        }, 150);
    };

    document.querySelectorAll('.close-revisoes-modal').forEach(el => {
        el.addEventListener('click', () => {
            const modal = document.getElementById('revisoes-modal');
            if (modal) modal.style.display = 'none';
        });
    });

    document.getElementById('card-stat-overdue')?.addEventListener('click', () => openRevisoesModal('overdue'));
    document.getElementById('card-stat-next')?.addEventListener('click', () => openRevisoesModal('next'));

    // ==========================================
    // EXPORTAÇÕES PARA CSV / EXCEL
    // ==========================================
    // CSV Veículos
    document.getElementById('btn-csv-veiculos')?.addEventListener('click', () => {
        const headers = ['Placa', 'Marca', 'Modelo', 'Ano', 'Cor', 'Chassi', 'KM Atual', 'Status'];
        const rows = vehicles.map(v => [
            v.plate, v.brand, v.model, v.year, v.color, v.chassi, v.km, v.status
        ]);
        exportToCSV('frota_veiculos', headers, rows);
    });

    // CSV Manutenções
    document.getElementById('btn-csv-manutencao')?.addEventListener('click', () => {
        const vId = document.getElementById('filter-vehicle-select')?.value;
        const start = document.getElementById('filter-start-date')?.value;
        const end = document.getElementById('filter-end-date')?.value;

        const filtered = activities.filter(a => {
            if (vId && a.vehicle_id !== vId) return false;
            const d = new Date(a.date.split('/').reverse().join('-'));
            if (start && d < new Date(start)) return false;
            if (end && d > new Date(end)) return false;
            return true;
        });

        const headers = ['Veículo', 'Placa', 'Serviço', 'Data', 'KM no Momento', 'Custo (R$)', 'Status'];
        const rows = filtered.map(a => [
            a.vehicle, a.plate, a.service, a.date, a.km || 0, a.cost || 0, a.status
        ]);
        exportToCSV('relatorio_manutencoes', headers, rows);
    });

    // CSV Guincho
    document.getElementById('btn-csv-guincho')?.addEventListener('click', () => {
        const filtered = getFilteredGuincho();
        const headers = ['Data Início', 'Placa Guincho', 'Placa Socorrida', 'Motorista', 'KM Inicial', 'KM Final', 'KM Percorrido', 'Valor Cobrado (R$)', 'Status', 'Observações'];
        const rows = filtered.map(s => [
            s.data_inicio ? new Date(s.data_inicio).toLocaleString('pt-BR') : '',
            s.placa, getPlacaSocorrida(s), s.motorista || '', s.km_inicial || '', s.km_final || '', s.km_percorrido || '',
            s.valor_cobrado, s.status, s.observacoes || ''
        ]);
        exportToCSV('servicos_guincho', headers, rows);
    });

    // CSV Guincho (Relatório)
    document.getElementById('btn-rel-csv-guincho')?.addEventListener('click', () => {
        document.getElementById('btn-csv-guincho')?.click();
    });

    // CSV Lavagens
    document.getElementById('btn-csv-lavagens')?.addEventListener('click', () => {
        const filtered = getFilteredLavagens();
        const headers = ['Data', 'Placa', 'Veículo', 'Tipo de Lavagem', 'Forma de Pagamento', 'Valor (R$)', 'Status', 'Responsável', 'Observações'];
        const rows = filtered.map(l => [
            l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '',
            l.placa, l.veiculo || '', l.tipo_lavagem, l.forma_pagamento || '',
            parseNum(l.valor) || 0, l.status, l.responsavel || '', l.observacoes || ''
        ]);
        exportToCSV('registro_lavagens', headers, rows);
    });

    // ==========================================
    // MÁSCARA AUTOMÁTICA DE PLACAS
    // ==========================================
    function applyPlateMask(inputEl) {
        if (!inputEl) return;
        inputEl.addEventListener('input', () => {
            let v = inputEl.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (v.length > 7) v = v.slice(0, 7);
            inputEl.value = v;
        });
    }
    applyPlateMask(document.querySelector('input[name="plate"]'));
    applyPlateMask(document.getElementById('lavagem-placa'));
    applyPlateMask(document.getElementById('guincho-placa'));
    applyPlateMask(document.getElementById('filter-guincho-placa'));
    applyPlateMask(document.getElementById('filter-lavagens-placa'));
    applyPlateMask(document.getElementById('filter-rel-guincho-placa'));

});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}
