"""
BCOS Platform — Vector Store (Stub)

Wraps Chroma for semantic search over knowledge embeddings.
This is a STUB for Phase 0 — full implementation comes in Phase 2.

The interface is defined now so the API routes can be built against it.
"""

from typing import Dict, List, Optional

import structlog

from ..config import settings

logger = structlog.get_logger("bcos.vector_store")


class VectorStore:
    """
    Semantic search via Chroma vector database.
    Phase 0: Returns empty results with a stub warning.
    Phase 2: Full embedding generation and ANN search.
    """

    def __init__(self):
        self._initialized = False
        self._collection = None

    async def initialize(self):
        """Initialize Chroma client and collection."""
        try:
            import chromadb

            client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            self._collection = client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            self._initialized = True
            logger.info(
                "Vector store initialized",
                collection=settings.CHROMA_COLLECTION_NAME,
                count=self._collection.count(),
            )
        except ImportError:
            logger.warning("chromadb not installed — vector search disabled")
        except Exception as e:
            logger.warning("Vector store initialization failed", error=str(e))

    async def search(
        self,
        query: str,
        max_results: int = 10,
        filters: Optional[Dict] = None,
    ) -> List[Dict]:
        """
        Perform semantic search.
        Returns list of {id, content, metadata, score}.
        """
        if not self._initialized or self._collection is None:
            logger.debug("Vector store not initialized, returning empty results")
            return []

        try:
            results = self._collection.query(
                query_texts=[query],
                n_results=max_results,
                where=filters,
            )

            items = []
            if results and results.get("documents"):
                for idx, doc in enumerate(results["documents"][0]):
                    items.append(
                        {
                            "id": results["ids"][0][idx] if results.get("ids") else "",
                            "content": doc,
                            "metadata": (
                                results["metadatas"][0][idx]
                                if results.get("metadatas")
                                else {}
                            ),
                            "score": (
                                1 - results["distances"][0][idx]
                                if results.get("distances")
                                else 0.0
                            ),
                        }
                    )
            return items

        except Exception as e:
            logger.error("Vector search failed", error=str(e))
            return []

    async def add_documents(
        self,
        documents: List[str],
        metadatas: List[Dict],
        ids: List[str],
    ):
        """Add documents to the vector store."""
        if not self._initialized or self._collection is None:
            logger.warning("Vector store not initialized, skipping add")
            return

        try:
            self._collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids,
            )
            logger.info("Documents added to vector store", count=len(documents))
        except Exception as e:
            logger.error("Failed to add documents", error=str(e))

    @property
    def is_available(self) -> bool:
        return self._initialized
