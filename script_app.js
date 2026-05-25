let costsChart, typeChart;
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
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const viewId = item.getAttribute('data-view');
            if (viewId) navigateTo(viewId);
        });
    });

    // Dashboard shortcuts
    document.querySelectorAll('.stat-card').forEach(card => {
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
                plate: v.placa,
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
                    { plate: 'KWZ1B56', chassi: '9BD17104G85125161', model: 'PALIO ELX 1.0', brand: 'FIAT', color: 'PRETA', year: 2007 }
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
                        id: v.id, plate: v.placa, chassi: v.chassi, brand: v.marca,
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
                plate: m.veiculos ? m.veiculos.placa : '---',
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
            placa: data.plate,
            chassi: data.chassi,
            marca: data.brand,
            modelo: data.model,
            cor: data.color,
            ano: parseInt(data.year) || null,
            km_atual: parseInt(data.km) || 0,
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
            return m.toLowerCase().includes(filterText.toLowerCase()) || 
                   p.toLowerCase().includes(filterText.toLowerCase()) ||
                   b.toLowerCase().includes(filterText.toLowerCase());
        });

        vehicleTable.innerHTML = filtered.length === 0 ? 
            '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Nenhum veículo encontrado.</td></tr>' : '';

        filtered.forEach(v => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <td style="font-weight: 700; color: var(--primary);">${v.plate}</td>
                <td>${v.brand}</td>
                <td>${v.model}</td>
                <td>${v.year}</td>
                <td>${v.km.toLocaleString()} km</td>
                <td><span class="badge ${v.status === 'Ativo' ? 'badge-active' : 'badge-maintenance'}">${v.status}</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-icon" title="Localização" onclick="event.stopPropagation(); window.openLocationModal('${v.plate}', '${v.model}')"><i data-lucide="map-pin" style="color: var(--accent-color);"></i></button>
                        <button class="btn-icon" title="Editar" onclick="event.stopPropagation(); findAndEditVehicle(${v.id})"><i data-lucide="edit-2" class="text-primary"></i></button>
                        <button class="btn-icon" title="Excluir" onclick="event.stopPropagation(); deleteVehicle(${v.id})"><i data-lucide="trash-2" class="text-danger"></i></button>
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
        if (confirm('Excluir este veículo e todo seu histórico?')) {
            try {
                const { error } = await window.supabaseClient
                    .from('veiculos')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                await fetchInitialData();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
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
            km: parseInt(fd.get('km')) || 0, status: fd.get('status') || 'Ativo'
        };

        try {
            await saveVehicle(data);
            modal.style.display = 'none';
        } catch (error) {
            alert('Erro ao salvar veículo: ' + error.message);
        }
    });

    // Maintenance
    let currentServices = [], currentParts = [];
    let editingActivityIndex = null;
    const servicesBody = document.getElementById('maint-services-body');
    const partsBody = document.getElementById('maint-parts-body');

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

        // We don't have individual items saved in activities yet, so we'll just put the total as a single service for now
        // or just let them re-enter if it's a legacy record. 
        // Improvement: Activities should store the services/parts list.
        currentServices = [{ desc: a.service, price: a.cost }];
        currentParts = [];
        renderMaintItems();
        navigateTo('manutencao');
    };

    window.deleteActivity = async (index) => {
        if (confirm('Excluir este registro de manutenção?')) {
            try {
                const activity = activities[index];
                const { error } = await window.supabaseClient
                    .from('manutencoes')
                    .delete()
                    .eq('id', activity.id);
                if (error) throw error;
                await fetchInitialData();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
            }
        }
    };

    window.renderMaintItems = () => {
        servicesBody.innerHTML = '';
        currentServices.forEach((s, i) => {
            const tr = document.createElement('tr');
            if (s.isEditing) {
                tr.innerHTML = `
                    <td><input type="text" class="form-input" value="${s.desc}" placeholder="Ex: Troca de Óleo" oninput="updateMaintItem('service',${i},'desc',this.value)"></td>
                    <td><input type="number" class="form-input" value="${s.price === 0 ? '' : s.price}" placeholder="0.00" oninput="updateMaintItem('service',${i},'price',this.value)"></td>
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

        partsBody.innerHTML = '';
        currentParts.forEach((p, i) => {
            const tr = document.createElement('tr');
            if (p.isEditing) {
                tr.innerHTML = `
                    <td><input type="text" class="form-input" value="${p.desc}" placeholder="Ex: Filtro de Óleo" oninput="updateMaintItem('part',${i},'desc',this.value)"></td>
                    <td><input type="number" class="form-input" value="${p.price === 0 ? '' : p.price}" placeholder="0.00" oninput="updateMaintItem('part',${i},'price',this.value)"></td>
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
        const total = currentServices.reduce((s,x)=>s+(x.price || 0),0) + currentParts.reduce((s,x)=>s+(x.price || 0),0);
        document.getElementById('maint-total-price').textContent = `R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        if (window.lucide) lucide.createIcons();
    };

    window.toggleMaintEdit = (t, i, state) => {
        const list = t === 'service' ? currentServices : currentParts;
        list[i].isEditing = state;
        renderMaintItems();
    };

    window.updateMaintItem = (t, i, f, v) => {
        const list = t === 'service' ? currentServices : currentParts;
        list[i][f] = f === 'price' ? (parseFloat(v) || 0) : v;
        const total = currentServices.reduce((s,x)=>s+x.price,0) + currentParts.reduce((s,x)=>s+x.price,0);
        document.getElementById('maint-total-price').textContent = `R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
    };

    window.removeMaintItem = (t, i) => { if(t==='service') currentServices.splice(i,1); else currentParts.splice(i,1); renderMaintItems(); };

    document.getElementById('add-service-row')?.addEventListener('click', () => { currentServices.push({desc:'', price:0, isEditing: true}); renderMaintItems(); });
    document.getElementById('add-part-row')?.addEventListener('click', () => { currentParts.push({desc:'', price:0, isEditing: true}); renderMaintItems(); });

    document.getElementById('save-maintenance')?.addEventListener('click', async () => {
        const vId = document.getElementById('maint-vehicle-select').value;
        const vehicle = vehicles.find(v => v.id == vId);
        const km = parseInt(document.querySelector('#manutencao input[placeholder="0"]').value);
        const date = document.querySelector('#manutencao input[type="date"]').value;

        if (!vId) return alert('Selecione um veículo.');
        const total = currentServices.reduce((s,x)=>s+x.price,0) + currentParts.reduce((s,x)=>s+x.price,0);
        if (total === 0) return alert('Adicione itens.');

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            // Combine all descriptions
            const allDescs = [];
            currentServices.forEach(s => { if(s.desc) allDescs.push(s.desc); });
            currentParts.forEach(p => { if(p.desc) allDescs.push(p.desc); });
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
            currentServices = []; currentParts = []; renderMaintItems();
            alert('Registro salvo com sucesso!');
            navigateTo('dashboard');
        } catch (error) {
            alert('Erro ao salvar manutenção: ' + error.message);
        }
    });

    const maintTabs = document.getElementById('maint-tabs');
    if (maintTabs) {
        maintTabs.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                maintTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.getElementById('services-table-container').style.display = tab === 'services' ? 'block' : 'none';
                document.getElementById('parts-table-container').style.display = tab === 'parts' ? 'block' : 'none';
            });
        });
    }

    // Initial load
    document.querySelector('.search-box input')?.addEventListener('input', (e) => renderVehicles(e.target.value));
    document.querySelector('#manutencao input[type="date"]').valueAsDate = new Date();
    
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

    document.getElementById('btn-reset-system')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('ATENÇÃO: Isso apagará TODOS os veículos e manutenções permanentemente. Deseja continuar?')) {
            localStorage.clear();
            location.reload();
        }
    });

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
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8', callback: (v) => 'R$ ' + v.toLocaleString() }
                    },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
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
                    backgroundColor: hasData ? ['#3b82f6', '#10b981', '#f59e0b'] : ['#1e293b'],
                    borderWidth: 0,
                    hoverOffset: hasData ? 10 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15, font: { size: 11 } } } },
                cutout: '70%'
            }
        });
    }

    function showVehicleDetails(v) {
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        document.getElementById('detalhes-veiculo').classList.add('active');
        document.getElementById('view-title').textContent = 'Detalhes do Veículo';

        document.getElementById('detail-model').textContent = v.model;
        document.getElementById('detail-brand').textContent = `${v.brand} • ${v.year} • ${v.color} • Chassi: ${v.chassi}`;
        document.querySelector('.plate-badge').textContent = v.plate;
        document.getElementById('detail-km').textContent = `${v.km.toLocaleString()} km`;

        const history = document.getElementById('vehicle-history');
        history.innerHTML = (v.history && v.history.length) ? '' : '<p>Sem histórico.</p>';
        (v.history || []).forEach(h => {
            history.innerHTML += `<div class="timeline-item">
                <div style="display:flex; justify-content:space-between;"><strong>${h.service}</strong><span>${h.date}</span></div>
                <p style="color:var(--text-secondary);">Custo: R$ ${h.cost.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
            </div>`;
        });
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
                    'Authorization': 'Basic ' + btoa('strsat:123456'),
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
        document.getElementById('loc-apelido').textContent = apelido || 'Veículo';
        
        const token = await getAstransatToken();
        if (!token) {
            loading.innerHTML = '<p class="text-danger" style="margin-top: 1rem;">Erro de autenticação com o satélite.</p>';
            return;
        }

        try {
            const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const res = await fetch(`https://posicoesgetrak.astransat.com.br/localizacao/${cleanPlate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Não foi possível obter a localização');
            const result = await res.json();
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
            mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
            
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

});
