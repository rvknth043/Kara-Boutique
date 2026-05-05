# AI Usage Monitor (WPF + Python Automation)

Updated implementation now focuses on UI Automation signals, not only process/window names.

## What it detects now

- Active app + window title.
- Focused UI element metadata using `pywinauto` UIA backend.
- Whether focused control looks like a chat/prompt input.
- Approximate time spent in the same detected AI session (`SessionSeconds`).

## Components

- `wpf-app/AiUsageMonitor`: WPF dashboard with focused-element and time columns.
- `python-automation/collector.py`: UIA-focused collector with local session tracking state.

## Run (Windows)

1. Install Python dependencies:
   ```powershell
   pip install -r python-automation/requirements.txt
   ```
2. Run WPF app:
   ```powershell
   cd wpf-app/AiUsageMonitor
   dotnet run
   ```
3. Click **Run Python Collector** repeatedly to accumulate `SessionSeconds`.

## Notes

- Time tracking is approximate and increments when consecutive samples match the same session key.
- For production, run collector on a timer (e.g., every 2–5 seconds) as a background service.
