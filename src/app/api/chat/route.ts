import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

// Pinecone client
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.Index(process.env.PINECONE_INDEX!);

// Call your embedding service (MiniLM-L6-v2)
async function getMiniLMEmbedding(text: string): Promise<number[]> {
  const resp = await fetch(process.env.EMBEDDING_SERVICE_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!resp.ok) {
    throw new Error("Embedding service failed");
  }

  const data = await resp.json();
  return data.embedding; // [384 floats]
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query must be a string" }, { status: 400 });
    }

    // 1. Get embedding from MiniLM
    const queryVector = await getMiniLMEmbedding(query);

    // 2. Retrieve chunks from Pinecone (top 30)
    const results = await index.query({
      vector: queryVector,
      topK: 30,
      includeMetadata: true,
    });

    const context = results.matches
      .map(
        (m, i) =>
          `Result ${i + 1}:\nCompany: ${m.metadata?.company_id}\nProduct: ${m.metadata?.product_id}\nChunk ID: ${m.id}\nText: ${m.metadata?.text}`
      )
      .join("\n\n");

    // 3. Ask DeepSeek with improved prompt
    const resp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `
You are InsureAssist AI, a professional insurance advisor for the Kenyan market.
You help users compare, explain, and recommend insurance products such as motor, health, life, funeral, and general policies.

INSTRUCTIONS:
- Always use the provided context to ground your answer.
- Highlight key details: premiums, benefits, exclusions, waiting periods, and payout timelines.
- If multiple options are relevant, compare them clearly (you may use bullet points or a table).
- If the context lacks enough information, say so politely and suggest what the user could clarify.
- Keep the tone professional, clear, and empathetic — like a trusted advisor.
- Do not invent insurer names, products, or numbers not supported by the context.
- Summarize into a short recommendation after explaining options.
`,
          },
          {
            role: "user",
            content: `USER QUESTION:\n${query}\n\nCONTEXT:\n${context}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      throw new Error(`DeepSeek API failed: ${resp.statusText}`);
    }

    const completion = await resp.json();
    const answer = completion.choices[0].message?.content ?? "";

    return NextResponse.json({
      answer,
      sources: results.matches.map((m) => ({
        id: m.id,
        score: m.score,
        company_id: m.metadata?.company_id,
        product_id: m.metadata?.product_id,
        text: m.metadata?.text,
      })),
    });
  } catch (err: any) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
