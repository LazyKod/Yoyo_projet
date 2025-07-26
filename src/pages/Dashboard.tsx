import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  TrendingUp, 
  LogOut, 
  CheckCircle,
  Clock,
  Euro,
  Award,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Order {
  id: string;
  poste: string;
  numeroArticle: string;
  designation: string;
  technologie: string;
  familleProduit: string;
  quantiteCommandee: number;
  quantiteExpediee: number;
  quantiteALivrer: number;
  quantiteEnPreparation: number;
  clientFinal: string;
  dateCreation: string;
  dateConfirmation?: string;
  typCommande: string;
  dateLivraison: string;
  unite: string;
}

interface KPIData {
  commandesConfirmees: number;
  commandesAConfirmer: number;
  chiffreAffaires: number;
  topArticles: Array<{ nom: string; quantite: number }>;
  topClients: Array<{ nom: string; commandes: number }>;
}

interface DashboardProps {
  onPageChange: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const { user, logout } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '1A'>('1M');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [kpiData, setKpiData] = useState<KPIData>({
    commandesConfirmees: 0,
    commandesAConfirmer: 0,
    chiffreAffaires: 0,
    topArticles: [],
    topClients: []
  });

  // Charger les commandes depuis le backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/api/orders');
        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
      }
    };

    fetchOrders();
  }, []);

  // Calculer les KPIs basés sur les vraies données et la période sélectionnée
  useEffect(() => {
    const calculateKPIs = (period: string): KPIData => {
      const today = new Date();
      let startDate: Date;

      // Calculer la date de début selon la période
      switch (period) {
        case '1M':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          break;
        case '3M':
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
          break;
        case '1A':
          startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      }

      // Filtrer les commandes selon la période
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.dateCreation);
        return orderDate >= startDate && orderDate <= today;
      });

      // Calculer les commandes confirmées (celles qui ont une date de confirmation)
      const commandesConfirmees = filteredOrders.filter(order => 
        order.dateConfirmation && order.dateConfirmation.trim() !== ''
      ).length;

      // Calculer les commandes à confirmer (celles qui n'ont pas de date de confirmation)
      const commandesAConfirmer = filteredOrders.filter(order => 
        !order.dateConfirmation || order.dateConfirmation.trim() === ''
      ).length;

      // Calculer le chiffre d'affaires (simulation basée sur les quantités)
      // En l'absence de prix unitaire, on estime à 50€ par unité en moyenne
      const chiffreAffaires = filteredOrders.reduce((total, order) => {
        return total + (order.quantiteCommandee * 50); // Prix unitaire estimé
      }, 0);

      // Calculer le top 3 des articles (utiliser numeroArticle au lieu de designation)
      const articlesMap = new Map<string, number>();
      filteredOrders.forEach(order => {
        const current = articlesMap.get(order.numeroArticle) || 0;
        articlesMap.set(order.numeroArticle, current + order.quantiteCommandee);
      });

      const topArticles = Array.from(articlesMap.entries())
        .map(([nom, quantite]) => ({ nom, quantite }))
        .sort((a, b) => b.quantite - a.quantite)
        .slice(0, 3);

      // Calculer le top 3 des clients
      const clientsMap = new Map<string, number>();
      filteredOrders.forEach(order => {
        const current = clientsMap.get(order.clientFinal) || 0;
        clientsMap.set(order.clientFinal, current + 1);
      });

      const topClients = Array.from(clientsMap.entries())
        .map(([nom, commandes]) => ({ nom, commandes }))
        .sort((a, b) => b.commandes - a.commandes)
        .slice(0, 3);

      return {
        commandesConfirmees,
        commandesAConfirmer,
        chiffreAffaires,
        topArticles,
        topClients
      };
    };

    if (orders.length > 0) {
      setKpiData(calculateKPIs(selectedPeriod));
    }
  }, [orders, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '1M': return 'Ce mois';
      case '3M': return 'Ce trimestre';
      case '1A': return 'Cette année';
      default: return 'Ce mois';
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onPageChange(tab);
  };

  const kpiCards = [
    {
      title: 'Commandes confirmées',
      value: kpiData.commandesConfirmees.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Commandes à confirmer',
      value: kpiData.commandesAConfirmer.toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Chiffre d\'affaires',
      value: formatCurrency(kpiData.chiffreAffaires),
      icon: Euro,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header avec navigation */}
      <header className="bg-gradient-to-r from-slate-700 to-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo et navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <svg 
                  className="h-10 w-auto text-white mr-3" 
                  viewBox="0 0 450 266" 
                  fill="currentColor"
                >
                  <g transform="translate(0.000000,266.000000) scale(0.100000,-0.100000)">
                    <path d="M2050 1831 c0 -10 164 -164 180 -169 12 -4 174 145 178 164 3 11 -30 14 -177 14 -104 0 -181 -4 -181 -9z"/>
                    <path d="M3095 1790 c-165 -26 -257 -92 -240 -169 32 -149 535 -205 755 -85 206 112 37 249 -320 259 -74 2 -162 0 -195 -5z m325 -44 c80 -20 112 -34 143 -64 141 -135 -305 -241 -533 -127 -111 56 -78 156 62 190 71 17 259 18 328 1z"/>
                    <path d="M410 1757 c-20 -17 -100 -86 -178 -151 -78 -65 -139 -122 -137 -126 12 -19 102 4 144 37 l44 33 180 0 180 0 41 -33 c29 -25 54 -35 89 -39 26 -3 49 -2 52 2 3 4 -18 27 -47 51 -28 24 -108 92 -177 151 -69 59 -133 107 -141 108 -8 0 -31 -15 -50 -33z m114 -104 c31 -26 56 -53 56 -60 0 -10 -29 -13 -120 -13 -85 0 -120 3 -120 12 0 14 100 107 116 108 7 0 37 -21 68 -47z"/>
                    <path d="M1047 1773 c-4 -3 -7 -71 -7 -150 l0 -144 53 3 52 3 1 40 c3 77 2 75 36 75 21 0 70 -21 138 -59 101 -56 191 -83 205 -62 3 5 -33 30 -80 56 -48 26 -84 52 -83 57 2 6 26 18 54 25 62 18 99 52 91 85 -14 54 -112 78 -317 78 -75 0 -140 -3 -143 -7z m345 -50 c48 -48 -17 -95 -122 -89 -25 1 -62 3 -82 4 l-38 2 0 49 c0 30 5 52 13 55 6 3 56 4 110 3 84 -2 100 -6 119 -24z"/>
                    <path d="M1881 1638 c-45 -78 -81 -145 -81 -150 0 -4 22 -8 49 -8 l48 0 38 85 c21 47 44 90 51 96 9 7 41 -16 123 -91 61 -55 116 -100 122 -100 14 0 41 21 145 116 47 44 90 81 95 82 5 2 30 -39 55 -92 l45 -96 50 0 c28 0 49 4 47 9 -10 30 -164 291 -171 291 -5 0 -63 -51 -129 -112 -66 -62 -126 -114 -134 -116 -8 -2 -56 36 -106 85 -145 140 -149 143 -158 143 -5 0 -45 -64 -89 -142z"/>
                    <path d="M3927 1773 c-4 -3 -7 -71 -7 -150 l0 -143 50 0 49 0 3 58 c3 56 4 57 34 60 20 2 49 -7 80 -24 27 -15 76 -41 109 -59 59 -33 156 -51 154 -30 -1 6 -36 28 -78 51 -42 23 -76 47 -76 54 0 7 19 18 43 25 65 20 92 41 92 74 0 40 -31 62 -108 77 -69 14 -334 19 -345 7z m312 -34 c59 -21 63 -67 9 -90 -31 -13 -200 -15 -219 -4 -13 9 -11 79 3 93 15 15 164 16 207 1z"/>
                  </g>
                </svg>
              </div>
              
              <nav className="flex space-x-6">
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Tableau de bord
                </button>
                <button
                  onClick={() => handleTabChange('orders')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Gestion de commandes
                </button>
              </nav>
            </div>

            {/* User info et déconnexion */}
            <div className="flex items-center space-x-4">
              <div className="text-slate-300 text-sm">
                <span className="font-medium text-white">{user?.nom}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="text-sm">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Sélecteur de période */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Tableau de bord</h1>
            <p className="text-slate-600">Vue d'ensemble des performances - {getPeriodLabel(selectedPeriod)}</p>
          </div>
          
          <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            {(['1M', '3M', '1A'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {period === '1M' ? '1 Mois' : period === '3M' ? '3 Mois' : '1 An'}
              </button>
            ))}
          </div>
        </div>

        {/* Grille des KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {kpiCards.map((kpi, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-sm border ${kpi.borderColor} p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">{kpi.title}</p>
                  <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                </div>
                <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section Top Articles et Top Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top 3 Articles */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Award className="w-5 h-5 mr-2 text-blue-600" />
                Top 3 Articles vendus
              </h3>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {kpiData.topArticles.length > 0 ? (
                kpiData.topArticles.map((article, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-slate-800 text-sm">{article.nom}</p>
                        <p className="text-sm text-slate-600">{article.quantite} unités</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`w-16 h-2 rounded-full ${
                        index === 0 ? 'bg-yellow-200' : index === 1 ? 'bg-slate-200' : 'bg-orange-200'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.max(20, 100 - (index * 20))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Aucun article trouvé pour cette période</p>
                </div>
              )}
            </div>
          </div>

          {/* Top 3 Clients */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Top 3 Clients
              </h3>
              <PieChart className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {kpiData.topClients.length > 0 ? (
                kpiData.topClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-slate-800 text-sm">{client.nom}</p>
                        <p className="text-sm text-slate-600">{client.commandes} commandes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`w-16 h-2 rounded-full ${
                        index === 0 ? 'bg-green-200' : index === 1 ? 'bg-blue-200' : 'bg-purple-200'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${
                            index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${Math.max(20, 100 - (index * 15))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Aucun client trouvé pour cette période</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;