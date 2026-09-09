// Vercel Serverless Function: Proxy seguro para API Astransat / Getrak
let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAstransatToken() {
    if (cachedToken && Date.now() < cachedTokenExpiry) {
        return cachedToken;
    }

    const authHeader = process.env.ASTRANSAT_AUTH || Buffer.from('warreco.sat:123456').toString('base64');
    const res = await fetch('https://posicoesgetrak.astransat.com.br/auth/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    if (!res.ok) {
        throw new Error(`Erro de autenticação Astransat (${res.status})`);
    }

    const data = await res.json();
    cachedToken = data.token;
    cachedTokenExpiry = Date.now() + ((data.expires_in - 60) * 1000);
    return cachedToken;
}

export default async function handler(req, res) {
    // Permitir CORS básico
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { placa } = req.query;
    if (!placa) {
        return res.status(400).json({ error: 'Parâmetro placa é obrigatório' });
    }

    const cleanPlate = String(placa).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    try {
        const token = await getAstransatToken();
        const telemetriaRes = await fetch(`https://posicoesgetrak.astransat.com.br/localizacao/${cleanPlate}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!telemetriaRes.ok) {
            return res.status(telemetriaRes.status).json({
                error: `Erro ao buscar localização da placa ${cleanPlate}`
            });
        }

        const data = await telemetriaRes.json();
        return res.status(200).json(data);
    } catch (err) {
        console.error('Erro no proxy Astransat:', err);
        return res.status(500).json({ error: err.message || 'Erro interno ao consultar telemetria' });
    }
}
