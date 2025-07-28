import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  Search,
  Edit,
  Trash2,
  Check,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Package,
  Euro,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Order {
  _id: string;
  clientLivreId: number;
  clientLivreFinal: string;
  articles: Array<{
    technologie: string;
    familleProduit: string;
    quantiteCommandee: number;
    quantiteExpediee: number;
    quantiteALivrer: number;
    unite: string;
  }>;
  dateCreation: string;
  dateLivraison: string;
  typeCommande: string;
  statut: string;
  createdAt: string;
  updatedAt: string;
}

interface CurrentOrdersProps {
  onPageChange: (page: string) => void;
}

const CurrentOrders: React.FC<CurrentOrdersProps> = ({ onPageChange }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('current-orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Charger les commandes
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/api/orders');
        if (response.data.success) {
          setOrders(response.data.data);
          setFilteredOrders(response.data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        setMessage({ type: 'error', text: 'Erreur lors du chargement des commandes' });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filtrer les commandes selon le terme de recherche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientLivreFinal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientLivreId.toString().includes(searchTerm) ||
        order.articles.some(article => 
          article.technologie.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.familleProduit.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onPageChange(tab);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return 'bg-orange-100 text-orange-800';
      case 'confirmee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return 'En attente';
      case 'confirmee':
        return 'Confirmée';
      default:
        return statut;
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setMessage(null);
  };

  const handleConfirmOrder = async (orderId: string) => {
    if (!window.confirm('Confirmer cette commande avec tous ses articles ?')) {
      return;
    }

    try {
      setConfirmingOrder(orderId);
      
      const response = await axios.put(`/api/orders/${orderId}/confirm`);

      if (response.data.success) {
        // Recharger les commandes
        const ordersResponse = await axios.get('/api/orders');
        if (ordersResponse.data.success) {
          setOrders(ordersResponse.data.data);
          setFilteredOrders(ordersResponse.data.data);
          
          // Mettre à jour la commande sélectionnée
          const updatedOrder = ordersResponse.data.data.find((order: Order) => order._id === orderId);
          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
          }
        }
        
        setMessage({ type: 'success', text: 'Commande confirmée avec succès !' });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la confirmation de la commande' });
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la confirmation de la commande' });
    } finally {
      setConfirmingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.')) {
      return;
    }

    try {
      setDeletingOrder(orderId);
      
      const response = await axios.delete(`/api/orders/${orderId}`);

      if (response.data.success) {
        // Recharger les commandes
        const ordersResponse = await axios.get('/api/orders');
        if (ordersResponse.data.success) {
          setOrders(ordersResponse.data.data);
          setFilteredOrders(ordersResponse.data.data);
        }
        
        // Désélectionner si c'était la commande sélectionnée
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(null);
        }
        
        setMessage({ type: 'success', text: 'Commande supprimée avec succès !' });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la suppression de la commande' });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression de la commande' });
    } finally {
      setDeletingOrder(null);
    }
  };

  const handleModifyOrder = (orderId: string) => {
    // TODO: Implémenter la modification
    setMessage({ type: 'error', text: 'Fonctionnalité de modification à implémenter' });
  };

  const handleGenerateOrderForm = (orderId: string) => {
    // TODO: Implémenter la génération de bon de commande
    setMessage({ type: 'error', text: 'Génération de bon de commande à implémenter' });
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
                  onClick={() => handleTabChange('current-orders')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'current-orders'
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Commandes actuelles
                </button>
                <button
                  onClick={() => handleTabChange('add-order')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'add-order'
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Ajouter une commande
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
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Commandes actuelles</h1>
            <p className="text-slate-600">
              Gérez toutes vos commandes en cours et confirmées
            </p>
          </div>
        </div>

        {/* Message de succès/erreur */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.type === 'error' ? (
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des commandes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-800">
                    Liste des commandes ({filteredOrders.length})
                  </h2>
                </div>
                
                {/* Barre de recherche */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300"
                    placeholder="Rechercher par ID, client, article ou technologie..."
                  />
                </div>
              </div>

              {/* Tableau des commandes */}
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Articles</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Livraison</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr 
                          key={order._id}
                          onClick={() => handleSelectOrder(order)}
                          className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                            selectedOrder?._id === order._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-900">
                              {order._id.slice(-8)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDate(order.dateCreation)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-900">
                              {order.clientLivreFinal}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {order.clientLivreId}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-slate-900">
                              {order.articles.length} article{order.articles.length > 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.articles.reduce((total, article) => total + article.quantiteCommandee, 0)} unités
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-slate-900">
                              {formatDate(order.dateLivraison)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.typeCommande}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.statut)}`}>
                              {getStatusLabel(order.statut)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p className="text-slate-500 text-lg">Aucune commande trouvée</p>
                          {searchTerm && <p className="text-slate-400 text-sm">Essayez un autre terme de recherche</p>}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Panneau de détails et actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-8">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  {selectedOrder ? 'Détails de la commande' : 'Sélectionnez une commande'}
                </h3>
              </div>

              <div className="p-6">
                {selectedOrder ? (
                  <div className="space-y-6">
                    {/* Informations générales */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">ID Commande</label>
                        <p className="text-sm text-slate-900">{selectedOrder._id.slice(-8)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Client</label>
                        <p className="text-sm text-slate-900">{selectedOrder.clientLivreFinal}</p>
                        <p className="text-xs text-slate-500">ID: {selectedOrder.clientLivreId}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Date de livraison</label>
                        <p className="text-sm text-slate-900">{formatDate(selectedOrder.dateLivraison)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Type</label>
                        <p className="text-sm text-slate-900">{selectedOrder.typeCommande}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Statut</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.statut)}`}>
                          {getStatusLabel(selectedOrder.statut)}
                        </span>
                      </div>
                    </div>

                    {/* Articles */}
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Articles commandés</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedOrder.articles.map((article, index) => (
                          <div key={index} className="p-3 bg-slate-50 rounded-lg">
                            <div className="text-sm font-medium text-slate-900">{article.technologie}</div>
                            <div className="text-xs text-slate-600">{article.familleProduit}</div>
                            <div className="text-xs text-slate-500">
                              Qté: {article.quantiteCommandee} {article.unite}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleModifyOrder(selectedOrder._id)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </button>

                      {selectedOrder.statut === 'brouillon' && (
                        <button
                          onClick={() => handleConfirmOrder(selectedOrder._id)}
                          disabled={confirmingOrder === selectedOrder._id}
                          className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {confirmingOrder === selectedOrder._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Confirmer
                        </button>
                      )}

                      <button
                        onClick={() => handleGenerateOrderForm(selectedOrder._id)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Bon de commande
                      </button>

                      <button
                        onClick={() => handleDeleteOrder(selectedOrder._id)}
                        disabled={deletingOrder === selectedOrder._id}
                        className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {deletingOrder === selectedOrder._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg">Sélectionnez une commande</p>
                    <p className="text-sm">Cliquez sur une ligne du tableau pour voir les détails</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CurrentOrders;