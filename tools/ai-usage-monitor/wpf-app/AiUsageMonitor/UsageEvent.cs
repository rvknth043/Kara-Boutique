namespace AiUsageMonitor;

public class UsageEvent
{
    public DateTime TimestampUtc { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string AppName { get; set; } = string.Empty;
    public string WindowTitle { get; set; } = string.Empty;
    public string FocusedControl { get; set; } = string.Empty;
    public bool IsChatInputLikely { get; set; }
    public int SessionSeconds { get; set; }
    public double Confidence { get; set; }
}
