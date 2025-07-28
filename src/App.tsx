import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CurrentOrders from './pages/CurrentOrders';
import AddOrder from './pages/AddOrder';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Fonction pour changer de page depuis les composants enfants
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  // Passer la fonction de changement de page aux composants
  const renderCurrentPage = () => {
    // Gérer les pages de modification de commande
    if (currentPage.startsWith('edit-order-')) {
      const orderId = currentPage.replace('edit-order-', '');
      return <AddOrder onPageChange={handlePageChange} editOrderId={orderId} />;
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={handlePageChange} />;
      case 'current-orders':
        return <CurrentOrders onPageChange={handlePageChange} />;
      case 'add-order':
        return <AddOrder onPageChange={handlePageChange} editOrderId={null} />;
      default:
        return <Dashboard onPageChange={handlePageChange} />;
    }
  };

  return renderCurrentPage();
}

function App() {
  return (
    <AuthProvider>
      <div className="font-inter">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;