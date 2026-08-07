"""
BCOS Platform — Build Vector Index Script

Indexes all Markdown knowledge modules into Chroma vector database for semantic search.
Run: python scripts/build_vector_index.py
"""

import sys
from pathlib import Path

# Fix encoding on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

import chromadb
from src.config import settings
from src.services.knowledge_loader import KnowledgeLoader


def build_vector_index():
    print("=" * 60)
    print("BCOS Platform — Vector Index Builder")
    print("=" * 60)

    knowledge_path = Path(settings.KNOWLEDGE_BASE_PATH)
    print(f"Knowledge Base Path: {knowledge_path}")
    print(f"Chroma Directory:    {settings.CHROMA_PERSIST_DIR}")
    print(f"Collection Name:     {settings.CHROMA_COLLECTION_NAME}")
    print()

    # 1. Load modules
    print("[1/3] Parsing Markdown modules...")
    loader = KnowledgeLoader(knowledge_path)
    modules = loader.load_all()
    print(f"  [OK] Parsed {len(modules)} modules")

    if not modules:
        print("No modules found to index.")
        return

    # 2. Initialize Chroma
    print("[2/3] Initializing Chroma Client...")
    persist_dir = Path(settings.CHROMA_PERSIST_DIR)
    persist_dir.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(path=str(persist_dir))
    
    # Reset or get collection
    try:
        client.delete_collection(name=settings.CHROMA_COLLECTION_NAME)
        print("  [OK] Cleared existing collection")
    except Exception:
        pass

    collection = client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    # 3. Prepare documents and add
    print("[3/3] Generating embeddings and indexing...")
    documents = []
    metadatas = []
    ids = []

    for mod in modules:
        # Index full raw content / principles
        doc_id = f"mod_{mod.slug}"
        documents.append(mod.raw_content or f"{mod.name}\n{mod.description}\n{mod.purpose}")
        metadatas.append({
            "slug": mod.slug,
            "name": mod.name,
            "department": mod.department,
            "type": "module"
        })
        ids.append(doc_id)

        # Index individual principles for higher granularity
        for p in mod.principles:
            p_id = f"principle_{mod.slug}_{p.order_index}"
            documents.append(f"Principle: {p.title}\n{p.description}")
            metadatas.append({
                "slug": mod.slug,
                "module_name": mod.name,
                "department": mod.department,
                "type": "principle",
                "title": p.title
            })
            ids.append(p_id)

    # Batch add (Chroma handles up to 5400 docs per batch)
    batch_size = 500
    for i in range(0, len(documents), batch_size):
        end_idx = min(i + batch_size, len(documents))
        collection.add(
            documents=documents[i:end_idx],
            metadatas=metadatas[i:end_idx],
            ids=ids[i:end_idx],
        )
        print(f"  [Indexed] {end_idx}/{len(documents)} documents")

    print()
    print("=" * 60)
    print("Vector Index Built Successfully!")
    print(f"Total documents indexed: {len(documents)}")
    print("=" * 60)


if __name__ == "__main__":
    build_vector_index()
