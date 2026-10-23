/**
 * groqChat.js
 * Calls Groq API directly from the browser with 4-key rotation.
 * Falls back to the next key on 429 (rate limit) or 403 (quota).
 * Works in dev (Vite) and production without needing a backend proxy.
 */

const GROQ_KEYS = [
  import.meta.env.VITE_GROQ_KEY1,
  import.meta.env.VITE_GROQ_KEY2,
  import.meta.env.VITE_GROQ_KEY3,
  import.meta.env.VITE_GROQ_KEY4,
].filter(Boolean);

const SYSTEM_PROMPT = `You are the CDN Portal Assistant for Colegio De Naujan (CDN), a college in Naujan, Oriental Mindoro, Philippines.

You help students and staff with questions about:
- CDN E-Portal systems: CSC Services (student fines), OSAS (violation tracking), Admission Services / ECNESIS (enrollment)
- How to log in, navigate the portal, and reset passwords
- Departments: BSIS (Information Systems), BPA (Public Administration), BTVTED-WFT, BTVTED-CHS
- Enrollment procedures, academic year 2026-2027

Rules:
- Never reveal passwords or personal student data
- Keep answers short, friendly, and specific to CDN
- If unsure, direct to the registrar or department coordinator`;

/**
 * Send a message to Groq with automatic key rotation.
 * @param {Array} messages - array of {role, content} objects
 * @returns {Promise<string>} - the assistant reply
 */
export async function sendToGroq(messages) {
  if (GROQ_KEYS.length === 0) {
    throw new Error('No Groq API keys configured. Add VITE_GROQ_KEY1–4 to your .env file.');
  }

  let lastError = null;

  for (let i = 0; i < GROQ_KEYS.length; i++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_KEYS[i]}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
          ],
          max_tokens: 500,
          temperature: 0.65,
        }),
      });

      // Rate limited or quota exceeded — try next key
      if (res.status === 429 || res.status === 403) {
        const txt = await res.text();
        console.warn(`[Groq] Key ${i + 1} exhausted (${res.status}):`, txt.slice(0, 100));
        lastError = `Key ${i + 1} returned ${res.status}`;
        continue;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Groq error ${res.status}: ${txt.slice(0, 200)}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) throw new Error('Empty response from Groq');
      return reply;

    } catch (err) {
      // Network error or thrown above — try next key
      lastError = err.message;
      console.warn(`[Groq] Key ${i + 1} failed:`, err.message);
    }
  }

  throw new Error(`All Groq keys exhausted. Last error: ${lastError}`);
}
