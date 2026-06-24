import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return jsonResponse({ error: "use POST" }, 405);

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return jsonResponse({ error: "GEMINI_API_KEY nao configurada no Supabase" }, 500);

    const { image, mimeType, categories } = await req.json();
    if (!image) return jsonResponse({ error: "imagem ausente" }, 400);

    const cats: string[] = Array.isArray(categories) ? categories : [];
    const prompt =
      "Voce le notas fiscais e cupons fiscais brasileiros. Analise a imagem e extraia:\n" +
      "- merchant: nome do estabelecimento (loja)\n" +
      "- total: valor TOTAL pago, como numero (use ponto decimal, ex 12.34)\n" +
      "- date: data da compra no formato YYYY-MM-DD; se nao encontrar, retorne string vazia\n" +
      "- category: escolha exatamente UMA categoria desta lista que melhor descreve a compra: " +
      cats.join("; ") +
      "\nSe a imagem nao for uma nota/cupom, retorne total 0 e merchant vazio.";

    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType || "image/jpeg", data: image } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            merchant: { type: "string" },
            total: { type: "number" },
            date: { type: "string" },
            category: { type: "string" },
          },
          required: ["merchant", "total", "date", "category"],
        },
      },
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) {
      return jsonResponse({ error: "Gemini: " + (data?.error?.message ?? r.status) }, 502);
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return jsonResponse({ error: "resposta da IA nao foi JSON", raw: text }, 502);
    }
    return jsonResponse(parsed);
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
