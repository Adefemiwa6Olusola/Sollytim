from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="TextSrat API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "TextSrat API is running"}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Textify API"}

# API Info endpoint
@app.get("/api/info")
async def api_info():
    return {
        "name": "Textify API",
        "version": "1.0.0",
        "description": "AI-powered text extraction from images",
        "features": [
            "Image upload support",
            "Text extraction using Tesseract.js",
            "Real-time processing feedback",
            "Copy to clipboard functionality"
        ]
    }

# Since we're using client-side Tesseract.js, we don't need complex backend processing
# The backend serves mainly as a health check and potential future enhancements

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)