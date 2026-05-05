using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Text.Json;

namespace AiUsageMonitor;

public partial class MainWindow : System.Windows.Window
{
    public ObservableCollection<UsageEvent> Events { get; } = new();

    private readonly string _eventsPath = Path.Combine(AppContext.BaseDirectory, "events.json");
    private readonly string _pythonScriptPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "python-automation", "collector.py"));

    public MainWindow()
    {
        InitializeComponent();
        DataContext = this;
        LoadEvents();
    }

    private void RefreshClicked(object sender, System.Windows.RoutedEventArgs e) => LoadEvents();

    private void RunCollectorClicked(object sender, System.Windows.RoutedEventArgs e)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "python",
                Arguments = $"\"{_pythonScriptPath}\" --output \"{_eventsPath}\"",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            process?.WaitForExit(15000);
            LoadEvents();
        }
        catch (Exception ex)
        {
            System.Windows.MessageBox.Show($"Failed to run collector: {ex.Message}", "Error");
        }
    }

    private void LoadEvents()
    {
        Events.Clear();

        if (!File.Exists(_eventsPath))
        {
            SeedEmptyState();
            return;
        }

        try
        {
            var json = File.ReadAllText(_eventsPath);
            var items = JsonSerializer.Deserialize<List<UsageEvent>>(json) ?? new List<UsageEvent>();

            foreach (var item in items.OrderByDescending(i => i.TimestampUtc))
            {
                Events.Add(item);
            }
        }
        catch
        {
            SeedEmptyState();
        }
    }

    private void SeedEmptyState()
    {
        Events.Add(new UsageEvent
        {
            TimestampUtc = DateTime.UtcNow,
            Source = "system",
            Category = "info",
            AppName = "AiUsageMonitor",
            WindowTitle = "Run Python Collector to populate data",
            Confidence = 0.0
        });
    }
}
