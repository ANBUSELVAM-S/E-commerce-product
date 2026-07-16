import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { getOrders } from '../services/orderService';
import { getPayments } from '../services/paymentService';
import { getProducts } from '../services/productService';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Color palette
const COLORS = {
  primary: '#6366f1',
  primaryLight: 'rgba(99, 102, 241, 0.15)',
  success: '#10b981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#ef4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  info: '#06b6d4',
  infoLight: 'rgba(6, 182, 212, 0.15)',
  purple: '#8b5cf6',
  pink: '#ec4899',
  slate: '#64748b',
};

const CHART_PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'
];

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, color, bgColor }) => (
  <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
    <Card.Body className="p-4">
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <p className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '1.5px' }}>{title}</p>
          <h2 className="fw-bold mb-1" style={{ color, fontSize: '28px' }}>{value}</h2>
          {subtitle && <p className="text-muted mb-0" style={{ fontSize: '12px' }}>{subtitle}</p>}
        </div>
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            width: '48px', height: '48px', borderRadius: '12px',
            backgroundColor: bgColor, color, fontSize: '22px'
          }}
        >
          {icon}
        </div>
      </div>
    </Card.Body>
  </Card>
);

const AdminAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, paymentsData, productsData] = await Promise.all([
        getOrders(),
        getPayments(),
        getProducts()
      ]);
      setOrders(ordersData);
      setPayments(paymentsData);
      // Handle both array and { products: [] } shapes
      setProducts(Array.isArray(productsData) ? productsData : (productsData.products || []));
    } catch (error) {
      toast.error('Failed to load analytics data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Computed Metrics ──
  const stats = useMemo(() => {
    const totalRevenue = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    const totalPayments = payments.length;
    const successPayments = payments.filter(p => p.status === 'success').length;
    const failedPayments = payments.filter(p => p.status === 'failed').length;

    const uniqueUsers = new Set([
      ...orders.map(o => o.userId),
      ...payments.map(p => p.userId)
    ].filter(Boolean)).size;

    const avgOrderValue = totalOrders > 0
      ? orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / totalOrders
      : 0;

    return {
      totalRevenue, totalOrders, pendingOrders, confirmedOrders, cancelledOrders,
      totalPayments, successPayments, failedPayments, uniqueUsers, avgOrderValue
    };
  }, [orders, payments]);

  // ── Revenue Over Time (last 7 days) ──
  const revenueChartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const revenueByDay = {};
    const ordersByDay = {};
    days.forEach(d => { revenueByDay[d] = 0; ordersByDay[d] = 0; });

    orders.forEach(order => {
      const day = order.createdAt?.split('T')[0];
      if (revenueByDay[day] !== undefined) {
        revenueByDay[day] += Number(order.totalAmount);
        ordersByDay[day] += 1;
      }
    });

    return {
      labels: days.map(d => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Revenue ($)',
          data: days.map(d => revenueByDay[d]),
          borderColor: COLORS.primary,
          backgroundColor: COLORS.primaryLight,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
      ],
    };
  }, [orders]);

  // ── Order Status Distribution ──
  const orderStatusChartData = useMemo(() => {
    const statusCounts = {};
    orders.forEach(o => {
      const s = o.status || 'unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    return {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [{
        data,
        backgroundColor: [COLORS.warning, COLORS.success, COLORS.danger, COLORS.info, COLORS.purple, COLORS.pink],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    };
  }, [orders]);

  // ── Payment Method Distribution ──
  const paymentMethodChartData = useMemo(() => {
    const methodCounts = {};
    payments.forEach(p => {
      const m = p.method || 'unknown';
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    });

    return {
      labels: Object.keys(methodCounts).map(m => m.replace(/_/g, ' ').toUpperCase()),
      datasets: [{
        data: Object.values(methodCounts),
        backgroundColor: CHART_PALETTE.slice(0, Object.keys(methodCounts).length),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    };
  }, [payments]);

  // ── Top Selling Products ──
  const topProductsChartData = useMemo(() => {
    const productSales = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const name = item.name || 'Unknown';
        productSales[name] = (productSales[name] || 0) + Number(item.quantity || 1);
      });
    });

    const sorted = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    return {
      labels: sorted.map(([name]) => name.length > 18 ? name.substring(0, 18) + '…' : name),
      datasets: [{
        label: 'Units Sold',
        data: sorted.map(([, count]) => count),
        backgroundColor: CHART_PALETTE.slice(0, sorted.length),
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 30,
      }],
    };
  }, [orders]);

  // ── Orders Per Day (bar chart) ──
  const ordersPerDayChartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const countByDay = {};
    days.forEach(d => { countByDay[d] = 0; });

    orders.forEach(order => {
      const day = order.createdAt?.split('T')[0];
      if (countByDay[day] !== undefined) {
        countByDay[day] += 1;
      }
    });

    return {
      labels: days.map(d => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      }),
      datasets: [{
        label: 'Orders',
        data: days.map(d => countByDay[d]),
        backgroundColor: COLORS.info,
        borderRadius: 6,
        barThickness: 24,
      }],
    };
  }, [orders]);

  // ── Chart Options ──
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: ctx => `$${ctx.parsed.y.toFixed(2)}`
        }
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11 }, callback: v => `$${v}` }
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', cornerRadius: 8, padding: 12 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, stepSize: 1 } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } },
      tooltip: { backgroundColor: '#1e293b', cornerRadius: 8, padding: 12 },
    },
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Container className="py-5" style={{ maxWidth: '1200px' }}>
      <div className="text-center mb-5">
        <h2 className="fw-bold mb-2">Analytics</h2>
        <p className="text-muted" style={{ fontSize: '14px' }}>Real-time overview of your store performance</p>
      </div>

      {/* ── Stat Cards ── */}
      <Row className="g-4 mb-5">
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            subtitle={`${stats.successPayments} successful payments`}
            icon="💰"
            color={COLORS.success}
            bgColor={COLORS.successLight}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            subtitle={`${stats.pendingOrders} pending`}
            icon="📦"
            color={COLORS.primary}
            bgColor={COLORS.primaryLight}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Avg Order Value"
            value={`$${stats.avgOrderValue.toFixed(2)}`}
            subtitle={`${stats.confirmedOrders} confirmed`}
            icon="📊"
            color={COLORS.warning}
            bgColor={COLORS.warningLight}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Users"
            value={stats.uniqueUsers}
            subtitle={`${products.length} products listed`}
            icon="👥"
            color={COLORS.info}
            bgColor={COLORS.infoLight}
          />
        </Col>
      </Row>

      {/* ── Revenue Trend ── */}
      <Row className="g-4 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <h6 className="fw-bold text-uppercase text-muted mb-4" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
                Revenue Trend (Last 7 Days)
              </h6>
              <div style={{ height: '280px' }}>
                <Line data={revenueChartData} options={lineOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Order Status + Payment Methods ── */}
      <Row className="g-4 mb-4">
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <h6 className="fw-bold text-uppercase text-muted mb-4" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
                Order Status
              </h6>
              <div style={{ height: '240px' }}>
                <Doughnut data={orderStatusChartData} options={doughnutOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <h6 className="fw-bold text-uppercase text-muted mb-4" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
                Payment Methods
              </h6>
              <div style={{ height: '240px' }}>
                <Doughnut data={paymentMethodChartData} options={doughnutOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <h6 className="fw-bold text-uppercase text-muted mb-4" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
                Orders Per Day
              </h6>
              <div style={{ height: '240px' }}>
                <Bar data={ordersPerDayChartData} options={barOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Top Selling Products ── */}
      <Row className="g-4 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <h6 className="fw-bold text-uppercase text-muted mb-4" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
                Top Selling Products
              </h6>
              <div style={{ height: '300px' }}>
                <Bar data={topProductsChartData} options={{
                  ...barOptions,
                  indexAxis: 'y',
                  scales: {
                    x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, stepSize: 1 } },
                    y: { grid: { display: false }, ticks: { font: { size: 12 } } },
                  }
                }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Quick Stats Summary ── */}
      <Row className="g-4">
        <Col xs={12} md={6}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
                Order Breakdown
              </h6>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ fontSize: '13px' }}>✅ Confirmed</span>
                  <span className="fw-bold" style={{ color: COLORS.success }}>{stats.confirmedOrders}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ fontSize: '13px' }}>⏳ Pending</span>
                  <span className="fw-bold" style={{ color: COLORS.warning }}>{stats.pendingOrders}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ fontSize: '13px' }}>❌ Cancelled</span>
                  <span className="fw-bold" style={{ color: COLORS.danger }}>{stats.cancelledOrders}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
                Payment Breakdown
              </h6>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ fontSize: '13px' }}>✅ Success</span>
                  <span className="fw-bold" style={{ color: COLORS.success }}>{stats.successPayments}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ fontSize: '13px' }}>❌ Failed</span>
                  <span className="fw-bold" style={{ color: COLORS.danger }}>{stats.failedPayments}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ fontSize: '13px' }}>💰 Total Revenue</span>
                  <span className="fw-bold" style={{ color: COLORS.primary }}>${stats.totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminAnalytics;
