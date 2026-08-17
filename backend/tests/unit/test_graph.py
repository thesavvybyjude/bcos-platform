"""
Unit tests for BCOS Platform Graph routes & GraphStore service.
"""

import pytest
from fastapi.testclient import TestClient
from src.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_get_graph_data_endpoint(client):
    response = client.get("/api/graph/data")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "links" in data
    assert "total_nodes" in data
    assert "total_links" in data


def test_get_department_subgraph_endpoint(client):
    response = client.get("/api/graph/department/Marketing")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "links" in data


def test_get_module_neighborhood_endpoint(client):
    response = client.get("/api/graph/module/brand-sponsorships-negotiation")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "links" in data


def test_find_path_endpoint(client):
    response = client.get("/api/graph/path?source=brand-sponsorships-negotiation&target=pricing-strategy")
    assert response.status_code == 200
    data = response.json()
    assert "path_found" in data
