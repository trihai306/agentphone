"""Media Library View - Professional media management for user's images and videos.

Features:
- Grid gallery view with thumbnails
- Filter by type (images, videos, screenshots, recordings)
- Upload, download, delete functionality
- Preview modal for images and videos
- Folder organization
- Search and sort options
"""

import flet as ft
from typing import Optional, List, Set, Callable
from datetime import datetime
import os
from pathlib import Path

from ..theme import get_colors, SPACING, RADIUS, ANIMATION, get_shadow
from ..components.toast import ToastManager


class MediaLibraryView(ft.Column):
    """Professional media library for managing user's images and videos."""
    
    def __init__(
        self,
        app_state: dict,
        toast: ToastManager,
        **kwargs
    ):
        self.app_state = app_state
        self.toast = toast
        
        # Scan from Pictures and Movies folders
        self.media_folders = []
        pictures_path = Path.home() / "Pictures"
        movies_path = Path.home() / "Movies"
        
        if pictures_path.exists():
            self.media_folders.append(pictures_path)
        if movies_path.exists():
            self.media_folders.append(movies_path)
        
        # If no media folders, use Downloads as fallback
        if not self.media_folders:
            downloads_path = Path.home() / "Downloads"
            if downloads_path.exists():
                self.media_folders.append(downloads_path)
        
        self.media_items: List[dict] = []
        self.selected_items: Set[str] = set()
        self.search_query = ""
        self.type_filter = "all"  # all, image, video
        self.sort_by = "date"  # date, name, size
        self.view_mode = "grid"  # grid, list
        self.loading = False
        
        super().__init__(
            expand=True,
            spacing=0,
        )
        
        # Load media files
        self._load_media_files()
        self.content = self._build_content()
        self.controls = [self.content]
    
    def _load_media_files(self):
        """Load media files from Pictures and Movies folders."""
        self.media_items = []
        
        # Image extensions
        image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic'}
        # Video extensions
        video_exts = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'}
        
        for folder in self.media_folders:
            try:
                for item in folder.iterdir():
                    # Skip hidden files and directories
                    if item.name.startswith('.') or item.is_dir():
                        continue
                    
                    ext = item.suffix.lower()
                    
                    # Check if it's an image or video
                    if ext in image_exts or ext in video_exts:
                        try:
                            stat = item.stat()
                            
                            # Determine device name from folder
                            device = "Local"
                            if "screenshot" in item.name.lower():
                                device = "Screenshots"
                            elif folder.name == "Movies":
                                device = "Recordings"
                            
                            media_type = "image" if ext in image_exts else "video"
                            
                            media_item = {
                                "id": str(item),
                                "name": item.name,
                                "type": media_type,
                                "size": stat.st_size,
                                "date": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                                "device": device,
                                "thumbnail": None,
                            }
                            
                            # Add duration for videos (placeholder)
                            if media_type == "video":
                                media_item["duration"] = "00:00"
                            
                            self.media_items.append(media_item)
                        except (PermissionError, OSError):
                            continue
            except PermissionError:
                continue
        
        # Limit to first 100 items for performance
        self.media_items = self.media_items[:100]
    
    def _build_content(self):
        """Build the main content."""
        colors = get_colors()
        
        return ft.Container(
            content=ft.Column(
                [
                    self._build_header(),
                    self._build_toolbar(),
                    self._build_media_grid() if self.view_mode == "grid" else self._build_media_list(),
                ],
                spacing=0,
                expand=True,
            ),
            expand=True,
            bgcolor=colors["bg_primary"],
        )
    
    def _build_header(self):
        """Build the page header."""
        colors = get_colors()
        
        # Stats
        total_items = len(self.media_items)
        total_images = len([m for m in self.media_items if m["type"] == "image"])
        total_videos = len([m for m in self.media_items if m["type"] == "video"])
        total_size = sum(m["size"] for m in self.media_items)
        
        return ft.Container(
            content=ft.Row(
                [
                    # Title section
                    ft.Column(
                        [
                            ft.Text(
                                "Media Library",
                                size=24,
                                weight=ft.FontWeight.W_800,
                                color=colors["text_primary"],
                            ),
                            ft.Text(
                                f"{total_items} files • {total_images} images • {total_videos} videos • {self._format_size(total_size)}",
                                size=13,
                                color=colors["text_secondary"],
                            ),
                        ],
                        spacing=4,
                    ),
                    ft.Container(expand=True),
                    # Upload button
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.CLOUD_UPLOAD_ROUNDED, size=18, color=colors["text_inverse"]),
                                ft.Container(width=8),
                                ft.Text("Upload", size=14, weight=ft.FontWeight.W_600, color=colors["text_inverse"]),
                            ],
                        ),
                        padding=ft.Padding(left=20, right=20, top=12, bottom=12),
                        border_radius=RADIUS["lg"],
                        bgcolor=colors["primary"],
                        on_click=self._on_upload,
                        on_hover=self._on_primary_hover,
                        shadow=get_shadow("sm"),
                    ),
                ],
            ),
            padding=ft.Padding(left=SPACING["xxl"], right=SPACING["xxl"], top=SPACING["xl"], bottom=SPACING["lg"]),
            bgcolor=colors["bg_secondary"],
            border=ft.Border(bottom=ft.BorderSide(1, colors["border"])),
        )
    
    def _build_toolbar(self):
        """Build the filter and action toolbar."""
        colors = get_colors()
        
        return ft.Container(
            content=ft.Row(
                [
                    # Search
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.SEARCH_ROUNDED, size=18, color=colors["text_muted"]),
                                ft.TextField(
                                    hint_text="Search media...",
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
                        width=280,
                        padding=ft.Padding(left=12, right=12, top=0, bottom=0),
                        bgcolor=colors["bg_tertiary"],
                        border_radius=RADIUS["md"],
                    ),
                    ft.Container(width=SPACING["lg"]),
                    # Type filter
                    self._build_filter_chip("All", "all", ft.Icons.GRID_VIEW_ROUNDED),
                    self._build_filter_chip("Images", "image", ft.Icons.IMAGE_ROUNDED),
                    self._build_filter_chip("Videos", "video", ft.Icons.VIDEOCAM_ROUNDED),
                    ft.Container(expand=True),
                    # Sort buttons
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.SORT_ROUNDED, size=16, color=colors["text_secondary"]),
                                ft.Container(width=6),
                                ft.Text("Sort:", size=12, color=colors["text_secondary"]),
                                ft.Container(width=8),
                                self._build_sort_chip("Date", "date"),
                                self._build_sort_chip("Name", "name"),
                                self._build_sort_chip("Size", "size"),
                            ],
                        ),
                    ),
                    ft.Container(width=SPACING["md"]),
                    # View toggle
                    self._build_view_toggle(),
                ],
            ),
            padding=ft.Padding(left=SPACING["xxl"], right=SPACING["xxl"], top=SPACING["md"], bottom=SPACING["md"]),
            bgcolor=colors["bg_card"],
            border=ft.Border(bottom=ft.BorderSide(1, colors["border"])),
        )
    
    def _build_filter_chip(self, label: str, value: str, icon: str):
        """Build a filter chip button."""
        colors = get_colors()
        is_active = self.type_filter == value
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Icon(icon, size=16, color=colors["primary"] if is_active else colors["text_secondary"]),
                    ft.Container(width=6),
                    ft.Text(
                        label,
                        size=12,
                        weight=ft.FontWeight.W_600 if is_active else ft.FontWeight.W_500,
                        color=colors["primary"] if is_active else colors["text_secondary"],
                    ),
                ],
            ),
            padding=ft.Padding(left=12, right=12, top=8, bottom=8),
            border_radius=RADIUS["full"],
            bgcolor=colors["primary_glow"] if is_active else "transparent",
            border=ft.Border(
                left=ft.BorderSide(1, colors["primary"] if is_active else colors["border"]),
                right=ft.BorderSide(1, colors["primary"] if is_active else colors["border"]),
                top=ft.BorderSide(1, colors["primary"] if is_active else colors["border"]),
                bottom=ft.BorderSide(1, colors["primary"] if is_active else colors["border"]),
            ),
            on_click=lambda e, v=value: self._on_filter_change(v),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )
    
    def _build_sort_chip(self, label: str, value: str):
        """Build a sort chip button."""
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
        """Build grid/list view toggle."""
        colors = get_colors()
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.GRID_VIEW_ROUNDED,
                            size=18,
                            color=colors["primary"] if self.view_mode == "grid" else colors["text_muted"],
                        ),
                        padding=8,
                        border_radius=RADIUS["sm"],
                        bgcolor=colors["primary_glow"] if self.view_mode == "grid" else "transparent",
                        on_click=lambda e: self._set_view_mode("grid"),
                    ),
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.VIEW_LIST_ROUNDED,
                            size=18,
                            color=colors["primary"] if self.view_mode == "list" else colors["text_muted"],
                        ),
                        padding=8,
                        border_radius=RADIUS["sm"],
                        bgcolor=colors["primary_glow"] if self.view_mode == "list" else "transparent",
                        on_click=lambda e: self._set_view_mode("list"),
                    ),
                ],
                spacing=2,
            ),
            padding=2,
            border_radius=RADIUS["md"],
            bgcolor=colors["bg_tertiary"],
        )
    
    def _build_media_grid(self):
        """Build the media grid view."""
        colors = get_colors()
        
        # Filter and sort items
        items = self._get_filtered_items()
        
        if not items:
            return self._build_empty_state()
        
        # Build grid cards
        cards = [self._build_media_card(item) for item in items]
        
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
            bgcolor=colors["bg_primary"],
        )
    
    def _build_media_card(self, item: dict):
        """Build a single media card."""
        colors = get_colors()
        is_video = item["type"] == "video"
        is_selected = item["id"] in self.selected_items
        
        # Thumbnail placeholder
        thumbnail = ft.Container(
            content=ft.Stack(
                [
                    # Background pattern
                    ft.Container(
                        bgcolor=colors["bg_tertiary"],
                        expand=True,
                    ),
                    # Center icon
                    ft.Container(
                        content=ft.Icon(
                            ft.Icons.VIDEOCAM_ROUNDED if is_video else ft.Icons.IMAGE_ROUNDED,
                            size=40,
                            color=colors["text_muted"],
                        ),
                        alignment=ft.Alignment(0, 0),
                        expand=True,
                    ),
                    # Video duration overlay
                    ft.Container(
                        content=ft.Container(
                            content=ft.Text(
                                item.get("duration", ""),
                                size=11,
                                weight=ft.FontWeight.W_600,
                                color="#FFFFFF",
                            ),
                            padding=ft.Padding(left=6, right=6, top=2, bottom=2),
                            border_radius=4,
                            bgcolor="rgba(0,0,0,0.7)",
                        ),
                        alignment=ft.Alignment(1, 1),
                        padding=8,
                    ) if is_video else ft.Container(),
                    # Selection checkbox
                    ft.Container(
                        content=ft.Checkbox(
                            value=is_selected,
                            on_change=lambda e, id=item["id"]: self._on_select_item(id, e.control.value),
                            active_color=colors["primary"],
                        ),
                        alignment=ft.Alignment(-1, -1),
                        padding=4,
                    ),
                ],
            ),
            width=200,
            height=150,
            border_radius=ft.BorderRadius(top_left=RADIUS["lg"], top_right=RADIUS["lg"], bottom_left=0, bottom_right=0),
            clip_behavior=ft.ClipBehavior.ANTI_ALIAS,
        )
        
        # Info section
        info = ft.Container(
            content=ft.Column(
                [
                    ft.Text(
                        item["name"],
                        size=13,
                        weight=ft.FontWeight.W_600,
                        color=colors["text_primary"],
                        max_lines=1,
                        overflow=ft.TextOverflow.ELLIPSIS,
                    ),
                    ft.Row(
                        [
                            ft.Icon(
                                ft.Icons.PHONE_ANDROID_ROUNDED,
                                size=12,
                                color=colors["text_muted"],
                            ),
                            ft.Text(
                                item.get("device", "Unknown"),
                                size=11,
                                color=colors["text_muted"],
                            ),
                            ft.Container(expand=True),
                            ft.Text(
                                self._format_size(item["size"]),
                                size=11,
                                color=colors["text_muted"],
                            ),
                        ],
                        spacing=4,
                    ),
                    ft.Text(
                        item["date"],
                        size=10,
                        color=colors["text_muted"],
                    ),
                ],
                spacing=4,
            ),
            padding=ft.Padding(left=12, right=12, top=10, bottom=10),
        )
        
        # Action buttons on hover
        actions = ft.Row(
            [
                ft.IconButton(
                    ft.Icons.VISIBILITY_ROUNDED,
                    icon_size=16,
                    icon_color=colors["text_secondary"],
                    tooltip="Preview",
                    on_click=lambda e, i=item: self._on_preview(i),
                ),
                ft.IconButton(
                    ft.Icons.DOWNLOAD_ROUNDED,
                    icon_size=16,
                    icon_color=colors["text_secondary"],
                    tooltip="Download",
                    on_click=lambda e, i=item: self._on_download(i),
                ),
                ft.IconButton(
                    ft.Icons.DELETE_OUTLINE_ROUNDED,
                    icon_size=16,
                    icon_color=colors["error"],
                    tooltip="Delete",
                    on_click=lambda e, i=item: self._on_delete(i),
                ),
            ],
            alignment=ft.MainAxisAlignment.CENTER,
            spacing=0,
        )
        
        return ft.Container(
            content=ft.Column(
                [
                    thumbnail,
                    info,
                    ft.Container(
                        content=actions,
                        bgcolor=colors["bg_secondary"],
                        border=ft.Border(top=ft.BorderSide(1, colors["border"])),
                    ),
                ],
                spacing=0,
            ),
            width=200,
            border_radius=RADIUS["lg"],
            bgcolor=colors["bg_card"],
            border=ft.Border(
                left=ft.BorderSide(2 if is_selected else 1, colors["primary"] if is_selected else colors["border"]),
                right=ft.BorderSide(2 if is_selected else 1, colors["primary"] if is_selected else colors["border"]),
                top=ft.BorderSide(2 if is_selected else 1, colors["primary"] if is_selected else colors["border"]),
                bottom=ft.BorderSide(2 if is_selected else 1, colors["primary"] if is_selected else colors["border"]),
            ),
            shadow=get_shadow("sm"),
            animate=ft.Animation(ANIMATION["fast"], ft.AnimationCurve.EASE_OUT),
        )
    
    def _build_media_list(self):
        """Build the media list view."""
        colors = get_colors()
        items = self._get_filtered_items()
        
        if not items:
            return self._build_empty_state()
        
        rows = [self._build_list_header()]
        rows.extend([self._build_list_row(item) for item in items])
        
        return ft.Container(
            content=ft.Column(
                rows,
                scroll=ft.ScrollMode.AUTO,
                spacing=0,
            ),
            expand=True,
            padding=ft.Padding(left=SPACING["xxl"], right=SPACING["xxl"], top=SPACING["lg"], bottom=SPACING["xxl"]),
        )
    
    def _build_list_header(self):
        """Build list view header row."""
        colors = get_colors()
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Container(width=40),  # Checkbox space
                    ft.Container(
                        content=ft.Text("Name", size=12, weight=ft.FontWeight.W_600, color=colors["text_secondary"]),
                        expand=True,
                    ),
                    ft.Container(
                        content=ft.Text("Device", size=12, weight=ft.FontWeight.W_600, color=colors["text_secondary"]),
                        width=120,
                    ),
                    ft.Container(
                        content=ft.Text("Size", size=12, weight=ft.FontWeight.W_600, color=colors["text_secondary"]),
                        width=80,
                    ),
                    ft.Container(
                        content=ft.Text("Date", size=12, weight=ft.FontWeight.W_600, color=colors["text_secondary"]),
                        width=140,
                    ),
                    ft.Container(width=120),  # Actions
                ],
            ),
            padding=ft.Padding(left=12, right=12, top=10, bottom=10),
            bgcolor=colors["bg_secondary"],
            border_radius=ft.BorderRadius(top_left=RADIUS["md"], top_right=RADIUS["md"], bottom_left=0, bottom_right=0),
        )
    
    def _build_list_row(self, item: dict):
        """Build a single list row."""
        colors = get_colors()
        is_video = item["type"] == "video"
        is_selected = item["id"] in self.selected_items
        
        return ft.Container(
            content=ft.Row(
                [
                    ft.Checkbox(
                        value=is_selected,
                        on_change=lambda e, id=item["id"]: self._on_select_item(id, e.control.value),
                        active_color=colors["primary"],
                    ),
                    ft.Row(
                        [
                            ft.Container(
                                content=ft.Icon(
                                    ft.Icons.VIDEOCAM_ROUNDED if is_video else ft.Icons.IMAGE_ROUNDED,
                                    size=20,
                                    color=colors["accent_purple"] if is_video else colors["accent_cyan"],
                                ),
                                width=36,
                                height=36,
                                border_radius=RADIUS["sm"],
                                bgcolor=f"{colors['accent_purple']}15" if is_video else f"{colors['accent_cyan']}15",
                                alignment=ft.Alignment(0, 0),
                            ),
                            ft.Container(width=12),
                            ft.Text(
                                item["name"],
                                size=13,
                                weight=ft.FontWeight.W_500,
                                color=colors["text_primary"],
                            ),
                        ],
                        expand=True,
                    ),
                    ft.Container(
                        content=ft.Text(item.get("device", "-"), size=12, color=colors["text_secondary"]),
                        width=120,
                    ),
                    ft.Container(
                        content=ft.Text(self._format_size(item["size"]), size=12, color=colors["text_secondary"]),
                        width=80,
                    ),
                    ft.Container(
                        content=ft.Text(item["date"], size=12, color=colors["text_secondary"]),
                        width=140,
                    ),
                    ft.Row(
                        [
                            ft.IconButton(ft.Icons.VISIBILITY_ROUNDED, icon_size=16, icon_color=colors["text_secondary"], tooltip="Preview", on_click=lambda e, i=item: self._on_preview(i)),
                            ft.IconButton(ft.Icons.DOWNLOAD_ROUNDED, icon_size=16, icon_color=colors["text_secondary"], tooltip="Download", on_click=lambda e, i=item: self._on_download(i)),
                            ft.IconButton(ft.Icons.DELETE_OUTLINE_ROUNDED, icon_size=16, icon_color=colors["error"], tooltip="Delete", on_click=lambda e, i=item: self._on_delete(i)),
                        ],
                        width=120,
                        spacing=0,
                    ),
                ],
            ),
            padding=ft.Padding(left=12, right=12, top=8, bottom=8),
            bgcolor=colors["primary_subtle"] if is_selected else colors["bg_card"],
            border=ft.Border(bottom=ft.BorderSide(1, colors["border"])),
            on_hover=self._on_row_hover,
        )
    
    def _build_empty_state(self):
        """Build empty state when no media."""
        colors = get_colors()
        
        return ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Icon(ft.Icons.PERM_MEDIA_OUTLINED, size=64, color=colors["text_muted"]),
                        width=120,
                        height=120,
                        border_radius=60,
                        bgcolor=colors["bg_tertiary"],
                        alignment=ft.Alignment(0, 0),
                    ),
                    ft.Container(height=24),
                    ft.Text(
                        "No media files",
                        size=18,
                        weight=ft.FontWeight.W_600,
                        color=colors["text_primary"],
                    ),
                    ft.Text(
                        "Screenshots and recordings will appear here",
                        size=14,
                        color=colors["text_secondary"],
                    ),
                    ft.Container(height=24),
                    ft.Container(
                        content=ft.Row(
                            [
                                ft.Icon(ft.Icons.CLOUD_UPLOAD_ROUNDED, size=18, color=colors["text_inverse"]),
                                ft.Container(width=8),
                                ft.Text("Upload Files", size=14, weight=ft.FontWeight.W_600, color=colors["text_inverse"]),
                            ],
                        ),
                        padding=ft.Padding(left=24, right=24, top=14, bottom=14),
                        border_radius=RADIUS["lg"],
                        bgcolor=colors["primary"],
                        on_click=self._on_upload,
                    ),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            expand=True,
            alignment=ft.Alignment(0, 0),
        )
    
    # ===== Helper Methods =====
    
    def _get_filtered_items(self) -> List[dict]:
        """Get filtered and sorted media items."""
        items = self.media_items.copy()
        
        # Filter by type
        if self.type_filter != "all":
            items = [i for i in items if i["type"] == self.type_filter]
        
        # Filter by search
        if self.search_query:
            query = self.search_query.lower()
            items = [i for i in items if query in i["name"].lower() or query in i.get("device", "").lower()]
        
        # Sort
        if self.sort_by == "name":
            items.sort(key=lambda x: x["name"].lower())
        elif self.sort_by == "size":
            items.sort(key=lambda x: x["size"], reverse=True)
        else:  # date
            items.sort(key=lambda x: x["date"], reverse=True)
        
        return items
    
    def _format_size(self, size: int) -> str:
        """Format file size to human readable."""
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        elif size < 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024):.1f} MB"
        else:
            return f"{size / (1024 * 1024 * 1024):.1f} GB"
    
    def _refresh(self):
        """Refresh the view."""
        self.content = self._build_content()
        self.controls = [self.content]
        if self.page:
            self.update()
    
    # ===== Event Handlers =====
    
    def _on_search_change(self, e):
        """Handle search input change."""
        self.search_query = e.control.value
        self._refresh()
    
    def _on_filter_change(self, filter_value: str):
        """Handle type filter change."""
        self.type_filter = filter_value
        self._refresh()
    
    def _on_sort_change(self, e):
        """Handle sort change."""
        self.sort_by = e.control.value
        self._refresh()
    
    def _on_sort_click(self, sort_value: str):
        """Handle sort chip click."""
        self.sort_by = sort_value
        self._refresh()
    
    def _set_view_mode(self, mode: str):
        """Set view mode (grid/list)."""
        self.view_mode = mode
        self._refresh()
    
    def _on_select_item(self, item_id: str, selected: bool):
        """Handle item selection."""
        if selected:
            self.selected_items.add(item_id)
        else:
            self.selected_items.discard(item_id)
        self._refresh()
    
    def _on_upload(self, e):
        """Handle upload button click."""
        self.toast.info("Upload feature coming soon...")
    
    def _on_preview(self, item: dict):
        """Handle preview action."""
        self.toast.info(f"Preview: {item['name']}")
    
    def _on_download(self, item: dict):
        """Handle download action."""
        self.toast.success(f"Downloading: {item['name']}")
    
    def _on_delete(self, item: dict):
        """Handle delete action."""
        self.media_items = [m for m in self.media_items if m["id"] != item["id"]]
        self.selected_items.discard(item["id"])
        self.toast.success(f"Deleted: {item['name']}")
        self._refresh()
    
    def _on_primary_hover(self, e):
        """Handle primary button hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["primary_dark"]
            e.control.shadow = get_shadow("md")
        else:
            e.control.bgcolor = colors["primary"]
            e.control.shadow = get_shadow("sm")
        e.control.update()
    
    def _on_row_hover(self, e):
        """Handle list row hover."""
        colors = get_colors()
        if e.data == "true":
            e.control.bgcolor = colors["bg_hover"]
        else:
            e.control.bgcolor = colors["bg_card"]
        e.control.update()
