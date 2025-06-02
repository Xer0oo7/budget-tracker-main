
import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { PieChart, Target, AlertTriangle, Plus, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Budget: React.FC = () => {
  const { state, setBudget, getExpensesByCategory } = useBudget();
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    limit: '',
  });

  const expensesByCategory = getExpensesByCategory();

  const handleSubmitBudget = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budgetForm.category || !budgetForm.limit || Number(budgetForm.limit) <= 0) {
      toast({
        title: "Invalid input",
        description: "Please select a category and enter a valid budget limit.",
        variant: "destructive",
      });
      return;
    }

    const spent = expensesByCategory[budgetForm.category] || 0;
    
    setBudget({
      category: budgetForm.category,
      limit: Number(budgetForm.limit),
      spent,
    });

    toast({
      title: "Budget updated",
      description: `Budget for ${budgetForm.category} has been set to ₹${budgetForm.limit}`,
    });

    setBudgetForm({ category: '', limit: '' });
    setIsAddingBudget(false);
    setEditingBudget(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const expenseCategories = state.categories.filter(cat => 
    !['Salary', 'Freelance'].includes(cat.name)
  );

  const totalBudget = state.budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = state.budgets.reduce((sum, budget) => {
    const spent = expensesByCategory[budget.category] || 0;
    return sum + spent;
  }, 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6 pb-20 sm:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600 mt-1">Set and track your spending limits</p>
        </div>
        <button
          onClick={() => setIsAddingBudget(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Set Budget</span>
        </button>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(totalBudget)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <PieChart className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className={`text-3xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalBudget - totalSpent)}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${totalBudget - totalSpent >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <AlertTriangle className={`w-8 h-8 ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Form */}
      {(isAddingBudget || editingBudget) && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingBudget ? 'Edit Budget' : 'Set New Budget'}
          </h3>
          <form onSubmit={handleSubmitBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={budgetForm.category}
              onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Category</option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            
            <input
              type="number"
              step="0.01"
              value={budgetForm.limit}
              onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })}
              placeholder="Budget limit"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
              >
                {editingBudget ? 'Update' : 'Set'} Budget
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingBudget(false);
                  setEditingBudget(null);
                  setBudgetForm({ category: '', limit: '' });
                }}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget List */}
      <div className="space-y-4">
        {state.budgets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No budgets set</h3>
            <p className="text-gray-600 mb-6">Start by setting budgets for your expense categories</p>
            <button
              onClick={() => setIsAddingBudget(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Set Your First Budget
            </button>
          </div>
        ) : (
          state.budgets.map((budget) => {
            const spent = expensesByCategory[budget.category] || 0;
            const percentage = getProgressPercentage(spent, budget.limit);
            const category = state.categories.find(c => c.name === budget.category);
            
            return (
              <div key={budget.category} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: category?.color || '#6B7280' }}
                    >
                      {category?.icon || '📦'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{budget.category}</h3>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(spent)} of {formatCurrency(budget.limit)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${getTextColor(percentage)}`}>
                      {percentage.toFixed(0)}%
                    </span>
                    <button
                      onClick={() => {
                        setBudgetForm({
                          category: budget.category,
                          limit: budget.limit.toString(),
                        });
                        setEditingBudget(budget.category);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Remaining: {formatCurrency(Math.max(0, budget.limit - spent))}
                  </span>
                  {percentage >= 100 && (
                    <span className="text-red-600 font-medium">
                      Over budget by {formatCurrency(spent - budget.limit)}
                    </span>
                  )}
                  {percentage >= 80 && percentage < 100 && (
                    <span className="text-yellow-600 font-medium">
                      Approaching limit
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Budget;
