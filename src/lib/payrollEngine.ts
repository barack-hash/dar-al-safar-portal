import { Employee } from '../types';

/**
 * Ethiopian Payroll Engine
 * Adheres to Ethiopian tax laws and pension contributions.
 */

export interface PayrollResult {
  baseSalary: number;
  employeePension: number;
  employerPension: number;
  taxableIncome: number;
  incomeTax: number;
  netSalary: number;
  totalCostToCompany: number;
}

export function calculatePayroll(employee: Employee, hoursWorked?: number): PayrollResult {
  // Logic 3: Gross Pay based on frequency
  let grossPay = employee.baseSalary;
  if (employee.paymentFrequency === 'HOURLY') {
    grossPay = (employee.hourlyRate || 0) * (hoursWorked || 0);
  }

  // Logic 2: Pro-Rata for first month
  const startDate = new Date(employee.startDate);
  const now = new Date();
  
  // Check if we are calculating for the same month/year as start date
  if (startDate.getMonth() === now.getMonth() && startDate.getFullYear() === now.getFullYear()) {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysWorked = daysInMonth - startDate.getDate() + 1;
    // Only pro-rate if they started after the 1st
    if (daysWorked < daysInMonth) {
      grossPay = (grossPay / daysInMonth) * daysWorked;
    }
  }

  // Logic 1: Optional Taxes
  const employeePension = employee.applyPension ? grossPay * 0.07 : 0;
  const employerPension = employee.applyPension ? grossPay * 0.11 : 0;

  const taxableIncome = grossPay - employeePension;
  let incomeTax = 0;

  if (employee.applyIncomeTax) {
    if (taxableIncome <= 600) {
      incomeTax = 0;
    } else if (taxableIncome <= 1650) {
      incomeTax = (taxableIncome * 0.10) - 60;
    } else if (taxableIncome <= 3200) {
      incomeTax = (taxableIncome * 0.15) - 142.5;
    } else if (taxableIncome <= 5250) {
      incomeTax = (taxableIncome * 0.20) - 302.5;
    } else if (taxableIncome <= 7800) {
      incomeTax = (taxableIncome * 0.25) - 565;
    } else if (taxableIncome <= 10900) {
      incomeTax = (taxableIncome * 0.30) - 955;
    } else {
      incomeTax = (taxableIncome * 0.35) - 1500;
    }
  }

  // 4. Net Salary
  const netSalary = taxableIncome - incomeTax;

  // 5. Total Cost to Company
  const totalCostToCompany = grossPay + employerPension;

  return {
    baseSalary: grossPay,
    employeePension,
    employerPension,
    taxableIncome,
    incomeTax,
    netSalary,
    totalCostToCompany
  };
}
