users/{userId}/chats/{chatId} (document)
  chat_name: string
  created_at: timestamp
  last_updated: timestamp
  user_id: string
  last_message_preview: string (optional)
  last_sources: [ { chunk_id, company_name, product_name, score } ] (optional)
  meta: { model: 'deepseek-chat', ... } (optional)

users/{userId}/chats/{chatId}/messages/{msgId} (documents)
  sender: 'user' | 'assistant'
  content: string
  timestamp: timestamp (use serverTimestamp)
  sources: [ ... ] (optional, e.g., the results returned by your /api/chat)
  role_meta: { score, chunk_ids } (optional)
