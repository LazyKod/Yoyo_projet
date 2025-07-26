import React, { useState } from 'react';
import { 
  Save, 
  X, 
  LogOut, 
  User,
  Package,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface AddOrderProps {
  onPageChange: (page: string) => void;
}

interface OrderFormData {
  clientFinal: string;
  designation: string;
  numeroArticle: string;
  quantiteCommandee: number;
  dateLivraison: string;
  commandeConfirmee: boolean;
  technologie: string;
  familleProduit: string;
  typCommande: string;
  unite: string;
}

const AddOrder: React.FC<AddOrderProps> = ({ onPageChange }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('add-order');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<OrderFormData>({
    clientFinal: '',
    designation: '',
    numeroArticle: '',
    quantiteCommandee: 1,
    dateLivraison: '',
    commandeConfirmee: false,
    technologie: '',
    familleProduit: 'APS BulkNiv2',
    typCommande: 'ZIG',
    unite: 'PCE'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onPageChange(tab);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.clientFinal.trim()) {
      newErrors.clientFinal = 'Le nom du client est requis';
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'La désignation de l\'article est requise';
    }

    if (!formData.numeroArticle.trim()) {
      newErrors.numeroArticle = 'Le numéro d\'article est requis';
    }

    if (formData.quantiteCommandee <= 0) {
      newErrors.quantiteCommandee = 'La quantité doit être supérieure à 0';
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

    if (!formData.technologie.trim()) {
      newErrors.technologie = 'La technologie est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateOrderId = (): string => {
    // Générer un ID unique basé sur timestamp et nombre aléatoire
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `47${timestamp.toString().slice(-8)}${random.toString().padStart(3, '0')}`;
  };

  const generatePoste = (): string => {
    // Générer un numéro de poste aléatoire entre 100 et 999
    return Math.floor(Math.random() * 900 + 100).toString();
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
      // Préparer les données de la commande
      const orderData = {
        id: generateOrderId(),
        poste: generatePoste(),
        numeroArticle: formData.numeroArticle,
        designation: formData.designation,
        technologie: formData.technologie,
        familleProduit: formData.familleProduit,
        quantiteCommandee: formData.quantiteCommandee,
        quantiteExpediee: 0,
        quantiteALivrer: formData.quantiteCommandee,
        quantiteEnPreparation: 0,
        clientFinal: formData.clientFinal,
        dateCreation: new Date().toISOString().split('T')[0],
        dateConfirmation: formData.commandeConfirmee ? new Date().toISOString().split('T')[0] : undefined,
        typCommande: formData.typCommande,
        dateLivraison: formData.dateLivraison,
        unite: formData.unite
      };

      const response = await axios.post('/api/orders', orderData);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Commande créée avec succès !' });
        
        // Reset du formulaire après succès
        setFormData({
          clientFinal: '',
          designation: '',
          numeroArticle: '',
          quantiteCommandee: 1,
          dateLivraison: '',
          commandeConfirmee: false,
          technologie: '',
          familleProduit: 'APS BulkNiv2',
          typCommande: 'ZIG',
          unite: 'PCE'
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
      <main className="max-w-4xl mx-auto px-6 py-8">
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
              <p className="text-slate-600">Créez une nouvelle commande dans le système</p>
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom du client */}
              <div className="space-y-2">
                <label htmlFor="clientFinal" className="block text-sm font-medium text-slate-700">
                  <User className="w-4 h-4 inline mr-1" />
                  Nom du client *
                </label>
                <input
                  type="text"
                  id="clientFinal"
                  name="clientFinal"
                  value={formData.clientFinal}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.clientFinal 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
                  }`}
                  placeholder="Ex: ARMOR PRINT SOLUTIONS S.A.S."
                />
                {errors.clientFinal && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.clientFinal}
                  </p>
                )}
              </div>

              {/* Numéro d'article */}
              <div className="space-y-2">
                <label htmlFor="numeroArticle" className="block text-sm font-medium text-slate-700">
                  <Package className="w-4 h-4 inline mr-1" />
                  Numéro d'article *
                </label>
                <input
                  type="text"
                  id="numeroArticle"
                  name="numeroArticle"
                  value={formData.numeroArticle}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.numeroArticle 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
                  }`}
                  placeholder="Ex: 5HBK15535BC000"
                />
                {errors.numeroArticle && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.numeroArticle}
                  </p>
                )}
              </div>

              {/* Désignation de l'article */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="designation" className="block text-sm font-medium text-slate-700">
                  Désignation de l'article *
                </label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.designation 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
                  }`}
                  placeholder="Ex: RE-HP-CE390-BK /AB-3H"
                />
                {errors.designation && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.designation}
                  </p>
                )}
              </div>

              {/* Quantité */}
              <div className="space-y-2">
                <label htmlFor="quantiteCommandee" className="block text-sm font-medium text-slate-700">
                  Quantité *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    id="quantiteCommandee"
                    name="quantiteCommandee"
                    min="1"
                    value={formData.quantiteCommandee}
                    onChange={handleInputChange}
                    className={`flex-1 px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.quantiteCommandee 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
                    }`}
                    placeholder="1"
                  />
                  <select
                    name="unite"
                    value={formData.unite}
                    onChange={handleInputChange}
                    className="px-3 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="PCE">PCE</option>
                    <option value="KG">KG</option>
                    <option value="L">L</option>
                    <option value="M">M</option>
                  </select>
                </div>
                {errors.quantiteCommandee && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.quantiteCommandee}
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

              {/* Technologie */}
              <div className="space-y-2">
                <label htmlFor="technologie" className="block text-sm font-medium text-slate-700">
                  Technologie *
                </label>
                <input
                  type="text"
                  id="technologie"
                  name="technologie"
                  value={formData.technologie}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.technologie 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
                  }`}
                  placeholder="Ex: TON111"
                />
                {errors.technologie && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.technologie}
                  </p>
                )}
              </div>

              {/* Famille de produit */}
              <div className="space-y-2">
                <label htmlFor="familleProduit" className="block text-sm font-medium text-slate-700">
                  Famille de produit
                </label>
                <select
                  id="familleProduit"
                  name="familleProduit"
                  value={formData.familleProduit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300"
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

              {/* Type de commande */}
              <div className="space-y-2">
                <label htmlFor="typCommande" className="block text-sm font-medium text-slate-700">
                  Type de commande
                </label>
                <select
                  id="typCommande"
                  name="typCommande"
                  value={formData.typCommande}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300"
                >
                  <option value="ZIG">ZIG (Quantité à produire)</option>
                  <option value="STD">STD (Produit fini)</option>
                </select>
              </div>

              {/* Commande confirmée */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="commandeConfirmee"
                    name="commandeConfirmee"
                    checked={formData.commandeConfirmee}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="commandeConfirmee" className="text-sm font-medium text-slate-700 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    Commande confirmée immédiatement
                  </label>
                </div>
                <p className="text-xs text-slate-500 ml-8">
                  Si cochée, la commande sera automatiquement confirmée avec la date d'aujourd'hui
                </p>
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
                disabled={loading}
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
      </main>
    </div>
  );
};

export default AddOrder;