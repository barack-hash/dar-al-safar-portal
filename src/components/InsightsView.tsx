import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  BarChart as BarChartIcon,
  Activity,
  DollarSign,
  Briefcase,
  UserCheck,
  Calendar,
  MapPin,
  RefreshCw
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTravelData } from '../hooks/useTravelData';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie,
  Cell
} from 'recharts';

// --- Types for Aggregated Data ---
interface StaffPerformance {
  name: string;
  revenue: number;
  volume: number;
}

/** Ready for live travel-intel APIs: interest score drives chart; optional revenue when linked to bookings. */
export interface TravelDestinationInsight {
  id: string;
  name: string;
  country: string;
  region: string;
  interestScore: number;
  avgStayNights: number;
  /** When wired to GDS / invoicing, populate from attributed bookings. */
  attributedRevenue: number | null;
  source: 'live' | 'fallback';
}

interface ClientLTV {
  id: string;
  name: string;
  ltv: number;
  transactionCount: number;
}

interface CashTrend {
  date: string;
  cashIn: number;
  cashOut: number;
}

export const InsightsView: React.FC = () => {
  const { 
    cashLog, 
    transactions, 
    invoices, 
    clients, 
    employees,
    currency,
    convertForDisplay
  } = useAppContext();

  const { destinations: travelDestinations, loading: travelLoading, error: travelError, refresh: refreshTravel } = useTravelData();

  // --- Data Aggregation Logic ---

  // 1. Staff Performance Matrix
  const staffPerformance = useMemo<StaffPerformance[]>(() => {
    const performanceMap: Record<string, { revenue: number; volume: number }> = {};

    // Initialize with all employees
    employees.forEach(emp => {
      performanceMap[emp.name] = { revenue: 0, volume: 0 };
    });

    // Aggregate from Cash Log
    cashLog.forEach(entry => {
      if (!performanceMap[entry.staff]) {
        performanceMap[entry.staff] = { revenue: 0, volume: 0 };
      }
      performanceMap[entry.staff].revenue += convertForDisplay(entry.moneyIn, entry.currency);
      performanceMap[entry.staff].volume += 1;
    });

    return Object.entries(performanceMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [cashLog, employees, convertForDisplay]);

  const travelDestinationInsights = useMemo<TravelDestinationInsight[]>(() => {
    return travelDestinations.map((d) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      region: d.region,
      interestScore: d.trendScore,
      avgStayNights: d.avgStayNights,
      attributedRevenue: null,
      source: d.source,
    }));
  }, [travelDestinations]);

  const travelChartRows = useMemo(
    () =>
      travelDestinationInsights.map((d) => ({
        name: d.name,
        value: d.interestScore,
        fullLabel: `${d.name} (${d.country})`,
      })),
    [travelDestinationInsights]
  );

  const blendedRevenueTotal = useMemo(() => {
    const fromTx = transactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((s, tx) => s + convertForDisplay(tx.amount, tx.currency), 0);
    const fromCash = cashLog.reduce(
      (s, e) => s + convertForDisplay(e.moneyIn, e.currency),
      0
    );
    return fromTx + fromCash;
  }, [transactions, cashLog, convertForDisplay]);

  // 3. Top Clients LTV
  const topClients = useMemo<ClientLTV[]>(() => {
    const clientMap: Record<string, { name: string; ltv: number; count: number }> = {};

    // Aggregate from Invoices
    invoices.forEach(inv => {
      if (inv.status === 'Paid') {
        const client = clients.find(c => c.id === inv.clientId);
        const name = client ? client.name : 'Unknown Client';
        const id = inv.clientId;
        
        if (!clientMap[id]) {
          clientMap[id] = { name, ltv: 0, count: 0 };
        }
        clientMap[id].ltv += convertForDisplay(inv.total, inv.currency);
        clientMap[id].count += 1;
      }
    });

    // Aggregate from Cash Log (for entities not in Client list)
    cashLog.forEach(entry => {
      if (entry.moneyIn > 0) {
        const name = entry.clientEntity;
        const existingClient = clients.find(c => c.name === name);
        const id = existingClient ? existingClient.id : `entity-${name}`;

        if (!clientMap[id]) {
          clientMap[id] = { name, ltv: 0, count: 0 };
        }
        clientMap[id].ltv += convertForDisplay(entry.moneyIn, entry.currency);
        clientMap[id].count += 1;
      }
    });

    return Object.entries(clientMap)
      .map(([id, stats]) => ({ 
        id, 
        name: stats.name, 
        ltv: stats.ltv, 
        transactionCount: stats.count 
      }))
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, 5); // Top 5 clients
  }, [invoices, clients, cashLog, convertForDisplay]);

  // 4. Cash In vs Cash Out Trend
  const cashTrend = useMemo<CashTrend[]>(() => {
    const trendMap: Record<string, { cashIn: number; cashOut: number }> = {};

    // Aggregate from Cash Log
    cashLog.forEach(entry => {
      const date = entry.date;
      if (!trendMap[date]) {
        trendMap[date] = { cashIn: 0, cashOut: 0 };
      }
      trendMap[date].cashIn += convertForDisplay(entry.moneyIn, entry.currency);
      trendMap[date].cashOut += convertForDisplay(entry.moneyOut, entry.currency);
    });

    // Aggregate from Transactions
    transactions.forEach(tx => {
      const date = tx.date;
      if (!trendMap[date]) {
        trendMap[date] = { cashIn: 0, cashOut: 0 };
      }
      if (tx.type === 'INCOME') trendMap[date].cashIn += convertForDisplay(tx.amount, tx.currency);
      if (tx.type === 'EXPENSE') trendMap[date].cashOut += convertForDisplay(tx.amount, tx.currency);
    });

    return Object.entries(trendMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days
  }, [cashLog, transactions, convertForDisplay]);

  // --- UI Helpers ---
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#71717a'];

  const formatCurrency = (val: number) => {
    const symbol = currency === 'ETB' ? 'Br' : currency === 'SAR' ? 'SR' : '$';
    return `${symbol}${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Intelligence Dashboard</h2>
          <p className="text-slate-500 mt-1 font-medium">Correlated business analytics across all operational contexts.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Calendar size={16} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-600">Last 30 Days</span>
        </div>
      </header>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Revenue" 
          value={formatCurrency(blendedRevenueTotal)}
          trend="+12.5%"
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard 
          label="Active Clients" 
          value={clients.length.toString()}
          trend="+4"
          icon={Users}
          color="blue"
        />
        <MetricCard 
          label="Transaction Volume" 
          value={(cashLog.length + transactions.length).toString()}
          trend="+18%"
          icon={Activity}
          color="indigo"
        />
        <MetricCard 
          label="Staff Efficiency" 
          value="94%"
          trend="+2.1%"
          icon={UserCheck}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cash Flow Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-900 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cash Flow Trends</h3>
            </div>
          </div>
          <div className="h-80 w-full">
            {cashTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => `${val > 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend iconType="circle" />
                  <Line 
                    type="monotone" 
                    dataKey="cashIn" 
                    name="Cash In"
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cashOut" 
                    name="Cash Out"
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No trend data available yet." />
            )}
          </div>
        </div>

        {/* Trending destinations (live API–ready) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Travel Demand Signals</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interest index by destination — wire <code className="text-[10px] bg-slate-100 px-1 rounded">VITE_TRAVEL_TRENDING_ENDPOINT</code> for live data.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void refreshTravel()}
              disabled={travelLoading}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={14} className={travelLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          {travelError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
              {travelError} Showing fallback destinations.
            </p>
          )}
          <div className="h-80 w-full">
            {travelChartRows.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={travelChartRows}
                    cx="35%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {travelChartRows.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, _name, item) => {
                      const row = item?.payload as { fullLabel?: string; name?: string } | undefined;
                      return [`${value} / 100 interest`, row?.fullLabel || row?.name || ''];
                    }}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No travel insight data yet." />
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
            {travelDestinationInsights.slice(0, 6).map((d) => (
              <div key={d.id} className="flex justify-between text-xs bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                <span className="font-bold text-slate-800">{d.name}</span>
                <span className="text-slate-500">{d.avgStayNights}n avg · {d.source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staff Performance Matrix */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                <Briefcase size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Staff Performance Matrix</h3>
            </div>
          </div>
          <div className="space-y-4">
            {staffPerformance.length > 0 ? staffPerformance.map((staff, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-slate-400 border border-slate-200">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{staff.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{staff.volume} Transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{formatCurrency(staff.revenue)}</p>
                  <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.min(100, (staff.revenue / (staffPerformance[0]?.revenue || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )) : (
              <EmptyState message="No staff performance data." />
            )}
          </div>
        </div>

        {/* Top Clients LTV List */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Top Clients (LTV)</h3>
            </div>
          </div>
          <div className="space-y-4">
            {topClients.length > 0 ? topClients.map((client, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-black text-slate-200 w-6">0{i + 1}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{client.transactionCount} Invoices Paid</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">{formatCurrency(client.ltv)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lifetime Value</p>
                </div>
              </div>
            )) : (
              <EmptyState message="No client revenue data available." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const MetricCard: React.FC<{ label: string; value: string; trend: string; icon: LucideIcon; color: string }> = ({ 
  label, value, trend, icon: Icon, color 
}) => {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 bg-slate-50 text-slate-500 rounded-lg uppercase tracking-widest">
          <ArrowUpRight size={10} />
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
    </motion.div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-full flex flex-col justify-center items-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-8">
    <div className="text-center">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
        <BarChartIcon size={20} className="text-slate-300" />
      </div>
      <p className="text-sm text-slate-400 font-medium italic">{message}</p>
    </div>
  </div>
);
