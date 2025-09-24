from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn

# Load embedding model once on startup
model = SentenceTransformer("all-MiniLM-L6-v2")

# FastAPI app
app = FastAPI(title="Embedding Service")

# Request schema
class TextIn(BaseModel):
    text: str

# Response schema
class EmbeddingOut(BaseModel):
    embedding: list[float]

@app.post("/embed", response_model=EmbeddingOut)
def embed_text(payload: TextIn):
    """Return 384-dim embedding for input text"""
    embedding = model.encode(payload.text).tolist()
    return EmbeddingOut(embedding=embedding)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
