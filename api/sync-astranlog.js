// Vercel Serverless Function: Auto-Sync Socorros Prestador Astranlog (Placas QRD9G90 e FCF5J84)
const INSTANT_AID_URL = 'https://syhdieqibyhlljahmrjp.supabase.co';
const INSTANT_AID_KEY = 'sb_publishable_OhZEQUt3cwUQ4wPMUBaonA_dJa07dci';
const ASTRANLOG_EMAIL = 'william.arreco@grupoastran.com.br';
const ASTRANLOG_PASS = 'Will@2026';

let cachedToken = null;
let cachedTokenExpiry = 0;

function cleanPlate(input) {
    if (!input || typeof input !== 'string') return '---';
    let s = input.trim();
    if (s === '' || s === '---') return '---';
    const match = s.match(/([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})/i);
    if (match) return match[1].replace('-', '').toUpperCase();
    s = s.split('(')[0].split('-')[0].trim().toUpperCase();
    if (s.length >= 7 && s.length <= 8 && /^[A-Z0-9]+$/.test(s)) return s;
    return '---';
}

async function getInstantAidToken() {
    if (cachedToken && Date.now() < cachedTokenExpiry) {
        return cachedToken;
    }

    const res = await fetch(`${INSTANT_AID_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'apikey': INSTANT_AID_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: ASTRANLOG_EMAIL,
            password: ASTRANLOG_PASS
        })
    });

    if (!res.ok) {
        throw new Error(`Falha na autenticação do Instant Aid Flow (${res.status})`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    cachedTokenExpiry = Date.now() + ((data.expires_in || 3600) - 300) * 1000;
    return cachedToken;
}

const ASTRANLOG_AUDITED_SERVICES = [
    {
        external_id: 'astran_01',
        protocolo: 'ASS20263598',
        placa: 'QRD9G90',
        placa_socorrida: 'OVK4F35',
        motorista: 'William Arreco',
        valor_cobrado: 40523.00,
        status: 'Finalizado',
        data_inicio: '2026-10-20T10:00:00.000Z',
        data_fim: '2026-10-20T16:00:00.000Z',
        observacoes: '[Instant Aid Flow ASS20263598] Socorro Placa: OVK4F35 (SAULO VIEIRA FARIAS) - Movimentação (Outros). Veículo: SCANIA/R-440. Prestador: ASTRANLOG (Pago R$ 40.523,00)',
        placa_atendida: 'OVK4F35',
        segurado: 'SAULO VIEIRA FARIAS'
    },
    {
        external_id: 'astran_02',
        protocolo: 'ASS20263439',
        placa: 'FCF5J84',
        placa_socorrida: 'PPX4651',
        motorista: 'Motorista Astranlog',
        valor_cobrado: 1.00,
        status: 'Finalizado',
        data_inicio: '2026-10-13T14:30:00.000Z',
        data_fim: '2026-10-13T17:00:00.000Z',
        observacoes: '[Instant Aid Flow ASS20263439] Socorro Placa: PPX4651 (JUVENAL PAVAO DA SILVA JUNIOR) - Transporte (Acidente). Veículo: RENAULT/SANDERO. Prestador: ASTRANLOG',
        placa_atendida: 'PPX4651',
        segurado: 'JUVENAL PAVAO DA SILVA JUNIOR'
    },
    {
        external_id: 'astran_03',
        protocolo: 'ASS20263434',
        placa: 'QRD9G90',
        placa_socorrida: 'ODG4G00',
        motorista: 'William Arreco',
        valor_cobrado: 22274.00,
        status: 'Finalizado',
        data_inicio: '2026-10-13T11:00:00.000Z',
        data_fim: '2026-10-13T15:30:00.000Z',
        observacoes: '[Instant Aid Flow ASS20263434] Socorro Placa: ODG4G00 (NORIVAL ANTONIO DE SOUZA) - Movimentação (Outros). Veículo: VOLVO/FH 440. Prestador: ASTRANLOG (Pago R$ 22.274,00)',
        placa_atendida: 'ODG4G00',
        segurado: 'NORIVAL ANTONIO DE SOUZA'
    },
    {
        external_id: 'astran_04',
        protocolo: 'ASS20263340',
        placa: 'QRD9G90',
        placa_socorrida: 'TOG5H34',
        motorista: 'Motorista Astranlog',
        valor_cobrado: 1.00,
        status: 'Finalizado',
        data_inicio: '2026-10-07T09:15:00.000Z',
        data_fim: '2026-10-07T12:00:00.000Z',
        observacoes: '[Instant Aid Flow ASS20263340] Socorro Placa: TOG5H34 (TRANS LIMA LTDA) - Guincho Extra Pesado (Pane Mecânica). Veículo: MERCEDES-BENZ/SPRINTER. Prestador: ASTRANLOG',
        placa_atendida: 'TOG5H34',
        segurado: 'TRANS LIMA LTDA'
    },
    {
        external_id: 'astran_05',
        protocolo: 'ASS20263328',
        placa: 'FCF5J84',
        placa_socorrida: 'PPX4651',
        motorista: 'Motorista Astranlog',
        valor_cobrado: 1.00,
        status: 'Finalizado',
        data_inicio: '2026-10-07T08:00:00.000Z',
        data_fim: '2026-10-07T11:00:00.000Z',
        observacoes: '[Instant Aid Flow ASS20263328] Socorro Placa: PPX4651 (JUVENAL PAVAO DA SILVA JUNIOR) - Transporte (Acidente). Veículo: RENAULT/SANDERO. Prestador: ASTRANLOG',
        placa_atendida: 'PPX4651',
        segurado: 'JUVENAL PAVAO DA SILVA JUNIOR'
    },
    {
        external_id: 'astran_06',
        protocolo: 'ASS20262949',
        placa: 'QRD9G90',
        placa_socorrida: 'RLH9D61',
        motorista: 'William Arreco',
        valor_cobrado: 400.00,
        status: 'Finalizado',
        data_inicio: '2026-09-17T14:00:00.000Z',
        data_fim: '2026-09-17T18:00:00.000Z',
        observacoes: '[Instant Aid Flow ASS20262949] Socorro Placa: RLH9D61 (PMW MARMORES GRANITOS LTDA) - Movimentação (Tombamento). Origem: Viana-ES -> Destino: Viana-ES',
        placa_atendida: 'RLH9D61',
        segurado: 'PMW MARMORES GRANITOS LTDA'
    },
    {
        external_id: 'astran_07',
        protocolo: 'ASS20262428',
        placa: 'QRD9G90',
        placa_socorrida: 'RMT8E55',
        motorista: 'William Arreco',
        valor_cobrado: 400.00,
        status: 'Finalizado',
        data_inicio: '2026-08-20T13:00:00.000Z',
        data_fim: '2026-08-20T16:30:00.000Z',
        observacoes: '[Instant Aid Flow ASS20262428] Socorro Placa: RMT8E55 (AMPLA PECAS E SERVICOS) - Guincho Extra Pesado (Outros). Origem: Viana-ES -> Destino: Cariacica-ES',
        placa_atendida: 'RMT8E55',
        segurado: 'AMPLA PECAS E SERVICOS'
    },
    {
        external_id: 'astran_08',
        protocolo: 'ASS20262344',
        placa: 'QRD9G90',
        placa_socorrida: 'OYJ2I32',
        motorista: 'William Arreco',
        valor_cobrado: 400.00,
        status: 'Finalizado',
        data_inicio: '2026-08-14T10:00:00.000Z',
        data_fim: '2026-10-14T14:00:00.000Z',
        observacoes: '[Instant Aid Flow ASS20262344] Socorro Placa: OYJ2I32 (ASTRANLOG TRANSPORTES E SERVIÇOS LTDA) - Movimentação (Outros). Origem: Viana-ES -> Destino: Cariacica-ES',
        placa_atendida: 'OYJ2I32',
        segurado: 'ASTRANLOG TRANSPORTES E SERVIÇOS LTDA'
    },
    {
        external_id: 'astran_09',
        protocolo: 'ASS20262184',
        placa: 'QRD9G90',
        placa_socorrida: 'MTS5835',
        motorista: 'William Arreco',
        valor_cobrado: 400.00,
        status: 'Finalizado',
        data_inicio: '2026-08-04T08:30:00.000Z',
        data_fim: '2026-08-04T12:00:00.000Z',
        observacoes: '[Instant Aid Flow ASS20262184] Socorro Placa: MTS5835 (PAULO DE ALMEIDA) - Guincho Extra Pesado (Pane Mecânica). Origem: Viana-ES -> Destino: Cariacica-ES',
        placa_atendida: 'MTS5835',
        segurado: 'PAULO DE ALMEIDA'
    },
    {
        external_id: 'astran_10',
        protocolo: 'ASS2026151',
        placa: 'FCF5J84',
        placa_socorrida: 'MSX1262',
        motorista: 'Motorista Astranlog',
        valor_cobrado: 11.00,
        status: 'Finalizado',
        data_inicio: '2026-05-05T09:00:00.000Z',
        data_fim: '2026-05-05T11:30:00.000Z',
        observacoes: '[Instant Aid Flow ASS2026151] Socorro Placa: MSX1262 (TRANSMARIANO TRANSPORTES LTDA) - Guincho Pesado (Pane Mecânica). Origem: Cariacica-ES -> Destino: Cariacica-ES',
        placa_atendida: 'MSX1262',
        segurado: 'TRANSMARIANO TRANSPORTES LTDA'
    }
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let records = [...ASTRANLOG_AUDITED_SERVICES];
        try {
            const token = await getInstantAidToken();
            if (token) {
                const headers = {
                    'apikey': INSTANT_AID_KEY,
                    'Authorization': `Bearer ${token}`
                };
                const chamadosRes = await fetch(`${INSTANT_AID_URL}/rest/v1/chamados?or=(prestador.ilike.*astran*,empresa.ilike.*astran*)&order=created_at.desc`, { headers });
                if (chamadosRes.ok) {
                    const chamados = await chamadosRes.json();
                    const finalizados = chamados.filter(c => {
                        const st = (c.status || '').toLowerCase();
                        const sit = (c.situacao || '').toLowerCase();
                        if (st === 'cancelado' || st === 'negado' || st === 'recusado' || st === 'em_andamento' || st === 'aberto' || st === 'pendente') return false;
                        if (sit === 'cancelado' || sit === 'negado' || sit === 'aberto' || sit === 'em_andamento') return false;
                        const isAtendido = st === 'atendido' || st === 'concluido' || st === 'finalizado' || st === 'realizado';
                        const isFinalState = sit === 'finalizado' || sit === 'aguardando_pagamento' || sit === 'pago' || c.finalizado_em != null;
                        return isAtendido && isFinalState;
                    });

                    for (const c of finalizados) {
                        const protocolo = c.protocolo || (c.id ? c.id.slice(0, 8) : 'ASS');
                        if (!records.some(r => r.protocolo === protocolo)) {
                            const fullText = JSON.stringify(c).toUpperCase();
                            let targetPlate = 'FCF5J84';
                            if (fullText.includes('FCF5J84')) targetPlate = 'FCF5J84';
                            else if (fullText.includes('QRD9G90')) targetPlate = 'QRD9G90';
                            else {
                                const serv = (c.servico || '').toLowerCase();
                                const mot = (c.motivo || c.motivo_final || '').toLowerCase();
                                if (serv.includes('extra pesado') || serv.includes('pesado') || serv.includes('moviment') || mot.includes('tombamento')) {
                                    targetPlate = 'QRD9G90';
                                }
                            }
                            const cleanPlacaSoc = cleanPlate(c.placa);
                            const placaAtendida = cleanPlacaSoc !== '---' ? cleanPlacaSoc : (c.placa || '---');
                            records.push({
                                external_id: c.id,
                                protocolo,
                                placa: targetPlate,
                                placa_socorrida: cleanPlacaSoc,
                                motorista: c.finalizado_por || c.usuario_abertura || 'Motorista Astranlog',
                                valor_cobrado: parseFloat(c.valor_servico) || 0,
                                status: 'Finalizado',
                                data_inicio: c.data_abertura || c.created_at,
                                data_fim: c.finalizado_em || c.updated_at || c.created_at,
                                observacoes: `[Instant Aid Flow ${protocolo}] Socorro Placa: ${placaAtendida} (${c.segurado || 'Cliente'}) - ${c.servico || 'Socorro'} (${c.motivo_final || c.motivo || 'Atendimento'}).`,
                                placa_atendida: placaAtendida,
                                segurado: c.segurado || 'Cliente'
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Sync live query notice:', e.message);
        }

        return res.status(200).json({
            success: true,
            total_finalizados: records.length,
            prestador: 'ASTRANLOG',
            placas_permitidas: ['QRD9G90', 'FCF5J84'],
            records
        });
    } catch (err) {
        console.error('Erro na API sync-astranlog:', err);
        return res.status(500).json({ error: err.message || 'Erro interno de sincronização' });
    }
}
