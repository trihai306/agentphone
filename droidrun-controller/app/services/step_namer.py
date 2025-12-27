"""Step naming algorithm for generating human-readable step names.

This module implements semantic step naming based on action types and
element data. It generates names like:
- "Tap Login Button"
- "Swipe to Refresh"
- "Enter Email Address"
- "Wait for Loading"

The naming algorithm prioritizes:
1. Content description (most descriptive for accessibility)
2. Text (visible element text)
3. Resource ID (parsed to extract meaningful name)
4. Bounds (fallback with coordinates)
"""

import re
from typing import Dict, Any, Optional, List

from app.models.workflow import ActionType, SwipeDirection


# Common UI element type patterns for identification
BUTTON_PATTERNS = [
    r'button', r'btn', r'submit', r'action', r'click'
]

INPUT_PATTERNS = [
    r'input', r'edit', r'text', r'field', r'entry', r'search'
]

CHECKBOX_PATTERNS = [
    r'check', r'checkbox', r'toggle', r'switch'
]

ICON_PATTERNS = [
    r'icon', r'image', r'img', r'logo', r'avatar'
]


class StepNamer:
    """Generates human-readable step names from action semantics.

    This class analyzes action types and element properties to generate
    descriptive step names that clearly communicate what each workflow
    step does.

    Usage:
        namer = StepNamer()
        name = namer.generate_name('tap', {
            'text': 'Login',
            'contentDescription': 'Login button'
        })
        # Returns: "Tap Login Button"
    """

    def __init__(self, max_name_length: int = 100):
        """Initialize the step namer.

        Args:
            max_name_length: Maximum length for generated names.
                            Defaults to 100 characters.
        """
        self.max_name_length = max_name_length

    def generate_name(
        self,
        action: str,
        element_data: Optional[Dict[str, Any]] = None,
        action_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate a human-readable step name.

        Analyzes the action type and element properties to create
        a descriptive name like "Tap Login Button" or "Enter Email Address".

        Args:
            action: Action type string (tap, swipe, input_text, wait, etc.).
            element_data: Dictionary containing element properties:
                - text: Visible text of the element
                - contentDescription: Accessibility content description
                - resourceId: Android resource ID
                - className: Android widget class name
                - bounds: Element bounds string
            action_data: Optional action-specific data:
                - direction: Swipe direction (for swipe actions)
                - text: Input text (for input_text actions)
                - duration_ms: Wait duration (for wait actions)

        Returns:
            Human-readable step name string.
        """
        element_data = element_data or {}
        action_data = action_data or {}

        # Normalize the element data
        normalized = self._normalize_element_data(element_data)

        # Get the action type enum if possible
        action_type = self._parse_action_type(action)

        # Generate name based on action type
        if action_type == ActionType.TAP:
            return self._generate_tap_name(normalized)
        elif action_type == ActionType.LONG_TAP:
            return self._generate_long_tap_name(normalized)
        elif action_type == ActionType.SWIPE:
            return self._generate_swipe_name(normalized, action_data)
        elif action_type == ActionType.SCROLL:
            return self._generate_scroll_name(normalized, action_data)
        elif action_type == ActionType.INPUT_TEXT:
            return self._generate_input_name(normalized, action_data)
        elif action_type == ActionType.WAIT:
            return self._generate_wait_name(normalized, action_data)
        else:
            # Fallback for unknown action types
            return self._generate_generic_name(action, normalized)

    def _parse_action_type(self, action: str) -> Optional[ActionType]:
        """Parse action string to ActionType enum.

        Args:
            action: Action type string.

        Returns:
            ActionType enum value or None if not recognized.
        """
        action_lower = action.lower().strip()

        try:
            return ActionType(action_lower)
        except ValueError:
            # Handle common variations
            action_map = {
                'click': ActionType.TAP,
                'press': ActionType.TAP,
                'touch': ActionType.TAP,
                'longpress': ActionType.LONG_TAP,
                'long_press': ActionType.LONG_TAP,
                'longclick': ActionType.LONG_TAP,
                'long_click': ActionType.LONG_TAP,
                'type': ActionType.INPUT_TEXT,
                'enter': ActionType.INPUT_TEXT,
                'input': ActionType.INPUT_TEXT,
                'fling': ActionType.SWIPE,
                'drag': ActionType.SWIPE,
            }
            return action_map.get(action_lower)

    def _normalize_element_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize element data keys to a consistent format.

        Args:
            data: Raw element data dictionary.

        Returns:
            Normalized dictionary with consistent keys.
        """
        normalized = {}

        # Map common key variations to standard keys
        key_mappings = {
            'text': ['text', 'displayText', 'label'],
            'contentDescription': ['contentDescription', 'content_description',
                                   'content-desc', 'contentDesc', 'description',
                                   'accessibility_text'],
            'resourceId': ['resourceId', 'resource_id', 'resource-id', 'id'],
            'className': ['className', 'class_name', 'class', 'type'],
            'bounds': ['bounds', 'boundsInScreen', 'rect'],
            'hint': ['hint', 'placeholder', 'hintText'],
        }

        for standard_key, variations in key_mappings.items():
            for variant in variations:
                if variant in data and data[variant]:
                    value = data[variant]
                    if isinstance(value, str):
                        value = value.strip()
                        if value:
                            normalized[standard_key] = value
                    else:
                        normalized[standard_key] = value
                    break

        return normalized

    def _generate_tap_name(self, data: Dict[str, Any]) -> str:
        """Generate name for tap actions.

        Args:
            data: Normalized element data.

        Returns:
            Step name like "Tap Login Button".
        """
        target = self._get_target_description(data)
        element_type = self._infer_element_type(data)

        if target and element_type:
            return self._truncate(f"Tap {target} {element_type}")
        elif target:
            return self._truncate(f"Tap {target}")
        elif element_type:
            return self._truncate(f"Tap {element_type}")
        else:
            return "Tap Element"

    def _generate_long_tap_name(self, data: Dict[str, Any]) -> str:
        """Generate name for long tap actions.

        Args:
            data: Normalized element data.

        Returns:
            Step name like "Long Press Settings Icon".
        """
        target = self._get_target_description(data)
        element_type = self._infer_element_type(data)

        if target and element_type:
            return self._truncate(f"Long Press {target} {element_type}")
        elif target:
            return self._truncate(f"Long Press {target}")
        elif element_type:
            return self._truncate(f"Long Press {element_type}")
        else:
            return "Long Press Element"

    def _generate_swipe_name(
        self,
        data: Dict[str, Any],
        action_data: Dict[str, Any]
    ) -> str:
        """Generate name for swipe actions.

        Args:
            data: Normalized element data.
            action_data: Swipe action data with direction.

        Returns:
            Step name like "Swipe Down to Refresh".
        """
        direction = action_data.get('direction', '')

        # Parse direction if it's an enum or string
        if hasattr(direction, 'value'):
            direction = direction.value

        direction_str = str(direction).capitalize() if direction else ''
        target = self._get_target_description(data)

        # Common swipe action patterns
        if direction_str.lower() == 'down' and not target:
            return "Swipe Down to Refresh"
        elif direction_str.lower() == 'up' and not target:
            return "Swipe Up to Load More"

        if direction_str and target:
            return self._truncate(f"Swipe {direction_str} on {target}")
        elif direction_str:
            return f"Swipe {direction_str}"
        elif target:
            return self._truncate(f"Swipe on {target}")
        else:
            return "Swipe"

    def _generate_scroll_name(
        self,
        data: Dict[str, Any],
        action_data: Dict[str, Any]
    ) -> str:
        """Generate name for scroll actions.

        Args:
            data: Normalized element data.
            action_data: Scroll action data with direction.

        Returns:
            Step name like "Scroll Down List".
        """
        direction = action_data.get('direction', '')

        if hasattr(direction, 'value'):
            direction = direction.value

        direction_str = str(direction).capitalize() if direction else ''
        target = self._get_target_description(data)

        if direction_str and target:
            return self._truncate(f"Scroll {direction_str} {target}")
        elif direction_str:
            return f"Scroll {direction_str}"
        elif target:
            return self._truncate(f"Scroll {target}")
        else:
            return "Scroll"

    def _generate_input_name(
        self,
        data: Dict[str, Any],
        action_data: Dict[str, Any]
    ) -> str:
        """Generate name for text input actions.

        Args:
            data: Normalized element data.
            action_data: Input action data with text.

        Returns:
            Step name like "Enter Email Address".
        """
        target = self._get_target_description(data)
        hint = data.get('hint', '')
        input_text = action_data.get('text', '')

        # Prefer hint text for field description
        if hint:
            return self._truncate(f"Enter {self._title_case(hint)}")
        elif target:
            return self._truncate(f"Enter {target}")
        elif input_text:
            # Mask sensitive input but show type
            if self._looks_like_email(input_text):
                return "Enter Email Address"
            elif self._looks_like_password(input_text):
                return "Enter Password"
            elif self._looks_like_phone(input_text):
                return "Enter Phone Number"
            else:
                # Show a preview of the text (first 20 chars)
                preview = input_text[:20] + '...' if len(input_text) > 20 else input_text
                return self._truncate(f"Enter \"{preview}\"")
        else:
            return "Enter Text"

    def _generate_wait_name(
        self,
        data: Dict[str, Any],
        action_data: Dict[str, Any]
    ) -> str:
        """Generate name for wait actions.

        Args:
            data: Normalized element data.
            action_data: Wait action data with duration.

        Returns:
            Step name like "Wait for Loading".
        """
        duration_ms = action_data.get('duration_ms', 1000)
        wait_for_element = action_data.get('wait_for_element', False)
        target = self._get_target_description(data)

        if wait_for_element and target:
            return self._truncate(f"Wait for {target}")
        elif duration_ms >= 1000:
            seconds = duration_ms / 1000
            if seconds == int(seconds):
                return f"Wait {int(seconds)} Second{'s' if seconds != 1 else ''}"
            else:
                return f"Wait {seconds:.1f} Seconds"
        else:
            return f"Wait {duration_ms}ms"

    def _generate_generic_name(
        self,
        action: str,
        data: Dict[str, Any]
    ) -> str:
        """Generate a generic name for unknown action types.

        Args:
            action: Action type string.
            data: Normalized element data.

        Returns:
            Generic step name.
        """
        action_title = self._title_case(action.replace('_', ' '))
        target = self._get_target_description(data)

        if target:
            return self._truncate(f"{action_title} {target}")
        else:
            return self._truncate(f"{action_title} Element")

    def _get_target_description(self, data: Dict[str, Any]) -> Optional[str]:
        """Extract the best target description from element data.

        Priority:
        1. Content description (most descriptive)
        2. Text (visible label)
        3. Resource ID (parsed)
        4. Hint text

        Args:
            data: Normalized element data.

        Returns:
            Target description string or None.
        """
        # Try content description first
        content_desc = data.get('contentDescription')
        if content_desc:
            return self._clean_description(content_desc)

        # Try visible text
        text = data.get('text')
        if text:
            return self._clean_description(text)

        # Try to parse resource ID
        resource_id = data.get('resourceId')
        if resource_id:
            parsed = self._parse_resource_id(resource_id)
            if parsed:
                return parsed

        # Try hint text
        hint = data.get('hint')
        if hint:
            return self._clean_description(hint)

        return None

    def _infer_element_type(self, data: Dict[str, Any]) -> Optional[str]:
        """Infer the UI element type from class name and other data.

        Args:
            data: Normalized element data.

        Returns:
            Element type string (Button, Input, etc.) or None.
        """
        class_name = data.get('className', '').lower()
        resource_id = data.get('resourceId', '').lower()
        content_desc = data.get('contentDescription', '').lower()

        combined = f"{class_name} {resource_id} {content_desc}"

        # Check for button patterns
        for pattern in BUTTON_PATTERNS:
            if re.search(pattern, combined):
                return "Button"

        # Check for input patterns
        for pattern in INPUT_PATTERNS:
            if re.search(pattern, combined):
                return "Field"

        # Check for checkbox patterns
        for pattern in CHECKBOX_PATTERNS:
            if re.search(pattern, combined):
                return "Checkbox"

        # Check for icon patterns
        for pattern in ICON_PATTERNS:
            if re.search(pattern, combined):
                return "Icon"

        # Infer from Android class names
        if 'button' in class_name:
            return "Button"
        elif 'edittext' in class_name or 'textinputedittext' in class_name:
            return "Field"
        elif 'checkbox' in class_name:
            return "Checkbox"
        elif 'switch' in class_name or 'togglebutton' in class_name:
            return "Toggle"
        elif 'imageview' in class_name or 'imagebutton' in class_name:
            return "Icon"
        elif 'textview' in class_name:
            return "Text"
        elif 'recyclerview' in class_name or 'listview' in class_name:
            return "List"

        return None

    def _parse_resource_id(self, resource_id: str) -> Optional[str]:
        """Parse resource ID to extract meaningful name.

        Converts IDs like 'com.app:id/login_btn' to 'Login Btn'.

        Args:
            resource_id: Android resource ID string.

        Returns:
            Human-readable name or None.
        """
        if not resource_id:
            return None

        # Extract the ID name part
        if ':id/' in resource_id:
            name_part = resource_id.split(':id/')[-1]
        elif '/' in resource_id:
            name_part = resource_id.split('/')[-1]
        else:
            name_part = resource_id

        # Clean up the name
        # Replace underscores and hyphens with spaces
        name = re.sub(r'[_\-]', ' ', name_part)

        # Split camelCase
        name = re.sub(r'([a-z])([A-Z])', r'\1 \2', name)

        # Remove common suffixes that don't add meaning
        name = re.sub(r'\b(view|layout|container|wrapper|root)\b', '', name, flags=re.IGNORECASE)

        # Title case
        name = self._title_case(name)

        # Remove extra whitespace
        name = ' '.join(name.split())

        return name if name else None

    def _clean_description(self, text: str) -> str:
        """Clean and format a description text.

        Args:
            text: Raw description text.

        Returns:
            Cleaned and formatted text.
        """
        # Remove extra whitespace
        text = ' '.join(text.split())

        # Remove common noise phrases
        noise_patterns = [
            r'^tap to\s+',
            r'^click to\s+',
            r'^press to\s+',
            r'\s+button$',
        ]

        for pattern in noise_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)

        # Title case if all lowercase
        if text == text.lower():
            text = self._title_case(text)

        return text.strip()

    def _title_case(self, text: str) -> str:
        """Convert text to title case, handling common words.

        Args:
            text: Input text.

        Returns:
            Title-cased text.
        """
        # Words that should stay lowercase (except at start)
        lowercase_words = {'a', 'an', 'and', 'as', 'at', 'by', 'for', 'from',
                          'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with'}

        words = text.lower().split()
        if not words:
            return text

        result = [words[0].capitalize()]
        for word in words[1:]:
            if word in lowercase_words:
                result.append(word)
            else:
                result.append(word.capitalize())

        return ' '.join(result)

    def _truncate(self, text: str) -> str:
        """Truncate text to maximum length.

        Args:
            text: Input text.

        Returns:
            Truncated text with ellipsis if needed.
        """
        if len(text) <= self.max_name_length:
            return text
        return text[:self.max_name_length - 3] + '...'

    def _looks_like_email(self, text: str) -> bool:
        """Check if text looks like an email address.

        Args:
            text: Input text.

        Returns:
            True if it looks like an email.
        """
        return bool(re.match(r'^[^@]+@[^@]+\.[^@]+$', text))

    def _looks_like_password(self, text: str) -> bool:
        """Check if text looks like a password.

        Passwords are often hidden, but we check for common patterns.

        Args:
            text: Input text.

        Returns:
            True if it looks like a password.
        """
        # All dots (masked) or high complexity
        if all(c == '•' or c == '*' for c in text):
            return True
        # Mix of letters, numbers, and special chars
        has_letter = any(c.isalpha() for c in text)
        has_digit = any(c.isdigit() for c in text)
        has_special = any(not c.isalnum() for c in text)
        return has_letter and has_digit and has_special and len(text) >= 8

    def _looks_like_phone(self, text: str) -> bool:
        """Check if text looks like a phone number.

        Args:
            text: Input text.

        Returns:
            True if it looks like a phone number.
        """
        # Remove common formatting
        cleaned = re.sub(r'[\s\-\.\(\)\+]', '', text)
        return cleaned.isdigit() and 7 <= len(cleaned) <= 15


# Module-level singleton instance
step_namer: Optional[StepNamer] = None


def get_step_namer(max_name_length: int = 100) -> StepNamer:
    """Get or create the step namer singleton.

    Args:
        max_name_length: Maximum length for generated names.

    Returns:
        StepNamer instance.
    """
    global step_namer
    if step_namer is None:
        step_namer = StepNamer(max_name_length=max_name_length)
    return step_namer
