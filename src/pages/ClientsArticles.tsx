import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  Users, 
  Package, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Building,
  Mail,
  Phone,
  MapPin,
  Euro,
  Hash,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Client {
  _id: string;
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  fax: string;
  adresse1: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };
  adresse2: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };
  memeAdresseLivraison: boolean;
  numeroClient: string;
  actif: boolean;
}

interface Article {
  _id: string;
  numeroArticle: string;
  designation: string;
  technologie: string;
  familleProduit: string;
  prixUnitaire: number;
  unite: string;
  stock: number;
  stockReserve: number;
  stockDisponible: number;
  actif: boolean;
}

interface ClientsArticlesProps {
  onPageChange: (page: string) => void;
}

const ClientsArticles: React.FC<ClientsArticlesProps> = ({ onPageChange }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('clients-articles');
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'articles'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Client | Article | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // États pour les formulaires
  const [clientForm, setClientForm] = useState({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    fax: '',
    adresse1: { rue: '', ville: '', codePostal: '', pays: 'France' },
    adresse2: { rue: '', ville: '', codePostal: '', pays: 'France' },
    memeAdresseLivraison: true
  });

  const [articleForm, setArticleForm] = useState({
    numeroArticle: '',
    designation: '',
    technologie: '',
    familleProduit: 'APS BulkNiv2',
    prixUnitaire: 0,
    unite: 'PCE',
    stock: 0,
    stockReserve: 0
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientsResponse, articlesResponse] = await Promise.all([
          axios.get('/api/clients'),
          axios.get('/api/articles')
        ]);

        if (clientsResponse.data.success) {
          setClients(clientsResponse.data.data);
        }

        if (articlesResponse.data.success) {
          setArticles(articlesResponse.data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onPageChange(tab);
  };

  const resetForms = () => {
    setClientForm({
      nom: '',
      entreprise: '',
      email: '',
      telephone: '',
      fax: '',
      adresse1: { rue: '', ville: '', codePostal: '', pays: 'France' },
      adresse2: { rue: '', ville: '', codePostal: '', pays: 'France' },
      memeAdresseLivraison: true
    });

    setArticleForm({
      numeroArticle: '',
      designation: '',
      technologie: '',
      familleProduit: 'APS BulkNiv2',
      prixUnitaire: 0,
      unite: 'PCE',
      stock: 0,
      stockReserve: 0
    });

    setErrors({});
    setEditingItem(null);
  };

  const handleAddNew = () => {
    resetForms();
    setShowAddModal(true);
  };

  const handleEdit = (item: Client | Article) => {
    setEditingItem(item);
    
    if ('email' in item) {
      // C'est un client
      setClientForm({
        nom: item.nom,
        entreprise: item.entreprise,
        email: item.email,
        telephone: item.telephone,
        fax: item.fax,
        adresse1: item.adresse1 || { rue: '', ville: '', codePostal: '', pays: 'France' },
        adresse2: item.adresse2 || { rue: '', ville: '', codePostal: '', pays: 'France' },
        memeAdresseLivraison: item.memeAdresseLivraison
      });
    } else {
      // C'est un article
      setArticleForm({
        numeroArticle: item.numeroArticle,
        designation: item.designation,
        technologie: item.technologie,
        familleProduit: item.familleProduit,
        prixUnitaire: item.prixUnitaire,
        unite: item.unite,
        stock: item.stock,
        stockReserve: item.stockReserve
      });
    }
    
    setShowAddModal(true);
  };

  const validateClientForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!clientForm.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!clientForm.email.trim()) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(clientForm.email)) newErrors.email = 'Format d\'email invalide';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateArticleForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!articleForm.numeroArticle.trim()) newErrors.numeroArticle = 'Le numéro d\'article est requis';
    if (!articleForm.designation.trim()) newErrors.designation = 'La désignation est requise';
    if (!articleForm.technologie.trim()) newErrors.technologie = 'La technologie est requise';
    if (articleForm.prixUnitaire <= 0) newErrors.prixUnitaire = 'Le prix unitaire doit être supérieur à 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const isClient = activeSubTab === 'clients';
    const isValid = isClient ? validateClientForm() : validateArticleForm();

    if (!isValid) return;

    try {
      setLoading(true);
      
      const data = isClient ? clientForm : articleForm;
      const endpoint = isClient ? '/api/clients' : '/api/articles';
      
      let response;
      if (editingItem) {
        response = await axios.put(`${endpoint}/${editingItem._id}`, data);
      } else {
        response = await axios.post(endpoint, data);
      }

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `${isClient ? 'Client' : 'Article'} ${editingItem ? 'modifié' : 'créé'} avec succès !` 
        });

        // Recharger les données
        const refreshResponse = await axios.get(endpoint);
        if (refreshResponse.data.success) {
          if (isClient) {
            setClients(refreshResponse.data.data);
          } else {
            setArticles(refreshResponse.data.data);
          }
        }

        setShowAddModal(false);
        resetForms();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || `Erreur lors de ${editingItem ? 'la modification' : 'la création'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Client | Article) => {
    const isClient = 'email' in item;
    const itemName = isClient ? (item as Client).nom : (item as Article).numeroArticle;
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${isClient ? 'le client' : 'l\'article'} "${itemName}" ?`)) {
      return;
    }

    try {
      const endpoint = isClient ? '/api/clients' : '/api/articles';
      const response = await axios.delete(`${endpoint}/${item._id}`);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `${isClient ? 'Client' : 'Article'} supprimé avec succès !` 
        });

        // Recharger les données
        const refreshResponse = await axios.get(endpoint);
        if (refreshResponse.data.success) {
          if (isClient) {
            setClients(refreshResponse.data.data);
          } else {
            setArticles(refreshResponse.data.data);
          }
        }
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erreur lors de la suppression' 
      });
    }
  };

  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.entreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.numeroClient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArticles = articles.filter(article =>
    article.numeroArticle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.technologie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && clients.length === 0 && articles.length === 0) {
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
                <button
                  onClick={() => handleTabChange('clients-articles')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'clients-articles'
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Clients/Articles
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
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Clients & Articles</h1>
            <p className="text-slate-600">Gérez vos clients et articles</p>
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

        {/* Onglets Clients/Articles */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveSubTab('clients')}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                activeSubTab === 'clients'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Clients ({clients.length})
            </button>
            <button
              onClick={() => setActiveSubTab('articles')}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                activeSubTab === 'articles'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Package className="w-5 h-5 mr-2" />
              Articles ({articles.length})
            </button>
          </div>

          <div className="p-6">
            {/* Barre d'actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300"
                  placeholder={`Rechercher ${activeSubTab === 'clients' ? 'un client' : 'un article'}...`}
                />
              </div>
              <button
                onClick={handleAddNew}
                className="flex items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors ml-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter {activeSubTab === 'clients' ? 'un client' : 'un article'}
              </button>
            </div>

            {/* Liste des clients */}
            {activeSubTab === 'clients' && (
              <div className="space-y-4">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <div key={client._id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">{client.nom}</h3>
                            {client.entreprise && (
                              <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                {client.entreprise}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {client.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {client.telephone || 'Non renseigné'}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Adresse 1: {client.adresse1.ville || 'Non renseignée'}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Adresse 2: {client.memeAdresseLivraison ? 'Identique à l\'adresse 1' : (client.adresse2.ville || 'Non renseignée')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg">Aucun client trouvé</p>
                    {searchTerm && <p className="text-sm">Essayez un autre terme de recherche</p>}
                  </div>
                )}
              </div>
            )}

            {/* Liste des articles */}
            {activeSubTab === 'articles' && (
              <div className="space-y-4">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <div key={article._id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">{article.numeroArticle}</h3>
                            <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              {article.technologie}
                            </span>
                          </div>
                          <p className="text-slate-700 mb-2">{article.designation}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                            <div className="flex items-center">
                              <Euro className="w-4 h-4 mr-2" />
                              {article.prixUnitaire.toFixed(2)}€ / {article.unite}
                            </div>
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              Stock: {article.stockDisponible} / {article.stock}
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              {article.familleProduit}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(article)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(article)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg">Aucun article trouvé</p>
                    {searchTerm && <p className="text-sm">Essayez un autre terme de recherche</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal d'ajout/modification */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingItem ? 'Modifier' : 'Ajouter'} {activeSubTab === 'clients' ? 'un client' : 'un article'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {activeSubTab === 'clients' ? (
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={clientForm.nom}
                        onChange={(e) => setClientForm(prev => ({ ...prev, nom: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.nom ? 'border-red-300' : 'border-slate-300'
                        }`}
                      />
                      {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Entreprise
                      </label>
                      <input
                        type="text"
                        value={clientForm.entreprise}
                        onChange={(e) => setClientForm(prev => ({ ...prev, entreprise: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={clientForm.email}
                        onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.email ? 'border-red-300' : 'border-slate-300'
                        }`}
                      />
                      {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={clientForm.telephone}
                        onChange={(e) => setClientForm(prev => ({ ...prev, telephone: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Adresse 1 (Principale) */}
                  <div>
                    <h4 className="text-md font-semibold text-slate-800 mb-3">Adresse 1 (Principale)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Rue</label>
                        <input
                          type="text"
                          value={clientForm.adresse1.rue}
                          onChange={(e) => setClientForm(prev => ({ 
                            ...prev, 
                            adresse1: { ...prev.adresse1, rue: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ville</label>
                        <input
                          type="text"
                          value={clientForm.adresse1.ville}
                          onChange={(e) => setClientForm(prev => ({ 
                            ...prev, 
                            adresse1: { ...prev.adresse1, ville: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Code postal</label>
                        <input
                          type="text"
                          value={clientForm.adresse1.codePostal}
                          onChange={(e) => setClientForm(prev => ({ 
                            ...prev, 
                            adresse1: { ...prev.adresse1, codePostal: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Option même adresse */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="memeAdresse"
                      checked={clientForm.memeAdresseLivraison}
                      onChange={(e) => setClientForm(prev => ({ 
                        ...prev, 
                        memeAdresseLivraison: e.target.checked,
                        adresse2: e.target.checked ? prev.adresse1 : { rue: '', ville: '', codePostal: '', pays: 'France' }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    />
                    <label htmlFor="memeAdresse" className="ml-2 text-sm text-slate-700">
                      Utiliser la même adresse pour la livraison
                    </label>
                  </div>

                  {/* Adresse 2 (Livraison) */}
                  {!clientForm.memeAdresseLivraison && (
                    <div>
                      <h4 className="text-md font-semibold text-slate-800 mb-3">Adresse 2 (Livraison)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Rue</label>
                          <input
                            type="text"
                            value={clientForm.adresse2.rue}
                            onChange={(e) => setClientForm(prev => ({ 
                              ...prev, 
                              adresse2: { ...prev.adresse2, rue: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Ville</label>
                          <input
                            type="text"
                            value={clientForm.adresse2.ville}
                            onChange={(e) => setClientForm(prev => ({ 
                              ...prev, 
                              adresse2: { ...prev.adresse2, ville: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Code postal</label>
                          <input
                            type="text"
                            value={clientForm.adresse2.codePostal}
                            onChange={(e) => setClientForm(prev => ({ 
                              ...prev, 
                              adresse2: { ...prev.adresse2, codePostal: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Numéro d'article *
                      </label>
                      <input
                        type="text"
                        value={articleForm.numeroArticle}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, numeroArticle: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.numeroArticle ? 'border-red-300' : 'border-slate-300'
                        }`}
                      />
                      {errors.numeroArticle && <p className="text-red-600 text-sm mt-1">{errors.numeroArticle}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Technologie *
                      </label>
                      <input
                        type="text"
                        value={articleForm.technologie}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, technologie: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.technologie ? 'border-red-300' : 'border-slate-300'
                        }`}
                      />
                      {errors.technologie && <p className="text-red-600 text-sm mt-1">{errors.technologie}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Désignation *
                    </label>
                    <input
                      type="text"
                      value={articleForm.designation}
                      onChange={(e) => setArticleForm(prev => ({ ...prev, designation: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        errors.designation ? 'border-red-300' : 'border-slate-300'
                      }`}
                    />
                    {errors.designation && <p className="text-red-600 text-sm mt-1">{errors.designation}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Famille de produit
                      </label>
                      <select
                        value={articleForm.familleProduit}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, familleProduit: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="APS BulkNiv2">APS BulkNiv2</option>
                        <option value="APS Finished Product">APS Finished Product</option>
                        <option value="APS Laser Box">APS Laser Box</option>
                        <option value="APS Packaging Label">APS Packaging Label</option>
                        <option value="APS Copier Box">APS Copier Box</option>
                        <option value="APS Cartridge Label">APS Cartridge Label</option>
                        <option value="APS Airbag/Insert/Inlay">APS Airbag/Insert/Inlay</option>
                        <option value="APS Packaging Other">APS Packaging Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Unité
                      </label>
                      <select
                        value={articleForm.unite}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, unite: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="PCE">PCE</option>
                        <option value="KG">KG</option>
                        <option value="L">L</option>
                        <option value="M">M</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prix unitaire (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={articleForm.prixUnitaire}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, prixUnitaire: parseFloat(e.target.value) || 0 }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.prixUnitaire ? 'border-red-300' : 'border-slate-300'
                        }`}
                      />
                      {errors.prixUnitaire && <p className="text-red-600 text-sm mt-1">{errors.prixUnitaire}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={articleForm.stock}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Stock réservé
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={articleForm.stockReserve}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, stockReserve: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingItem ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsArticles;