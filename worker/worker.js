// Cloudflare Worker — dùng Workers AI (miễn phí, tích hợp sẵn trong tài khoản Cloudflare, không bị chặn vùng miền).
// Deploy: xem hướng dẫn README đi kèm.

const WORKERS_AI_MODEL = '@cf/meta/llama-3.2-3b-instruct';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { system, userContent, maxTokens } = body;
    if (!userContent) return json({ error: 'Missing userContent' }, 400);

    if (!env.AI) return json({ error: 'Server missing AI binding' }, 500);

    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: userContent });

    let result;
    try {
      result = await env.AI.run(WORKERS_AI_MODEL, {
        messages,
        max_tokens: maxTokens || 800,
        temperature: 0.4,
        repetition_penalty: 1.3,
        frequency_penalty: 0.4,
      });
    } catch (e) {
      return json({ error: 'Workers AI error: ' + (e?.message || String(e)) }, 502);
    }

    const text = result?.response || '{}';
    return json({ text });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
