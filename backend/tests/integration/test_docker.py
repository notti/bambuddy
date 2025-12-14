"""
Docker integration tests.

These tests run against a containerized instance of BamBuddy.
They verify the application works correctly in the Docker environment.

Run with: pytest -m docker
Or via: ./test_docker.sh --integration-only
"""

import os

import httpx
import pytest

# Get the test URL from environment (set by docker-compose.test.yml)
BAMBUDDY_URL = os.environ.get("BAMBUDDY_TEST_URL", "http://localhost:8000")


@pytest.fixture
def client():
    """HTTP client for testing."""
    return httpx.Client(base_url=BAMBUDDY_URL, timeout=10.0)


@pytest.mark.docker
class TestDockerHealth:
    """Test health and basic functionality in Docker."""

    def test_health_endpoint(self, client):
        """Health endpoint returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_api_docs_available(self, client):
        """OpenAPI docs are accessible."""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "swagger" in response.text.lower() or "openapi" in response.text.lower()

    def test_static_files_served(self, client):
        """Static files (frontend) are served."""
        response = client.get("/")
        assert response.status_code == 200
        # Should serve index.html with React app
        assert "text/html" in response.headers.get("content-type", "")


@pytest.mark.docker
class TestDockerAPI:
    """Test API endpoints work correctly in Docker."""

    def test_printers_endpoint(self, client):
        """Printers API endpoint is accessible."""
        response = client.get("/api/v1/printers/")
        # Should return empty list or list of printers
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_archives_endpoint(self, client):
        """Archives API endpoint is accessible."""
        response = client.get("/api/v1/archives/")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data or isinstance(data, list)

    def test_settings_endpoint(self, client):
        """Settings API endpoint is accessible."""
        response = client.get("/api/v1/settings")
        assert response.status_code == 200

    def test_projects_endpoint(self, client):
        """Projects API endpoint is accessible."""
        response = client.get("/api/v1/projects/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.docker
class TestDockerPersistence:
    """Test that data persistence works in Docker."""

    def test_database_writable(self, client):
        """Can create and retrieve data (database is writable)."""
        # Create a project
        response = client.post(
            "/api/v1/projects/",
            json={"name": "Docker Test Project", "description": "Test project for Docker"},
        )
        # May return 200, 201, or 409 (if already exists)
        assert response.status_code in [200, 201, 409]

        # Verify we can list projects
        response = client.get("/api/v1/projects/")
        assert response.status_code == 200
        projects = response.json()
        assert isinstance(projects, list)


@pytest.mark.docker
class TestDockerWebSocket:
    """Test WebSocket functionality in Docker."""

    def test_websocket_endpoint_exists(self, client):
        """WebSocket endpoint is configured (not a full WS test)."""
        # We can't easily test WebSocket with httpx, but we can verify
        # the endpoint is routed and accessible
        response = client.get("/api/v1/ws")
        # May return various codes depending on framework handling:
        # 200 (endpoint exists), 400, 403, or 426 (Upgrade Required)
        assert response.status_code in [200, 400, 403, 426]
