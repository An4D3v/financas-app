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
      "- merchant: nome do estabelecimento/loja (ou de quem enviou/recebeu, em comprovantes)\n" +
      "- date: data da compra em YYYY-MM-DD; se nao achar, string vazia\n" +
      "- items: REGRA PRINCIPAL — para uma nota/cupom/comprovante de UMA compra, retorne APENAS UM item: value = o VALOR TOTAL FINAL da nota (o 'total', 'total a pagar', 'valor total' ou 'valor pago'), e description = o nome da loja (ou 'Compra'). NAO liste os produtos um a um. NUNCA retorne preco unitario, quantidade, subtotal, impostos/tributos, descontos, troco nem forma de pagamento como itens — esses valores nao viram lancamentos; so o total final conta.\n" +
      "  EXCECAO: se a imagem for claramente um EXTRATO ou lista de transacoes SEPARADAS e independentes (varias compras/recebimentos distintos, geralmente com datas/descricoes proprias), ai sim retorne um item para CADA transacao independente — mas nunca os itens internos de uma mesma compra.\n" +
      "- Para cada item retorne tambem: value (numero com ponto decimal, ex 187.40), category (escolha exatamente UMA da lista: " +
      cats.join("; ") +
      ") e type.\n" +
      "- type: \"saida\" (gasto/despesa/compra/pagamento/debito) ou \"entrada\" (receita/recebimento/deposito/PIX recebido/transferencia recebida/salario/venda/credito). A maioria das notas e gasto (saida). Na duvida, use \"saida\".\n" +
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
                  type: { type: "string", enum: ["entrada", "saida"] },
                },
                required: ["description", "value", "category", "type"],
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
