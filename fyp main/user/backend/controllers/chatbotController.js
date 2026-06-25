const FALLBACK_MESSAGE = 'I want to help, but I did not fully understand that. Please ask again in simple words about registration, login, biometrics, recovery, voting, candidates, or your dashboard.';

const SYSTEM_PROMPT = `
You are the official iVotePK voter assistant.

Role:
- Help only with iVotePK website usage and voter-facing guidance.
- Speak like a calm, friendly, helpful human support agent.
- Be concise, clear, and practical.

Website behavior and rules:
- The iVotePK website helps voters register securely, verify their identity, and vote in their own halqa district.
- Services include registration, email OTP verification, fingerprint and face biometric setup, security question recovery, and voter election/candidate information.
- Support channels: voters can use the ChatBot on the support page, email support@ivotepk.com for email help, or use the contact page for general enquiries.
- Registration flow: account details with CNIC and halqa selection -> OTP verification -> fingerprint registration -> face registration -> security questions.
- During registration, the voter enters CNIC. The first 5 CNIC digits detect the district. Only halqay for that detected district are shown, and the voter chooses one halqa. That saved halqa is permanent for voter-facing elections and candidates.
- After login, candidates and active elections are filtered by the voter saved halqa_id. Voters should only see candidates from their own saved halqa.
- Admin creates elections and candidates with district and halqa. The old constituency label is treated as the halqa/seat value.
- Both fingerprint and face registration are mandatory before registration is complete.
- Fingerprint registration uses the device sensor / platform authenticator and stores a cryptographic credential, not a raw fingerprint image.
- Face registration uses the webcam, guides the voter through positioning and multiple angles, and stores only encrypted face representations.
- Login flow: password first, then both fingerprint and face verification are required to complete secure access.
- If biometrics fail, access must be denied securely.
- Recovery path: Email OTP + security question, then re-register device biometrics from Security Settings.
- Shared-device guidance: recommend separate Windows/OS user profile or separate device for each person.
- Some actions, like district detection, page loading, fingerprint scanning, and face capture, may take a few seconds. Tell the user to wait calmly when the system is processing.

Behavior:
- If user greets you, greet them naturally.
- If user asks how to do something, answer step by step.
- If user asks about problems, explain the likely cause and the safest fix.
- If user asks something outside the iVotePK website, politely say you can help only with iVotePK website questions.
- If the question is unclear, reply exactly with: "${FALLBACK_MESSAGE}"
`;

const FAQS = [
  {
    key: 'greeting',
    patterns: ['hi', 'hello', 'hey', 'salam', 'assalam', 'how are you', 'who are you'],
    reply: () => 'Hello. I am the iVotePK assistant. I can help with registration, login, biometrics, account recovery, elections, candidates, and casting a vote.'
  },
  {
    key: 'registration',
    patterns: ['register', 'signup', 'sign up', 'create account', 'new account'],
    reply: () => 'To create a voter account: 1. Open Register. 2. Enter your name, CNIC, email, phone, and password. 3. The system detects your district from the first 5 CNIC digits. 4. Select one halqa from that district. 5. Verify OTP, register fingerprint, complete face scan, and save security questions.'
  },
  {
    key: 'halqa',
    patterns: ['halqa', 'halka', 'constituency', 'district', 'cnic prefix', 'cnic district'],
    reply: () => 'Your halqa is selected once during registration. The system reads the first 5 digits of your CNIC, detects your district, then shows only that district halqay. After login, you see elections and candidates only from your saved halqa.'
  },
  {
    key: 'fingerprint',
    patterns: ['fingerprint', 'finger scan', 'sensor', 'scan finger'],
    reply: () => 'Fingerprint registration uses your laptop or device sensor through the secure platform authenticator. The system stores a cryptographic credential only, not a raw fingerprint image. If the prompt shows the wrong option, cancel it and retry using the fingerprint method.'
  },
  {
    key: 'face',
    patterns: ['face', 'face id', 'webcam', 'camera', 'scan face'],
    reply: () => 'For face registration, allow camera access, keep your face centered, use good lighting, and follow the guided scan positions. The system captures encrypted face representations from multiple angles, not raw biometric images.'
  },
  {
    key: 'security-questions',
    patterns: ['security question', 'security questions'],
    reply: () => 'Security questions are the final step of registration. They stay locked until both fingerprint and face registration are complete. If the page is blocked, return to biometric setup and finish both scans first.'
  },
  {
    key: 'login',
    patterns: ['login', 'log in', 'sign in', 'authenticate'],
    reply: () => 'To log in: 1. Enter your account details. 2. Verify fingerprint using your device sensor. 3. Complete face verification with the camera. Access is granted only after both biometric checks succeed.'
  },
  {
    key: 'shared-device',
    patterns: ['friend laptop', 'same laptop', 'shared laptop', 'my friend', 'shared device'],
    reply: () => 'If another person wants to register on the same laptop, the safest option is a separate Windows or device user profile for that person, with their own Windows Hello setup. Using the same OS profile for multiple people is not recommended for biometric identity verification.'
  },
  {
    key: 'recovery',
    patterns: ['forgot password', 'recovery', 'recover', 'lost device', 'new device', 'otp'],
    reply: () => 'If you lose your device or cannot use biometrics, use the recovery flow with email OTP and your security question. After login, open Security Settings and re-register fingerprint and face on the current device.'
  },
  {
    key: 'voting',
    patterns: ['vote', 'voting', 'cast vote', 'ballot', 'receipt'],
    reply: () => 'To cast a vote: 1. Open Elections. 2. Choose the active election. 3. Review candidates. 4. Select your preferred candidate. 5. Answer your security questions. 6. Submit the secure ballot and keep the receipt.'
  },
  {
    key: 'candidates',
    patterns: ['candidate', 'candidates', 'party', 'parties'],
    reply: () => 'After login, candidate lists are filtered to your saved halqa. You can compare party affiliation, halqa, profile details, and promises before moving to the election and ballot flow.'
  },
  {
    key: 'dashboard',
    patterns: ['dashboard', 'profile', 'security settings'],
    reply: () => 'The voter dashboard shows your secure account status, quick links to parties, candidates, elections, and your security settings. Use Security Settings when you need to refresh biometrics on the current device.'
  },
];

const normalize = (value = '') => String(value).toLowerCase().trim();

const matchFaq = (message) => {
  const text = normalize(message);
  let best = null;

  FAQS.forEach((faq) => {
    let score = 0;
    faq.patterns.forEach((pattern) => {
      if (text.includes(pattern)) score += pattern.split(' ').length + 1;
    });

    if (!best || score > best.score) {
      best = { faq, score };
    }
  });

  return best && best.score > 0 ? best.faq : null;
};

const buildLocalReply = (message = '') => {
  const text = normalize(message);
  const isWebsiteQuestion = /(ivotepk|vote|voting|candidate|party|register|registration|login|fingerprint|face|biometric|otp|dashboard|security|device|webcam|camera|receipt|election|halqa|halka|constituency|district|cnic)/.test(text);

  if (!isWebsiteQuestion && !/(hi|hello|hey|salam|assalam|how are you|who are you)/.test(text)) {
    return 'I can help only with iVotePK website questions such as registration, biometric login, recovery, elections, candidates, and voting.';
  }

  const faq = matchFaq(text);
  if (faq) {
    return faq.reply(text);
  }

  if (!text) {
    return FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
};

const normalizeChatHistory = (history = []) => (
  Array.isArray(history)
    ? history
      .slice(-12)
      .map((entry) => ({
        role: entry?.role === 'assistant' || entry?.role === 'model' ? 'assistant' : 'user',
        content: String(entry?.text || entry?.content || '').slice(0, 1000)
      }))
      .filter((entry) => entry.content)
    : []
);

const callOpenAI = async ({ message, history, signal }) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    signal,
    body: JSON.stringify({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...normalizeChatHistory(history),
        { role: 'user', content: String(message) }
      ],
      temperature: 0.35,
      max_tokens: 420
    })
  });

  if (!response.ok) throw new Error('OpenAI request failed');
  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim();
};

const callClaude = async ({ message, history, signal }) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    signal,
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
      system: SYSTEM_PROMPT,
      messages: [
        ...normalizeChatHistory(history),
        { role: 'user', content: String(message) }
      ],
      temperature: 0.35,
      max_tokens: 420
    })
  });

  if (!response.ok) throw new Error('Claude request failed');
  const data = await response.json();
  return data?.content?.map((part) => part?.text || '').join('\n').trim();
};

const callGemini = async ({ message, history, signal }) => {
  const normalizedHistory = Array.isArray(history)
    ? history
      .slice(-12)
      .map((entry) => ({
        role: entry?.role === 'assistant' || entry?.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(entry?.text || entry?.content || '') }]
      }))
    : [];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash'}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          ...normalizedHistory,
          { role: 'user', parts: [{ text: String(message) }] }
        ],
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: 420
        }
      })
    }
  );

  if (!response.ok) throw new Error('Gemini request failed');
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n').trim();
};

exports.chatWithVoter = async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const provider = process.env.CHATBOT_PROVIDER || (
      process.env.OPENAI_API_KEY ? 'openai' :
        process.env.ANTHROPIC_API_KEY ? 'claude' :
          process.env.GEMINI_API_KEY ? 'gemini' :
            'fallback'
    );

    if (provider === 'fallback') {
      return res.status(200).json({
        success: true,
        reply: buildLocalReply(message),
        source: 'fallback'
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let reply;
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      reply = await callOpenAI({ message, history, signal: controller.signal });
    } else if ((provider === 'claude' || provider === 'anthropic') && process.env.ANTHROPIC_API_KEY) {
      reply = await callClaude({ message, history, signal: controller.signal });
    } else if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
      reply = await callGemini({ message, history, signal: controller.signal });
    }
    clearTimeout(timeout);

    return res.status(200).json({
      success: true,
      reply: reply || buildLocalReply(message),
      source: reply ? provider : 'fallback'
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      reply: buildLocalReply(req.body?.message || ''),
      source: 'fallback'
    });
  }
};
