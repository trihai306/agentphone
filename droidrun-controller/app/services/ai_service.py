"""AI Service for fetching models from various providers."""

import aiohttp
from typing import List, Dict, Optional


class AIService:
    """Service for interacting with AI providers APIs."""

    def __init__(self, app_state: dict):
        self.app_state = app_state
        self._cached_models = {}

    async def fetch_openai_models(self) -> List[Dict]:
        """Fetch available models from OpenAI API."""
        api_key = self.app_state.get("openai_api_key", "")
        if not api_key:
            return []

        base_url = self.app_state.get("api_base_url", "https://api.openai.com/v1")

        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {api_key}"}
                async with session.get(
                    f"{base_url}/models",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        models = []
                        for model in data.get("data", []):
                            model_id = model.get("id", "")
                            # Filter for chat models
                            if any(x in model_id for x in ["gpt-4", "gpt-3.5", "o1", "chatgpt"]):
                                models.append({
                                    "id": model_id,
                                    "name": self._format_model_name(model_id),
                                    "provider": "openai",
                                })
                        # Sort by name
                        models.sort(key=lambda x: x["name"])
                        return models
                    return []
        except Exception as e:
            print(f"Error fetching OpenAI models: {e}")
            return []

    async def fetch_anthropic_models(self) -> List[Dict]:
        """Fetch available models from Anthropic API."""
        api_key = self.app_state.get("anthropic_api_key", "")
        if not api_key:
            return []

        # Anthropic doesn't have a models endpoint, return known models
        return [
            {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "provider": "anthropic"},
            {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet", "provider": "anthropic"},
            {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "provider": "anthropic"},
            {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "provider": "anthropic"},
            {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku", "provider": "anthropic"},
        ]

    async def fetch_google_models(self) -> List[Dict]:
        """Fetch available models from Google AI API."""
        api_key = self.app_state.get("google_api_key", "")
        if not api_key:
            return []

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        models = []
                        for model in data.get("models", []):
                            model_name = model.get("name", "").replace("models/", "")
                            if "gemini" in model_name.lower():
                                models.append({
                                    "id": model_name,
                                    "name": self._format_model_name(model_name),
                                    "provider": "google",
                                })
                        return models
                    return []
        except Exception as e:
            print(f"Error fetching Google models: {e}")
            return []

    async def fetch_all_models(self) -> List[Dict]:
        """Fetch models from all configured providers."""
        all_models = []

        # Fetch from each provider
        openai_models = await self.fetch_openai_models()
        anthropic_models = await self.fetch_anthropic_models()
        google_models = await self.fetch_google_models()

        all_models.extend(openai_models)
        all_models.extend(anthropic_models)
        all_models.extend(google_models)

        # Cache the results
        self._cached_models = {m["id"]: m for m in all_models}

        return all_models

    def get_cached_models(self) -> List[Dict]:
        """Get cached models list."""
        return list(self._cached_models.values())

    def _format_model_name(self, model_id: str) -> str:
        """Format model ID to a readable name."""
        name = model_id.replace("-", " ").replace("_", " ")

        # Capitalize known parts
        replacements = {
            "gpt 4": "GPT-4",
            "gpt 3.5": "GPT-3.5",
            "gpt 4o": "GPT-4o",
            "o1": "O1",
            "claude 3": "Claude 3",
            "claude 3.5": "Claude 3.5",
            "gemini": "Gemini",
            "turbo": "Turbo",
            "mini": "Mini",
            "opus": "Opus",
            "sonnet": "Sonnet",
            "haiku": "Haiku",
            "pro": "Pro",
            "flash": "Flash",
        }

        for old, new in replacements.items():
            name = name.replace(old, new)

        return name.strip().title()


# Global AI service instance (will be initialized with app_state)
ai_service: Optional[AIService] = None


def get_ai_service(app_state: dict) -> AIService:
    """Get or create AI service instance."""
    global ai_service
    if ai_service is None:
        ai_service = AIService(app_state)
    return ai_service
