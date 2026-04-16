import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Briefcase, 
  CreditCard, 
  TrendingUp, 
  X,
  User,
  Hash,
  DollarSign,
  Printer,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  Pencil
} from 'lucide-react';
import { useClientsContext, useUI } from '../contexts/AppContext';
import { Employee, EmployeeRole, PaymentFrequency, Currency } from '../types';

const PAYROLL_CURRENCY: Currency = 'ETB';
import { calculatePayroll } from '../lib/payrollEngine';

export const StaffView: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, generatePayroll, transactions } = useClientsContext();
  const { currency, convertForDisplay } = useUI();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHourlyModalOpen, setIsHourlyModalOpen] = useState(false);
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<Employee | null>(null);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(20);

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  const isPayrollGenerated = transactions.some(tx => 
    tx.category === 'Tax & Pension' && 
    tx.description.includes(currentMonth) &&
    tx.date.startsWith(currentYear.toString())
  );

  const filteredEmployees = useMemo(() => 
    employees.filter(emp => 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  [employees, searchQuery]);

  const visibleEmployees = useMemo(() => 
    filteredEmployees.slice(0, pageSize),
  [filteredEmployees, pageSize]);

  const totalMonthlyCost = employees.reduce((sum, emp) => {
    const payroll = calculatePayroll(emp);
    return sum + payroll.totalCostToCompany;
  }, 0);

  const handleGeneratePayroll = () => {
    const hourlyEmployees = employees.filter(emp => emp.paymentFrequency === 'HOURLY');
    if (hourlyEmployees.length > 0) {
      setIsHourlyModalOpen(true);
    } else {
      generatePayroll();
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Staff Registry</h2>
          <p className="text-slate-500 mt-1">Manage Dar Al Safar's elite concierge and operations team.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGeneratePayroll}
            disabled={isPayrollGenerated}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${
              isPayrollGenerated 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <CreditCard size={20} />
            {isPayrollGenerated ? 'Payroll Generated' : 'Generate Monthly Payroll'}
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add Employee
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Staff</p>
            <h3 className="text-2xl font-bold text-slate-900">{employees.length}</h3>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Monthly Cost to Company</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
              {convertForDisplay(totalMonthlyCost, PAYROLL_CURRENCY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Roles</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {new Set(employees.map(e => e.role)).size}
            </h3>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900">Staff Directory</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">TIN Number</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Base Salary</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Cost to Company</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {visibleEmployees.map((emp) => {
                const payroll = calculatePayroll(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={20} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{emp.name}</span>
                            {emp.paymentFrequency === 'HOURLY' && (
                              <Clock size={12} className="text-amber-500" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Started: {emp.startDate}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{emp.tinNumber}</td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-900 text-right">
                      <div className="flex flex-col items-end">
                        <span>
                          {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                          {emp.paymentFrequency === 'HOURLY' 
                            ? (convertForDisplay(emp.hourlyRate ?? 0, PAYROLL_CURRENCY).toLocaleString() + '/hr')
                            : convertForDisplay(emp.baseSalary, PAYROLL_CURRENCY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{emp.paymentFrequency}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-emerald-600 text-right">
                      {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {convertForDisplay(payroll.totalCostToCompany, PAYROLL_CURRENCY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedEmployeeForPayslip(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-active-green hover:bg-active-green/10 rounded-xl transition-all"
                        >
                          <FileText size={14} />
                          View Payslip
                        </button>
                        <button 
                          onClick={() => setSelectedEmployeeForEdit(emp)}
                          className="p-2 text-slate-400 hover:text-active-green hover:bg-active-green/5 rounded-xl transition-all"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${emp.name} from the registry?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length > pageSize && (
          <div className="p-8 border-t border-black/5 flex justify-center">
            <button 
              onClick={() => setPageSize(prev => prev + 20)}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
            >
              Load More Employees
            </button>
          </div>
        )}
      </div>

      <AddEmployeeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        addEmployee={addEmployee}
      />

      <HourlyHoursModal
        isOpen={isHourlyModalOpen}
        onClose={() => setIsHourlyModalOpen(false)}
        employees={employees.filter(emp => emp.paymentFrequency === 'HOURLY')}
        onConfirm={(hours) => generatePayroll(hours)}
      />

      <PayslipModal
        employee={selectedEmployeeForPayslip}
        onClose={() => setSelectedEmployeeForPayslip(null)}
      />

      {selectedEmployeeForEdit && (
        <EditEmployeeModal
          isOpen={!!selectedEmployeeForEdit}
          onClose={() => setSelectedEmployeeForEdit(null)}
          employee={selectedEmployeeForEdit}
          updateEmployee={updateEmployee}
        />
      )}
    </div>
  );
};

const EditEmployeeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
}> = ({ isOpen, onClose, employee, updateEmployee }) => {
  const [form, setForm] = useState({
    name: employee.name,
    role: employee.role,
    baseSalary: employee.baseSalary,
    hourlyRate: employee.hourlyRate || 0,
    tinNumber: employee.tinNumber,
    startDate: employee.startDate,
    paymentFrequency: employee.paymentFrequency,
    applyPension: employee.applyPension,
    applyIncomeTax: employee.applyIncomeTax
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployee(employee.id, form);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden z-10 border border-white/40"
          >
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Edit Employee</h2>
                  <p className="text-xs font-bold text-active-green tracking-widest uppercase">Update Registry Details</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-active-green/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                    <input 
                      type="text"
                      required
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}
                      className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-active-green/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Frequency</label>
                    <select 
                      value={form.paymentFrequency}
                      onChange={(e) => setForm({ ...form, paymentFrequency: e.target.value as any })}
                      className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-active-green/10 transition-all"
                    >
                      <option value="MONTHLY">Monthly Salary</option>
                      <option value="HOURLY">Hourly Rate</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      {form.paymentFrequency === 'HOURLY' ? 'Hourly Rate' : 'Base Monthly Salary'}
                    </label>
                    <input 
                      type="number"
                      required
                      value={form.paymentFrequency === 'HOURLY' ? form.hourlyRate : form.baseSalary}
                      onChange={(e) => setForm({ 
                        ...form, 
                        [form.paymentFrequency === 'HOURLY' ? 'hourlyRate' : 'baseSalary']: Number(e.target.value) 
                      })}
                      className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-active-green/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">TIN Number</label>
                    <input 
                      type="text"
                      required
                      value={form.tinNumber}
                      onChange={(e) => setForm({ ...form, tinNumber: e.target.value })}
                      className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-active-green/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-active-green/10 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={form.applyPension}
                      onChange={(e) => setForm({ ...form, applyPension: e.target.checked })}
                      className="w-5 h-5 rounded-lg text-active-green focus:ring-active-green/20"
                    />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Apply Pension</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={form.applyIncomeTax}
                      onChange={(e) => setForm({ ...form, applyIncomeTax: e.target.checked })}
                      className="w-5 h-5 rounded-lg text-active-green focus:ring-active-green/20"
                    />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Apply Income Tax</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PayslipModal: React.FC<{
  employee: Employee | null;
  onClose: () => void;
}> = ({ employee, onClose }) => {
  const { currency, convertForDisplay } = useUI();
  
  if (!employee) return null;
  
  const payroll = calculatePayroll(employee);
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {employee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            id="payslip-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden z-10 border border-white/40"
          >
            <div className="p-10 space-y-8">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Dar Al Safar</h1>
                  <p className="text-xs font-bold text-active-green tracking-[0.2em] uppercase">Employee Payslip</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{currentMonth}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Payment Period</p>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Employee Name</p>
                  <p className="text-lg font-bold text-slate-900">{employee.name}</p>
                  <p className="text-sm text-slate-500">{employee.role}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">TIN Number</p>
                  <p className="text-lg font-bold text-slate-900">{employee.tinNumber}</p>
                  <p className="text-sm text-slate-500">ID: {employee.id}</p>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="bg-slate-50/50 rounded-3xl p-8 space-y-6 border border-slate-100">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">
                      {employee.paymentFrequency === 'HOURLY' ? 'Calculated Gross Pay' : 'Base Salary (Gross)'}
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {convertForDisplay(payroll.baseSalary, PAYROLL_CURRENCY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="h-px bg-slate-200/50" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">
                      Less: Employee Pension (7%)
                      {!employee.applyPension && <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">(Exempt)</span>}
                    </span>
                    <span className={`text-sm font-bold ${employee.applyPension ? 'text-rose-500' : 'text-slate-300'}`}>
                      - {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {convertForDisplay(payroll.employeePension, PAYROLL_CURRENCY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">
                      Less: Income Tax (PAYE)
                      {!employee.applyIncomeTax && <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">(Exempt)</span>}
                    </span>
                    <span className={`text-sm font-bold ${employee.applyIncomeTax ? 'text-rose-500' : 'text-slate-300'}`}>
                      - {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {convertForDisplay(payroll.incomeTax, PAYROLL_CURRENCY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-slate-900/10" />

                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold text-slate-900 uppercase tracking-widest">Net Take-Home Pay</span>
                  <span className="text-3xl font-black text-active-green">
                    {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                    {convertForDisplay(payroll.netSalary, PAYROLL_CURRENCY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Memo Items */}
              <div className="px-8 py-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    Memo: Employer Pension (11%)
                    {!employee.applyPension && <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">(Exempt)</span>}
                  </span>
                </div>
                <span className={`text-sm font-bold ${employee.applyPension ? 'text-indigo-900' : 'text-slate-300'}`}>
                  {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                  {convertForDisplay(payroll.employerPension, PAYROLL_CURRENCY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Footer */}
              <div className="pt-4 flex flex-col md:flex-row gap-4 no-print">
                <button 
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                >
                  <Printer size={20} />
                  Print / Save as PDF
                </button>
                <button 
                  onClick={onClose}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const AddEmployeeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  addEmployee: (data: Omit<Employee, 'id'>) => void;
}> = ({ isOpen, onClose, addEmployee }) => {
  const [form, setForm] = useState({
    name: '',
    role: 'Concierge' as EmployeeRole,
    baseSalary: 0,
    hourlyRate: 0,
    tinNumber: '',
    startDate: new Date().toISOString().split('T')[0],
    paymentFrequency: 'MONTHLY' as PaymentFrequency,
    applyPension: true,
    applyIncomeTax: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee(form);
    onClose();
    setForm({
      name: '',
      role: 'Concierge',
      baseSalary: 0,
      hourlyRate: 0,
      tinNumber: '',
      startDate: new Date().toISOString().split('T')[0],
      paymentFrequency: 'MONTHLY',
      applyPension: true,
      applyIncomeTax: true
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">Add New Employee</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                      placeholder="e.g., Abebe Bikila"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                    >
                      <option value="Concierge">Concierge</option>
                      <option value="Travel Consultant">Travel Consultant</option>
                      <option value="Operations Manager">Operations Manager</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Marketing Specialist">Marketing Specialist</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Payment Frequency</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={form.paymentFrequency}
                      onChange={(e) => setForm({ ...form, paymentFrequency: e.target.value as PaymentFrequency })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="BI_WEEKLY">Bi-Weekly</option>
                      <option value="HOURLY">Hourly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    {form.paymentFrequency === 'HOURLY' ? 'Hourly Rate (ETB)' : 'Base Salary (ETB)'}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="number"
                      value={form.paymentFrequency === 'HOURLY' ? (form.hourlyRate || '') : (form.baseSalary || '')}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (form.paymentFrequency === 'HOURLY') {
                          setForm({ ...form, hourlyRate: val });
                        } else {
                          setForm({ ...form, baseSalary: val });
                        }
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">TIN Number</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={form.tinNumber}
                      onChange={(e) => setForm({ ...form, tinNumber: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                      placeholder="10 digits"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Deduct Income Tax</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, applyIncomeTax: !form.applyIncomeTax })}
                    className={`w-10 h-5 rounded-full transition-all relative ${form.applyIncomeTax ? 'bg-active-green' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${form.applyIncomeTax ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Deduct Pension</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, applyPension: !form.applyPension })}
                    className={`w-10 h-5 rounded-full transition-all relative ${form.applyPension ? 'bg-active-green' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${form.applyPension ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const HourlyHoursModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onConfirm: (hours: Record<string, number>) => void;
}> = ({ isOpen, onClose, employees, onConfirm }) => {
  const [hours, setHours] = useState<Record<string, number>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(hours);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
          >
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900">Hours Worked</h3>
              <p className="text-sm text-slate-500">Enter hours for hourly staff this month.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {employees.map(emp => (
                  <div key={emp.id} className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">{emp.name}</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="number"
                        value={hours[emp.id] || ''}
                        onChange={(e) => setHours({ ...hours, [emp.id]: parseFloat(e.target.value) })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                        placeholder="Total hours"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Generate
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
