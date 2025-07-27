import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  LogOut, 
  User,
  Package,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Plus,
  Trash2,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface AddOrderProps {
  onPageChange: (page: string) => void;
}

interface Client {
  _id: string;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: {
    rue?: string;
    ville?: string;
    codePostal?: string;
    pays?: string;
  };
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
}

interface ArticleCommande {
  articleId: string;
  numeroArticle: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  unite: string;
  stockDisponible: number;
}

interface OrderFormData {
  clientId: string;
  articles: ArticleCommande[];
  dateLivraison: string;
  typeCommande: string;
  notes: string;
}

const AddOrder: React.FC<AddOrderProps> = ({ onPageChange }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('add-order');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [articleSearch, setArticleSearch] = useState('');
  
  const [formData, setFormData] = useState<OrderFormData>({
    clientId: '',
    articles: [],
    dateLivraison: '',
    typeCommande: 'ZIG',
    notes: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Charger les clients et articles
  useEffect(() => {
    const fetchData = async () => {
      try {
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
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onPageChange(tab);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddArticle = (article: Article) => {
    // Vérifier si l'article n'est pas déjà ajouté
    const existingArticle = formData.articles.find(a => a.articleId === article._id);
    if (existingArticle) {
      setMessage({ type: 'error', text: 'Cet article est déjà dans la commande' });
      return;
    }

    const newArticle: ArticleCommande = {
      articleId: article._id,
      numeroArticle: article.numeroArticle,
      designation: article.designation,
      quantite: 1,
      prixUnitaire: article.prixUnitaire,
      unite: article.unite,
      stockDisponible: article.stockDisponible
    };

    setFormData(prev => ({
      ...prev,
      articles: [...prev.articles, newArticle]
    }));

    setShowArticleModal(false);
    setArticleSearch('');
    setMessage(null);
  };

  const handleRemoveArticle = (articleId: string) => {
    setFormData(prev => ({
      ...prev,
      articles: prev.articles.filter(a => a.articleId !== articleId)
    }));
  };

  const handleQuantityChange = (articleId: string, quantite: number) => {
    setFormData(prev => ({
      ...prev,
      articles: prev.articles.map(article => 
        article.articleId === articleId 
          ? { ...article, quantite: Math.max(1, quantite) }
          : article
      )
    }));
  };

  const calculateTotals = () => {
    const montantHT = formData.articles.reduce((total, article) => {
      return total + (article.quantite * article.prixUnitaire);
    }, 0);
    
    const montantTVA = montantHT * 0.20;
    const montantTTC = montantHT + montantTVA;

    return { montantHT, montantTVA, montantTTC };
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Veuillez sélectionner un client';
    }

    if (formData.articles.length === 0) {
      newErrors.articles = 'Veuillez ajouter au moins un article';
    }

    // Vérifier les stocks
    for (const article of formData.articles) {
      if (article.quantite > article.stockDisponible) {
        newErrors.articles = `Stock insuffisant pour ${article.numeroArticle}`;
        break;
      }
    }

    if (!formData.dateLivraison) {
      newErrors.dateLivraison = 'La date de livraison est requise';
    } else {
      const today = new Date();
      const deliveryDate = new Date(formData.dateLivraison);
      if (deliveryDate < today) {
        newErrors.dateLivraison = 'La date de livraison ne peut pas être dans le passé';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Veuillez corriger les erreurs dans le formulaire' });
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        clientId: formData.clientId,
        articles: formData.articles.map(article => ({
          articleId: article.articleId,
          quantite: article.quantite
        })),
        dateLivraison: formData.dateLivraison,
        typeCommande: formData.typeCommande,
        notes: formData.notes
      };

      const response = await axios.post('/api/orders', orderData);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Commande créée avec succès !' });
        
        // Reset du formulaire après succès
        setFormData({
          clientId: '',
          articles: [],
          dateLivraison: '',
          typeCommande: 'ZIG',
          notes: ''
        });

        // Redirection vers la gestion des commandes après 2 secondes
        setTimeout(() => {
          onPageChange('orders');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Erreur lors de la création de la commande' });
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la commande:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erreur lors de la création de la commande' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onPageChange('orders');
  };

  const filteredArticles = articles.filter(article =>
    article.numeroArticle.toLowerCase().includes(articleSearch.toLowerCase()) ||
    article.designation.toLowerCase().includes(articleSearch.toLowerCase()) ||
    article.technologie.toLowerCase().includes(articleSearch.toLowerCase())
  );

  const { montantHT, montantTVA, montantTTC } = calculateTotals();

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
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* En-tête de la page */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="flex items-center px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Ajouter une commande</h1>
              <p className="text-slate-600">Créez une nouvelle commande multi-articles</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                  <Package className="w-6 h-6 mr-2 text-blue-600" />
                  Informations de la commande
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
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
                  </div>
                )}

                <div className="space-y-6">
                  {/* Sélection du client */}
                  <div className="space-y-2">
                    <label htmlFor="clientId" className="block text-sm font-medium text-slate-700">
                      <User className="w-4 h-4 inline mr-1" />
                      Client *
                    </label>
                    <select
                      id="clientId"
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        errors.clientId 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
                      }`}
                    >
                      <option value="">Sélectionnez un client</option>
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>
                          {client.nom} - {client.email}
                        </option>
                      ))}
                    </select>
                    {errors.clientId && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.clientId}
                      </p>
                    )}
                  </div>

                  {/* Articles */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-700">
                        <Package className="w-4 h-4 inline mr-1" />
                        Articles *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowArticleModal(true)}
                        className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter un article
                      </button>
                    </div>

                    {/* Liste des articles ajoutés */}
                    <div className="space-y-3">
                      {formData.articles.map((article, index) => (
                        <div key={article.articleId} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">{article.numeroArticle}</div>
                            <div className="text-sm text-slate-600">{article.designation}</div>
                            <div className="text-xs text-slate-500">
                              Prix unitaire: {article.prixUnitaire.toFixed(2)}€ | 
                              Stock disponible: {article.stockDisponible} {article.unite}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="1"
                              max={article.stockDisponible}
                              value={article.quantite}
                              onChange={(e) => handleQuantityChange(article.articleId, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border border-slate-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-500">{article.unite}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-slate-800">
                              {(article.quantite * article.prixUnitaire).toFixed(2)}€
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveArticle(article.articleId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {formData.articles.length === 0 && (
                        <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                          <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                          <p>Aucun article ajouté</p>
                          <p className="text-sm">Cliquez sur "Ajouter un article" pour commencer</p>
                        </div>
                      )}
                    </div>

                    {errors.articles && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.articles}
                      </p>
                    )}
                  </div>

                  {/* Date de livraison */}
                  <div className="space-y-2">
                    <label htmlFor="dateLivraison" className="block text-sm font-medium text-slate-700">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date de livraison souhaitée *
                    </label>
                    <input
                      type="date"
                      id="dateLivraison"
                      name="dateLivraison"
                      value={formData.dateLivraison}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        errors.dateLivraison 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
                      }`}
                    />
                    {errors.dateLivraison && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.dateLivraison}
                      </p>
                    )}
                  </div>

                  {/* Type de commande */}
                  <div className="space-y-2">
                    <label htmlFor="typeCommande" className="block text-sm font-medium text-slate-700">
                      Type de commande
                    </label>
                    <select
                      id="typeCommande"
                      name="typeCommande"
                      value={formData.typeCommande}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300"
                    >
                      <option value="ZIG">ZIG (Quantité à produire)</option>
                      <option value="STD">STD (Produit fini)</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
                      Notes (optionnel)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300"
                      placeholder="Informations complémentaires..."
                    />
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || formData.articles.length === 0}
                    className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    {loading ? 'Création en cours...' : 'Créer la commande'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-8">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Récapitulatif</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Articles:</span>
                    <span className="font-medium">{formData.articles.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Quantité totale:</span>
                    <span className="font-medium">
                      {formData.articles.reduce((total, article) => total + article.quantite, 0)}
                    </span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Montant HT:</span>
                    <span className="font-medium">{montantHT.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">TVA (20%):</span>
                    <span className="font-medium">{montantTVA.toFixed(2)}€</span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-slate-800">Total TTC:</span>
                    <span className="text-blue-600">{montantTTC.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de sélection d'articles */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Sélectionner un article</h3>
              <button
                onClick={() => setShowArticleModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Barre de recherche */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Rechercher par numéro, désignation ou technologie..."
                  />
                </div>
              </div>

              {/* Liste des articles */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredArticles.map(article => (
                  <div
                    key={article._id}
                    onClick={() => handleAddArticle(article)}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{article.numeroArticle}</div>
                        <div className="text-sm text-slate-600">{article.designation}</div>
                        <div className="text-xs text-slate-500">
                          {article.technologie} | {article.familleProduit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-800">{article.prixUnitaire.toFixed(2)}€</div>
                        <div className="text-sm text-slate-600">
                          Stock: {article.stockDisponible} {article.unite}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredArticles.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>Aucun article trouvé</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOrder;