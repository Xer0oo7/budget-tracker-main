
import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Calendar, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const {
    calculateTotalIncome,
    calculateTotalExpenses,
    calculateBalance,
    getExpensesByCategory,
    state,
  } = useBudget();

  const totalIncome = calculateTotalIncome();
  const totalExpenses = calculateTotalExpenses();
  const balance = calculateBalance();
  const expensesByCategory = getExpensesByCategory();

  // Prepare chart data
  const pieChartData = Object.entries(expensesByCategory).map(([category, amount]) => {
    const categoryData = state.categories.find(c => c.name === category);
    return {
      name: category,
      value: amount,
      color: categoryData?.color || '#6B7280',
    };
  });

  // Monthly trends data (last 6 months)
  const getMonthlyData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthTransactions = state.transactions.filter(t => t.date.startsWith(monthKey));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      months.push({
        month: monthName,
        income,
        expenses,
      });
    }
    
    return months;
  };

  const monthlyData = getMonthlyData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const StatCard = ({ title, amount, icon: Icon, trend, trendValue, color }: any) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>
            {formatCurrency(amount)}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color === 'text-green-600' ? 'bg-green-100' : color === 'text-red-600' ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload }: any) => {
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
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-8 pb-20 sm:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your financial health</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income"
          amount={totalIncome}
          icon={TrendingUp}
          color="text-green-600"
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          title="Total Expenses"
          amount={totalExpenses}
          icon={TrendingDown}
          color="text-red-600"
          trend="down"
          trendValue="-3.2%"
        />
        <StatCard
          title="Current Balance"
          amount={balance}
          icon={DollarSign}
          color={balance >= 0 ? "text-blue-600" : "text-red-600"}
        />
        <StatCard
          title="Savings Rate"
          amount={(totalIncome > 0 ? (balance / totalIncome) * 100 : 0)}
          icon={PiggyBank}
          color="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense Categories Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Expenses by Category</h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <PiggyBank className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No expenses yet</p>
              <p className="text-sm">Start adding transactions to see your spending breakdown</p>
            </div>
          )}
        </div>

        {/* Monthly Trends Bar Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
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
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-yellow-500" />
          Quick Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600">Average Daily Spending</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalExpenses / 30)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600">Largest Expense Category</p>
            <p className="text-2xl font-bold text-purple-600">
              {pieChartData.length > 0 
                ? pieChartData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name
                : 'None'
              }
            </p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600">Transactions This Month</p>
            <p className="text-2xl font-bold text-green-600">
              {state.transactions.filter(t => 
                t.date.startsWith(new Date().toISOString().slice(0, 7))
              ).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
