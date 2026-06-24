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
      "Voce le notas fiscais, cupons fiscais e comprovantes brasileiros. Leia a imagem com MUITA atencao e extraia:\n" +
      "- merchant: nome do estabelecimento/loja\n" +
      "- date: data da compra em YYYY-MM-DD; se nao achar, string vazia\n" +
      "- items: a lista de valores/itens da nota. Para CADA item retorne: description (nome do produto ou do gasto), value (numero com ponto decimal, ex 12.34) e category (escolha exatamente UMA da lista: " +
      cats.join("; ") +
      ").\n" +
      "Se a nota tiver varios produtos/valores distintos, retorne um item para CADA um. Se houver apenas um valor (um total unico), retorne UM unico item com description igual ao nome da loja (ou 'Compra') e value igual ao total.\n" +
      "Se a imagem claramente nao for uma nota/cupom/comprovante, retorne items como lista vazia.";

    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-flash-lite-latest";
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
            date: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  value: { type: "number" },
                  category: { type: "string" },
                },
                required: ["description", "value", "category"],
              },
            },
          },
          required: ["merchant", "date", "items"],
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
      console.error("Gemini NAO-OK", r.status, "model", model, JSON.stringify(data?.error ?? data).slice(0, 600));
      return jsonResponse({ error: "Gemini: " + (data?.error?.message ?? r.status) }, 502);
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("resposta nao-JSON", String(text).slice(0, 400));
      return jsonResponse({ error: "resposta da IA nao foi JSON", raw: text }, 502);
    }
    console.log("scan resultado", JSON.stringify(parsed).slice(0, 400));
    return jsonResponse(parsed);
  } catch (e) {
    console.error("scan-receipt EXCECAO", String(e));
    return jsonResponse({ error: String(e) }, 500);
  }
});
