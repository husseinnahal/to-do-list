"use client"
import  { useState, useEffect } from 'react';
import { Calendar, Target, Brain, TrendingUp, Zap, Plus, Check, Clock, AlertCircle, Sparkles, ChevronRight, Menu, X, BarChart3, PieChart, Filter, ArrowUp, ArrowDown, Edit2, Trash2, CalendarDays } from 'lucide-react';

// Types
type Priority = 'low' | 'medium' | 'high';
type Status = 'todo' | 'doing' | 'done';
type Category = 'work' | 'study' | 'health' | 'money' | 'personal';
type Timeframe = 'year' | 'quarter' | 'month' | 'week' | 'day';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  estimatedTime: number;
  timeframe: Timeframe;
  category: Category;
  dueDate: string;
  aiGenerated: boolean;
  completedAt?: string;
}

interface Goal {
  id: string;
  title: string;
  category: Category;
  timeframe: Timeframe;
  createdAt: string;
  tasks: Task[];
}

interface DailyStats {
  date: string;
  completed: number;
  total: number;
  hoursSpent: number;
}

// AI Mock Logic
const generateSmartPlan = (goalTitle: string, category: Category, timeframe: Timeframe): Task[] => {
  const now = new Date();
  const tasks: Task[] = [];
  
  const templates = {
    work: ['Research and planning', 'Build MVP', 'Test with users', 'Iterate and improve', 'Launch'],
    study: ['Create learning roadmap', 'Study fundamentals', 'Practice exercises', 'Build project', 'Review and test'],
    health: ['Set baseline metrics', 'Create routine', 'Track daily progress', 'Adjust plan', 'Celebrate milestones'],
    money: ['Analyze current state', 'Set budget', 'Track expenses', 'Optimize spending', 'Review monthly'],
    personal: ['Define clear objective', 'Break into steps', 'Schedule time', 'Execute consistently', 'Reflect and adjust']
  };

  const steps = templates[category];
  const timeframes: Timeframe[] = ['year', 'quarter', 'month', 'week', 'day'];
  const startIndex = timeframes.indexOf(timeframe);

  steps.forEach((step, index) => {
    const taskTimeframe = timeframes[Math.min(startIndex + (index % 3), timeframes.length - 1)];
    const daysOffset = index * (timeframe === 'year' ? 60 : timeframe === 'quarter' ? 20 : timeframe === 'month' ? 7 : 2);
    const dueDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);

    tasks.push({
      id: `task-${Date.now()}-${index}`,
      title: `${goalTitle}: ${step}`,
      description: `AI-generated task for ${goalTitle}`,
      priority: index === 0 ? 'high' : index < 2 ? 'medium' : 'low',
      status: 'todo',
      estimatedTime: 2 + index,
      timeframe: taskTimeframe,
      category,
      dueDate: dueDate.toISOString().split('T')[0],
      aiGenerated: true
    });
  });

  return tasks;
};

// Utility functions
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (formatDate(date) === formatDate(today)) return 'Today';
  if (formatDate(date) === formatDate(tomorrow)) return 'Tomorrow';
  if (formatDate(date) === formatDate(yesterday)) return 'Yesterday';
  
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const getNextDays = (count: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(formatDate(date));
  }
  return dates;
};

// Main App Component
export default function SmartTodoApp() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeView, setActiveView] = useState<'timeline' | 'stats' | 'goals'>('timeline');
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  // New Goal Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<Category>('work');
  const [newGoalTimeframe, setNewGoalTimeframe] = useState<Timeframe>('month');

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('work');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(formatDate(new Date()));
  const [newTaskEstimatedTime, setNewTaskEstimatedTime] = useState<number>(2);

  // Load from storage
  useEffect(() => {
    const savedGoals = localStorage.getItem('smartTodoGoals');
    const savedStats = localStorage.getItem('smartTodoStats');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
    if (savedStats) {
      setDailyStats(JSON.parse(savedStats));
    }
  }, []);

  // Save to storage
  useEffect(() => {
    if (goals.length > 0) {
      localStorage.setItem('smartTodoGoals', JSON.stringify(goals));
    }
  }, [goals]);

  useEffect(() => {
    if (dailyStats.length > 0) {
      localStorage.setItem('smartTodoStats', JSON.stringify(dailyStats));
    }
  }, [dailyStats]);

  // Update daily stats
  useEffect(() => {
    const updateStats = () => {
      const last7Days = getNextDays(7);
      const newStats: DailyStats[] = last7Days.map(date => {
        const dayTasks = getAllTasks().filter(t => t.dueDate === date);
        const completed = dayTasks.filter(t => t.status === 'done').length;
        const hoursSpent = dayTasks
          .filter(t => t.status === 'done')
          .reduce((sum, t) => sum + t.estimatedTime, 0);
        
        return {
          date,
          completed,
          total: dayTasks.length,
          hoursSpent
        };
      });
      setDailyStats(newStats);
    };
    
    if (goals.length > 0) {
      updateStats();
    }
  }, [goals]);

  const handleCreateGoal = () => {
    if (!newGoalTitle.trim()) return;

    const aiTasks = generateSmartPlan(newGoalTitle, newGoalCategory, newGoalTimeframe);
    
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle,
      category: newGoalCategory,
      timeframe: newGoalTimeframe,
      createdAt: new Date().toISOString(),
      tasks: aiTasks
    };

    setGoals([...goals, newGoal]);
    setNewGoalTitle('');
    setShowGoalForm(false);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
      status: 'todo',
      estimatedTime: newTaskEstimatedTime,
      timeframe: 'day',
      category: newTaskCategory,
      dueDate: newTaskDueDate,
      aiGenerated: false
    };

    // Add to first goal or create a default goal
    if (goals.length === 0) {
      const defaultGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: 'My Tasks',
        category: newTaskCategory,
        timeframe: 'month',
        createdAt: new Date().toISOString(),
        tasks: [newTask]
      };
      setGoals([defaultGoal]);
    } else {
      const updatedGoals = [...goals];
      updatedGoals[0].tasks.push(newTask);
      setGoals(updatedGoals);
    }

    // Reset form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskEstimatedTime(2);
    setShowTaskForm(false);
  };

  const toggleTaskStatus = (goalId: string, taskId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          tasks: goal.tasks.map(task => {
            if (task.id === taskId) {
              const statuses: Status[] = ['todo', 'doing', 'done'];
              const currentIndex = statuses.indexOf(task.status);
              const nextStatus = statuses[(currentIndex + 1) % statuses.length];
              return { 
                ...task, 
                status: nextStatus,
                completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined
              };
            }
            return task;
          })
        };
      }
      return goal;
    }));
  };

  const deleteTask = (goalId: string, taskId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          tasks: goal.tasks.filter(task => task.id !== taskId)
        };
      }
      return goal;
    }));
  };

  const deleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  const getAllTasks = () => {
    return goals.flatMap(goal => 
      goal.tasks.map(task => ({ ...task, goalId: goal.id, goalTitle: goal.title }))
    );
  };

  const getTasksByDate = (date: string) => {
    let tasks = getAllTasks().filter(task => task.dueDate === date);
    
    if (filterCategory !== 'all') {
      tasks = tasks.filter(t => t.category === filterCategory);
    }
    if (filterPriority !== 'all') {
      tasks = tasks.filter(t => t.priority === filterPriority);
    }
    
    return tasks;
  };

  // Calculate statistics
  const allTasks = getAllTasks();
  const completedTasks = allTasks.filter(t => t.status === 'done');
  const todayTasks = getTasksByDate(formatDate(new Date()));
  const completedToday = todayTasks.filter(t => t.status === 'done').length;
  const totalHoursCompleted = completedTasks.reduce((sum, t) => sum + t.estimatedTime, 0);
  const avgCompletionRate = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
  
  const categoryStats = ['work', 'study', 'health', 'money', 'personal'].map(cat => ({
    category: cat as Category,
    completed: completedTasks.filter(t => t.category === cat).length,
    total: allTasks.filter(t => t.category === cat).length
  }));

  const streak = dailyStats.filter(s => s.completed > 0).length;

  const categoryColors = {
    work: 'bg-blue-500',
    study: 'bg-purple-500',
    health: 'bg-green-500',
    money: 'bg-yellow-500',
    personal: 'bg-pink-500'
  };

  const priorityColors = {
    low: 'border-gray-300',
    medium: 'border-yellow-400',
    high: 'border-red-400'
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-700',
    doing: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700'
  };

  const next7Days = getNextDays(7);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-2 rounded-xl shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SmartGoals Pro
                </h1>
                <p className="text-xs text-slate-500">AI-Powered Task Management</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-yellow-50 px-3 py-1.5 rounded-full border border-orange-200">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-700">{streak} day streak</span>
              </div>
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI Assistant</span>
              </button>
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Quick Task</span>
              </button>
              <button
                onClick={() => setShowGoalForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">New Goal</span>
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2">
            <button
              onClick={() => { setShowTaskForm(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Quick Task</span>
            </button>
            <button
              onClick={() => { setShowGoalForm(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">New Goal</span>
            </button>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveView('timeline')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeView === 'timeline'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className="w-5 h-5 mx-auto mb-1" />
              Timeline
            </button>
            <button
              onClick={() => setActiveView('stats')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeView === 'stats'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-5 h-5 mx-auto mb-1" />
              Statistics
            </button>
            <button
              onClick={() => setActiveView('goals')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeView === 'goals'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Target className="w-5 h-5 mx-auto mb-1" />
              Goals
            </button>
          </div>
        </div>

        {/* Timeline View */}
        {activeView === 'timeline' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium opacity-90">Today's Tasks</span>
                  <Target className="w-5 h-5 opacity-80" />
                </div>
                <div className="text-3xl font-bold">{completedToday}/{todayTasks.length}</div>
                <div className="text-sm opacity-80 mt-1">
                  {todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0}% Complete
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium opacity-90">Total Progress</span>
                  <TrendingUp className="w-5 h-5 opacity-80" />
                </div>
                <div className="text-3xl font-bold">{Math.round(avgCompletionRate)}%</div>
                <div className="text-sm opacity-80 mt-1">
                  {completedTasks.length} of {allTasks.length} tasks
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium opacity-90">Hours Completed</span>
                  <Clock className="w-5 h-5 opacity-80" />
                </div>
                <div className="text-3xl font-bold">{totalHoursCompleted}h</div>
                <div className="text-sm opacity-80 mt-1">Total productivity time</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium opacity-90">Active Goals</span>
                  <Zap className="w-5 h-5 opacity-80" />
                </div>
                <div className="text-3xl font-bold">{goals.length}</div>
                <div className="text-sm opacity-80 mt-1">Goals in progress</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Filters:</span>
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="work">Work</option>
                  <option value="study">Study</option>
                  <option value="health">Health</option>
                  <option value="money">Money</option>
                  <option value="personal">Personal</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Daily Timeline */}
            <div className="space-y-6">
              {next7Days.map((date) => {
                const dayTasks = getTasksByDate(date);
                const dayCompleted = dayTasks.filter(t => t.status === 'done').length;
                const dayProgress = dayTasks.length > 0 ? (dayCompleted / dayTasks.length) * 100 : 0;

                return (
                  <div key={date} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{getDateLabel(date)}</h3>
                          <p className="text-sm text-slate-600">{date}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{dayCompleted}/{dayTasks.length}</div>
                          <div className="text-xs text-slate-600">Tasks completed</div>
                        </div>
                      </div>
                      {dayTasks.length > 0 && (
                        <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${dayProgress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {dayTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No tasks scheduled for this day</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`bg-slate-50 rounded-lg p-4 border-l-4 ${priorityColors[task.priority]} hover:shadow-md transition-all group`}
                            >
                              <div className="flex items-start gap-4">
                                <button
                                  onClick={() => toggleTaskStatus(task.goalId, task.id)}
                                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-blue-500'
                                  }`}
                                >
                                  {task.status === 'done' && <Check className="w-4 h-4 text-white" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <h4 className={`font-medium text-slate-900 ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                                        {task.title}
                                      </h4>
                                      {task.description && (
                                        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                                      )}
                                      <p className="text-xs text-slate-500 mt-1">{task.goalTitle}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {task.aiGenerated && (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                          <Sparkles className="w-3 h-3" />
                                          AI
                                        </span>
                                      )}
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status]}`}>
                                        {task.status}
                                      </span>
                                      <button
                                        onClick={() => deleteTask(task.goalId, task.id)}
                                        className="p-1 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {task.estimatedTime}h
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[task.category]} text-white`}>
                                      {task.category}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border-2 ${priorityColors[task.priority]}`}>
                                      {task.priority}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Statistics View */}
        {activeView === 'stats' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-4">Completion Rate</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">{Math.round(avgCompletionRate)}%</div>
                <p className="text-sm text-slate-500">
                  {completedTasks.length} completed of {allTasks.length} total tasks
                </p>
                <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${avgCompletionRate}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-4">Productivity Hours</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">{totalHoursCompleted}h</div>
                <p className="text-sm text-slate-500">Total hours on completed tasks</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Avg per task</span>
                    <span className="font-semibold">
                      {completedTasks.length > 0 ? (totalHoursCompleted / completedTasks.length).toFixed(1) : 0}h
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-4">Active Streak</h3>
                <div className="text-4xl font-bold text-orange-600 mb-2">{streak} days</div>
                <p className="text-sm text-slate-500">Days with completed tasks</p>
                <div className="mt-4 flex items-center gap-1">
                  {dailyStats.slice(0, 7).map((stat, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-8 rounded ${
                        stat.completed > 0 ? 'bg-orange-500' : 'bg-slate-200'
                      }`}
                      title={`${stat.date}: ${stat.completed} tasks`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Category Breakdown</h3>
              <div className="space-y-4">
                {categoryStats.map((stat) => {
                  const percentage = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;
                  return (
                    <div key={stat.category}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${categoryColors[stat.category]}`} />
                          <span className="text-sm font-medium text-slate-700 capitalize">{stat.category}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {stat.completed}/{stat.total} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`${categoryColors[stat.category]} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Progress Chart */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6">7-Day Progress</h3>
              <div className="space-y-4">
                {dailyStats.map((stat) => (
                  <div key={stat.date}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{getDateLabel(stat.date)}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {stat.completed}/{stat.total} ({stat.hoursSpent}h)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${stat.total > 0 ? (stat.completed / stat.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Goals View */}
        {activeView === 'goals' && (
          <div className="space-y-6">
            {goals.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
                <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No goals yet</h3>
                <p className="text-slate-500 mb-6">Create your first goal and let AI break it down intelligently</p>
                <button
                  onClick={() => setShowGoalForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Goal
                </button>
              </div>
            ) : (
              goals.map((goal) => {
                const goalTasks = goal.tasks;
                const goalCompleted = goalTasks.filter(t => t.status === 'done').length;
                const goalProgress = goalTasks.length > 0 ? (goalCompleted / goalTasks.length) * 100 : 0;

                return (
                  <div key={goal.id} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{goal.title}</h3>
                          <div className="flex items-center gap-3 text-sm opacity-90">
                            <span className="capitalize">{goal.category}</span>
                            <span>•</span>
                            <span className="capitalize">{goal.timeframe}</span>
                            <span>•</span>
                            <span>{new Date(goal.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span className="font-semibold">{Math.round(goalProgress)}%</span>
                        </div>
                        <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-500"
                            style={{ width: `${goalProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-sm text-blue-600 font-medium mb-1">Total Tasks</div>
                          <div className="text-2xl font-bold text-blue-700">{goalTasks.length}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-sm text-green-600 font-medium mb-1">Completed</div>
                          <div className="text-2xl font-bold text-green-700">{goalCompleted}</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-sm text-purple-600 font-medium mb-1">In Progress</div>
                          <div className="text-2xl font-bold text-purple-700">
                            {goalTasks.filter(t => t.status === 'doing').length}
                          </div>
                        </div>
                      </div>

                      <h4 className="font-semibold text-slate-900 mb-3">Tasks ({goalTasks.length})</h4>
                      <div className="space-y-2">
                        {goalTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              task.status === 'done' ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <button
                              onClick={() => toggleTaskStatus(goal.id, task.id)}
                              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-slate-400'
                              }`}
                            >
                              {task.status === 'done' && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <div className="flex-1">
                              <div className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                {task.title}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${statusColors[task.status]}`}>
                              {task.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quick Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Add Quick Task</h2>
              <button
                onClick={() => setShowTaskForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Review project proposal"
                  className="w-full text-black placeholder:text-slate-300  px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Add details about this task..."
                  rows={3}
                  className="w-full text-black placeholder:text-slate-300 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                    className="w-full text-black placeholder:text-slate-300 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="health">Health</option>
                    <option value="money">Money</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                    className="w-full text-black placeholder:text-slate-300 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full text-black placeholder:text-slate-300 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Est. Hours</label>
                  <input
                    type="number"
                    value={newTaskEstimatedTime}
                    onChange={(e) => setNewTaskEstimatedTime(Number(e.target.value))}
                    min="0.5"
                    step="0.5"
                    className="w-full text-black placeholder:text-slate-300 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateTask}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Creation Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Create Smart Goal</h2>
              <button
                onClick={() => setShowGoalForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g., Build my SaaS, Get fit, Learn Next.js"
                  className="w-full  px-4 py-3 border border-slate-300 rounded-lg focus:ring-2
                  text-black placeholder:text-slate-300 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Category</label>
                <select
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value as Category)}
                  className="w-full px-4 py-3 border border-slate-300
                    placeholder:text-slate-400 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="work">Work</option>
                  <option value="study">Study</option>
                  <option value="health">Health</option>
                  <option value="money">Money</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Timeframe</label>
                <select
                  value={newGoalTimeframe}
                  onChange={(e) => setNewGoalTimeframe(e.target.value as Timeframe)}
                  className="w-full text-black px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="year">Year</option>
                  <option value="quarter">Quarter (3 Months)</option>
                  <option value="month">Month</option>
                </select>
              </div>

              <button
                onClick={handleCreateGoal}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                Generate Smart Plan with AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Panel */}
      {showAIPanel && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <button
                onClick={() => setShowAIPanel(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
              <div className="flex items-start gap-2">
                <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Todays Focus</p>
                  <p className="text-sm text-black">
                    You have {todayTasks.length} tasks today. Start with high-priority items for maximum impact.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Productivity Insights</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Your completion rate is {Math.round(avgCompletionRate)}%</li>
                    <li>• You're on a {streak}-day streak!</li>
                    <li>• {totalHoursCompleted}h of productive work completed</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-start gap-2">
                <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Pro Tips</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Break large tasks into 2-3 hour chunks</li>
                    <li>• Focus on 3 high-priority items per day</li>
                    <li>• Review and adjust your plan weekly</li>
                    <li>• Use categories to maintain balance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
              