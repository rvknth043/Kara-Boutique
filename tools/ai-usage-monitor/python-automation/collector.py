#!/usr/bin/env python3
"""Collect AI-usage signals from active window + focused UI element metadata (Windows).

Privacy model:
- Collects app/window/focused-control metadata only.
- Does not collect keystrokes or full text content from chat inputs.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

STATE_FILE = Path(__file__).with_name("usage_state.json")

KNOWN_PATTERNS = {
    "chatgpt": ["chatgpt", "openai"],
    "copilot": ["copilot", "github copilot"],
    "claude": ["claude", "anthropic"],
    "gemini": ["gemini", "bard"],
    "cursor": ["cursor"],
}

CHATBOX_HINTS = ["message", "prompt", "ask", "chat", "input", "editor"]


@dataclass
class UsageEvent:
    TimestampUtc: str
    Source: str
    Category: str
    AppName: str
    WindowTitle: str
    FocusedControl: str
    IsChatInputLikely: bool
    SessionSeconds: int
    Confidence: float


def get_active_context() -> dict[str, Any]:
    """Return current active app/window/focused control metadata.

    Uses pywinauto UIA on Windows when available; returns fallback if unavailable.
    """
    try:
        from pywinauto import Desktop

        active = Desktop(backend="uia").get_active()
        if active is None:
            raise RuntimeError("No active window")

        title = active.window_text() or ""
        element_info = active.element_info
        app_name = (getattr(element_info, "name", "") or "unknown").strip() or "unknown"

        focused_desc = ""
        for child in active.descendants(depth=6):
            try:
                if hasattr(child.element_info, "has_keyboard_focus") and child.element_info.has_keyboard_focus:
                    cn = getattr(child.element_info, "class_name", "") or ""
                    nm = getattr(child.element_info, "name", "") or ""
                    ct = getattr(child.element_info, "control_type", "") or ""
                    focused_desc = f"{ct}:{cn}:{nm}".strip(":")
                    break
            except Exception:
                continue

        return {"app_name": app_name, "window_title": title, "focused_control": focused_desc}
    except Exception:
        # Fallback for non-Windows/dev environments
        return {
            "app_name": "chrome.exe",
            "window_title": "ChatGPT - OpenAI",
            "focused_control": "Edit:Chrome_RenderWidgetHostHWND:Message ChatGPT",
        }


def detect_category(context: dict[str, Any]) -> tuple[str, float]:
    haystack = f"{context.get('app_name','')} {context.get('window_title','')} {context.get('focused_control','')}".lower()
    for category, keywords in KNOWN_PATTERNS.items():
        if any(k in haystack for k in keywords):
            return category, 0.8
    return "unknown", 0.2


def likely_chat_input(focused_control: str) -> bool:
    low = focused_control.lower()
    return any(token in low for token in CHATBOX_HINTS)


def load_state() -> dict[str, Any]:
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(state: dict[str, Any]) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def update_duration(key: str, now_epoch: int) -> int:
    state = load_state()
    last_key = state.get("last_key")
    last_seen = int(state.get("last_seen_epoch", now_epoch))
    sessions = state.get("sessions", {})

    if key == last_key:
        delta = max(0, now_epoch - last_seen)
        sessions[key] = int(sessions.get(key, 0)) + delta

    state["last_key"] = key
    state["last_seen_epoch"] = now_epoch
    state["sessions"] = sessions
    save_state(state)
    return int(sessions.get(key, 0))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="events.json")
    args = parser.parse_args()

    now = datetime.now(timezone.utc)
    context = get_active_context()
    category, confidence = detect_category(context)
    is_chat = likely_chat_input(context.get("focused_control", ""))

    session_key = f"{category}|{context.get('app_name','')}|{context.get('window_title','')}"
    session_seconds = update_duration(session_key, int(now.timestamp()))

    event = UsageEvent(
        TimestampUtc=now.isoformat(),
        Source="uia-focused-element",
        Category=category,
        AppName=context.get("app_name", "unknown"),
        WindowTitle=context.get("window_title", ""),
        FocusedControl=context.get("focused_control", ""),
        IsChatInputLikely=is_chat,
        SessionSeconds=session_seconds,
        Confidence=confidence + (0.15 if is_chat else 0),
    )

    Path(args.output).write_text(json.dumps([event.__dict__], indent=2), encoding="utf-8")
    print(f"Wrote 1 event to {args.output}; session_seconds={session_seconds}")


if __name__ == "__main__":
    main()
