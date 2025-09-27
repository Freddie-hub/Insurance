import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import fs from "fs";
import path from "path";
import { adminDb } from "@/lib/firebaseAdmin"; // ✅ use Admin SDK

// Init Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.Index(process.env.PINECONE_INDEX!);

// Load JSON file once into memory
const chunksFile = path.join(
  process.cwd(),
  "src",
  "data",
  "processed",
  "all_product_chunks.json"
);
const chunksData: { chunk_id: string; metadata: any }[] = JSON.parse(
  fs.readFileSync(chunksFile, "utf-8")
);
const chunkMap = new Map(chunksData.map((c) => [c.chunk_id, c]));

// Call embedding service
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
  return data.embedding;
}

// ✅ Get last N messages from Firestore (Admin SDK version)
async function getChatHistory(chatId: string, limitCount = 15) {
  const snapshot = await adminDb
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("timestamp", "asc")
    .limit(limitCount)
    .get();

  return snapshot.docs.map((doc) => ({
    role: doc.data().role,
    content: doc.data().content,
  }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userQuery = body.query || body.message || body.content;
    const chatId = body.chatId;

    if (!userQuery || typeof userQuery !== "string") {
      return NextResponse.json(
        { error: "Query must be a string" },
        { status: 400 }
      );
    }

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required for memory" },
        { status: 400 }
      );
    }

    // Step 1: Embed query
    const queryVector = await getMiniLMEmbedding(userQuery);

    // Step 2: Query Pinecone
    const results = await index.query({
      vector: queryVector,
      topK: 30,
      includeMetadata: false,
    });

    // Step 3: Lookup metadata
    const relevantChunks = results.matches
      .map((m) => chunkMap.get(m.id))
      .filter(Boolean);

    // Step 4: Build context
    const context = relevantChunks
      .map(
        (c, i) =>
          `Result ${i + 1}:\nChunk ID: ${c?.chunk_id}\nMetadata:\n${JSON.stringify(
            c?.metadata,
            null,
            2
          )}`
      )
      .join("\n\n");

    // Step 5: Fetch conversation history
    const history = await getChatHistory(chatId);

    // Step 6: Send to DeepSeek
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

Guidelines:
- Always use the provided context to ground your answer.
- Highlight premiums, benefits, exclusions, waiting periods, payout timelines.
- Compare multiple relevant options clearly (bullet points or tables are allowed).
- If context is insufficient, say so politely and ask for clarification.
- Keep tone professional, clear, empathetic.
- Never invent product names or numbers not in context.
- Provide a short recommendation summary at the end.`,
          },
          ...history,
          {
            role: "user",
            content: `USER QUESTION:\n${userQuery}\n\nCONTEXT:\n${context}`,
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
      sources: relevantChunks.map((c) => ({
        chunk_id: c?.chunk_id,
        company_name: c?.metadata.company_name,
        product_name: c?.metadata.product_name ?? null,
      })),
    });
  } catch (err: any) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
