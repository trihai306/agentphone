"""Professional File Manager View - Advanced file management with tree navigation.

Features:
- Folder tree navigation with expand/collapse
- Breadcrumb navigation
- Multiple view modes (grid, list, table)
- File preview panel
- Advanced search and filters
- Drag & drop upload
- Batch operations (copy, move, delete, download)
- File sorting and grouping
- Context menu
- Quick actions
"""

import flet as ft
from typing import Optional, List, Set, Dict
from datetime import datetime
from pathlib import Path
import os
import time

from ..theme import get_colors, SPACING, RADIUS, ANIMATION, get_shadow
from ..components.toast import ToastManager


class FileManagerView(ft.Column):
    """Professional file manager with advanced features."""
    
    def __init__(
        self,
        app_state: dict,
        toast: ToastManager,
        **kwargs
    ):
        self.app_state = app_state
        self.toast = toast
        
        # Use project's storage folder
        project_root = Path(__file__).parent.parent.parent  # Go up to project root
        self.root_path = project_root / "storage"
        
        # Create storage folder if it doesn't exist
        if not self.root_path.exists():
            self.root_path.mkdir(parents=True, exist_ok=True)
            (self.root_path / "images").mkdir(exist_ok=True)
            (self.root_path / "videos").mkdir(exist_ok=True)
            (self.root_path / "documents").mkdir(exist_ok=True)
            (self.root_path / "screenshots").mkdir(exist_ok=True)
        
        self.current_path = self.root_path
        self.all_files: List[dict] = []
        self.selected_items: Set[str] = set()
        self.search_query = ""
        self.file_type_filter = "all"  # all, image, video, document
        self.view_mode = "grid"  # grid, list, table
        self.sort_by = "name"  # name, date, size, type
        self.sort_order = "asc"  # asc, desc
        self.show_hidden = False
        self.loading = False
        
        super().__init__(
            expand=True,
            spacing=0,
        )
        
        # Load files from current directory
        self._load_directory()
        self.controls = [self._build_content()]
    
    def _load_directory(self):
        """Load files and folders from current directory."""
        try:
            self.all_files = []
            
            # Scan current directory
            for item in self.current_path.iterdir():
                # Skip hidden files if needed
                if not self.show_hidden and item.name.startswith('.'):
                    continue
                
                try:
                    stat = item.stat()
                    
                    if item.is_dir():
                        # Count items in folder
                        try:
                            items_count = len(list(item.iterdir()))
                        except PermissionError:
                            items_count = 0
                        
                        self.all_files.append({
                            "id": str(item),
                            "name": item.name,
                            "type": "folder",
                            "size": 0,
                            "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                            "items": items_count,
                            "path": str(item),
                        })
                    else:
                        # Get file extension
                        ext = item.suffix.lstrip('.').lower()
                        
                        self.all_files.append({
                            "id": str(item),
                            "name": item.name,
                            "type": "file",
                            "ext": ext,
                            "size": stat.st_size,
                            "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                            "path": str(item.parent),
                        })
                except (PermissionError, OSError) as e:
                    # Skip files we can't read
                    continue
                    
        except PermissionError:
            self.toast.error(f"Permission denied: {self.current_path}")
            self.all_files = []
        except Exception as e:
            self.toast.error(f"Error loading directory: {e}")
            self.all_files = []
    
    def _build_content(self):
        """Build the main content."""
        colors = get_colors()
        
        return ft.Container(
            content=ft.Row(
                [
                    # Left sidebar - Folder tree
                    self._build_sidebar(),
                    # Right content - File browser
                    ft.Container(
                        content=ft.Column(
                            [
                                self._build_header(),
                                self._build_toolbar(),
                                self._build_file_area(),
                            ],
                            spacing=0,
                            expand=True,
                        ),
                        expand=True,
                    ),
                ],
                spacing=0,
                expand=True,
            ),
            expand=True,
            bgcolor=colors["bg_primary"],
        )
    
    def _build_sidebar(self):
        """Build left sidebar with folder tree."""
        colors = get_colors()
        
        # Quick access items
        quick_items = [
            ("All Files", ft.Icons.FOLDER_OUTLINED, "/"),
            ("Recent", ft.Icons.HISTORY_ROUNDED, "/recent"),
            ("Starred", ft.Icons.STAR_OUTLINE_ROUNDED, "/starred"),
            ("Trash", ft.Icons.DELETE_OUTLINE_ROUNDED, "/trash"),
        ]
        
        # Folder tree
        folders = [f for f in self.all_files if f["type"] == "folder"]
        
        return ft.Container(
            content=ft.Column(
                [
                    # Header
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.FOLDER_OPEN_ROUNDED, size=20, color=colors["primary"]),
                                ft.Container(width=8),
                                ft.Text(
                                    "File Browser",
                                    size=16,
                                    weight=ft.FontWeight.W_700,
                                    color=colors["text_primary"],
                                ),
                            ],
                        ),
                        padding=ft.Padding(left=20, right=20, top=20, bottom=16),
                    ),
                    ft.Container(
                        height=1,
                        bgcolor=colors["border"],
                        margin=ft.Margin(left=16, right=16, top=0, bottom=0),
                    ),
                    # Quick access
                    ft.Container(
                        content=ft.Column(
                            [
                                ft.Container(
                                    content=ft.Text(
                                        "QUICK ACCESS",
                                        size=10,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["text_muted"],
                                    ),
                                    padding=ft.Padding(left=20, right=20, top=16, bottom=8),
                                ),
                                ft.Column(
                                    [self._build_sidebar_item(name, icon, path) for name, icon, path in quick_items],
                                    spacing=2,
                                ),
                            ],
                        ),
                    ),
                    ft.Container(
                        height=1,
                        bgcolor=colors["border"],
                        margin=ft.Margin(left=16, right=16, top=12, bottom=0),
                    ),
                    # Folders
                    ft.Container(
                        content=ft.Column(
                            [
                                ft.Container(
                                    content=ft.Text(
                                        "FOLDERS",
                                        size=10,
                                        weight=ft.FontWeight.W_600,
                                        color=colors["text_muted"],
                                    ),
                                    padding=ft.Padding(left=20, right=20, top=16, bottom=8),
                                ),
                                ft.Column(
                                    [self._build_folder_item(folder) for folder in folders],
                                    spacing=2,
                                ),
                            ],
                            scroll=ft.ScrollMode.AUTO,
                            expand=True,
                        ),
                        expand=True,
                    ),
                    # Storage info
                    self._build_storage_info(),
                ],
                spacing=0,
                expand=True,
            ),
            width=260,
            bgcolor=colors["bg_secondary"],
            border=ft.Border(right=ft.BorderSide(1, colors["border"])),
        )
    
    def _build_sidebar_item(self, name: str, icon: str, path: str):
        """Build a sidebar quick access item."""
        colors = get_colors()
        is_active = self.current_path == path
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        icon,
                        size=18,
                        color=colors["primary"] if is_active else colors["text_secondary"],
                    ),
                    ft.Container(width=10),
                    ft.Text(
                        name,
                        size=13,
                        weight=ft.FontWeight.W_600 if is_active else ft.FontWeight.W_500,
                        color=colors["text_primary"] if is_active else colors["text_secondary"],
                    ),
                ],
            ),
            padding=ft.Padding(left=20, right=20, top=8, bottom=8),
            bgcolor=colors["primary_glow"] if is_active else "transparent",
            border_radius=RADIUS["md"],
            margin=ft.Margin(left=12, right=12, top=0, bottom=0),
            on_click=lambda e, p=path: self._navigate_to(p),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )
    
    def _build_folder_item(self, folder: dict):
        """Build a folder tree item."""
        colors = get_colors()
        is_active = self.current_path == folder["path"]
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(
                        ft.Icons.FOLDER_ROUNDED if is_active else ft.Icons.FOLDER_OUTLINED,
                        size=18,
                        color=colors["accent_yellow"] if is_active else colors["text_muted"],
                    ),
                    ft.Container(width=10),
                    ft.Column(
                        [
                            ft.Text(
                                folder["name"],
                                size=13,
                                weight=ft.FontWeight.W_600 if is_active else ft.FontWeight.W_500,
                                color=colors["text_primary"] if is_active else colors["text_secondary"],
                            ),
                            ft.Text(
                                f"{folder.get('items', 0)} items",
                                size=10,
                                color=colors["text_muted"],
                            ),
                        ],
                        spacing=0,
                        expand=True,
                    ),
                ],
            ),
            padding=ft.Padding(left=20, right=20, top=8, bottom=8),
            bgcolor=colors["bg_hover"] if is_active else "transparent",
            border_radius=RADIUS["md"],
            margin=ft.Margin(left=12, right=12, top=0, bottom=0),
            on_click=lambda e, p=folder["path"]: self._navigate_to(p),
            on_hover=self._on_sidebar_hover,
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )
    
    def _build_storage_info(self):
        """Build storage usage info."""
        colors = get_colors()
        used_gb = 42.5
        total_gb = 100
        percent = (used_gb / total_gb) * 100
        
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        height=1,
                        bgcolor=colors["border"],
                        margin=ft.Margin(left=0, right=0, top=0, bottom=12),
                    ),
                    ft.Text(
                        "Storage",
                        size=11,
                        weight=ft.FontWeight.W_600,
                        color=colors["text_secondary"],
                    ),
                    ft.Container(height=6),
                    ft.Container(
                        content=ft.Stack(
                            [
                                ft.Container(
                                    height=6,
                                    border_radius=3,
                                    bgcolor=colors["bg_tertiary"],
                                ),
                                ft.Container(
                                    width=f"{percent}%",
                                    height=6,
                                    border_radius=3,
                                    bgcolor=colors["primary"],
                                ),
                            ],
                        ),
                        height=6,
                    ),
                    ft.Container(height=8),
                    ft.Text(
                        f"{used_gb} GB of {total_gb} GB used",
                        size=10,
                        color=colors["text_muted"],
                    ),
                ],
            ),
            padding=ft.Padding(left=20, right=20, top=12, bottom=20),
        )
    
    def _build_header(self):
        """Build the page header."""
        colors = get_colors()
        
        # Breadcrumb navigation
        breadcrumbs = self._build_breadcrumb()
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Column(
                        [
                            breadcrumbs,
                            ft.Container(height=4),
                            ft.Text(
                                f"{len(self._get_current_files())} items",
                                size=12,
                                color=colors["text_muted"],
                            ),
                        ],
                        spacing=0,
                    ),
                    ft.Container(expand=True),
                    # Actions
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.CREATE_NEW_FOLDER_OUTLINED, size=18, color=colors["text_inverse"]),
                                ft.Container(width=8),
                                ft.Text("New Folder", size=13, weight=ft.FontWeight.W_600, color=colors["text_inverse"]),
                            ],
                        ),
                        padding=ft.Padding(left=16, right=16, top=10, bottom=10),
                        border_radius=RADIUS["md"],
                        bgcolor=colors["primary"],
                        on_click=self._on_new_folder,
                        on_hover=self._on_primary_hover,
                    ),
                    ft.Container(width=12),
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.UPLOAD_FILE_ROUNDED, size=18, color=colors["text_inverse"]),
                                ft.Container(width=8),
                                ft.Text("Upload", size=13, weight=ft.FontWeight.W_600, color=colors["text_inverse"]),
                            ],
                        ),
                        padding=ft.Padding(left=16, right=16, top=10, bottom=10),
                        border_radius=RADIUS["md"],
                        bgcolor=colors["accent_cyan"],
                        on_click=self._on_upload,
                        on_hover=self._on_upload_hover,
                    ),
                ],
            ),
            padding=ft.Padding(left=SPACING["xxl"], right=SPACING["xxl"], top=SPACING["xl"], bottom=SPACING["md"]),
            bgcolor=colors["bg_card"],
            border=ft.Border(bottom=ft.BorderSide(1, colors["border"])),
        )
    
    def _build_breadcrumb(self):
        """Build breadcrumb navigation."""
        colors = get_colors()
        
        # Get path relative to root
        try:
            rel_path = self.current_path.relative_to(self.root_path)
            parts = rel_path.parts
        except ValueError:
            # current_path is not relative to root_path
            parts = self.current_path.parts
        
        items = []
        
        # Home icon
        items.append(
            ft.Container(
                content=ft.Icon(ft.Icons.HOME_ROUNDED, size=18, color=colors["primary"] if not parts or parts == ('.',) else colors["text_secondary"]),
                on_click=lambda e: self._navigate_to(self.root_path),
            )
        )
        
        if not parts or parts == ('.',):
            # We're at root, show as "Home"
            items.append(ft.Container(width=8))
            items.append(ft.Text("Home", size=18, weight=ft.FontWeight.W_700, color=colors["text_primary"]))
            return ft.Row(items, spacing=6)
        
        items.append(ft.Icon(ft.Icons.CHEVRON_RIGHT, size=14, color=colors["text_muted"]))
        
        # Path parts
        for i, part in enumerate(parts):
            is_last = i == len(parts) - 1
            items.append(
                ft.Text(
                    part,
                    size=16 if is_last else 13,
                    weight=ft.FontWeight.W_700 if is_last else ft.FontWeight.W_500,
                    color=colors["text_primary"] if is_last else colors["text_secondary"],
                )
            )
            if not is_last:
                items.append(ft.Icon(ft.Icons.CHEVRON_RIGHT, size=14, color=colors["text_muted"]))
        
        return ft.Row(items, spacing=6)
    
    def _build_toolbar(self):
        """Build the filter and action toolbar."""
        colors = get_colors()
        
        return ft.Container(
            content=ft.Column(
                [
                    # File type filters
                    ft.Row(
                        [
                            self._build_type_filter_chip("All Files", "all", ft.Icons.GRID_VIEW_ROUNDED),
                            self._build_type_filter_chip("Images", "image", ft.Icons.IMAGE_ROUNDED),
                            self._build_type_filter_chip("Videos", "video", ft.Icons.VIDEOCAM_ROUNDED),
                            self._build_type_filter_chip("Documents", "document", ft.Icons.DESCRIPTION_ROUNDED),
                            ft.Container(expand=True),
                        ],
                    ),
                    ft.Container(height=SPACING["md"]),
                    # Search and Sort row
                    ft.Row(
                        [
                            # Search
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.SEARCH_ROUNDED, size=18, color=colors["text_muted"]),
                                        ft.TextField(
                                            hint_text="Search files...",
                                            border=ft.InputBorder.NONE,
                                            height=36,
                                            text_size=13,
                                            hint_style=ft.TextStyle(color=colors["text_muted"]),
                                            color=colors["text_primary"],
                                            on_change=self._on_search_change,
                                            expand=True,
                                        ),
                                    ],
                                    spacing=8,
                                ),
                                width=300,
                                padding=ft.Padding(left=12, right=12, top=0, bottom=0),
                                bgcolor=colors["bg_tertiary"],
                                border_radius=RADIUS["md"],
                            ),
                            ft.Container(width=SPACING["lg"]),
                            # Sort
                            ft.Container(
                                content=ft.Row(
                                    [
                                        ft.Icon(ft.Icons.SORT_ROUNDED, size=16, color=colors["text_secondary"]),
                                        ft.Container(width=6),
                                        ft.Text("Sort:", size=12, color=colors["text_secondary"]),
                                        ft.Container(width=8),
                                        self._build_sort_chip("Name", "name"),
                                        self._build_sort_chip("Date", "date"),
                                        self._build_sort_chip("Size", "size"),
                                        self._build_sort_chip("Type", "type"),
                                    ],
                                ),
                            ),
                            ft.Container(expand=True),
                            # View mode toggle
                            self._build_view_toggle(),
                        ],
                    ),
                ],
                spacing=0,
            ),
            padding=ft.Padding(left=SPACING["xxl"], right=SPACING["xxl"], top=SPACING["md"], bottom=SPACING["md"]),
            bgcolor=colors["bg_card"],
            border=ft.Border(bottom=ft.BorderSide(1, colors["border"])),
        )
    
    def _build_type_filter_chip(self, label: str, value: str, icon: str):
        """Build a file type filter chip."""
        colors = get_colors()
        is_active = self.file_type_filter == value
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=colors["primary"] if is_active else colors["text_secondary"]),
                    ft.Container(width=6),
                    ft.Text(
                        label,
                        size=13,
                        weight=ft.FontWeight.W_600 if is_active else ft.FontWeight.W_500,
                        color=colors["primary"] if is_active else colors["text_secondary"],
                    ),
                ],
            ),
            padding=ft.Padding(left=14, right=14, top=9, bottom=9),
            border_radius=RADIUS["full"],
            bgcolor=colors["primary_glow"] if is_active else "transparent",
            border=ft.Border(
                left=ft.BorderSide(1, colors["primary"] if is_active else colors["border"]),
                right=ft.BorderSide(1, colors["primary"] if is_active else colors["border"]),
                top=ft.BorderSide(1, colors["primary"] if is_active else colors["border"]),
                bottom=ft.BorderSide(1, colors["primary"] if is_active else colors["border"]),
            ),
            on_click=lambda e, v=value: self._on_type_filter_change(v),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )
    
    def _build_sort_chip(self, label: str, value: str):
        """Build a sort chip."""
        colors = get_colors()
        is_active = self.sort_by == value
        
        return ft.Container(
            content=ft.Text(
                label,
                size=11,
                weight=ft.FontWeight.W_600 if is_active else ft.FontWeight.W_500,
                color=colors["primary"] if is_active else colors["text_muted"],
            ),
            padding=ft.Padding(left=10, right=10, top=5, bottom=5),
            border_radius=RADIUS["sm"],
            bgcolor=colors["primary_glow"] if is_active else "transparent",
            on_click=lambda e, v=value: self._on_sort_click(v),
        )
    
    def _build_view_toggle(self):
        """Build view mode toggle."""
        colors = get_colors()
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.GRID_VIEW_ROUNDED,
                            size=16,
                            color=colors["primary"] if self.view_mode == "grid" else colors["text_muted"],
                        ),
                        padding=6,
                        border_radius=RADIUS["sm"],
                        bgcolor=colors["primary_glow"] if self.view_mode == "grid" else "transparent",
                        on_click=lambda e: self._set_view_mode("grid"),
                    ),
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.VIEW_LIST_ROUNDED,
                            size=16,
                            color=colors["primary"] if self.view_mode == "list" else colors["text_muted"],
                        ),
                        padding=6,
                        border_radius=RADIUS["sm"],
                        bgcolor=colors["primary_glow"] if self.view_mode == "list" else "transparent",
                        on_click=lambda e: self._set_view_mode("list"),
                    ),
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.TABLE_ROWS_ROUNDED,
                            size=16,
                            color=colors["primary"] if self.view_mode == "table" else colors["text_muted"],
                        ),
                        padding=6,
                        border_radius=RADIUS["sm"],
                        bgcolor=colors["primary_glow"] if self.view_mode == "table" else "transparent",
                        on_click=lambda e: self._set_view_mode("table"),
                    ),
                ],
                spacing=2,
            ),
            padding=2,
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_tertiary"],
        )
    
    def _build_file_area(self):
        """Build the main file display area."""
        if self.view_mode == "grid":
            return self._build_grid_view()
        elif self.view_mode == "list":
            return self._build_list_view()
        else:
            return self._build_table_view()
    
    def _build_grid_view(self):
        """Build grid view of files."""
        colors = get_colors()
        files = self._get_current_files()
        
        if not files:
            return self._build_empty_state()
        
        cards = [self._build_file_card(file) for file in files]
        
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Row(
                            cards,
                            wrap=True,
                            spacing=SPACING["lg"],
                            run_spacing=SPACING["lg"],
                        ),
                        padding=ft.Padding(left=SPACING["xxl"], right=SPACING["xxl"], top=SPACING["xl"], bottom=SPACING["xxl"]),
                    ),
                ],
                scroll=ft.ScrollMode.AUTO,
                expand=True,
            ),
            expand=True,
        )
    
    def _build_file_card(self, file: dict):
        """Build a single file/folder card."""
        colors = get_colors()
        is_folder = file["type"] == "folder"
        is_selected = file["id"] in self.selected_items
        
        # File type icon and color
        if is_folder:
            icon = ft.Icons.FOLDER_ROUNDED
            icon_color = colors["accent_yellow"]
            bg_color = f"{colors['accent_yellow']}15"
        else:
            ext = file.get("ext", "").lower()
            if ext in ["pdf"]:
                icon = ft.Icons.PICTURE_AS_PDF_ROUNDED
                icon_color = colors["error"]
                bg_color = f"{colors['error']}15"
            elif ext in ["doc", "docx", "txt"]:
                icon = ft.Icons.DESCRIPTION_ROUNDED
                icon_color = colors["accent_indigo"]
                bg_color = f"{colors['accent_indigo']}15"
            elif ext in ["xls", "xlsx"]:
                icon = ft.Icons.TABLE_CHART_ROUNDED
                icon_color = colors["accent_green"]
                bg_color = f"{colors['accent_green']}15"
            elif ext in ["ppt", "pptx"]:
                icon = ft.Icons.SLIDESHOW_ROUNDED
                icon_color = colors["accent_orange"]
                bg_color = f"{colors['accent_orange']}15"
            elif ext in ["jpg", "jpeg", "png", "gif"]:
                icon = ft.Icons.IMAGE_ROUNDED
                icon_color = colors["accent_purple"]
                bg_color = f"{colors['accent_purple']}15"
            elif ext in ["mp4", "avi", "mov"]:
                icon = ft.Icons.VIDEOCAM_ROUNDED
                icon_color = colors["accent_pink"]
                bg_color = f"{colors['accent_pink']}15"
            else:
                icon = ft.Icons.INSERT_DRIVE_FILE_ROUNDED
                icon_color = colors["text_secondary"]
                bg_color = colors["bg_tertiary"]
        
        return ft.Container(
            content=ft.Column(
                [
                    # Icon/thumbnail
                    ft.Container(
                        content=ft.Stack(
                            [
                                ft.Container(
                                    content=ft.Icon(icon, size=48, color=icon_color),
                                    width=140,
                                    height=100,
                                    bgcolor=bg_color,
                                    border_radius=ft.BorderRadius(top_left=RADIUS["lg"], top_right=RADIUS["lg"], bottom_left=0, bottom_right=0),
                                    alignment=ft.Alignment(0, 0),
                                ),
                                # Selection checkbox
                                ft.Container(
                                    content=ft.Checkbox(
                                        value=is_selected,
                                        on_change=lambda e, id=file["id"]: self._on_select_item(id, e.control.value),
                                        active_color=colors["primary"],
                                    ),
                                    alignment=ft.Alignment(-1, -1),
                                    padding=4,
                                ),
                            ],
                        ),
                    ),
                    # File info
                    ft.Container(
                        content=ft.Column(
                            [
                                ft.Text(
                                    file["name"],
                                    size=12,
                                    weight=ft.FontWeight.W_600,
                                    color=colors["text_primary"],
                                    max_lines=1,
                                    overflow=ft.TextOverflow.ELLIPSIS,
                                ),
                                ft.Text(
                                    f"{file.get('items', '')} items" if is_folder else self._format_size(file.get("size", 0)),
                                    size=10,
                                    color=colors["text_muted"],
                                ),
                            ],
                            spacing=2,
                        ),
                        padding=ft.Padding(left=12, right=12, top=8, bottom=10),
                    ),
                ],
                spacing=0,
            ),
            width=140,
            border_radius=RADIUS["lg"],
            bgcolor=colors["bg_card"],
            border=ft.Border(
                left=ft.BorderSide(2 if is_selected else 1, colors["primary"] if is_selected else colors["border"]),
                right=ft.BorderSide(2 if is_selected else 1, colors["primary"] if is_selected else colors["border"]),
                top=ft.BorderSide(2 if is_selected else 1, colors["primary"] if is_selected else colors["border"]),
                bottom=ft.BorderSide(2 if is_selected else 1, colors["primary"] if is_selected else colors["border"]),
            ),
            shadow=get_shadow("xs"),
            on_click=lambda e, f=file: self._on_file_double_click(f) if is_folder else self._on_file_single_click(f),
            on_hover=self._on_card_hover,
        )
    
    def _build_list_view(self):
        """Build list view of files."""
        colors = get_colors()
        files = self._get_current_files()
        
        if not files:
            return self._build_empty_state()
        
        rows = []
        for file in files:
            rows.append(self._build_list_row(file))
        
        return ft.Container(
            content=ft.Column(
                rows,
                scroll=ft.ScrollMode.AUTO,
                spacing=0,
            ),
            expand=True,
            padding=ft.Padding(left=SPACING["xxl"], right=SPACING["xxl"], top=SPACING["lg"], bottom=SPACING["xxl"]),
        )
    
    def _build_list_row(self, file: dict):
        """Build a list row for a file."""
        colors = get_colors()
        is_folder = file["type"] == "folder"
        is_selected = file["id"] in self.selected_items
        
        # Get icon
        if is_folder:
            icon = ft.Icons.FOLDER_ROUNDED
            icon_color = colors["accent_yellow"]
        else:
            ext = file.get("ext", "").lower()
            if ext == "pdf":
                icon = ft.Icons.PICTURE_AS_PDF_ROUNDED
                icon_color = colors["error"]
            elif ext in ["doc", "docx"]:
                icon = ft.Icons.DESCRIPTION_ROUNDED
                icon_color = colors["accent_indigo"]
            elif ext in ["png", "jpg"]:
                icon = ft.Icons.IMAGE_ROUNDED
                icon_color = colors["accent_purple"]
            elif ext == "mp4":
                icon = ft.Icons.VIDEOCAM_ROUNDED
                icon_color = colors["accent_pink"]
            else:
                icon = ft.Icons.INSERT_DRIVE_FILE_ROUNDED
                icon_color = colors["text_secondary"]
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Checkbox(
                        value=is_selected,
                        on_change=lambda e, id=file["id"]: self._on_select_item(id, e.control.value),
                        active_color=colors["primary"],
                    ),
                    ft.Icon(icon, size=20, color=icon_color),
                    ft.Container(width=12),
                    ft.Text(
                        file["name"],
                        size=13,
                        weight=ft.FontWeight.W_500,
                        color=colors["text_primary"],
                        expand=True,
                    ),
                    ft.Text(
                        f"{file.get('items', '')} items" if is_folder else self._format_size(file.get("size", 0)),
                        size=12,
                        color=colors["text_muted"],
                        width=100,
                    ),
                    ft.Text(
                        file.get("modified", ""),
                        size=12,
                        color=colors["text_muted"],
                        width=140,
                    ),
                    ft.Row(
                        [
                            ft.IconButton(
                                ft.Icons.DOWNLOAD_ROUNDED,
                                icon_size=18,
                                icon_color=colors["accent_cyan"],
                                tooltip="Download",
                                on_click=lambda e, f=file: self._on_download_file(f),
                            ),
                            ft.IconButton(
                                ft.Icons.DELETE_OUTLINE_ROUNDED,
                                icon_size=18,
                                icon_color=colors["error"],
                                tooltip="Delete",
                                on_click=lambda e, f=file: self._on_delete_single(f),
                            ),
                        ],
                        width=90,
                        spacing=0,
                    ),
                ],
            ),
            padding=ft.Padding(left=12, right=12, top=10, bottom=10),
            bgcolor=colors["primary_subtle"] if is_selected else colors["bg_card"],
            border=ft.Border(bottom=ft.BorderSide(1, colors["border"])),
            on_click=lambda e, f=file: self._on_file_double_click(f) if is_folder else self._on_file_single_click(f),
            on_hover=self._on_row_hover,
        )
    
    def _build_table_view(self):
        """Build table view - similar to list but with header."""
        colors = get_colors()
        files = self._get_current_files()
        
        if not files:
            return self._build_empty_state()
        
        # Header
        header = ft.Container(
            content=ft.Row(
                [
                    ft.Container(width=40),  # Checkbox
                    ft.Text("Name", size=12, weight=ft.FontWeight.W_600, color=colors["text_secondary"], expand=True),
                    ft.Text("Size", size=12, weight=ft.FontWeight.W_600, color=colors["text_secondary"], width=100),
                    ft.Text("Modified", size=12, weight=ft.FontWeight.W_600, color=colors["text_secondary"], width=140),
                    ft.Container(width=40),  # Actions
                ],
            ),
            padding=ft.Padding(left=12, right=12, top=10, bottom=10),
            bgcolor=colors["bg_secondary"],
        )
        
        rows = [header]
        for file in files:
            rows.append(self._build_list_row(file))
        
        return ft.Container(
            content=ft.Column(
                rows,
                scroll=ft.ScrollMode.AUTO,
                spacing=0,
            ),
            expand=True,
            padding=ft.Padding(left=SPACING["xxl"], right=SPACING["xxl"], top=SPACING["lg"], bottom=SPACING["xxl"]),
        )
    
    def _build_empty_state(self):
        """Build empty state."""
        colors = get_colors()
        
        return ft.Container(
            content=ft.Column(
                [
                    ft.Icon(ft.Icons.FOLDER_OPEN_ROUNDED, size=64, color=colors["text_muted"]),
                    ft.Container(height=16),
                    ft.Text("No files here", size=16, weight=ft.FontWeight.W_600, color=colors["text_primary"]),
                    ft.Text("Drag and drop files or click upload", size=13, color=colors["text_muted"]),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            expand=True,
            alignment=ft.Alignment(0, 0),
        )
    
    # ===== Helper Methods =====
    
    def _get_current_files(self) -> List[dict]:
        """Get files in current path."""
        # Files are already loaded for current directory by _load_directory
        files = self.all_files.copy()
        
        # Apply file type filter
        if self.file_type_filter != "all":
            # Define file types
            image_exts = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'svg'}
            video_exts = {'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v'}
            document_exts = {'pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'ppt', 'pptx', 'odt', 'rtf'}
            
            # When filter is active, only show files matching the extension (hide folders)
            if self.file_type_filter == "image":
                files = [f for f in files if f["type"] == "file" and f.get("ext", "") in image_exts]
            elif self.file_type_filter == "video":
                files = [f for f in files if f["type"] == "file" and f.get("ext", "") in video_exts]
            elif self.file_type_filter == "document":
                files = [f for f in files if f["type"] == "file" and f.get("ext", "") in document_exts]
        
        # Apply search filter
        if self.search_query:
            query = self.search_query.lower()
            files = [f for f in files if query in f["name"].lower()]
        
        # Sort
        if self.sort_by == "name":
            files.sort(key=lambda x: (x["type"] != "folder", x["name"].lower()))
        elif self.sort_by == "date":
            files.sort(key=lambda x: (x["type"] != "folder", x.get("modified", "")), reverse=True)
        elif self.sort_by == "size":
            files.sort(key=lambda x: (x["type"] != "folder", x.get("size", 0)), reverse=True)
        elif self.sort_by == "type":
            files.sort(key=lambda x: (x["type"] != "folder", x.get("ext", "")))
        
        return files
    
    def _format_size(self, size: int) -> str:
        """Format file size."""
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        elif size < 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024):.1f} MB"
        else:
            return f"{size / (1024 * 1024 * 1024):.1f} GB"
    
    def _refresh(self):
        """Refresh view."""
        self.controls = [self._build_content()]
        self.update()
    
    # ===== Event Handlers =====
    
    def _navigate_to(self, path):
        """Navigate to path."""
        # Handle special paths
        if isinstance(path, str) and path in ["/", "/recent", "/starred", "/trash"]:
            if path == "/":
                self.current_path = self.root_path
            else:
                self.toast.info(f"{path} coming soon...")
                return
        else:
            # Convert to Path object
            self.current_path = Path(path) if not isinstance(path, Path) else path
        
        # Reload directory
        self._load_directory()
        self._refresh()
    
    def _on_search_change(self, e):
        """Handle search."""
        self.search_query = e.control.value
        self._refresh()
    
    def _on_type_filter_change(self, filter_value: str):
        """Handle file type filter change."""
        self.file_type_filter = filter_value
        self._refresh()
    
    def _on_sort_click(self, sort_value: str):
        """Handle sort change."""
        self.sort_by = sort_value
        self._refresh()
    
    def _set_view_mode(self, mode: str):
        """Set view mode."""
        self.view_mode = mode
        self._refresh()
   
    def _on_select_item(self, item_id: str, selected: bool):
        """Handle item selection."""
        if selected:
            self.selected_items.add(item_id)
        else:
            self.selected_items.discard(item_id)
        self._refresh()
    
    def _on_file_single_click(self, file: dict):
        """Handle file single click."""
        self.toast.info(f"Selected: {file['name']}")
    
    def _on_file_double_click(self, file: dict):
        """Handle file/folder double click."""
        if file["type"] == "folder":
            self._navigate_to(file["id"])  # id is the full path
        else:
            self.toast.info(f"Opening: {file['name']}")
    
    def _on_new_folder(self, e):
        """Handle new folder creation."""
        async def create_folder():
            def close_dialog(e):
                dialog.open = False
                self.page.update()
            
            def confirm_create(e):
                folder_name = name_field.value.strip()
                if not folder_name:
                    self.toast.error("Folder name cannot be empty")
                    return
                
                # Create folder
                new_folder_path = self.current_path / folder_name
                try:
                    new_folder_path.mkdir(exist_ok=False)
                    self.toast.success(f"Created folder: {folder_name}")
                    dialog.open = False
                    self._load_directory()
                    self._refresh()
                except FileExistsError:
                    self.toast.error(f"Folder '{folder_name}' already exists")
                except Exception as ex:
                    self.toast.error(f"Error creating folder: {ex}")
                self.page.update()
            
            colors = get_colors()
            name_field = ft.TextField(
                label="Folder Name",
                hint_text="Enter folder name",
                autofocus=True,
                border_color=colors["border"],
                focused_border_color=colors["primary"],
                on_submit=confirm_create,
            )
            
            dialog = ft.AlertDialog(
                title=ft.Text("Create New Folder", weight=ft.FontWeight.W_600),
                content=ft.Container(
                    content=name_field,
                    padding=ft.Padding(left=0, right=0, top=10, bottom=10),
                ),
                actions=[
                    ft.TextButton("Cancel", on_click=close_dialog),
                    ft.ElevatedButton(
                        "Create",
                        on_click=confirm_create,
                        bgcolor=colors["primary"],
                        color=colors["text_inverse"],
                    ),
                ],
            )
            
            self.page.overlay.append(dialog)
            dialog.open = True
            self.page.update()
        
        self.page.run_task(create_folder)
    
    def _on_upload(self, e):
        """Handle file upload."""
        async def pick_files_result(e: ft.FilePickerResultEvent):
            if e.files:
                import shutil
                for file in e.files:
                    try:
                        # Copy file to current directory
                        source = Path(file.path)
                        dest = self.current_path / file.name
                        shutil.copy2(source, dest)
                        self.toast.success(f"Uploaded: {file.name}")
                    except Exception as ex:
                        self.toast.error(f"Error uploading {file.name}: {ex}")
                
                # Reload directory
                self._load_directory()
                self._refresh()
        
        # Create file picker if doesn't exist
        if not hasattr(self, 'file_picker'):
            self.file_picker = ft.FilePicker(on_result=pick_files_result)
            self.page.overlay.append(self.file_picker)
            self.page.update()
        
        # Open file picker
        self.file_picker.pick_files(allow_multiple=True)
    
    def _on_delete_selected(self, e):
        """Handle deleting selected items."""
        async def confirm_delete():
            def close_dialog(e):
                dialog.open = False
                self.page.update()
            
            def do_delete(e):
                import shutil
                deleted_count = 0
                errors = []
                
                for item_id in list(self.selected_items):
                    try:
                        item_path = Path(item_id)
                        if item_path.is_dir():
                            shutil.rmtree(item_path)
                        else:
                            item_path.unlink()
                        deleted_count += 1
                    except Exception as ex:
                        errors.append(f"{item_path.name}: {ex}")
                
                # Clear selection
                self.selected_items.clear()
                
                # Show result
                if deleted_count > 0:
                    self.toast.success(f"Deleted {deleted_count} item(s)")
                if errors:
                    for error in errors[:3]:  # Show first 3 errors
                        self.toast.error(error)
                
                # Reload
                dialog.open = False
                self._load_directory()
                self._refresh()
                self.page.update()
            
            colors = get_colors()
            count = len(self.selected_items)
            
            dialog = ft.AlertDialog(
                title=ft.Text("Confirm Delete", weight=ft.FontWeight.W_600),
                content=ft.Text(
                    f"Are you sure you want to delete {count} item(s)? This action cannot be undone.",
                    size=14,
                ),
                actions=[
                    ft.TextButton("Cancel", on_click=close_dialog),
                    ft.ElevatedButton(
                        "Delete",
                        on_click=do_delete,
                        bgcolor=colors["error"],
                        color=colors["text_inverse"],
                    ),
                ],
            )
            
            self.page.overlay.append(dialog)
            dialog.open = True
            self.page.update()
        
        if self.selected_items:
            self.page.run_task(confirm_delete)
    
    def _on_download_file(self, file: dict):
        """Handle downloading a single file."""
        import shutil
        from tkinter import filedialog
        from tkinter import Tk
        
        # Hide tkinter root window
        root = Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        
        # Get file path
        file_path = Path(file["id"])
        
        # Ask where to save
        save_path = filedialog.asksaveasfilename(
            initialfile=file["name"],
            defaultextension=file_path.suffix,
            title=f"Save {file['name']}"
        )
        
        root.destroy()
        
        if save_path:
            try:
                shutil.copy2(file_path, save_path)
                self.toast.success(f"Downloaded: {file['name']}")
            except Exception as ex:
                self.toast.error(f"Error downloading: {ex}")
    
    def _on_delete_single(self, file: dict):
        """Handle deleting a single file/folder."""
        async def confirm_delete():
            def close_dialog(e):
                dialog.open = False
                self.page.update()
            
            def do_delete(e):
                import shutil
                try:
                    file_path = Path(file["id"])
                    if file_path.is_dir():
                        shutil.rmtree(file_path)
                    else:
                        file_path.unlink()
                    
                    self.toast.success(f"Deleted: {file['name']}")
                    dialog.open = False
                    self._load_directory()
                    self._refresh()
                except Exception as ex:
                    self.toast.error(f"Error deleting: {ex}")
                self.page.update()
            
            colors = get_colors()
            
            dialog = ft.AlertDialog(
                title=ft.Text("Confirm Delete", weight=ft.FontWeight.W_600),
                content=ft.Text(
                    f"Are you sure you want to delete '{file['name']}'? This action cannot be undone.",
                    size=14,
                ),
                actions=[
                    ft.TextButton("Cancel", on_click=close_dialog),
                    ft.ElevatedButton(
                        "Delete",
                        on_click=do_delete,
                        bgcolor=colors["error"],
                        color=colors["text_inverse"],
                    ),
                ],
            )
            
            self.page.overlay.append(dialog)
            dialog.open = True
            self.page.update()
        
        self.page.run_task(confirm_delete)
    
    def _on_primary_hover(self, e):
        """Handle primary button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["primary_dark"]
        else:
            e.control.bgcolor = colors["primary"]
        e.control.update()
    
    def _on_upload_hover(self, e):
        """Handle upload button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["accent_cyan_dark"]
        else:
            e.control.bgcolor = colors["accent_cyan"]
        e.control.update()
    
    def _on_sidebar_hover(self, e):
        """Handle sidebar item hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = "transparent"
        e.control.update()
    
    def _on_card_hover(self, e):
        """Handle card hover."""
        if e.data == "true":
            e.control.shadow = get_shadow("md")
        else:
            e.control.shadow = get_shadow("xs")
        e.control.update()
    
    def _on_row_hover(self, e):
        """Handle row hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = colors["bg_card"]
        e.control.update()
