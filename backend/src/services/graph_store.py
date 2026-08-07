"""
BCOS Platform — Graph Store (Stub)

Wraps Neo4j for knowledge graph queries and visualization.
This is a STUB for Phase 0 — full implementation comes in Phase 2.

The interface is defined now so the API routes can be built against it.
"""

from typing import Any, Dict, List, Optional

import structlog

from ..config import settings

logger = structlog.get_logger("bcos.graph_store")


class GraphStore:
    """
    Knowledge graph via Neo4j.
    Phase 0: Returns mock graph data for D3 visualization.
    Phase 2: Full Neo4j integration with Cypher queries.
    """

    def __init__(self):
        self._driver = None
        self._initialized = False

    async def initialize(self):
        """Initialize Neo4j driver."""
        try:
            from neo4j import AsyncGraphDatabase

            self._driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            )
            # Verify connectivity
            async with self._driver.session() as session:
                await session.run("RETURN 1")
            self._initialized = True
            logger.info("Graph store initialized", uri=settings.NEO4J_URI)
        except ImportError:
            logger.warning("neo4j driver not installed — graph features disabled")
        except Exception as e:
            logger.warning("Graph store initialization failed", error=str(e))

    async def close(self):
        """Close Neo4j driver."""
        if self._driver:
            await self._driver.close()

    async def get_graph_data(
        self, department: Optional[str] = None
    ) -> Dict[str, List]:
        """
        Get graph data in D3-compatible format: {nodes: [...], links: [...]}.
        Phase 0: Returns data built from the database (no Neo4j required).
        """
        # Phase 0 stub — in Phase 2, this queries Neo4j
        return {"nodes": [], "links": []}

    async def build_graph_from_modules(
        self, modules: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """
        Build/rebuild the Neo4j graph from parsed module data.
        Returns counts of nodes and relationships created.
        """
        if not self._initialized:
            logger.warning("Graph store not initialized, skipping build")
            return {"nodes_created": 0, "relationships_created": 0}

        nodes_created = 0
        rels_created = 0

        try:
            async with self._driver.session() as session:
                # Clear existing graph
                await session.run("MATCH (n) DETACH DELETE n")

                for mod in modules:
                    # Create Department node
                    await session.run(
                        "MERGE (d:Department {name: $dept})",
                        dept=mod["department"],
                    )

                    # Create Module node
                    await session.run(
                        """
                        MERGE (m:Module {slug: $slug})
                        SET m.name = $name,
                            m.department = $department,
                            m.description = $description
                        """,
                        slug=mod["slug"],
                        name=mod["name"],
                        department=mod["department"],
                        description=mod.get("description", ""),
                    )
                    nodes_created += 1

                    # Link module to department
                    await session.run(
                        """
                        MATCH (m:Module {slug: $slug})
                        MATCH (d:Department {name: $dept})
                        MERGE (m)-[:BELONGS_TO]->(d)
                        """,
                        slug=mod["slug"],
                        dept=mod["department"],
                    )
                    rels_created += 1

                    # Create cross-reference edges
                    for ref in mod.get("cross_references", []):
                        await session.run(
                            """
                            MATCH (s:Module {slug: $source})
                            MERGE (t:Module {slug: $target})
                            MERGE (s)-[:RELATED_TO {type: $rel_type}]->(t)
                            """,
                            source=mod["slug"],
                            target=ref["target_slug"],
                            rel_type=ref.get("relationship_type", "related_to"),
                        )
                        rels_created += 1

            logger.info(
                "Graph built",
                nodes=nodes_created,
                relationships=rels_created,
            )
        except Exception as e:
            logger.error("Graph build failed", error=str(e))

        return {
            "nodes_created": nodes_created,
            "relationships_created": rels_created,
        }

    @property
    def is_available(self) -> bool:
        return self._initialized
