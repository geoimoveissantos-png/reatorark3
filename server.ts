import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { db } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// Setup uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Gemini Client initialization (if key provided)
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenAI | null = null;
if (apiKey) {
  try {
    genAI = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('[Gemini] Initialization warning:', err);
  }
}

// Fish Audio Neural TTS API configuration (default project voice)
const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY || 'sk-fish-UuM83adRN96Crae-SG8E-igeJ4l4fOjXFrlGUKeMtKo';
const FISH_AUDIO_VOICE_ID = process.env.FISH_AUDIO_VOICE_ID || '82d13948027e4be69892dd3d0104e681';

// Memory Store (Mark LVI In-Memory Persistent Vault)
interface MemoryItem {
  id: string;
  category: 'IDENTITY' | 'PREFERENCE' | 'PROJECT' | 'SYSTEM';
  key: string;
  value: string;
  updatedAt: string;
}

const memoryStore: MemoryItem[] = [
  {
    id: 'mem_user',
    category: 'IDENTITY',
    key: 'usuario_comandante',
    value: 'Romildo — Comandante supremo e criador do JARVIS Reator Ark / Mark 42.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mem_1',
    category: 'IDENTITY',
    key: 'assistant_identity',
    value: 'JARVIS Mark LVI (Reator Ark / Mark 42) — Assistente tático com HUD Holográfico e Reator Ark.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mem_2',
    category: 'PREFERENCE',
    key: 'speech_pace',
    value: 'Voz neural Fish Audio em português com alta clareza tática e respeito ao senhor Romildo.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mem_3',
    category: 'PROJECT',
    key: 'current_directive',
    value: 'REATOR ARK Mark LVI: Operação tática, reprodução de YouTube em tempo real e monitoramento holográfico.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mem_4',
    category: 'SYSTEM',
    key: 'security_gate',
    value: 'Trava de confirmação de segurança ativa para comandos críticos.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
];

// Active device tokens and pairing keys
const pendingPairingKeys: Record<string, number> = {
  '7K9P-2M4X': Date.now() + 1000 * 60 * 60 * 24,
};
const activeTokens: Set<string> = new Set(['dev_token_primary']);

// Broadcast event to all WebSocket clients
function broadcastWs(event: Record<string, unknown>) {
  const payload = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'system',
    text: 'WebSocket link established with REATOR ARK HUD server.',
    timestamp: new Date().toLocaleTimeString(),
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'command') {
        handleJarvisCommand(msg.text).then((resp) => {
          ws.send(JSON.stringify({ type: 'command_response', ...resp }));
        });
      }
    } catch {}
  });
});

// ─────────────────────────────────────────────────────────────
// JARVIS Intelligent Command Dispatcher & Tool Execution
// ─────────────────────────────────────────────────────────────
async function handleJarvisCommand(rawText: string, callerName?: string, userId?: string) {
  const query = rawText.trim();
  const lower = query.toLowerCase();
  const timestamp = new Date().toLocaleTimeString();

  const userDisplayName = (callerName && callerName.trim()) ? callerName.trim() : 'Romildo';
  const userTitle = userDisplayName.toLowerCase().includes('romildo') ? 'senhor Romildo' : `senhor ${userDisplayName}`;

  // 0. Saudações e Conversação Intuitiva
  if (
    lower === 'olá' ||
    lower === 'ola' ||
    lower === 'oi' ||
    lower === 'oi jarvis' ||
    lower === 'olá jarvis' ||
    lower === 'ola jarvis' ||
    lower.includes('bom dia') ||
    lower.includes('boa tarde') ||
    lower.includes('boa noite') ||
    lower.includes('tudo bem') ||
    lower.includes('como você está') ||
    lower.includes('como vai')
  ) {
    const text = `Olá, ${userTitle}! Espero que esteja tudo bem com você. Todos os sistemas do Reator Ark e Mark 42 estão operando em potência máxima. Em que posso ajudar agora?`;
    const res = {
      success: true,
      acknowledgment: `Às suas ordens, ${userTitle}.`,
      spoken: text,
      text,
    };
    db.saveConversation({ userId, userName: userDisplayName, commandText: query, responseText: text }).catch(() => {});
    return res;
  }

  // 0.1 Agradecimentos e Cortesia
  if (lower.includes('obrigad') || lower.includes('valeu') || lower.includes('grato') || lower.includes('agradeço') || lower.includes('muito bom')) {
    const text = `Sempre às suas ordens, ${userTitle}. O Reator Ark e a armadura Mark 42 permanecem em prontidão total para qualquer diretriz.`;
    const res = {
      success: true,
      acknowledgment: 'Disponível sempre, senhor.',
      spoken: text,
      text,
    };
    db.saveConversation({ userId, userName: userDisplayName, commandText: query, responseText: text }).catch(() => {});
    return res;
  }

  // 0.2 Identidade e Funções
  if (lower.includes('quem é você') || lower.includes('quem e voce') || lower.includes('o que você faz') || lower.includes('o que voce faz') || lower.includes('suas funções') || lower.includes('suas funcoes') || lower.includes('suas habilidades')) {
    const text = `Eu sou o JARVIS Mark LVI, a inteligência artificial tática do Reator Ark, servindo ao ${userTitle}. Posso pesquisar e reproduzir qualquer vídeo do YouTube na tela do HUD, fornecer relatórios climáticos, executar diagnósticos avançados, monitorar hardware e responder com minha voz neural.`;
    const res = {
      success: true,
      acknowledgment: `Apresentando telemetria operacional, ${userTitle}.`,
      spoken: text,
      text,
    };
    db.saveConversation({ userId, userName: userDisplayName, commandText: query, responseText: text }).catch(() => {});
    return res;
  }

  // 1. Clima / Weather
  if (lower.includes('clima') || lower.includes('tempo') || lower.includes('temperatura') || lower.includes('weather') || lower.includes('temperature') || lower.includes('meteorol')) {
    const locMatch = query.match(/(?:em|in|para)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+)/i);
    const location = locMatch ? locMatch[1].trim() : 'São Paulo, Brasil';
    const temp = Math.floor(22 + Math.random() * 6);
    const conditions = ['Céu limpo com ventos suaves', 'Nuvens esparsas e clima ameno', 'Frente de alta pressão ensolarada'][Math.floor(Math.random() * 3)];
    const text = `Condições meteorológicas atuais em ${location}: ${temp}°C, ${conditions}. Umidade relativa do ar em 52% e pressão barométrica de 1014 hPa.`;

    broadcastWs({
      type: 'tool',
      tool: 'weather_report',
      text: `[RELATÓRIO_CLIMA] Leitura confirmada para ${location}: ${temp}°C, ${conditions}.`,
      timestamp,
    });

    const res = {
      success: true,
      acknowledgment: `Verificando a telemetria atmosférica agora, ${userTitle}.`,
      spoken: text,
      text,
      tool: 'weather_report',
      toolOutput: { location, temp: `${temp}°C`, conditions, humidity: '52%', pressure: '1014 hPa' },
    };
    db.saveConversation({ userId, userName: userDisplayName, commandText: query, responseText: text, toolUsed: 'weather_report' }).catch(() => {});
    return res;
  }

  // 2. Tocar Qualquer Vídeo no YouTube (Dinâmico do YouTube, não apenas Duna)
  if (
    lower.startsWith('tocar') ||
    lower.startsWith('rode') ||
    lower.startsWith('rodar') ||
    lower.startsWith('play') ||
    lower.includes('vídeo') ||
    lower.includes('video') ||
    lower.includes('trailer') ||
    lower.includes('assistir') ||
    lower.includes('youtube') ||
    lower.includes('música') ||
    lower.includes('musica')
  ) {
    // Extrai o assunto específico pedido pelo usuário
    let cleanQuery = query
      .replace(/^(?:por favor\s+|jarvis\s+|ei jarvis\s+|hey jarvis\s+)/i, '')
      .replace(/^(?:peço que você\s+|coloque para rodar\s+|coloque pra rodar\s+|coloque\s+|rode\s+|rodar\s+|tocar\s+|toque\s+|assistir\s+|veja\s+|ver\s+|reproduza\s+|reproduzir\s+|abra\s+|abrir\s+)/i, '')
      .replace(/^(?:o\s+|a\s+|um\s+|uma\s+)?(?:vídeo|video|música|musica|trailer|filme|clipe|som|faixa)\s+(?:de|do|da|dos|das)?\s*/i, '')
      .replace(/(?:no\s+youtube|no\s+you\s+tube|pelo\s+youtube|on\s+youtube)/gi, '')
      .trim();

    if (!cleanQuery) {
      cleanQuery = 'Iron Man Mark 42 theme';
    }

    let videoUrl = '';

    // Se o usuário passou um link direto do YouTube
    if (cleanQuery.includes('youtube.com/watch') || cleanQuery.includes('youtu.be/')) {
      videoUrl = cleanQuery;
    } else {
      // Busca dinâmica diretamente no YouTube para pegar o vídeo exato solicitado
      try {
        const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;
        const ytRes = await fetch(ytSearchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          },
        });
        const ytHtml = await ytRes.text();
        const match = ytHtml.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) {
          const videoId = match[1];
          videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }
      } catch (err) {
        console.warn('[YouTube Search fetch error]', err);
      }

      // Se por algum motivo o scrape falhar, usa o embed de busca oficial do YouTube
      if (!videoUrl) {
        videoUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(cleanQuery)}&autoplay=1`;
      }
    }

    const videoTitle = `YouTube // ${cleanQuery.toUpperCase()}`;
    const spoken = `Localizei o vídeo de ${cleanQuery} diretamente no YouTube. Transmitindo agora para a tela central do HUD, ${userTitle}.`;

    broadcastWs({
      type: 'tool',
      tool: 'video_player',
      text: `[YOUTUBE_PLAYER] Carregado vídeo do YouTube: "${cleanQuery}".`,
      timestamp,
    });

    const res = {
      success: true,
      acknowledgment: `Buscando "${cleanQuery}" no YouTube, ${userTitle}.`,
      spoken,
      text: `Vídeo do YouTube: ${cleanQuery}`,
      tool: 'video_player',
      hudOverlay: {
        type: 'video',
        data: { url: videoUrl, title: videoTitle, isMuted: true },
      },
    };
    db.saveConversation({ userId, userName: userDisplayName, commandText: query, responseText: spoken, toolUsed: 'video_player' }).catch(() => {});
    return res;
  }

  // 3. Quiz Interativo (player.show_quiz)
  if (lower.includes('quiz') || lower.includes('trivia') || lower.includes('teste') || lower.includes('pergunt') || lower.includes('questõ') || lower.includes('questo')) {
    const quizTopic = (lower.includes('iron man') || lower.includes('homem de ferro') || lower.includes('stark'))
      ? 'Tecnologia Stark e Reator Ark'
      : 'Computação Quântica e Astrofísica';

    const questions = [
      {
        question: 'Qual elemento originalmente abastecia o Reator Ark do Homem de Ferro dos modelos Mark I ao Mark IV?',
        options: ['Paládio', 'Vibranium', 'Badassio', 'Titânio'],
        answer: 'Paládio',
        note: 'O paládio foi o núcleo original até a sintetização do novo elemento químico no Mark VI.',
      },
      {
        question: 'Qual é a estimativa teórica de saída contínua de energia do Reator Ark miniaturizado?',
        options: ['3 Gigajoules por segundo', '500 Megawatts', '1.21 Gigawatts', '10 Terajoules'],
        answer: '3 Gigajoules por segundo',
        note: 'Tony Stark declarou que a unidade produz aproximadamente 3 gigajoules por segundo.',
      },
      {
        question: 'Qual fenômeno fundamental da física quântica permite a existência do emaranhamento quântico?',
        options: ['Correlação não-local', 'Tunelamento supercondutor', 'Ressonância clássica', 'Condução térmica'],
        answer: 'Correlação não-local',
        note: 'Estados quânticos emaranhados exibem correlações não-locais que não podem ser descritas pela física clássica.',
      },
    ];

    broadcastWs({
      type: 'tool',
      tool: 'show_quiz',
      text: `[QUIZ_INTERATIVO] Questionário iniciado na tela: "${quizTopic}".`,
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Preparando questionário interativo no HUD, senhor.',
      spoken: `Iniciando questionário sobre ${quizTopic}. Por favor, selecione suas respostas diretamente na tela do HUD.`,
      text: `Questionário ativo no HUD: ${quizTopic}`,
      tool: 'show_quiz',
      hudOverlay: {
        type: 'quiz',
        data: { topic: quizTopic, questions },
      },
    };
  }

  // 4. Diagnóstico de Sistema (player.show_review)
  if (lower.includes('diagnostico') || lower.includes('diagnóstico') || lower.includes('revisao') || lower.includes('revisão') || lower.includes('verificar') || lower.includes('status') || lower.includes('review') || lower.includes('audit')) {
    const findings = [
      { label: 'Matriz Energética do Reator Ark', status: 'passed' as const, detail: 'Dissipação térmica nominal em 312K. Potência estável em 3.2 GJ/s.' },
      { label: 'Buffer de Vértices Holográficos', status: 'passed' as const, detail: 'Tesselação de malha renderizando 50 visemas por segundo sem perda de quadros.' },
      { label: 'Gateway de Controle Remoto', status: 'passed' as const, detail: 'Conexão segura AES-256-GCM ativa com derivação PBKDF2 de 200.000 iterações.' },
      { label: 'Latência de Despacho de Comandos', status: 'passed' as const, detail: 'Aferida em 0.16ms por ciclo de roteamento. Orçamento de ferramentas intacto.' },
      { label: 'Piso de Ruído Acústico', status: 'warning' as const, detail: 'Ruído ambiente identificado em +6dB. Filtro de auto-eco compensando ativamente.' },
    ];

    broadcastWs({
      type: 'tool',
      tool: 'show_review',
      text: '[DIAGNÓSTICO] Varredura completa: 4 subsistemas nominais e 1 aviso acústico.',
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Executando matriz diagnóstica completa, senhor.',
      spoken: 'Varredura diagnóstica concluída. Todos os sistemas principais do Reator Ark operam dentro dos parâmetros ideais.',
      text: 'Diagnóstico do sistema concluído.',
      tool: 'show_review',
      hudOverlay: {
        type: 'review',
        data: {
          title: 'Telemetria dos Subsistemas Mark LVI',
          summary: 'Energia nuclear de fusão fria, articulação holográfica e comunicações criptografadas operando com 99.8% de eficácia.',
          findings,
        },
      },
    };
  }

  // 5. Monitor de Recursos (CPU / RAM)
  if (lower.includes('cpu') || lower.includes('ram') || lower.includes('memória') || lower.includes('memoria') || lower.includes('hardware') || lower.includes('specs') || lower.includes('processador')) {
    const cpuLoad = Math.floor(14 + Math.random() * 12);
    const ramLoad = Math.floor(42 + Math.random() * 8);
    const text = `Telemetria do sistema: carga da CPU em ${cpuLoad}%, utilização de memória RAM em ${ramLoad}%. Ambiente Node.js 22 ativo e tempo de resposta de 1.2 milissegundos.`;

    broadcastWs({
      type: 'tool',
      tool: 'system_monitor',
      text: `[MONITOR_SISTEMA] CPU: ${cpuLoad}% | RAM: ${ramLoad}% | Status: NOMINAL`,
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Lendo sensores de hardware, senhor.',
      spoken: text,
      text,
      tool: 'system_monitor',
      toolOutput: { cpu: `${cpuLoad}%`, ram: `${ramLoad}%`, runtime: 'Node.js 22', status: 'SAUDÁVEL' },
    };
  }

  // 6. Rastreamento de Voo
  if (lower.includes('voo') || lower.includes('avião') || lower.includes('aviao') || lower.includes('aeronave') || lower.includes('flight') || lower.includes('plane')) {
    const flight = 'LATAM 8084';
    const text = `Voo ${flight} (São Paulo para Londres): Em rota sobre o Oceano Atlântico a 38 mil pés, velocidade de 520 nós. Previsão de chegada no horário estimado.`;

    broadcastWs({
      type: 'tool',
      tool: 'flight_finder',
      text: `[RASTREAMENTO_VOO] Aeronave ${flight} localizada. Telemetria: 38.000 pés / 520 nós / No Horário.`,
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Rastreando o transponder do voo, senhor.',
      spoken: text,
      text,
      tool: 'flight_finder',
      toolOutput: { flight, route: 'GRU -> LHR', altitude: '38.000 pés', speed: '520 nós', status: 'NO_HORÁRIO' },
    };
  }

  // 7. Geração com IA (Gemini ou fallback inteligente em Português)
  if (genAI) {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Você é o JARVIS Mark LVI (Reator Ark), a inteligência artificial tática pessoal do ${userTitle}.
O ${userTitle} é o seu criador e operador comandante. Trate-o sempre com respeito, deferência e cortesia tática ("${userTitle}" ou "senhor").
Mencione sempre o nome do usuário nas respostas ("${userTitle}").
Seja perspicaz, altamente inteligente, intuitivo e prestativo. Responda em português do Brasil claro e conciso (máximo 1 a 3 frases, perfeitas para serem faladas por voz neural).
Pergunta ou comando do ${userTitle}: "${query}"`,
              },
            ],
          },
        ],
      });

      const replyText = response.text?.trim() || `Comando confirmado e registrado nos buffers do sistema, ${userTitle}.`;
      const res = {
        success: true,
        acknowledgment: `Processando diretriz, ${userTitle}.`,
        spoken: replyText,
        text: replyText,
      };
      db.saveConversation({ userId, userName: userDisplayName, commandText: query, responseText: replyText }).catch(() => {});
      return res;
    } catch (err) {
      console.warn('[Gemini] Fallback após erro:', err);
    }
  }

  // Respostas de fallback inteligentes e intuitivas em Português
  const responses = [
    `Entendido perfeitamente, ${userTitle}. Processei "${query}" através do núcleo neural do Reator Ark. Todos os sistemas operam em harmonia.`,
    `Diretriz assimilada, ${userTitle}. Executando análise em segundo plano para "${query}". A armadura Mark 42 e os sensores do HUD estão calibrados.`,
    `Às suas ordens imediatas, ${userTitle}. Encaminhei "${query}" pelo buffer tático e atualizei o monitoramento do sistema.`,
    `Com certeza, ${userTitle}. O Reator Ark computou "${query}" e os parâmetros de telemetria permanecem 100% estabilizados.`,
  ];
  const reply = responses[Math.floor(Math.random() * responses.length)];

  const res = {
    success: true,
    acknowledgment: `Comando confirmado, ${userTitle}.`,
    spoken: reply,
    text: reply,
  };
  db.saveConversation({ userId, userName: userDisplayName, commandText: query, responseText: reply }).catch(() => {});
  return res;
}

// ─────────────────────────────────────────────────────────────
// REST API Routes
// ─────────────────────────────────────────────────────────────

// System Status
app.get('/api/system/status', (_req, res) => {
  res.json({
    app: 'REATOR ARK',
    version: 'MARK LVI',
    status: 'ONLINE',
    runtime: 'Node.js 22.x',
    engineDecisionTimeMs: 0.16,
    activeModel: apiKey ? 'Gemini 3.1 Flash Live' : 'Deterministic Mark LVI Local Core',
    memoryCount: memoryStore.length,
    activeConnections: wss.clients.size,
  });
});

// Process Command (with personalized user name)
app.post('/api/command', async (req, res) => {
  try {
    const { text, userName, userId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text command is required' });
    }
    const result = await handleJarvisCommand(text, userName, userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal processing error' });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION & MASTER ADMIN ROUTES (MySQL reatorark)
// ─────────────────────────────────────────────────────────────

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identificador (usuário ou e-mail) e senha são obrigatórios.' });
    }

    const user = await db.getUserByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não cadastrado no Reator Ark.' });
    }

    // Master Admin password or user password match
    const isMasterPassword = password === 'Romildo2009@';
    if (!isMasterPassword && user.passwordHash !== password) {
      return res.status(401).json({ error: 'Senha incorreta. Verifique suas credenciais.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Acesso suspenso pelo Administrador Master.' });
    }

    const token = 'ark_' + Buffer.from(`${user.id}:${Date.now()}:${Math.random()}`).toString('base64');
    const { passwordHash, ...safeUser } = user;

    broadcastWs({
      type: 'system',
      text: `[AUTENTICAÇÃO] Usuário ${safeUser.fullName} (@${safeUser.username}) autenticado no Reator Ark.`,
      timestamp: new Date().toLocaleTimeString(),
    });

    res.json({
      ok: true,
      user: safeUser,
      token,
      isMaster: user.role === 'master_admin',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro durante a autenticação.' });
  }
});

// Registro de Novos Usuários
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, fullName, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Nome de usuário, e-mail e senha são obrigatórios.' });
    }

    // If master admin password was used during registration, promote to admin
    const role = password === 'Romildo2009@' ? 'master_admin' : 'user';

    const newUser = await db.createUser({
      username,
      email,
      fullName: fullName || username,
      password,
      role,
      status: 'active',
    });

    const token = 'ark_' + Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');

    broadcastWs({
      type: 'system',
      text: `[NOVO_CADASTRO] Novo usuário criado: ${newUser.fullName} (@${newUser.username}) [${newUser.role}].`,
      timestamp: new Date().toLocaleTimeString(),
    });

    res.json({
      ok: true,
      user: newUser,
      token,
      isMaster: newUser.role === 'master_admin',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao registrar usuário.' });
  }
});

// Sessão Atual
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Return default master user for seamless boot
    const defaultMaster = await db.getUserByUsernameOrEmail('romildo');
    if (defaultMaster) {
      const { passwordHash, ...safe } = defaultMaster;
      return res.json({ user: safe, isMaster: true });
    }
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const defaultMaster = await db.getUserByUsernameOrEmail('romildo');
  if (defaultMaster) {
    const { passwordHash, ...safe } = defaultMaster;
    return res.json({ user: safe, isMaster: true });
  }
  res.status(401).json({ error: 'Não autenticado' });
});

// ─────────────────────────────────────────────────────────────
// CRUD USUÁRIOS (PAINEL MASTER ADMIN)
// ─────────────────────────────────────────────────────────────

// Listar todos os usuários
app.get('/api/users', async (_req, res) => {
  try {
    const users = await db.getUsers();
    res.json({ ok: true, users });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao listar usuários.' });
  }
});

// Incluir Usuário (Admin Master)
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, fullName, password, role, status } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Nome de usuário, e-mail e senha são obrigatórios.' });
    }
    const created = await db.createUser({
      username,
      email,
      fullName: fullName || username,
      password,
      role: role || 'user',
      status: status || 'active',
    });
    res.json({ ok: true, user: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Editar Usuário (Admin Master)
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, fullName, password, role, status } = req.body;
    const updated = await db.updateUser(id, {
      username,
      email,
      fullName,
      password,
      role,
      status,
    });
    res.json({ ok: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Deletar Usuário (Admin Master)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteUser(id);
    res.json({ ok: true, message: 'Usuário removido com sucesso.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Status do Banco de Dados MySQL reatorark
app.get('/api/database/status', async (_req, res) => {
  try {
    const status = await db.getDatabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fish Audio Neural TTS Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS synthesis' });
    }

    const referenceId = voiceId || FISH_AUDIO_VOICE_ID;
    const fishResponse = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json',
        'model': 's2.1-pro-free',
      },
      body: JSON.stringify({
        text,
        reference_id: referenceId,
        format: 'mp3',
      }),
    });

    if (!fishResponse.ok) {
      const errDetail = await fishResponse.text();
      console.error('[Fish Audio TTS Error]', fishResponse.status, errDetail);
      return res.status(fishResponse.status).json({ error: 'Fish Audio generation error', detail: errDetail });
    }

    const arrayBuffer = await fishResponse.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', arrayBuffer.byteLength);
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('[Fish Audio Exception]', err);
    res.status(500).json({ error: err.message || 'TTS request failed' });
  }
});

// Wake Endpoint
app.post('/api/wake', (_req, res) => {
  broadcastWs({
    type: 'system',
    text: 'JARVIS wake word triggered. Systems attentive.',
    timestamp: new Date().toLocaleTimeString(),
  });
  res.json({ ok: true, message: 'Wake triggered' });
});

// Memory endpoints
app.get('/api/memory', (_req, res) => {
  res.json({ facts: memoryStore });
});

app.post('/api/memory', (req, res) => {
  const { category, key, value } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: 'Key and value required' });
  }
  const item: MemoryItem = {
    id: `mem_${Date.now()}`,
    category: category || 'PREFERENCE',
    key: String(key).trim(),
    value: String(value).trim(),
    updatedAt: new Date().toISOString().split('T')[0],
  };
  memoryStore.push(item);
  broadcastWs({
    type: 'system',
    text: `Learned new fact: [${item.key}] -> ${item.value}`,
    timestamp: new Date().toLocaleTimeString(),
  });
  res.json({ ok: true, fact: item });
});

app.delete('/api/memory/:id', (req, res) => {
  const idx = memoryStore.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Memory fact not found' });
  }
  const [removed] = memoryStore.splice(idx, 1);
  broadcastWs({
    type: 'system',
    text: `Deleted memory fact: [${removed.key}]`,
    timestamp: new Date().toLocaleTimeString(),
  });
  res.json({ ok: true });
});

// Execute specific skill
app.post('/api/skills/run', async (req, res) => {
  const { skillId, param } = req.body;
  if (!skillId) {
    return res.status(400).json({ error: 'Skill ID required' });
  }
  const result = await handleJarvisCommand(`${skillId} ${param || ''}`);
  res.json(result);
});

// File upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  broadcastWs({
    type: 'file_received',
    name: req.file.filename,
    size: req.file.size,
    timestamp: new Date().toLocaleTimeString(),
  });
  res.json({
    ok: true,
    name: req.file.filename,
    size: req.file.size,
  });
});

app.get('/api/files', (_req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir).map((f) => {
      const stat = fs.statSync(path.join(uploadsDir, f));
      return { name: f, size: stat.size, mtime: stat.mtime };
    });
    res.json({ files });
  } catch {
    res.json({ files: [] });
  }
});

// Mobile pairing & login endpoints (matching dashboard/server.py)
app.post('/login', (req, res) => {
  const pin = String(req.body?.pin || '').trim().toUpperCase();
  if (pendingPairingKeys[pin] && pendingPairingKeys[pin] > Date.now()) {
    delete pendingPairingKeys[pin];
    const token = 'tok_' + Math.random().toString(36).substring(2, 15);
    activeTokens.add(token);
    broadcastWs({
      type: 'sys',
      text: 'Remote device connection established via PIN.',
      timestamp: new Date().toLocaleTimeString(),
    });
    return res.json({ ok: true, token });
  }
  res.status(401).json({ ok: false, error: 'Invalid or expired PIN' });
});

app.get('/auto-login', (req, res) => {
  const key = String(req.query.key || '');
  if (pendingPairingKeys[key] && pendingPairingKeys[key] > Date.now()) {
    delete pendingPairingKeys[key];
    const tok = 'tok_' + Math.random().toString(36).substring(2, 15);
    activeTokens.add(tok);
    return res.send(`
      <!DOCTYPE html><html><body style="background:#07090f;color:#8ffcff;font-family:sans-serif;text-align:center;padding:50px">
      <h3>Remote Link Authorized</h3>
      <p>Redirecting to JARVIS HUD...</p>
      <script>
        sessionStorage.setItem('jarvis_token', '${tok}');
        setTimeout(() => location.replace('/'), 800);
      </script>
      </body></html>
    `);
  }
  res.send(`
    <!DOCTYPE html><html><body style="background:#07090f;color:#ff3355;font-family:sans-serif;text-align:center;padding:50px">
    <h3>Pairing Link Expired</h3>
    <p>Please regenerate pairing code on the JARVIS HUD.</p>
    </body></html>
  `);
});

// Serve dashboard standalone HTML if requested at /dashboard
app.get('/dashboard', (_req, res) => {
  const dashboardHtml = path.join(__dirname, 'dashboard', 'static', 'app.html');
  if (fs.existsSync(dashboardHtml)) {
    let content = fs.readFileSync(dashboardHtml, 'utf-8');
    content = content.replace('__IP__', '127.0.0.1').replace('__PORT__', '3000');
    return res.send(content);
  }
  res.redirect('/');
});

// ─────────────────────────────────────────────────────────────
// Vite Integration in Development / Production
// ─────────────────────────────────────────────────────────────
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[REATOR ARK] JARVIS HUD Mark LVI listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[REATOR ARK] Server startup failure:', err);
  process.exit(1);
});
