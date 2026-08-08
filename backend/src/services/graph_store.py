"""
BCOS Platform — Graph Store Service

Wraps Neo4j for knowledge graph operations:
1. Rebuilding full graph (Departments, Modules, Principles, Rules, Cross-references).
2. Department subgraphs.
3. Module N-hop neighborhood traversals.
4. Shortest path finding between business modules.
5. D3-compatible JSON graph formatting with relational fallback.
"""

from typing import Any, Dict, List, Optional
import structlog
from ..config import settings

logger = structlog.get_logger("bcos.graph_store")


class GraphStore:
    def __init__(self):
        self._driver = None
        self._initialized = False

    async def initialize(self):
        """Initialize Neo4j driver connection."""
        try:
            from neo4j import AsyncGraphDatabase

            self._driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            )
            # Verify connection
            async with self._driver.session() as session:
                await session.run("RETURN 1")
            self._initialized = True
            logger.info("Neo4j graph store initialized successfully", uri=settings.NEO4J_URI)
        except ImportError:
            logger.warning("neo4j driver not installed — fallback graph mode enabled")
        except Exception as e:
            logger.warning("Neo4j graph store connection skipped/failed", error=str(e))

    async def close(self):
        """Close Neo4j driver connection."""
        if self._driver:
            await self._driver.close()

    @property
    def is_available(self) -> bool:
        return self._initialized

    async def build_graph_from_modules(
        self, modules: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """
        Build or rebuild full Neo4j knowledge graph from ingested module dicts.
        """
        if not self._initialized:
            logger.warning("Neo4j not connected, skipping graph build")
            return {"nodes_created": 0, "relationships_created": 0}

        nodes_created = 0
        rels_created = 0

        try:
            async with self._driver.session() as session:
                # Clear existing graph
                await session.run("MATCH (n) DETACH DELETE n")

                for mod in modules:
                    # Department node
                    await session.run(
                        "MERGE (d:Department {name: $dept})",
                        dept=mod["department"],
                    )

                    # Module node
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

                    # Module -> Department relationship
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

                    # Cross references
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

            logger.info("Neo4j graph populated successfully", nodes=nodes_created, relationships=rels_created)
        except Exception as e:
            logger.error("Failed to populate Neo4j graph", error=str(e))

        return {"nodes_created": nodes_created, "relationships_created": rels_created}

    async def get_module_neighbors(self, slug: str, depth: int = 2) -> Dict[str, List]:
        """
        Fetch N-hop neighbor subgraph centered around a specific module.
        """
        if not self._initialized:
            return {"nodes": [], "links": []}

        nodes = []
        links = []
        seen_nodes = set()

        query = """
        MATCH path = (m:Module {slug: $slug})-[r:RELATED_TO|BELONGS_TO*1..%d]-(other)
        RETURN path LIMIT 100
        """ % min(depth, 3)

        try:
            async with self._driver.session() as session:
                result = await session.run(query, slug=slug)
                records = await result.data()

                for record in records:
                    path = record["path"]
                    for node in path.nodes:
                        node_id = node.get("slug") or f"dept-{node.get('name')}"
                        if node_id not in seen_nodes:
                            seen_nodes.add(node_id)
                            labels = list(node.labels)
                            node_type = "department" if "Department" in labels else "module"
                            nodes.append({
                                "id": node_id,
                                "label": node.get("name"),
                                "type": node_type,
                                "department": node.get("department", ""),
                            })

                    for rel in path.relationships:
                        links.append({
                            "source": rel.start_node.get("slug") or f"dept-{rel.start_node.get('name')}",
                            "target": rel.end_node.get("slug") or f"dept-{rel.end_node.get('name')}",
                            "type": rel.type,
                        })
        except Exception as e:
            logger.error("Error executing Cypher neighborhood query", error=str(e))

        return {"nodes": nodes, "links": links}

    async def find_path(self, source_slug: str, target_slug: str) -> Dict[str, Any]:
        """
        Find shortest path between two modules in Neo4j.
        """
        if not self._initialized:
            return {"path_found": False, "nodes": [], "links": []}

        query = """
        MATCH (s:Module {slug: $source}), (t:Module {slug: $target})
        MATCH path = shortestPath((s)-[:RELATED_TO|BELONGS_TO*..10]-(t))
        RETURN path
        """

        try:
            async with self._driver.session() as session:
                result = await session.run(query, source=source_slug, target=target_slug)
                record = await result.single()
                if not record:
                    return {"path_found": False, "nodes": [], "links": []}

                path = record["path"]
                nodes = []
                links = []

                for node in path.nodes:
                    node_id = node.get("slug") or f"dept-{node.get('name')}"
                    labels = list(node.labels)
                    nodes.append({
                        "id": node_id,
                        "label": node.get("name"),
                        "type": "department" if "Department" in labels else "module",
                    })

                for rel in path.relationships:
                    links.append({
                        "source": rel.start_node.get("slug") or f"dept-{rel.start_node.get('name')}",
                        "target": rel.end_node.get("slug") or f"dept-{rel.end_node.get('name')}",
                        "type": rel.type,
                    })

                return {"path_found": True, "nodes": nodes, "links": links}
        except Exception as e:
            logger.error("Error running pathfinding Cypher query", error=str(e))
            return {"path_found": False, "nodes": [], "links": []}
