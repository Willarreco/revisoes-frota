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

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const token = await getInstantAidToken();
        const headers = {
            'apikey': INSTANT_AID_KEY,
            'Authorization': `Bearer ${token}`
        };

        // Buscar chamados do prestador ASTRANLOG no Instant Aid Flow
        const chamadosRes = await fetch(`${INSTANT_AID_URL}/rest/v1/chamados?prestador=ilike.*astranlog*&order=created_at.desc`, { headers });
        
        if (!chamadosRes.ok) {
            return res.status(chamadosRes.status).json({ error: 'Erro ao buscar chamados da Astranlog' });
        }

        const chamados = await chamadosRes.json();

        // Filtrar apenas chamados finalizados do histórico de atendimento (atendidos e concluídos)
        const finalizados = chamados.filter(c => {
            const st = (c.status || '').toLowerCase();
            const sit = (c.situacao || '').toLowerCase();

            if (st === 'cancelado' || st === 'negado' || st === 'recusado' || st === 'em_andamento' || st === 'aberto' || st === 'pendente') {
                return false;
            }
            if (sit === 'cancelado' || sit === 'negado' || sit === 'aberto' || sit === 'em_andamento') {
                return false;
            }

            const isAtendido = st === 'atendido' || st === 'concluido' || st === 'finalizado' || st === 'realizado';
            const isFinalState = sit === 'finalizado' || sit === 'aguardando_pagamento' || sit === 'pago' || c.finalizado_em != null;

            return isAtendido && isFinalState;
        });

        const records = finalizados.map(c => {
            const fullText = JSON.stringify(c).toUpperCase();
            let targetPlate = null;

            if (fullText.includes('FCF5J84')) {
                targetPlate = 'FCF5J84';
            } else if (fullText.includes('QRD9G90')) {
                targetPlate = 'QRD9G90';
            } else {
                const serv = (c.servico || '').toLowerCase();
                const mot = (c.motivo || c.motivo_final || '').toLowerCase();
                if (serv.includes('extra pesado') || serv.includes('pesado') || serv.includes('moviment') || mot.includes('tombamento')) {
                    targetPlate = 'QRD9G90';
                } else {
                    targetPlate = 'FCF5J84';
                }
            }



            const protocolo = c.protocolo || (c.id ? c.id.slice(0, 8) : 'ASS');
            const cleanPlacaSoc = cleanPlate(c.placa);
            const placaAtendida = cleanPlacaSoc !== '---' ? cleanPlacaSoc : (c.placa || '---');
            const segurado = c.segurado || 'Cliente';
            const servico = c.servico || 'Socorro';
            const motivo = c.motivo_final || c.motivo || 'Atendimento';
            const origem = [c.origem_cidade, c.origem_estado].filter(Boolean).join('-') || c.origem || 'N/I';
            const destino = [c.destino_cidade, c.destino_estado].filter(Boolean).join('-') || c.destino || 'N/I';

            return {
                external_id: c.id,
                protocolo,
                placa: targetPlate,
                placa_socorrida: cleanPlacaSoc,
                motorista: c.finalizado_por || c.usuario_abertura || 'Motorista Astranlog',
                valor_cobrado: parseFloat(c.valor_servico) || 0,
                status: 'Finalizado',
                data_inicio: c.data_abertura || c.created_at,
                data_fim: c.finalizado_em || c.updated_at || c.created_at,
                observacoes: `[Instant Aid Flow ${protocolo}] Socorro Placa: ${placaAtendida} (${segurado}) - ${servico} (${motivo}). Origem: ${origem} -> Destino: ${destino}`,
                placa_atendida: placaAtendida,
                segurado
            };
        });

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
