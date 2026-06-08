import OpenAI from "openai";
import { NextResponse } from "next/server";

const PROVIDERS = [
  {
    name: "Mistral",
    baseURL: "https://api.mistral.ai/v1",
    apiKey: () => process.env.MISTRAL_API_KEY,
    model: "pixtral-12b-2409",
  },
  {
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: () => process.env.OPENROUTER_API_KEY,
    model: "google/gemini-2.0-flash-exp:free",
  },
];

async function callProvider(
  provider: (typeof PROVIDERS)[number],
  prompt: string,
  image: string,
  mimeType: string
): Promise<string> {
  const apiKey = provider.apiKey();
  if (!apiKey) throw new Error(`Clé ${provider.name} manquante`);

  const client = new OpenAI({ baseURL: provider.baseURL, apiKey });

  const response = await client.chat.completions.create({
    model: provider.model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType || "image/jpeg"};base64,${image}` },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  return response.choices[0].message.content ?? "";
}

export async function POST(req: Request) {
  try {
    const { image, mimeType, mode } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 });
    }

    const isRamsay = mode === "ramsay";

    const prompt = isRamsay
      ? `Tu es Gordon Ramsay version designer web, brutal et sans pitié. Tu analyses des landing pages avec une franchise totale.
Tu utilises des métaphores culinaires, des expressions percutantes. Tu es cinglant mais tes conseils sont en or.

Analyse cette landing page de façon BRUTALE sur ces 3 axes :
- Hiérarchie visuelle (comment l'œil se déplace sur la page)
- Contraste, lisibilité et design global
- Clarté du message principal et efficacité du CTA

Réponds UNIQUEMENT avec ce JSON strict (pas de markdown, pas de backticks, juste le JSON brut) :
{"score": 5, "roast": "critique principale percutante en 2-3 phrases directes", "details": {"Hiérarchie visuelle": "analyse courte et directe", "Contraste & lisibilité": "analyse courte et directe", "Message & CTA": "analyse courte et directe"}, "actions": ["action prioritaire 1", "action prioritaire 2", "action prioritaire 3"], "tweet": "Tweet humoristique <100 caractères avec le score"}`
      : `Tu es un coach UX bienveillant et enthousiaste. Tu analyses des landing pages avec bienveillance mais sans mentir.
Tu vois le positif, tu encourages les efforts, et tu proposes des améliorations avec enthousiasme constructif.

Analyse cette landing page avec bienveillance sur ces 3 axes :
- Hiérarchie visuelle (comment l'œil se déplace sur la page)
- Contraste, lisibilité et design global
- Clarté du message principal et efficacité du CTA

Réponds UNIQUEMENT avec ce JSON strict (pas de markdown, pas de backticks, juste le JSON brut) :
{"score": 7, "roast": "feedback bienveillant et encourageant en 2-3 phrases", "details": {"Hiérarchie visuelle": "analyse positive et constructive", "Contraste & lisibilité": "analyse positive et constructive", "Message & CTA": "analyse positive et constructive"}, "actions": ["conseil d'amélioration 1", "conseil d'amélioration 2", "conseil d'amélioration 3"], "tweet": "Tweet enthousiaste <100 caractères avec le score"}`;

    let lastError: Error | null = null;

    for (const provider of PROVIDERS) {
      try {
        console.log(`Tentative via ${provider.name}...`);
        const text = await callProvider(provider, prompt, image, mimeType);

        const startJson = text.indexOf("{");
        const endJson = text.lastIndexOf("}") + 1;
        const jsonString = text.substring(startJson, endJson);

        return NextResponse.json(JSON.parse(jsonString));
      } catch (err: any) {
        console.warn(`${provider.name} échoué : ${err.message}`);
        lastError = err;
        // Continue vers le prochain provider
      }
    }

    throw lastError ?? new Error("Tous les providers ont échoué");
  } catch (error: any) {
    console.error("Erreur finale:", error.message);
    return NextResponse.json({ error: "L'IA a eu un bug. Réessaie." }, { status: 500 });
  }
}
