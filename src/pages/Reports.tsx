
import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const Reports: React.FC = () => {
  const { state, calculateTotalIncome, calculateTotalExpenses, getExpensesByCategory } = useBudget();
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days' | '1year'>('30days');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    const daysAgo = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      '1year': 365,
    }[timeRange];

    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return state.transactions.filter(t => new Date(t.date) >= cutoffDate);
  };

  const getTimeSeriesData = () => {
    const filteredTransactions = getFilteredTransactions();
    const dataPoints: { [key: string]: { income: number; expenses: number; date: string } } = {};

    // Determine the grouping interval
    const groupBy = timeRange === '7days' ? 'day' : timeRange === '30days' ? 'day' : 'month';

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!dataPoints[key]) {
        dataPoints[key] = { income: 0, expenses: 0, date: key };
      }

      if (transaction.type === 'income') {
        dataPoints[key].income += transaction.amount;
      } else {
        dataPoints[key].expenses += transaction.amount;
      }
    });

    return Object.values(dataPoints).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getCategoryData = () => {
    const filteredTransactions = getFilteredTransactions();
    const categories: { [key: string]: number } = {};

    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        categories[transaction.category] = (categories[transaction.category] || 0) + transaction.amount;
      });

    return Object.entries(categories).map(([category, amount]) => {
      const categoryData = state.categories.find(c => c.name === category);
      return {
        name: category,
        value: amount,
        color: categoryData?.color || '#6B7280',
      };
    }).sort((a, b) => b.value - a.value);
  };

  const getTopCategories = () => {
    return getCategoryData().slice(0, 5);
  };

  const getSummaryStats = () => {
    const filteredTransactions = getFilteredTransactions();
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;

    return { income, expenses, balance, savingsRate };
  };

  const timeSeriesData = getTimeSeriesData();
  const categoryData = getCategoryData();
  const topCategories = getTopCategories();
  const summaryStats = getSummaryStats();

  const exportData = () => {
    const filteredTransactions = getFilteredTransactions();
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount'].join(','),
      ...filteredTransactions.map(t => [
        t.date,
        t.type,
        t.category,
        `"${t.description}"`,
        t.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6 pb-20 sm:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Analyze your spending patterns and trends</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last year</option>
          </select>
          <button
            onClick={exportData}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summaryStats.income)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summaryStats.expenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold ${summaryStats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(summaryStats.balance)}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${summaryStats.balance >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${summaryStats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Savings Rate</p>
              <p className={`text-2xl font-bold ${summaryStats.savingsRate >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {summaryStats.savingsRate.toFixed(1)}%
              </p>
            </div>
            <div className={`p-3 rounded-xl ${summaryStats.savingsRate >= 0 ? 'bg-purple-100' : 'bg-red-100'}`}>
              <Calendar className={`w-6 h-6 ${summaryStats.savingsRate >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Income vs Expenses Over Time */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Income vs Expenses Over Time</h3>
        {timeSeriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border">
                        <p className="font-medium">{label}</p>
                        <p className="text-green-600">
                          Income: {formatCurrency(Number(payload[0]?.value || 0))}
                        </p>
                        <p className="text-red-600">
                          Expenses: {formatCurrency(Number(payload[1]?.value || 0))}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Income"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Expenses"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No data for selected period</p>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Expenses by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border">
                          <p className="font-medium">{payload[0].payload.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(Number(payload[0].value))}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No expenses in this period</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Categories List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Top Spending Categories</h3>
          <div className="space-y-4">
            {topCategories.map((category, index) => {
              const percentage = categoryData.length > 0 
                ? (category.value / categoryData.reduce((sum, cat) => sum + cat.value, 0)) * 100 
                : 0;
              
              const categoryInfo = state.categories.find(c => c.name === category.name);
              
              return (
                <div key={category.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 text-lg">
                      {index + 1}
                    </div>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-600">{percentage.toFixed(1)}% of total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(category.value)}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {topCategories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No spending data available for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
