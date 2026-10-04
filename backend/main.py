from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import runs, diagnose, eval, demo
from backend.storage import storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation
    storage.load()
    try:
        eval.validate_eval_data()
    except Exception as e:
        print(f"Evaluation dataset validation note: {e}")
    yield


app = FastAPI(
    title="Black Box API",
    description="Developer tool for diagnosing failures inside AI-agent execution traces",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Person C endpoints
app.include_router(runs.router)
app.include_router(diagnose.router)
app.include_router(eval.router)
app.include_router(demo.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "blackbox-api", "runs_loaded": len(storage._runs)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
