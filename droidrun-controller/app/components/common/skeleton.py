"""Skeleton Loading Components for Droidrun Controller.

Provides elegant loading placeholders while content is being fetched.
Implements shimmer animation for better perceived performance.
"""

import flet as ft
import asyncio
from typing import Optional, List
from ...theme import get_colors, RADIUS, SPACING



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class Skeleton(ft.Container):
    """Base skeleton component with shimmer animation.

    Provides a placeholder shape that animates to indicate loading.

    Example:
        Skeleton(width=200, height=20, border_radius=4)
    """

    def __init__(
        self,
        width: Optional[float] = None,
        height: Optional[float] = 20,
        border_radius: float = RADIUS["sm"],
        circle: bool = False,
        **kwargs
    ):
        colors = get_colors()

        # For circle, width and height should be equal
        if circle:
            size = width or height or 40
            width = size
            height = size
            border_radius = size / 2

        super().__init__(
            width=width,
            height=height,
            border_radius=border_radius,
            bgcolor=colors.get("skeleton_base", colors["bg_hover"]),
            animate=ft.Animation(2000, ft.AnimationCurve.EASE_IN_OUT),
            **kwargs
        )

        # Start shimmer animation
        self.page.run_task(self._animate_shimmer) if hasattr(self, 'page') and self.page else None

    async def _animate_shimmer(self):
        """Animate the shimmer effect."""
        colors = get_colors()
        base = colors.get("skeleton_base", colors["bg_hover"])
        highlight = colors.get("skeleton_highlight", colors["bg_card"])

        while True:
            # Fade to highlight
            self.bgcolor = highlight
            self.update()
            await asyncio.sleep(1)

            # Fade to base
            self.bgcolor = base
            self.update()
            await asyncio.sleep(1)


class SkeletonText(ft.Column):
    """Skeleton placeholder for text content.

    Example:
        SkeletonText(lines=3)  # 3 lines of loading text
    """

    def __init__(
        self,
        lines: int = 3,
        last_line_width: float = 0.6,
        spacing: float = SPACING["sm"],
        **kwargs
    ):
        lines_list = []
        for i in range(lines):
            # Last line is shorter
            width = None if i < lines - 1 else f"{last_line_width * 100}%"
            lines_list.append(
                Skeleton(width=width, height=16, border_radius=RADIUS["xs"])
            )

        super().__init__(
            lines_list,
            spacing=spacing,
            **kwargs
        )


class SkeletonCard(ft.Container):
    """Skeleton placeholder for a card.

    Example:
        SkeletonCard()  # Standard card loading state
    """

    def __init__(
        self,
        width: Optional[float] = None,
        height: Optional[float] = 200,
        **kwargs
    ):
        colors = get_colors()

        content = ft.Column(
            [
                # Header
                ft.Row(
                    [
                        Skeleton(width=40, height=40, circle=True),
                        ft.Container(width=SPACING["md"]),
                        ft.Column(
                            [
                                Skeleton(width=120, height=16),
                                ft.Container(height=SPACING["xs"]),
                                Skeleton(width=80, height=12),
                            ],
                            spacing=0,
                        ),
                    ],
                ),
                ft.Container(height=SPACING["lg"]),
                # Content lines
                SkeletonText(lines=3),
            ],
            spacing=0,
        )

        super().__init__(
            content=content,
            width=width,
            height=height,
            padding=SPACING["xl"],
            border_radius=RADIUS["lg"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border"]),
            **kwargs
        )


class SkeletonDeviceCard(ft.Container):
    """Skeleton placeholder for device card in Phone Viewer.

    Matches the actual device card dimensions and layout.
    """

    def __init__(self, **kwargs):
        colors = get_colors()

        content = ft.Column(
            [
                # Header with status badge
                ft.Row(
                    [
                        Skeleton(width=60, height=20, border_radius=RADIUS["sm"]),
                        ft.Container(expand=True),
                        Skeleton(width=30, height=20, border_radius=RADIUS["sm"]),
                    ],
                ),
                ft.Container(height=SPACING["sm"]),
                # Device name
                Skeleton(width=100, height=14, border_radius=RADIUS["xs"]),
                ft.Container(height=SPACING["md"]),
                # Screenshot preview
                Skeleton(
                    width=None,
                    height=160,
                    border_radius=RADIUS["md"],
                    expand=True,
                ),
                ft.Container(height=SPACING["sm"]),
                # Status
                Skeleton(width=60, height=12, border_radius=RADIUS["xs"]),
                ft.Container(height=SPACING["sm"]),
                # Action buttons
                ft.Row(
                    [
                        Skeleton(width=32, height=32, border_radius=RADIUS["sm"]),
                        Skeleton(width=32, height=32, border_radius=RADIUS["sm"]),
                        Skeleton(width=32, height=32, border_radius=RADIUS["sm"]),
                        Skeleton(width=32, height=32, border_radius=RADIUS["sm"]),
                    ],
                    alignment=ft.MainAxisAlignment.SPACE_AROUND,
                ),
            ],
            spacing=0,
        )

        super().__init__(
            content=content,
            width=180,
            height=310,
            padding=ft.padding.all(12),
            border_radius=RADIUS["xl"],
            bgcolor=colors["bg_card"],
            border=ft.border.all(1, colors["border"]),
            **kwargs
        )


class SkeletonTable(ft.Column):
    """Skeleton placeholder for data table.

    Example:
        SkeletonTable(rows=5, columns=4)
    """

    def __init__(
        self,
        rows: int = 5,
        columns: int = 4,
        **kwargs
    ):
        colors = get_colors()

        # Header row
        header_cells = []
        for _ in range(columns):
            header_cells.append(
                ft.Container(
                    content=Skeleton(width=100, height=16),
                    padding=SPACING["md"],
                    expand=True,
                )
            )

        header = ft.Container(
            content=ft.Row(header_cells, spacing=0),
            bgcolor=colors["bg_secondary"],
            border_radius=ft.border_radius.only(top_left=RADIUS["lg"], top_right=RADIUS["lg"]),
        )

        # Data rows
        data_rows = []
        for _ in range(rows):
            cells = []
            for _ in range(columns):
                cells.append(
                    ft.Container(
                        content=Skeleton(width=80, height=14),
                        padding=SPACING["md"],
                        expand=True,
                    )
                )
            data_rows.append(
                ft.Container(
                    content=ft.Row(cells, spacing=0),
                    border=ft.border.only(bottom=ft.BorderSide(1, colors["border"])),
                )
            )

        super().__init__(
            [
                header,
                *data_rows,
            ],
            spacing=0,
            **kwargs
        )


class SkeletonGrid(ft.Container):
    """Skeleton placeholder for grid layout.

    Example:
        SkeletonGrid(items=6)  # Shows 6 skeleton cards in a grid
    """

    def __init__(
        self,
        items: int = 6,
        columns: int = 3,
        item_height: float = 200,
        **kwargs
    ):
        # Create skeleton cards
        cards = []
        for _ in range(items):
            cards.append(SkeletonDeviceCard())

        super().__init__(
            content=ft.Row(
                cards,
                wrap=True,
                spacing=SPACING["xl"],
                run_spacing=SPACING["xl"],
            ),
            padding=SPACING["xxl"],
            **kwargs
        )


class SkeletonList(ft.Column):
    """Skeleton placeholder for list view.

    Example:
        SkeletonList(items=5)  # Shows 5 skeleton list items
    """

    def __init__(
        self,
        items: int = 5,
        **kwargs
    ):
        colors = get_colors()

        items_list = []
        for _ in range(items):
            item = ft.Container(
                content=ft.Row(
                    [
                        Skeleton(width=48, height=48, circle=True),
                        ft.Container(width=SPACING["md"]),
                        ft.Column(
                            [
                                Skeleton(width=200, height=16),
                                ft.Container(height=SPACING["xs"]),
                                Skeleton(width=150, height=12),
                            ],
                            spacing=0,
                            expand=True,
                        ),
                        Skeleton(width=80, height=32, border_radius=RADIUS["md"]),
                    ],
                ),
                padding=SPACING["lg"],
                border=ft.border.only(bottom=ft.BorderSide(1, colors["border"])),
            )
            items_list.append(item)

        super().__init__(
            items_list,
            spacing=0,
            **kwargs
        )


# Helper function to show skeleton while loading
def with_skeleton(
    loading: bool,
    content: ft.Control,
    skeleton: ft.Control,
) -> ft.Control:
    """Helper to show skeleton while loading, content when loaded.

    Example:
        with_skeleton(
            loading=is_loading,
            content=actual_content,
            skeleton=SkeletonCard(),
        )
    """
    if loading:
        return skeleton
    return content
