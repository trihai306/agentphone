"""
LLM Utilities - Multi-provider LLM support (DroidRun standard)

Supports:
- OpenAI (GPT-4, GPT-4o, etc.) - with vision
- Anthropic (Claude) - with vision
- Google (Gemini) - with vision
- Ollama (local models) - with vision (llava, etc.)
- DeepSeek - with vision
"""

import os
import re
import json
import base64
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Union, Tuple
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger("agents.utils.llm")


class LLMProvider(Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    OLLAMA = "ollama"
    DEEPSEEK = "deepseek"


@dataclass
class LLMConfig:
    """Configuration for LLM"""
    provider: LLMProvider = LLMProvider.OPENAI
    model: str = "gpt-4o"
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    max_tokens: int = 1000
    temperature: float = 0.2

    def __post_init__(self):
        """Load API key from environment if not provided"""
        if self.api_key is None:
            env_keys = {
                LLMProvider.OPENAI: "OPENAI_API_KEY",
                LLMProvider.ANTHROPIC: "ANTHROPIC_API_KEY",
                LLMProvider.GOOGLE: "GOOGLE_API_KEY",
                LLMProvider.DEEPSEEK: "DEEPSEEK_API_KEY",
            }
            env_key = env_keys.get(self.provider)
            if env_key:
                self.api_key = os.getenv(env_key)


@dataclass
class LLMMessage:
    """Chat message"""
    role: str  # system, user, assistant
    content: Union[str, List[Dict]]  # text or multimodal content


@dataclass
class LLMResponse:
    """LLM response"""
    content: str
    model: str
    usage: Dict[str, int] = field(default_factory=dict)
    raw_response: Any = None


def extract_image_from_content(content: Union[str, List[Dict]]) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Extract text and image data from multimodal content

    Args:
        content: String or list of content parts

    Returns:
        Tuple of (text, base64_data, media_type)
    """
    if isinstance(content, str):
        return content, None, None

    text_parts = []
    image_data = None
    media_type = None

    for part in content:
        if part.get("type") == "text":
            text_parts.append(part.get("text", ""))
        elif part.get("type") == "image_url":
            # OpenAI format: {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
            url = part.get("image_url", {}).get("url", "")
            if url.startswith("data:"):
                # Parse data URL
                match = re.match(r"data:([^;]+);base64,(.+)", url)
                if match:
                    media_type = match.group(1)
                    image_data = match.group(2)
        elif part.get("type") == "image":
            # Already in Anthropic format
            source = part.get("source", {})
            if source.get("type") == "base64":
                image_data = source.get("data")
                media_type = source.get("media_type", "image/png")

    return "\n".join(text_parts), image_data, media_type


class LLM(ABC):
    """Abstract base class for LLM providers"""

    def __init__(self, config: LLMConfig):
        self.config = config
        self._client = None

    @abstractmethod
    async def chat(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Send chat request to LLM"""
        pass

    @abstractmethod
    def chat_sync(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Synchronous chat request"""
        pass

    def format_messages(self, messages: List[LLMMessage]) -> List[Dict]:
        """Format messages for API (default: OpenAI format)"""
        return [{"role": m.role, "content": m.content} for m in messages]


class OpenAILLM(LLM):
    """OpenAI LLM provider (supports vision with gpt-4o, gpt-4-vision-preview)"""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        try:
            from openai import OpenAI, AsyncOpenAI
            self._client = OpenAI(
                api_key=config.api_key,
                base_url=config.base_url
            )
            self._async_client = AsyncOpenAI(
                api_key=config.api_key,
                base_url=config.base_url
            )
        except ImportError:
            raise ImportError("OpenAI package not installed. Run: pip install openai")

    async def chat(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Async chat with OpenAI"""
        # OpenAI natively supports the multimodal format
        formatted = self.format_messages(messages)

        response = await self._async_client.chat.completions.create(
            model=kwargs.get("model", self.config.model),
            messages=formatted,
            max_tokens=kwargs.get("max_tokens", self.config.max_tokens),
            temperature=kwargs.get("temperature", self.config.temperature)
        )

        return LLMResponse(
            content=response.choices[0].message.content,
            model=response.model,
            usage={
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            },
            raw_response=response
        )

    def chat_sync(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Sync chat with OpenAI"""
        formatted = self.format_messages(messages)

        response = self._client.chat.completions.create(
            model=kwargs.get("model", self.config.model),
            messages=formatted,
            max_tokens=kwargs.get("max_tokens", self.config.max_tokens),
            temperature=kwargs.get("temperature", self.config.temperature)
        )

        return LLMResponse(
            content=response.choices[0].message.content,
            model=response.model,
            usage={
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            },
            raw_response=response
        )


class AnthropicLLM(LLM):
    """Anthropic (Claude) LLM provider (supports vision with claude-3-*)"""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        try:
            from anthropic import Anthropic, AsyncAnthropic
            self._client = Anthropic(api_key=config.api_key)
            self._async_client = AsyncAnthropic(api_key=config.api_key)
        except ImportError:
            raise ImportError("Anthropic package not installed. Run: pip install anthropic")

    def format_messages(self, messages: List[LLMMessage]) -> Tuple[str, List[Dict]]:
        """
        Format messages for Anthropic API

        Anthropic requires:
        - System prompt as separate parameter
        - Image format: {"type": "image", "source": {"type": "base64", "media_type": "...", "data": "..."}}
        """
        system_prompt = ""
        formatted = []

        for m in messages:
            if m.role == "system":
                if isinstance(m.content, str):
                    system_prompt = m.content
                continue

            # Process content
            if isinstance(m.content, str):
                formatted.append({"role": m.role, "content": m.content})
            else:
                # Multimodal content - convert to Anthropic format
                anthropic_content = []
                for part in m.content:
                    if part.get("type") == "text":
                        anthropic_content.append({
                            "type": "text",
                            "text": part.get("text", "")
                        })
                    elif part.get("type") == "image_url":
                        # Convert OpenAI format to Anthropic format
                        url = part.get("image_url", {}).get("url", "")
                        if url.startswith("data:"):
                            match = re.match(r"data:([^;]+);base64,(.+)", url)
                            if match:
                                media_type = match.group(1)
                                base64_data = match.group(2)
                                anthropic_content.append({
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": media_type,
                                        "data": base64_data
                                    }
                                })
                    elif part.get("type") == "image":
                        # Already in Anthropic format
                        anthropic_content.append(part)

                formatted.append({"role": m.role, "content": anthropic_content})

        return system_prompt, formatted

    async def chat(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Async chat with Anthropic"""
        system_prompt, formatted = self.format_messages(messages)

        response = await self._async_client.messages.create(
            model=kwargs.get("model", self.config.model),
            system=system_prompt,
            messages=formatted,
            max_tokens=kwargs.get("max_tokens", self.config.max_tokens),
            temperature=kwargs.get("temperature", self.config.temperature)
        )

        return LLMResponse(
            content=response.content[0].text,
            model=response.model,
            usage={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
            raw_response=response
        )

    def chat_sync(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Sync chat with Anthropic"""
        system_prompt, formatted = self.format_messages(messages)

        response = self._client.messages.create(
            model=kwargs.get("model", self.config.model),
            system=system_prompt,
            messages=formatted,
            max_tokens=kwargs.get("max_tokens", self.config.max_tokens),
            temperature=kwargs.get("temperature", self.config.temperature)
        )

        return LLMResponse(
            content=response.content[0].text,
            model=response.model,
            usage={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
            raw_response=response
        )


class GoogleLLM(LLM):
    """Google (Gemini) LLM provider (supports vision with gemini-1.5-pro, gemini-1.5-flash)"""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        try:
            import google.generativeai as genai
            genai.configure(api_key=config.api_key)
            self._genai = genai
            self._model = genai.GenerativeModel(config.model)
        except ImportError:
            raise ImportError("Google AI package not installed. Run: pip install google-generativeai")

    def format_messages(self, messages: List[LLMMessage]) -> List[Dict]:
        """
        Format messages for Gemini API

        Gemini requires:
        - Parts format: [{"text": "..."}, {"inline_data": {"mime_type": "...", "data": "..."}}]
        """
        contents = []

        for m in messages:
            role = "user" if m.role in ["user", "system"] else "model"

            if isinstance(m.content, str):
                contents.append({
                    "role": role,
                    "parts": [{"text": m.content}]
                })
            else:
                # Multimodal content - convert to Gemini format
                parts = []
                for part in m.content:
                    if part.get("type") == "text":
                        parts.append({"text": part.get("text", "")})
                    elif part.get("type") == "image_url":
                        # Convert OpenAI format to Gemini format
                        url = part.get("image_url", {}).get("url", "")
                        if url.startswith("data:"):
                            match = re.match(r"data:([^;]+);base64,(.+)", url)
                            if match:
                                mime_type = match.group(1)
                                base64_data = match.group(2)
                                parts.append({
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": base64_data
                                    }
                                })
                    elif part.get("type") == "image":
                        # Anthropic format - convert
                        source = part.get("source", {})
                        if source.get("type") == "base64":
                            parts.append({
                                "inline_data": {
                                    "mime_type": source.get("media_type", "image/png"),
                                    "data": source.get("data", "")
                                }
                            })

                contents.append({"role": role, "parts": parts})

        return contents

    async def chat(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Async chat with Google Gemini"""
        contents = self.format_messages(messages)

        response = await self._model.generate_content_async(
            contents,
            generation_config={
                "max_output_tokens": kwargs.get("max_tokens", self.config.max_tokens),
                "temperature": kwargs.get("temperature", self.config.temperature)
            }
        )

        return LLMResponse(
            content=response.text,
            model=self.config.model,
            usage={},
            raw_response=response
        )

    def chat_sync(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Sync chat with Google Gemini"""
        contents = self.format_messages(messages)

        response = self._model.generate_content(
            contents,
            generation_config={
                "max_output_tokens": kwargs.get("max_tokens", self.config.max_tokens),
                "temperature": kwargs.get("temperature", self.config.temperature)
            }
        )

        return LLMResponse(
            content=response.text,
            model=self.config.model,
            usage={},
            raw_response=response
        )


class OllamaLLM(LLM):
    """Ollama (local) LLM provider (supports vision with llava, bakllava, etc.)"""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self.base_url = config.base_url or "http://localhost:11434"

    def format_messages(self, messages: List[LLMMessage]) -> Tuple[List[Dict], List[str]]:
        """
        Format messages for Ollama API

        Ollama requires images as separate field in the message:
        {"role": "user", "content": "...", "images": ["base64_data"]}
        """
        formatted = []
        all_images = []

        for m in messages:
            if isinstance(m.content, str):
                formatted.append({"role": m.role, "content": m.content})
            else:
                # Multimodal content - extract text and images
                text_parts = []
                images = []

                for part in m.content:
                    if part.get("type") == "text":
                        text_parts.append(part.get("text", ""))
                    elif part.get("type") == "image_url":
                        url = part.get("image_url", {}).get("url", "")
                        if url.startswith("data:"):
                            match = re.match(r"data:[^;]+;base64,(.+)", url)
                            if match:
                                images.append(match.group(1))
                    elif part.get("type") == "image":
                        source = part.get("source", {})
                        if source.get("type") == "base64":
                            images.append(source.get("data", ""))

                msg = {
                    "role": m.role,
                    "content": "\n".join(text_parts)
                }
                if images:
                    msg["images"] = images
                    all_images.extend(images)

                formatted.append(msg)

        return formatted, all_images

    async def chat(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Async chat with Ollama"""
        import aiohttp

        formatted, _ = self.format_messages(messages)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": kwargs.get("model", self.config.model),
                    "messages": formatted,
                    "stream": False,
                    "options": {
                        "temperature": kwargs.get("temperature", self.config.temperature)
                    }
                }
            ) as response:
                data = await response.json()

        return LLMResponse(
            content=data["message"]["content"],
            model=data["model"],
            usage={
                "prompt_tokens": data.get("prompt_eval_count", 0),
                "completion_tokens": data.get("eval_count", 0)
            },
            raw_response=data
        )

    def chat_sync(
        self,
        messages: List[LLMMessage],
        **kwargs
    ) -> LLMResponse:
        """Sync chat with Ollama"""
        import requests

        formatted, _ = self.format_messages(messages)

        response = requests.post(
            f"{self.base_url}/api/chat",
            json={
                "model": kwargs.get("model", self.config.model),
                "messages": formatted,
                "stream": False,
                "options": {
                    "temperature": kwargs.get("temperature", self.config.temperature)
                }
            }
        )
        data = response.json()

        return LLMResponse(
            content=data["message"]["content"],
            model=data["model"],
            usage={
                "prompt_tokens": data.get("prompt_eval_count", 0),
                "completion_tokens": data.get("eval_count", 0)
            },
            raw_response=data
        )


class DeepSeekLLM(OpenAILLM):
    """DeepSeek LLM provider (OpenAI compatible, supports vision)"""

    def __init__(self, config: LLMConfig):
        config.base_url = config.base_url or "https://api.deepseek.com"
        super().__init__(config)


def create_llm(
    provider: Union[str, LLMProvider] = "openai",
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    **kwargs
) -> LLM:
    """
    Factory function to create LLM instance

    Args:
        provider: LLM provider name or enum
        model: Model name
        api_key: API key
        **kwargs: Additional config options

    Returns:
        LLM instance

    Example:
        # OpenAI with vision
        llm = create_llm("openai", "gpt-4o")

        # Anthropic with vision
        llm = create_llm("anthropic", "claude-3-5-sonnet-20241022")

        # Google Gemini with vision
        llm = create_llm("google", "gemini-1.5-pro")

        # Ollama with vision (llava)
        llm = create_llm("ollama", "llava")
    """
    if isinstance(provider, str):
        provider = LLMProvider(provider.lower())

    # Default models per provider (vision-capable)
    default_models = {
        LLMProvider.OPENAI: "gpt-4o",
        LLMProvider.ANTHROPIC: "claude-3-5-sonnet-20241022",
        LLMProvider.GOOGLE: "gemini-1.5-pro",
        LLMProvider.OLLAMA: "llava",  # Vision model
        LLMProvider.DEEPSEEK: "deepseek-chat",
    }

    config = LLMConfig(
        provider=provider,
        model=model or default_models.get(provider, "gpt-4o"),
        api_key=api_key,
        **kwargs
    )

    llm_classes = {
        LLMProvider.OPENAI: OpenAILLM,
        LLMProvider.ANTHROPIC: AnthropicLLM,
        LLMProvider.GOOGLE: GoogleLLM,
        LLMProvider.OLLAMA: OllamaLLM,
        LLMProvider.DEEPSEEK: DeepSeekLLM,
    }

    llm_class = llm_classes.get(provider)
    if not llm_class:
        raise ValueError(f"Unsupported provider: {provider}")

    return llm_class(config)


# ============================================================================
# HELPER: Create multimodal message
# ============================================================================

def create_vision_message(
    text: str,
    image_base64: str,
    media_type: str = "image/png",
    role: str = "user"
) -> LLMMessage:
    """
    Create a multimodal message with text and image

    Args:
        text: Text content
        image_base64: Base64 encoded image data
        media_type: MIME type of image (default: image/png)
        role: Message role (default: user)

    Returns:
        LLMMessage with multimodal content (OpenAI format, auto-converted by each provider)
    """
    return LLMMessage(
        role=role,
        content=[
            {"type": "text", "text": text},
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{media_type};base64,{image_base64}"
                }
            }
        ]
    )


def create_vision_message_from_file(
    text: str,
    image_path: str,
    role: str = "user"
) -> LLMMessage:
    """
    Create a multimodal message from image file

    Args:
        text: Text content
        image_path: Path to image file
        role: Message role (default: user)

    Returns:
        LLMMessage with multimodal content
    """
    import mimetypes

    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(image_path)
    if not mime_type:
        mime_type = "image/png"

    # Read and encode image
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    return create_vision_message(text, image_data, mime_type, role)


# ============================================================================
# LEGACY FUNCTIONS (backward compatibility)
# ============================================================================

def get_openai_client(api_key: Optional[str] = None):
    """
    Get OpenAI client instance (legacy)

    Args:
        api_key: API key (or from OPENAI_API_KEY env)

    Returns:
        OpenAI client
    """
    from openai import OpenAI
    return OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))


def call_llm(
    client,
    messages: list,
    model: str = "gpt-4o",
    max_tokens: int = 1000,
    temperature: float = 0.2
) -> str:
    """
    Call LLM with messages (legacy)

    Args:
        client: OpenAI client
        messages: List of messages
        model: Model name
        max_tokens: Max response tokens
        temperature: Sampling temperature

    Returns:
        LLM response content
    """
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature
    )
    return response.choices[0].message.content


def parse_json_response(response: str) -> Dict[str, Any]:
    """
    Parse JSON from LLM response

    Args:
        response: Raw LLM response

    Returns:
        Parsed JSON dict
    """
    json_str = response.strip()

    # Extract from markdown code blocks
    if "```json" in json_str:
        start = json_str.find("```json") + 7
        end = json_str.find("```", start)
        json_str = json_str[start:end].strip()
    elif "```" in json_str:
        start = json_str.find("```") + 3
        end = json_str.find("```", start)
        json_str = json_str[start:end].strip()

    # Find JSON object
    if "{" in json_str:
        start = json_str.find("{")
        end = json_str.rfind("}") + 1
        json_str = json_str[start:end]

    return json.loads(json_str)
