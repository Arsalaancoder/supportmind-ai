import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  PlusCircle, 
  Users, 
  Bot, 
  BrainCircuit, 
  Activity, 
  BarChart3, 
  Settings, 
  Sparkles,
  Menu,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';

import { DashboardPage } from './pages/DashboardPage';
import { TicketsPage } from './pages/TicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { NewTicketPage } from './pages/NewTicketPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { AgentPage } from './pages/AgentPage';
import { MemoryPage } from './pages/MemoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export default function App() {
  const getPath = () => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return hash;
    return window.location.pathname || '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getPath);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(getPath());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Tickets', path: '/tickets', icon: Ticket },
    { label: 'New Ticket', path: '/new-ticket', icon: PlusCircle },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'AI Agent Workspace', path: '/agent', icon: Bot },
    { label: 'Hindsight Memory Bank', path: '/memory', icon: BrainCircuit },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const renderContent = () => {
    if (currentPath === '/' || currentPath === '/dashboard') {
      return <DashboardPage onNavigate={navigate} />;
    }
    if (currentPath === '/tickets') {
      return <TicketsPage onNavigate={navigate} />;
    }
    if (currentPath === '/new-ticket' || currentPath === '/tickets/new') {
      return <NewTicketPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/tickets/')) {
      const ticketId = currentPath.replace('/tickets/', '');
      return <TicketDetailPage ticketId={ticketId} onNavigate={navigate} />;
    }
    if (currentPath === '/customers') {
      return <CustomersPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/customers/')) {
      const customerId = currentPath.replace('/customers/', '');
      return <CustomerDetailPage customerId={customerId} onNavigate={navigate} />;
    }
    if (currentPath === '/agent') {
      return <AgentPage onNavigate={navigate} />;
    }
    if (currentPath === '/memory') {
      return <MemoryPage onNavigate={navigate} />;
    }
    if (currentPath === '/analytics') {
      return <AnalyticsPage onNavigate={navigate} />;
    }

    return <DashboardPage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white">SupportMind AI</span>
            <span className="block text-[10px] font-mono text-purple-400">Bank: SmartMind</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-full md:w-64 bg-slate-900/95 border-r border-slate-800/80 flex-shrink-0 md:min-h-screen flex flex-col justify-between p-4 md:p-6 fixed md:static inset-y-0 left-0 z-40 transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0 mt-16 md:mt-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="hidden md:flex items-center space-x-3 pb-6 border-b border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 text-white shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                SupportMind <Sparkles className="w-3.5 h-3.5 text-amber-400 inline" />
              </h1>
              <p className="text-xs font-mono text-purple-400">Hindsight Memory AI</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 font-mono text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? currentPath === '/' || currentPath === '/dashboard'
                  : currentPath.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Footer Status Box */}
        <div className="pt-6 border-t border-slate-800/80 space-y-2">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">System Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
              </span>
            </div>
            <div className="text-slate-500 text-[10px]">Bank ID: <strong className="text-purple-300">SmartMind</strong></div>
            <div className="text-slate-500 text-[10px]">Gemini: <strong className="text-indigo-300">gemini-3.6-flash</strong></div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-950">
        {renderContent()}
      </main>
    </div>
  );
}
