"""Data table component."""

import flet as ft
from ..theme import get_colors



# Dynamic color proxy - acts like a dict but always gets current theme colors
class _DynamicColors:
    def get(self, key, default=None):
        return get_colors().get(key, default)
    
    def __getitem__(self, key):
        return get_colors()[key]

COLORS = _DynamicColors()

class DataTable(ft.Container):
    """A styled data table."""

    def __init__(
        self,
        columns: list[str],
        rows: list[list[ft.Control | str]],
        on_row_click=None,
        **kwargs
    ):
        # Build header
        header_cells = [
            ft.Container(
                content=ft.Text(
                    col,
                    size=12,
                    weight=ft.FontWeight.W_600,
                    color=COLORS["text_secondary"],
                ),
                padding=ft.padding.symmetric(horizontal=16, vertical=12),
                expand=True,
            )
            for col in columns
        ]

        header = ft.Container(
            content=ft.Row(header_cells, spacing=0),
            bgcolor=COLORS["bg_tertiary"],
            border=ft.border.only(bottom=ft.BorderSide(1, COLORS["border"])),
        )

        # Build rows
        row_controls = []
        for i, row_data in enumerate(rows):
            cells = []
            for cell in row_data:
                if isinstance(cell, str):
                    cell_content = ft.Text(
                        cell,
                        size=14,
                        color=COLORS["text_primary"],
                    )
                else:
                    cell_content = cell

                cells.append(
                    ft.Container(
                        content=cell_content,
                        padding=ft.padding.symmetric(horizontal=16, vertical=14),
                        expand=True,
                    )
                )

            row = ft.Container(
                content=ft.Row(cells, spacing=0),
                bgcolor=COLORS["bg_card"],
                border=ft.border.only(
                    bottom=ft.BorderSide(1, COLORS["border"])
                ) if i < len(rows) - 1 else None,
                on_hover=lambda e: self._on_row_hover(e),
                on_click=lambda e, idx=i: on_row_click(idx) if on_row_click else None,
                data=i,
            )
            row_controls.append(row)

        # Combine header and rows
        table_content = ft.Column(
            [header, *row_controls],
            spacing=0,
        )

        super().__init__(
            content=table_content,
            bgcolor=COLORS["bg_card"],
            border_radius=12,
            border=ft.border.all(1, COLORS["border"]),
            clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
            **kwargs
        )

    def _on_row_hover(self, e):
        """Handle row hover effect."""
        e.control.bgcolor = COLORS["bg_hover"] if e.data == "true" else COLORS["bg_card"]
        e.control.update()
