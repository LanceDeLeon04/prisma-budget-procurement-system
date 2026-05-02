import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

import {
  Bell,
  Wallet,
  ArrowUpRight,
  Landmark,
  ClipboardList,
  Mail,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react'

import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { budgetAPI, procurementAPI, notificationsAPI } from '../services/api'

const fmt = (n) => '₱' + (n ?? 0).toLocaleString()
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

const STATUS_CONFIG = {
  approved: { label: 'Approved', color: '#10b981', bg: '#10b98118' },
  pending: { label: 'Pending', color: '#f59e0b', bg: '#f59e0b18' },
  for_review: { label: 'For Review', color: '#3b82f6', bg: '#3b82f618' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#ef444418' },
}

const NOTIF_ICONS = {
  approval: <Mail size={18} />,
  alert: <AlertTriangle size={18} />,
  info: <Info size={18} />,
  success: <CheckCircle size={18} />
}

export default function Dashboard() {
  const user = useSelector((state) => state.auth.user)

  const [summary, setSummary] = useState(null)
  const [activity, setActivity] = useState([])
  const [monthly, setMonthly] = useState([])
  const [departments, setDepartments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loadingCards, setLoadingCards] = useState(true)

  useEffect(() => {
    budgetAPI.getSummary().then((d) => {
      setSummary(d)
      setLoadingCards(false)
    })

    procurementAPI.getRecentActivity().then(setActivity)
    procurementAPI.getMonthlySpending().then(setMonthly)
    procurementAPI.getDepartmentBreakdown().then(setDepartments)
    notificationsAPI.getAll().then(setNotifications)
  }, [])

  const spentPct = summary ? pct(summary.totalSpent, summary.totalBudget) : 0
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="dashboard-root">
      <Navbar />

      <main className="dashboard-main">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">
              Good {new Date().getHours() < 12
                ? 'Morning'
                : new Date().getHours() < 17
                  ? 'Afternoon'
                  : 'Evening'
              }, {user?.name?.split(' ')[0]}
            </h1>

            <p className="dashboard-date">
              {new Date().toLocaleDateString('en-PH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="dashboard-header-right">
            <button className="header-notif-btn">
              <Bell size={18} />
              {unread > 0 && <span className="notif-badge">{unread}</span>}
            </button>

            <div className="header-avatar">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* BUDGET BANNER */}
        {summary && (
          <div className="budget-banner">
            <div className="budget-banner-left">
              <span className="budget-banner-label">
                Fiscal Year Budget Utilization
              </span>

              <span
                className="budget-banner-pct"
                style={{ color: spentPct > 80 ? '#ef4444' : '#06b6d4' }}
              >
                {spentPct}% Used
              </span>
            </div>

            <div className="budget-progress-track">
              <div
                className="budget-progress-fill"
                style={{
                  width: `${spentPct}%`,
                  background:
                    spentPct > 80
                      ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                      : 'linear-gradient(90deg,#06b6d4,#3b82f6)',
                }}
              />
            </div>

            <div className="budget-banner-right">
              {fmt(summary?.totalSpent)} spent of {fmt(summary?.totalBudget)}
            </div>
          </div>
        )}

        {/* KPI CARDS */}
        <section className="cards-grid">
          <Card
            title="Total Budget"
            value={summary ? fmt(summary.totalBudget) : '—'}
            subtitle="FY Allocation"
            icon={<Wallet size={22} />}
            accent="#06b6d4"
            trend={5}
            loading={loadingCards}
          />

          <Card
            title="Total Spent"
            value={summary ? fmt(summary.totalSpent) : '—'}
            subtitle={`${spentPct}% used`}
            icon={<ArrowUpRight size={22} />}
            accent="#3b82f6"
            trend={12}
            loading={loadingCards}
          />

          <Card
            title="Remaining"
            value={summary ? fmt(summary.totalRemaining) : '—'}
            subtitle="Available funds"
            icon={<Landmark size={22} />}
            accent="#10b981"
            trend={-3}
            loading={loadingCards}
          />

          <Card
            title="Pending Requests"
            value={summary ? summary.pendingRequests : '—'}
            subtitle="Awaiting approval"
            icon={<ClipboardList size={22} />}
            accent="#f59e0b"
            loading={loadingCards}
          />
        </section>

        {/* CHARTS */}
        <section className="charts-row">

          <div className="chart-card chart-card-wide">
            <div className="chart-card-header">
              <h3 className="chart-title">Monthly Spending vs Budget</h3>
              <span className="chart-badge">Last 6 Months</span>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly || []}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => fmt(v)} />

                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="#06b6d4"
                  fill="#06b6d420"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* PIE CHART FIXED */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-title">By Department</h3>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={departments || []}
                  dataKey="spent"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                >
                  {(departments || []).map((d, i) => (
                    <Cell key={i} fill={d.color || '#06b6d4'} />
                  ))}
                </Pie>

                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </section>

        {/* NOTIFICATIONS */}
        <section className="bottom-row">

          <div className="notif-card">
            <div className="chart-card-header">
              <h3 className="chart-title">Notifications</h3>
            </div>

            <div className="notif-list">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'notif-unread' : ''}`}
                >
                  <span className="notif-icon">
                    {NOTIF_ICONS[n.type]}
                  </span>

                  <div className="notif-body">
                    <span className="notif-msg">{n.message}</span>
                    <span className="notif-time">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>
    </div>
  )
}