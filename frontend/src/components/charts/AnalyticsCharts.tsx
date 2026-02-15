'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import api from '@/lib/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SalesTrendProps {
  days?: number;
}

export function SalesTrendChart({ days = 30 }: SalesTrendProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    try {
      const response = await api.get(`/analytics/advanced/sales-trend?days=${days}`);
      const salesData = response.data.data;

      setData({
        labels: salesData.map((d: any) => new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Revenue (₹)',
            data: salesData.map((d: any) => d.revenue),
            borderColor: '#D4A373',
            backgroundColor: 'rgba(212, 163, 115, 0.1)',
            tension: 0.4,
            yAxisID: 'y',
          },
          {
            label: 'Orders',
            data: salesData.map((d: any) => d.orders),
            borderColor: '#6C757D',
            backgroundColor: 'rgba(108, 117, 125, 0.1)',
            tension: 0.4,
            yAxisID: 'y1',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch sales trend:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border" /></div>;
  }

  if (!data) {
    return <div className="text-center py-5">No data available</div>;
  }

  return (
    <div style={{ height: '400px' }}>
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Revenue (₹)',
              },
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Orders',
              },
              grid: {
                drawOnChartArea: false,
              },
            },
          },
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: `Sales Trend - Last ${days} Days`,
            },
          },
        }}
      />
    </div>
  );
}

export function CategoryPerformanceChart() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/analytics/advanced/category-performance');
      const categories = response.data.data;

      setData({
        labels: categories.map((c: any) => c.category_name),
        datasets: [
          {
            label: 'Revenue (₹)',
            data: categories.map((c: any) => c.total_revenue),
            backgroundColor: [
              '#D4A373',
              '#6C757D',
              '#28A745',
              '#DC3545',
              '#FFC107',
              '#17A2B8',
              '#6F42C1',
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch category performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border" /></div>;
  }

  if (!data) {
    return <div className="text-center py-5">No data available</div>;
  }

  return (
    <div style={{ height: '400px' }}>
      <Pie
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: 'Revenue by Category',
            },
          },
        }}
      />
    </div>
  );
}

export function DayOfWeekChart() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/analytics/advanced/day-of-week');
      const days = response.data.data;

      setData({
        labels: days.map((d: any) => d.day_name.trim()),
        datasets: [
          {
            label: 'Revenue (₹)',
            data: days.map((d: any) => d.revenue),
            backgroundColor: '#D4A373',
          },
          {
            label: 'Orders',
            data: days.map((d: any) => d.order_count),
            backgroundColor: '#6C757D',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch day of week data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border" /></div>;
  }

  if (!data) {
    return <div className="text-center py-5">No data available</div>;
  }

  return (
    <div style={{ height: '400px' }}>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Performance by Day of Week',
            },
          },
        }}
      />
    </div>
  );
}

export function CustomerSegmentsChart() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/analytics/advanced/customer-segments');
      const segments = response.data.data;

      setData({
        labels: segments.map((s: any) => s.segment),
        datasets: [
          {
            label: 'Customer Count',
            data: segments.map((s: any) => s.customer_count),
            backgroundColor: '#D4A373',
          },
          {
            label: 'Total Revenue (₹)',
            data: segments.map((s: any) => s.total_revenue),
            backgroundColor: '#6C757D',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch customer segments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border" /></div>;
  }

  if (!data) {
    return <div className="text-center py-5">No data available</div>;
  }

  return (
    <div style={{ height: '400px' }}>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Customer Segments',
            },
          },
        }}
      />
    </div>
  );
}
