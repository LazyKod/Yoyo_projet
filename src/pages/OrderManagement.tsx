import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  LogOut, 
  CheckCircle,
  Clock,
  Calendar,
  User,
  Package,
  Shield,
  Check,
  Eye,
  Euro
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Order {
  _id: string;
  numeroCommande: string;
  clientId: {
    _id: string;
    nom: string;
    email: string;
  };
  articles: Array<{
    articleId: string;
    numeroArticle: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    unite: string;
  }>;
  dateLivraison: string;
  typeCommande: string;
  statut: string;
  dateConfirmation?: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  notes?: string;
  createdAt: string;
}

interface OrderManagementProps {
  onPageChange: (page: string) => void;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ onPageChange }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Séparer les commandes selon leur statut
  const commandesNonConfirmees = orders.filter(order => order.statut === 'brouillon');
  const commandesConfirmees = orders.filter(order => order.statut !== 'brouillon');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return 'bg-orange-100 text-orange-800';
      case 'confirmee':
        return 'bg-green-100 text-green-800';
      case 'en_preparation':
        return 'bg-blue-100 text-blue-800';
      case 'expediee':
        return 'bg-purple-100 text-purple-800';
      case 'livree':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return 'Brouillon';
      case 'confirmee':
        return 'Confirmée';
      case 'en_preparation':
        return 'En préparation';
      case 'expediee':
        return 'Expédiée';
      case 'livree':
        return 'Livrée';
      default:
        return statut;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onPageChange(tab);
  };

  // Fonction pour confirmer une commande
  const handleConfirmOrder = async (orderId: string) => {
    try {
      setConfirmingOrder(orderId);
      
      const response = await axios.put(`/api/orders/${orderId}/confirm`);

      if (response.data.success) {
        // Recharger les commandes pour refléter les changements
        const ordersResponse = await axios.get('/api/orders');
        if (ordersResponse.data.success) {
          setOrders(ordersResponse.data.data);
        }
        
        alert('Commande confirmée avec succès !');
      } else {
        alert('Erreur lors de la confirmation de la commande');
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      alert('Erreur lors de la confirmation de la commande');
    } finally {
      setConfirmingOrder(null);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Fonction pour naviguer vers la page d'ajout de commande
  const handleAddOrder = () => {
    onPageChange('add-order');
  };

  // Fonction pour naviguer vers la page de modification de commande
  const handleEditOrder = () => {
    onPageChange('edit-order');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
        {/* En-tête de la page */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestion de commandes</h1>
            <p className="text-slate-600">
              Gérez vos commandes multi-articles et leur validation
            </p>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex space-x-4">
            <button 
              onClick={handleAddOrder}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter une commande
            </button>
            <button 
              onClick={handleEditOrder}
              className="flex items-center px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              <Edit className="w-5 h-5 mr-2" />
              Modifier une commande
            </button>
          </div>
        </div>

        {/* Tableau des commandes non confirmées */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-orange-600" />
                Commandes non confirmées
              </h2>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {commandesNonConfirmees.length} commande{commandesNonConfirmees.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Client
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-1" />
                      Articles
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Euro className="w-4 h-4 mr-1" />
                      Montant
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Livraison
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {commandesNonConfirmees.length > 0 ? (
                  commandesNonConfirmees.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{order.numeroCommande}</div>
                        <div className="text-xs text-slate-500">Créée le {formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{order.clientId.nom}</div>
                        <div className="text-xs text-slate-500">{order.clientId.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {order.articles.length} article{order.articles.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.articles.reduce((total, article) => total + article.quantite, 0)} unités
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{formatCurrency(order.montantTTC)}</div>
                        <div className="text-xs text-slate-500">TTC</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{formatDate(order.dateLivraison)}</div>
                        <div className="text-xs text-slate-500">{order.typeCommande}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="flex items-center px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </button>
                          <button
                            onClick={() => handleConfirmOrder(order._id)}
                            disabled={confirmingOrder === order._id}
                            className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-xs font-medium transition-colors"
                          >
                            {confirmingOrder === order._id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                            ) : (
                              <Check className="w-3 h-3 mr-1" />
                            )}
                            Confirmer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500 text-lg">Aucune commande non confirmée</p>
                      <p className="text-slate-400 text-sm">Toutes les commandes ont été confirmées</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tableau des commandes confirmées */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                Commandes confirmées
              </h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {commandesConfirmees.length} commande{commandesConfirmees.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Client
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-1" />
                      Articles
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Euro className="w-4 h-4 mr-1" />
                      Montant
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Livraison
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {commandesConfirmees.length > 0 ? (
                  commandesConfirmees.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{order.numeroCommande}</div>
                        <div className="text-xs text-slate-500">Créée le {formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{order.clientId.nom}</div>
                        <div className="text-xs text-slate-500">{order.clientId.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {order.articles.length} article{order.articles.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.articles.reduce((total, article) => total + article.quantite, 0)} unités
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{formatCurrency(order.montantTTC)}</div>
                        <div className="text-xs text-slate-500">TTC</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{formatDate(order.dateLivraison)}</div>
                        <div className="text-xs text-slate-500">{order.typeCommande}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.statut)}`}>
                          {getStatusLabel(order.statut)}
                        </span>
                        {order.dateConfirmation && (
                          <div className="text-xs text-slate-500 mt-1">
                            Confirmée le {formatDate(order.dateConfirmation)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="flex items-center px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500 text-lg">Aucune commande confirmée</p>
                      <p className="text-slate-400 text-sm">Les commandes confirmées apparaîtront ici</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de détails de commande */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Détails de la commande {selectedOrder.numeroCommande}
              </h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations générales */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Numéro:</strong> {selectedOrder.numeroCommande}</div>
                    <div><strong>Client:</strong> {selectedOrder.clientId.nom}</div>
                    <div><strong>Email:</strong> {selectedOrder.clientId.email}</div>
                    <div><strong>Date de création:</strong> {formatDate(selectedOrder.createdAt)}</div>
                    <div><strong>Date de livraison:</strong> {formatDate(selectedOrder.dateLivraison)}</div>
                    <div><strong>Type:</strong> {selectedOrder.typeCommande}</div>
                    <div>
                      <strong>Statut:</strong> 
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.statut)}`}>
                        {getStatusLabel(selectedOrder.statut)}
                      </span>
                    </div>
                    {selectedOrder.dateConfirmation && (
                      <div><strong>Confirmée le:</strong> {formatDate(selectedOrder.dateConfirmation)}</div>
                    )}
                  </div>
                </div>

                {/* Montants */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800">Montants</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Montant HT:</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.montantHT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA (20%):</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.montantTVA)}</span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total TTC:</span>
                      <span className="text-blue-600">{formatCurrency(selectedOrder.montantTTC)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Articles */}
              <div className="mt-6">
                <h4 className="font-semibold text-slate-800 mb-4">Articles commandés</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Article</th>
                        <th className="px-4 py-2 text-left">Désignation</th>
                        <th className="px-4 py-2 text-right">Quantité</th>
                        <th className="px-4 py-2 text-right">Prix unitaire</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedOrder.articles.map((article, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 font-medium">{article.numeroArticle}</td>
                          <td className="px-4 py-2">{article.designation}</td>
                          <td className="px-4 py-2 text-right">{article.quantite} {article.unite}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(article.prixUnitaire)}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatCurrency(article.quantite * article.prixUnitaire)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mt-6">
                  <h4 className="font-semibold text-slate-800 mb-2">Notes</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;