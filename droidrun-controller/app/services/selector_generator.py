"""Selector generator for smart element identification.

This module implements smart selector generation with priority logic:
1. resource-id (highest confidence: 0.95)
2. content-desc (accessibility label: 0.85)
3. text (visible text: 0.75)
4. xpath (hierarchy path: 0.70)
5. bounds (pixel coordinates, fallback: 0.50)

Selectors are generated from Android UI element data captured during
recording sessions. Each selector includes a confidence score based on
its reliability for replay scenarios.
"""

from typing import Dict, List, Optional, Any, Tuple

from app.models.workflow import ElementSelector, SelectorType


# Confidence scores for each selector type (higher = more reliable)
SELECTOR_CONFIDENCE = {
    SelectorType.RESOURCE_ID: 0.95,
    SelectorType.CONTENT_DESC: 0.85,
    SelectorType.TEXT: 0.75,
    SelectorType.XPATH: 0.70,
    SelectorType.BOUNDS: 0.50,
}

# Priority order for selector generation (first = highest priority)
SELECTOR_PRIORITY = [
    SelectorType.RESOURCE_ID,
    SelectorType.CONTENT_DESC,
    SelectorType.TEXT,
    SelectorType.XPATH,
    SelectorType.BOUNDS,
]


class SelectorGenerator:
    """Generates robust element selectors from UI element data.

    This class analyzes element properties captured during recording
    and generates the most reliable selector based on available data.
    Selectors are generated with fallback chains to handle cases where
    the primary selector fails during replay.

    Usage:
        generator = SelectorGenerator()
        selector = generator.generate_selector({
            'resourceId': 'com.app:id/login_btn',
            'text': 'Login',
            'contentDescription': 'Login button',
            'bounds': '[100,200][300,400]'
        })
        # Returns ElementSelector with type=resource-id and fallback chain
    """

    def __init__(self, include_fallbacks: bool = True):
        """Initialize the selector generator.

        Args:
            include_fallbacks: Whether to generate fallback selectors.
                              Defaults to True.
        """
        self.include_fallbacks = include_fallbacks

    def generate_selector(self, element_data: Dict[str, Any]) -> Optional[ElementSelector]:
        """Generate the best selector from element data.

        Analyzes the element data and generates a selector using the
        highest-priority available strategy. If fallbacks are enabled,
        generates a chain of fallback selectors.

        Args:
            element_data: Dictionary containing element properties:
                - resourceId: Android resource ID (e.g., 'com.app:id/btn')
                - contentDescription: Accessibility content description
                - text: Visible text of the element
                - className: Android widget class name
                - bounds: Bounds string like '[x1,y1][x2,y2]'
                - index: Child index in parent
                - package: Application package name

        Returns:
            ElementSelector with the best strategy and optional fallbacks,
            or None if no valid selector can be generated.
        """
        if not element_data:
            return None

        # Normalize the element data keys (Android may use different casing)
        normalized = self._normalize_element_data(element_data)

        # Generate all possible selectors in priority order
        selectors = self._generate_all_selectors(normalized)

        if not selectors:
            return None

        # Get the primary selector (highest priority)
        primary = selectors[0]

        # Build fallback chain if enabled
        if self.include_fallbacks and len(selectors) > 1:
            primary = self._build_fallback_chain(selectors)

        return primary

    def generate_all_selectors(
        self, element_data: Dict[str, Any]
    ) -> List[ElementSelector]:
        """Generate all possible selectors for an element.

        Returns a list of all valid selectors that can be generated
        from the element data, ordered by priority.

        Args:
            element_data: Dictionary containing element properties.

        Returns:
            List of ElementSelector objects ordered by priority.
        """
        if not element_data:
            return []

        normalized = self._normalize_element_data(element_data)
        return self._generate_all_selectors(normalized)

    def _normalize_element_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize element data keys to a consistent format.

        Android AccessibilityNodeInfo may use different key formats.
        This normalizes them for consistent processing.

        Args:
            data: Raw element data dictionary.

        Returns:
            Normalized dictionary with consistent keys.
        """
        normalized = {}

        # Map common key variations to standard keys
        key_mappings = {
            'resourceId': ['resourceId', 'resource_id', 'resource-id', 'id'],
            'contentDescription': ['contentDescription', 'content_description',
                                   'content-desc', 'contentDesc', 'description'],
            'text': ['text', 'displayText'],
            'className': ['className', 'class_name', 'class'],
            'bounds': ['bounds', 'boundsInScreen'],
            'index': ['index', 'childIndex'],
            'package': ['package', 'packageName', 'package_name'],
        }

        for standard_key, variations in key_mappings.items():
            for variant in variations:
                if variant in data and data[variant]:
                    value = data[variant]
                    # Handle string values
                    if isinstance(value, str):
                        value = value.strip()
                        if value:
                            normalized[standard_key] = value
                    else:
                        normalized[standard_key] = value
                    break

        return normalized

    def _generate_all_selectors(
        self, normalized_data: Dict[str, Any]
    ) -> List[ElementSelector]:
        """Generate all possible selectors from normalized data.

        Args:
            normalized_data: Normalized element data dictionary.

        Returns:
            List of ElementSelector objects in priority order.
        """
        selectors = []

        for selector_type in SELECTOR_PRIORITY:
            selector = self._generate_single_selector(selector_type, normalized_data)
            if selector:
                selectors.append(selector)

        return selectors

    def _generate_single_selector(
        self,
        selector_type: SelectorType,
        data: Dict[str, Any]
    ) -> Optional[ElementSelector]:
        """Generate a single selector of the specified type.

        Args:
            selector_type: The type of selector to generate.
            data: Normalized element data.

        Returns:
            ElementSelector if the type can be generated, None otherwise.
        """
        value = None

        if selector_type == SelectorType.RESOURCE_ID:
            value = self._extract_resource_id(data)
        elif selector_type == SelectorType.CONTENT_DESC:
            value = self._extract_content_desc(data)
        elif selector_type == SelectorType.TEXT:
            value = self._extract_text(data)
        elif selector_type == SelectorType.XPATH:
            value = self._generate_xpath(data)
        elif selector_type == SelectorType.BOUNDS:
            value = self._extract_bounds(data)

        if value:
            return ElementSelector(
                type=selector_type,
                value=value,
                confidence=SELECTOR_CONFIDENCE[selector_type],
                fallback=None
            )

        return None

    def _extract_resource_id(self, data: Dict[str, Any]) -> Optional[str]:
        """Extract resource ID from element data.

        Valid resource IDs have the format: package:type/name
        e.g., 'com.example.app:id/login_button'

        Args:
            data: Normalized element data.

        Returns:
            Resource ID string or None if not available.
        """
        resource_id = data.get('resourceId')
        if not resource_id:
            return None

        # Validate resource ID format (should contain ':id/')
        if ':id/' in resource_id or resource_id.startswith('id/'):
            return resource_id

        # Some apps use simple IDs without package prefix
        if resource_id and '/' not in resource_id:
            # It's a simple ID, still usable
            return resource_id

        return resource_id if resource_id else None

    def _extract_content_desc(self, data: Dict[str, Any]) -> Optional[str]:
        """Extract content description from element data.

        Content descriptions are accessibility labels that should be
        stable across app versions.

        Args:
            data: Normalized element data.

        Returns:
            Content description string or None if not available.
        """
        content_desc = data.get('contentDescription')
        if content_desc and isinstance(content_desc, str) and content_desc.strip():
            return content_desc.strip()
        return None

    def _extract_text(self, data: Dict[str, Any]) -> Optional[str]:
        """Extract visible text from element data.

        Text selectors are less reliable than resource-id or content-desc
        as they may change with translations or UI updates.

        Args:
            data: Normalized element data.

        Returns:
            Text string or None if not available.
        """
        text = data.get('text')
        if text and isinstance(text, str) and text.strip():
            return text.strip()
        return None

    def _generate_xpath(self, data: Dict[str, Any]) -> Optional[str]:
        """Generate XPath selector from element data.

        XPath selectors use the class name and available attributes
        to create a path expression.

        Args:
            data: Normalized element data.

        Returns:
            XPath expression string or None if cannot be generated.
        """
        class_name = data.get('className')
        if not class_name:
            return None

        # Build XPath with available attributes
        xpath_parts = [f"//{class_name}"]
        conditions = []

        # Add text condition if available
        text = data.get('text')
        if text:
            escaped_text = text.replace("'", "\\'")
            conditions.append(f"@text='{escaped_text}'")

        # Add content description condition
        content_desc = data.get('contentDescription')
        if content_desc:
            escaped_desc = content_desc.replace("'", "\\'")
            conditions.append(f"@content-desc='{escaped_desc}'")

        # Add resource ID condition (without package prefix for portability)
        resource_id = data.get('resourceId')
        if resource_id:
            # Extract just the ID name part
            if ':id/' in resource_id:
                id_name = resource_id.split(':id/')[-1]
            else:
                id_name = resource_id
            conditions.append(f"contains(@resource-id, '{id_name}')")

        # Add index if no other conditions
        if not conditions:
            index = data.get('index')
            if index is not None:
                conditions.append(f"position()={index + 1}")

        if conditions:
            xpath_parts.append(f"[{' and '.join(conditions)}]")

        return ''.join(xpath_parts)

    def _extract_bounds(self, data: Dict[str, Any]) -> Optional[str]:
        """Extract bounds from element data.

        Bounds format: '[x1,y1][x2,y2]' representing the element's
        screen coordinates. This is the least reliable selector as
        it depends on screen size and layout.

        Args:
            data: Normalized element data.

        Returns:
            Bounds string or None if not available.
        """
        bounds = data.get('bounds')
        if bounds and isinstance(bounds, str) and bounds.strip():
            return bounds.strip()
        return None

    def _build_fallback_chain(
        self, selectors: List[ElementSelector]
    ) -> ElementSelector:
        """Build a fallback chain from a list of selectors.

        Links selectors in priority order so that if the primary
        selector fails during replay, the system can try alternatives.

        Args:
            selectors: List of selectors in priority order.

        Returns:
            Primary selector with fallback chain attached.
        """
        if not selectors:
            raise ValueError("Cannot build fallback chain from empty list")

        # Start from the last selector and work backwards
        current_fallback = None
        for selector in reversed(selectors):
            new_selector = ElementSelector(
                type=selector.type,
                value=selector.value,
                confidence=selector.confidence,
                fallback=current_fallback
            )
            current_fallback = new_selector

        return current_fallback

    def get_selector_confidence(self, selector_type: SelectorType) -> float:
        """Get the confidence score for a selector type.

        Args:
            selector_type: The type of selector.

        Returns:
            Confidence score between 0.0 and 1.0.
        """
        return SELECTOR_CONFIDENCE.get(selector_type, 0.5)

    def parse_bounds(self, bounds_str: str) -> Optional[Tuple[int, int, int, int]]:
        """Parse bounds string to coordinates.

        Args:
            bounds_str: Bounds string like '[100,200][300,400]'

        Returns:
            Tuple of (x1, y1, x2, y2) or None if parsing fails.
        """
        if not bounds_str:
            return None

        try:
            # Format: [x1,y1][x2,y2]
            parts = bounds_str.replace('[', '').replace(']', ',').split(',')
            parts = [p.strip() for p in parts if p.strip()]
            if len(parts) == 4:
                return (int(parts[0]), int(parts[1]), int(parts[2]), int(parts[3]))
        except (ValueError, IndexError):
            pass

        return None

    def get_center_from_bounds(
        self, bounds_str: str
    ) -> Optional[Tuple[int, int]]:
        """Calculate center point from bounds string.

        Useful for tap actions when bounds-based selector is used.

        Args:
            bounds_str: Bounds string like '[100,200][300,400]'

        Returns:
            Tuple of (x, y) center coordinates or None if parsing fails.
        """
        coords = self.parse_bounds(bounds_str)
        if coords:
            x1, y1, x2, y2 = coords
            return ((x1 + x2) // 2, (y1 + y2) // 2)
        return None


# Module-level singleton instance
selector_generator: Optional[SelectorGenerator] = None


def get_selector_generator(include_fallbacks: bool = True) -> SelectorGenerator:
    """Get or create the selector generator singleton.

    Args:
        include_fallbacks: Whether to include fallback selectors.

    Returns:
        SelectorGenerator instance.
    """
    global selector_generator
    if selector_generator is None:
        selector_generator = SelectorGenerator(include_fallbacks=include_fallbacks)
    return selector_generator
