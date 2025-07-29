import React from 'react';

interface Order {
  _id: string;
  clientLivreId: number;
  clientLivreFinal: string;
  articles: Array<{
    technologie: string;
    familleProduit: string;
    quantiteCommandee: number;
    unite: string;
  }>;
  dateCreation: string;
  dateLivraison: string;
  typeCommande: string;
  client?: {
    nom: string;
    entreprise: string;
    email: string;
    telephone: string;
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
  };
}

interface OrderFormGeneratorProps {
  order: Order;
  onClose: () => void;
}

const OrderFormGenerator: React.FC<OrderFormGeneratorProps> = ({ order, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Debug détaillé pour identifier le problème
  console.log('🎯 OrderFormGenerator - DEBUT DEBUG');
  console.log('📋 Order complet:', JSON.stringify(order, null, 2));
  console.log('👤 Client existe?', !!order.client);
  
  if (order.client) {
    console.log('👤 Client data:', JSON.stringify(order.client, null, 2));
    console.log('🏠 Adresse1 existe?', !!order.client.adresse1);
    console.log('🏠 Adresse1 rue:', order.client.adresse1?.rue);
    console.log('🏠 Adresse1 ville:', order.client.adresse1?.ville);
    console.log('🚚 Adresse2 existe?', !!order.client.adresse2);
    console.log('🚚 Adresse2 rue:', order.client.adresse2?.rue);
    console.log('📍 Même adresse?', order.client.memeAdresseLivraison);
  } else {
    console.log('❌ PAS DE CLIENT DANS ORDER');
  }
  console.log('🎯 OrderFormGenerator - FIN DEBUG');
  
  const calculateTotals = () => {
    // Prix estimé par article (à remplacer par les vrais prix depuis la base Articles)
    const prixEstime = 50;
    const sousTotal = order.articles.reduce((total, article) => {
      return total + (article.quantiteCommandee * prixEstime);
    }, 0);
    
    const taxe = sousTotal * 0.20;
    const transport = 15.00;
    const total = sousTotal + taxe + transport;

    return { sousTotal, taxe, transport, total };
  };

  const { sousTotal, taxe, transport, total } = calculateTotals();

  const handlePrint = () => {
    // Masquer tous les éléments sauf le bon de commande
    const elementsToHide = document.querySelectorAll('body > *:not(.order-form-print)');
    const originalDisplay: string[] = [];
    
    // Sauvegarder les styles originaux et masquer les éléments
    elementsToHide.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      originalDisplay[index] = htmlElement.style.display;
      htmlElement.style.display = 'none';
    });
    
    // Créer un conteneur temporaire pour l'impression
    const printContainer = document.createElement('div');
    printContainer.className = 'order-form-print';
    printContainer.innerHTML = document.querySelector('.order-form-content')?.innerHTML || '';
    document.body.appendChild(printContainer);
    
    // Lancer l'impression
    window.print();
    
    // Restaurer l'affichage original après impression
    setTimeout(() => {
      elementsToHide.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.display = originalDisplay[index];
      });
      document.body.removeChild(printContainer);
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header avec boutons */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between no-print">
          <h3 className="text-lg font-semibold text-slate-800">Bon de commande</h3>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Imprimer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Contenu du bon de commande */}
        <div className="order-form-content p-8 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* En-tête avec logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <svg 
                className="h-16 w-auto text-slate-700 mr-4" 
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
            <h1 className="text-3xl font-bold text-slate-600 tracking-wider">BON DE COMMANDE</h1>
          </div>

          {/* Informations entreprise */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">ARMOR PRINT SOLUTIONS</h2>
            <div className="text-sm text-slate-600">
              <p>7, Rue Balouch El Hassan</p>
              <p>Casablanca</p>
              <p>20100</p>
              <p>05 22 25 68 31</p>
              <p>contact@armor.com</p>
            </div>
          </div>

          {/* Numéro de commande */}
          <div className="mb-4">
            <p className="font-bold">B.C. N° : {order._id.slice(-8)}</p>
          </div>

          {/* Informations client */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-bold mb-2">À :</h3>
              <div className="text-sm">
                <p>Nom : {order.client?.nom || order.clientLivreFinal}</p>
                <p>Entreprise : {order.client?.entreprise || order.clientLivreFinal}</p>
                <p>Adresse : {(() => {
                  console.log('🔍 Tentative affichage adresse1 rue:', order.client?.adresse1?.rue);
                  return order.client?.adresse1?.rue || 'Adresse non renseignée';
                })()}</p>
                <p>Ville, Code Postal : {(() => {
                  const ville = order.client?.adresse1?.ville || '';
                  const codePostal = order.client?.adresse1?.codePostal || '';
                  console.log('🔍 Ville:', ville, 'Code postal:', codePostal);
                  return `${ville} ${codePostal}`.trim();
                })()}</p>
                <p>Téléphone : {(() => {
                  console.log('🔍 Téléphone:', order.client?.telephone);
                  return order.client?.telephone || '';
                })()}</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">Adresse de livraison :</h3>
              <div className="text-sm">
                <p>Nom : {order.client?.nom || order.clientLivreFinal}</p>
                <p>Entreprise : {order.client?.entreprise || order.clientLivreFinal}</p>
                <p>Adresse : {(() => {
                  const useSameAddress = order.client?.memeAdresseLivraison;
                  const adresse = useSameAddress ? order.client?.adresse1?.rue : order.client?.adresse2?.rue;
                  console.log('🔍 Même adresse livraison?', useSameAddress);
                  console.log('🔍 Adresse livraison:', adresse);
                  return adresse || 'Adresse non renseignée';
                })()}</p>
                <p>Ville, Code Postal : {(() => {
                  const useSameAddress = order.client?.memeAdresseLivraison;
                  const ville = useSameAddress ? order.client?.adresse1?.ville : order.client?.adresse2?.ville;
                  const codePostal = useSameAddress ? order.client?.adresse1?.codePostal : order.client?.adresse2?.codePostal;
                  console.log('🔍 Ville livraison:', ville, 'Code postal livraison:', codePostal);
                  return `${ville || ''} ${codePostal || ''}`.trim();
                })()}</p>
                <p>Téléphone : {order.client?.telephone || ''}</p>
              </div>
            </div>
          </div>

          {/* Tableau des informations de commande */}
          <table className="w-full mb-4 border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">DATE B.C.</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">RECEVEUR</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">TRANSIT</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">POINT F.O.B.</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">MODALITÉS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 px-3 py-4 text-sm">{formatDate(order.dateCreation)}</td>
                <td className="border border-slate-300 px-3 py-4 text-sm">{order.clientLivreFinal}</td>
                <td className="border border-slate-300 px-3 py-4 text-sm">{order.typeCommande}</td>
                <td className="border border-slate-300 px-3 py-4 text-sm">ARMOR</td>
                <td className="border border-slate-300 px-3 py-4 text-sm">Paiement à la livraison</td>
              </tr>
            </tbody>
          </table>

          {/* Tableau des articles */}
          <table className="w-full mb-4 border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">QTÉ</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">UNITÉ</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">DESCRIPTION</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">PRIX UNITAIRE</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {order.articles.map((article, index) => (
                <tr key={index}>
                  <td className="border border-slate-300 px-3 py-3 text-sm text-center">{article.quantiteCommandee}</td>
                  <td className="border border-slate-300 px-3 py-3 text-sm text-center">{article.unite}</td>
                  <td className="border border-slate-300 px-3 py-3 text-sm">{article.technologie} - {article.familleProduit}</td>
                  <td className="border border-slate-300 px-3 py-3 text-sm text-right">50,00 €</td>
                  <td className="border border-slate-300 px-3 py-3 text-sm text-right">{(article.quantiteCommandee * 50).toFixed(2)} €</td>
                </tr>
              ))}
              {/* Lignes vides pour l'espace */}
              {Array.from({ length: Math.max(0, 5 - order.articles.length) }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="border border-slate-300 px-3 py-6 text-sm">&nbsp;</td>
                  <td className="border border-slate-300 px-3 py-6 text-sm">&nbsp;</td>
                  <td className="border border-slate-300 px-3 py-6 text-sm">&nbsp;</td>
                  <td className="border border-slate-300 px-3 py-6 text-sm">&nbsp;</td>
                  <td className="border border-slate-300 px-3 py-6 text-sm">&nbsp;</td>
                </tr>
              ))}
              {/* Totaux */}
              <tr>
                <td colSpan={4} className="border border-slate-300 px-3 py-2 text-sm text-right font-bold">SOUSTOTAL</td>
                <td className="border border-slate-300 px-3 py-2 text-sm text-right">{sousTotal.toFixed(2)} €</td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-slate-300 px-3 py-2 text-sm text-right font-bold">TVA</td>
                <td className="border border-slate-300 px-3 py-2 text-sm text-right">{taxe.toFixed(2)} €</td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-slate-300 px-3 py-2 text-sm text-right font-bold">TRANSP. & MANUTENTION</td>
                <td className="border border-slate-300 px-3 py-2 text-sm text-right">{transport.toFixed(2)} €</td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-slate-300 px-3 py-2 text-sm text-right font-bold bg-slate-100">TOTAL</td>
                <td className="border border-slate-300 px-3 py-2 text-sm text-right font-bold bg-slate-100">{total.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>

          {/* Conditions et signatures */}
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="text-xs">
              <p className="mb-2"> Exécuter la commande conformément aux prix, modalités, mode de livraison et spécifications précisées ci-dessus.</p>
            </div>
            <div>
              <div className="mb-8">
                <p className="text-sm">Autorisé par: _________________ Titre:_________________</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <div className="flex justify-between text-sm">
                  <span>Signature</span>
                  <span>Date</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          body > *:not(.order-form-print) {
            display: none !important;
          }
          .order-form-print {
            display: block !important;
            position: static !important;
            background: white !important;
            padding: 20px !important;
            font-family: Arial, sans-serif !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderFormGenerator;