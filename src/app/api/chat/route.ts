import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import fs from "fs";
import path from "path";
import { adminDb } from "@/lib/firebaseAdmin";

// Pinecone Setup
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.Index(process.env.PINECONE_INDEX!);

// Load JSON Chunks into Memory
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

// Helper: Get MiniLM Embedding
async function getMiniLMEmbedding(text: string): Promise<number[]> {
  // Always resolve to /embed, even if ENV only has base URL
  const baseUrl = process.env.EMBEDDING_SERVICE_URL!;
  const url = baseUrl.endsWith("/") ? `${baseUrl}embed` : `${baseUrl}/embed`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!resp.ok) throw new Error(`Embedding service failed: ${resp.statusText}`);
  const data = await resp.json();
  return data.embedding;
}

// Helper: Fetch Chat History
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

// POST /api/chat
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

    // Generate embedding for query
    const queryVector = await getMiniLMEmbedding(userQuery);

    // Pinecone search
    const results = await index.query({
      vector: queryVector,
      topK: 30,
      includeMetadata: false,
    });

    const relevantChunks = results.matches
      .map((m) => chunkMap.get(m.id))
      .filter(Boolean);

    // Build retrieved context string
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

    const history = await getChatHistory(chatId);

    // DeepSeek request with improved system prompt
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
            content: `You are PolicyPilot, a professional insurance advisor for the Kenyan market. 
Your role is to provide accurate, clear, and empathetic advice by combining two sources of information:
1. Retrieved Context: Product-specific chunks from the database (priority source).
2. Foundational Knowledge: Your own insurance expertise and trusted, widely accepted information (laws, principles, Kenyan regulations) when the retrieved context is missing or incomplete.

Guidelines:
- Grounding Priority: Always rely on retrieved context for product-specific details (premiums, benefits, exclusions, waiting periods, payout timelines).
- Knowledge Integration: If context does not cover the full answer, seamlessly supplement with your foundational knowledge as a qualified insurance advisor.
- User-facing Wording: Do not mention “retrieved context” or “general knowledge.” Instead, phrase answers as “based on the available data” or give direct advisory responses.
- Comparisons: Use bullet points or tables for clarity when comparing products or explaining options.
- Clarity & Professionalism: Maintain a professional, empathetic, and helpful tone.
- Accuracy: Do not invent product names, figures, or details. Use general knowledge only for well-established facts and practices.
- User Guidance: If data is insufficient, politely explain the limitation and suggest clarification or next steps.
- Summary: Always end with a short, tailored recommendation relevant to the user’s query.`,
          },
          ...history,
          {
            role: "user",
            content: `USER QUESTION:\n${userQuery}\n\nAVAILABLE DATA:\n${context}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!resp.ok) {
      throw new Error(`DeepSeek API failed: ${resp.statusText}`);
    }

    const completion = await resp.json();
    const answer = completion.choices[0].message?.content ?? "";

    const chatRef = adminDb.collection("chats").doc(chatId);

    // Save only AI message (avoid duplication)
    await chatRef.collection("messages").add({
      role: "assistant",
      content: answer,
      timestamp: new Date(),
    });

    // Rename chat if still "New Chat"
    const chatDoc = await chatRef.get();
    if (chatDoc.exists) {
      const chatData = chatDoc.data();
      if (chatData?.chat_name === "New Chat") {
        await chatRef.update({
          chat_name:
            userQuery.length > 30
              ? userQuery.slice(0, 30) + "..."
              : userQuery,
          updatedAt: new Date(),
        });
      } else {
        await chatRef.update({ updatedAt: new Date() });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
