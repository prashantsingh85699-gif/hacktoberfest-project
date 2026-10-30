import { withErrors, HttpError } from '../server/lib/http.js';
import { checkRateLimit } from '../server/lib/rateLimit.js';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT_CHATBOT = `You are ExpiryBot, the interactive AI guide and packaging expert for ExpiryWatch AI.
Your purpose is to guide users step-by-step on how to inspect products, understand packaging expiration rules, and interpret results.

CRITICAL HONESTY CONTRACT RULES (NEVER VIOLATE):
1. Never invent or speculate an expiration date for any product.
2. Never tell the user that any product is "safe to eat" or "safe to use". Say: "No expiry problem was detected on the packaging, but packaging inspection does not guarantee chemical, bacterial, or microbiological safety."
3. If the user asks about prescription medicines or drugs with missing/unreadable dates, immediately advise them to consult a licensed pharmacist or physician.
4. Non-Perishable Goods: If the user asks about electronics, computer mice, keyboards, wires, or durable goods, explain clearly that durable hardware does not spoil or expire over time.
5. Truth Ladder Hierarchy: Explain the 5 levels if asked:
   - PRINTED: Directly printed date (EXP / Best Before) verified by OCR + Gemini vision.
   - LABEL_RULE: Deterministically calculated from packaging text (e.g., "Best before 24 months from MFG") + confirmed MFG date.
   - MANUFACTURER_CONFIRMED: Batch-specific expiration verified directly from official manufacturer or regulator database.
   - CALCULATED: Derived from a confirmed MFG date and a verbatim manufacturer shelf-life claim.
   - UNKNOWN: Refuses to guess when evidence is missing.

BEHAVIOR:
- Respond in the language used by the user (English, Hindi, or Hinglish).
- Keep answers concise, friendly, visually structured with bullet points and bold highlights.
- Give actionable step-by-step tips for taking clear photos (lighting, avoiding glare, finding embossed lot numbers on crimps/bottoms).`;

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp, 'chat', 20)) {
    throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Too many questions in a short time. Please wait a few seconds.');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { message = 'How do I use ExpiryWatch?', history = [] } = body || {};
  const queryText = (typeof message === 'string' && message.trim().length > 0)
    ? message.trim()
    : 'How do I inspect a product?';

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // High-quality offline knowledge base fallback
    const offlineReply = getOfflineFaqResponse(message);
    return res.status(200).json({
      reply: offlineReply,
      source: 'offline-kb',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Format conversation history for Gemini
    const contents = [];
    for (const item of history.slice(-6)) {
      if (item.sender === 'user') {
        contents.push({ role: 'user', parts: [{ text: item.text }] });
      } else if (item.sender === 'bot') {
        contents.push({ role: 'model', parts: [{ text: item.text }] });
      }
    }

    contents.push({ role: 'user', parts: [{ text: queryText }] });

    const callPromise = (async () => {
      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: SYSTEM_PROMPT_CHATBOT,
              temperature: 0.3,
              maxOutputTokens: 600,
            },
          });
          if (response?.text) return response.text;
        } catch {
          // fallback to next model
        }
      }
      return null;
    })();

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 6000)
    );

    let replyText = await Promise.race([callPromise, timeoutPromise]);

    if (!replyText) {
      replyText = getOfflineFaqResponse(queryText);
    }

    return res.status(200).json({
      reply: replyText,
      source: 'gemini',
    });
  } catch (err) {
    return res.status(200).json({
      reply: getOfflineFaqResponse(message),
      source: 'fallback',
    });
  }
});

function getOfflineFaqResponse(query) {
  const q = query.toLowerCase();

  if (q.includes('step') || q.includes('kaise') || q.includes('how to') || q.includes('use') || q.includes('chala')) {
    return `**ExpiryWatch AI ko use karne ke 4 aasan steps:**\n\n1. **Photograph Upload Karein**: 'Inspect Product' par click karein. Front packaging, back nutritional/ingredients label, aur embossed batch/date area ki clear photo lein.\n2. **AI & OCR Reading**: System aapki photo me se Tesseract OCR aur Gemini Vision se printed text extract karta hai.\n3. **Field Confirmation**: Agar date ambiguous hai (e.g. 05/06/2025), to system aapse verify karwata hai.\n4. **Verified Assessment**: System exact Truth Ladder status (PRINTED, LABEL_RULE, etc.) aur physical damage scan provide karta hai!`;
  }

  if (q.includes('mouse') || q.includes('computer') || q.includes('electronic') || q.includes('hardware')) {
    return `**Electronics & Non-Perishable Goods Policy:**\n\nComputer mouse, keyboard, electronics, aur durable goods expire ya spoil nahi hote. Isliye hamara system strictly in items ke liye expiration date fabricate nahi karta aur clearly non-perishable label karta hai.`;
  }

  if (q.includes('medicine') || q.includes('dawa') || q.includes('tablet') || q.includes('syrup')) {
    return `**Medicine & Pharmaceutical Safety:**\n\nMedicine packaging inspect karte waqt hum printed expiry date aur batch number ko cross-check karte hain. Agar date unreadable ya missing hai, to hamara system strict UNKNOWN declare karta hai aur licensed pharmacist se consult karne ki advice deta hai.`;
  }

  if (q.includes('batch') || q.includes('lot') || q.includes('kahan') || q.includes('where')) {
    return `**Stamped EXP / Batch Code Kahan Dhundhe:**\n\n- **Canned Goods / Tins**: Bottom ya rim par ink-jet se stamped hota hai.\n- **Bottles / Syrups**: Cap ke side ya neck par black dotted font me hota hai.\n- **Medicine Blisters**: Strip ke crimp edge par embossed (press kiya hua) hota hai.\n- **Tubes / Cosmetics**: Tube ke crimped end ya bottom seal par hota hai.`;
  }

  return `Main ExpiryWatch Assistant hoon! Aap mujhse step-by-step guidance, packaging inspection rules, batch code location, ya Truth Ladder levels ke baare me pooch sakte hain. Kya main aapko ek product inspect karne ka demo dikhaun?`;
}
