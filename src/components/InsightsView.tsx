import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  Users,
  Calendar,
  UserCircle,
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  buildSixMonthFormalTrend,
  buildVisaPipelineDistribution,
  topClientsFromFormalTicketing,
  topStaffByTicketedBookings,
} from '../lib/insightsAggregates';
import { useStaffDisplayNames } from '../hooks/useStaffDisplayNames';

const EMERALD = '#10b981';
const ROSE = '#f43f5e';

export const InsightsView: React.FC = () => {
  const {
    formalLedger,
    bookings,
    visas,
    clients,
    currency,
    convertForDisplay,
    exchangeRates,
  } = useAppContext();

  const { staffByUserId } = useStaffDisplayNames();

  const trend = useMemo(
    () => buildSixMonthFormalTrend(formalLedger, currency, exchangeRates),
    [formalLedger, currency, exchangeRates]
  );

  const visaChartData = useMemo(() => buildVisaPipelineDistribution(visas), [visas]);

  const topClients = useMemo(
    () => topClientsFromFormalTicketing(formalLedger, bookings, clients, currency, exchangeRates, 3),
    [formalLedger, bookings, clients, currency, exchangeRates]
  );

  const topStaff = useMemo(() => topStaffByTicketedBookings(bookings), [bookings]);

  const topStaffName = topStaff ? staffByUserId.get(topStaff.assignedStaffId) ?? 'Staff member' : null;

  const formatCurrency = (val: number) => {
    const symbol = currency === 'ETB' ? 'Br' : currency === 'SAR' ? 'SR' : '$';
    return `${symbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const trailingNet = useMemo(() => trend.reduce((s, p) => s + p.netProfit, 0), [trend]);
  const trailingIncome = useMemo(() => trend.reduce((s, p) => s + p.income, 0), [trend]);

  const trendRangeLabel = useMemo(() => {
    if (trend.length === 0) return '';
    return `${trend[0].label} – ${trend[trend.length - 1].label}`;
  }, [trend]);

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Insights & Analytics</h2>
          <p className="text-slate-500 mt-1 font-medium">
            Live formal ledger, visas, and ticketing — trailing six months.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass-panel border border-white/30 rounded-2xl shadow-sm">
          <Calendar size={16} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-600">{trendRangeLabel || 'No data range'}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[2rem] border border-white/25 p-6"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">6-mo net (verified)</p>
          <p className={`text-2xl font-black mt-1 ${trailingNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(trailingNet)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel rounded-[2rem] border border-white/25 p-6"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">6-mo income (verified)</p>
          <p className="text-2xl font-black mt-1 text-emerald-600">{formatCurrency(trailingIncome)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-[2rem] border border-white/25 p-6"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visa cases</p>
          <p className="text-2xl font-black mt-1 text-slate-900">{visas.length}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-[2.5rem] border border-white/25 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Financial trend</h3>
              <p className="text-xs text-slate-500">Verified formal ledger — net income vs expenses by month</p>
            </div>
          </div>
          <div className="h-80 w-full">
            {trend.some((p) => p.income > 0 || p.expenses > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill={EMERALD} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill={ROSE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No verified formal ledger activity in the last six months." />
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[2.5rem] border border-white/25 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700">
              <PieChartIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Operational pipeline</h3>
              <p className="text-xs text-slate-500">Visa status distribution</p>
            </div>
          </div>
          <div className="h-80 w-full flex items-center justify-center">
            {visaChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visaChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {visaChartData.map((entry, i) => (
                      <Cell key={`${entry.name}-${i}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No visa applications to chart." />
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[2.5rem] border border-white/25 shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Top performers</h3>
            <p className="text-xs text-slate-500">
              Clients from verified ticketing income; staff by ticketed bookings (6 mo)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Top 3 clients</p>
            <div className="overflow-hidden rounded-2xl border border-white/20">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/40 border-b border-white/20">
                    <th className="px-4 py-3 font-bold text-slate-500">#</th>
                    <th className="px-4 py-3 font-bold text-slate-500">Client</th>
                    <th className="px-4 py-3 font-bold text-slate-500 text-right">Net (formal)</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500 italic">
                        No ticketing income in the formal ledger yet.
                      </td>
                    </tr>
                  ) : (
                    topClients.map((c, i) => (
                      <tr key={c.clientId} className="border-b border-white/10 last:border-0">
                        <td className="px-4 py-3 font-black text-slate-300">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {formatCurrency(c.totalNet)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Top staff</p>
            <div className="rounded-2xl border border-white/20 bg-white/30 p-6 flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600">
                <UserCircle size={28} />
              </div>
              <div>
                {topStaff && topStaffName ? (
                  <>
                    <p className="text-lg font-black text-slate-900">{topStaffName}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="font-bold text-emerald-600">{topStaff.ticketCount}</span> ticketed booking
                      {topStaff.ticketCount === 1 ? '' : 's'} in trailing 6 months
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    Assign staff to bookings and issue tickets to see a leader here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-full min-h-[200px] flex items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-white/20 px-6">
    <p className="text-sm text-slate-500 text-center font-medium">{message}</p>
  </div>
);
