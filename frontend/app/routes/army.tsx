import { useState, useEffect } from 'react';
import { Ship, FileText, Send, Calendar, Fuel, Droplets, Package, Shield, Heart, Image as ImageIcon } from 'lucide-react';

const ArmyBaseSystem = () => {
  const [activeTab, setActiveTab] = useState('form');
  const [reports, setReports] = useState([]);
  const [selectedBase, setSelectedBase] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    buildingName: '',
    date: new Date().toISOString().split('T')[0],
    commanderNote: '',
    photoCaption: '',
    satisfaction: 5,
    fuel: '',
    water: '',
    provisions: '',
    armament: '',
    defibrillators: { available: '', total: '' },
    previsionJ1: ''
  });

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await window.storage.get('army-reports');
        if (result) {
          setReports(JSON.parse(result.value));
        }
      } catch (error) {
        console.log('No existing reports found');
      }
    };
    loadData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDefibChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      defibrillators: { ...prev.defibrillators, [field]: value }
    }));
  };

  const getSatisfactionColor = (value) => {
    const colors = [
      '#dc2626', '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#10b981', '#059669', '#047857'
    ];
    return colors[Math.floor(value - 1)] || colors[4];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newReport = {
      id: Date.now(),
      ...formData,
      timestamp: new Date().toISOString(),
      photo: photoPreview
    };
    
    const updatedReports = [...reports, newReport];
    setReports(updatedReports);
    
    try {
      await window.storage.set('army-reports', JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Error saving report:', error);
    }

    setFormData({
      buildingName: '',
      date: new Date().toISOString().split('T')[0],
      commanderNote: '',
      photoCaption: '',
      satisfaction: 5,
      fuel: '',
      water: '',
      provisions: '',
      armament: '',
      defibrillators: { available: '', total: '' },
      previsionJ1: ''
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    
    alert('Rapport enregistré avec succès');
  };

  const getBasesList = () => {
    const bases = {};
    reports.forEach(report => {
      if (!bases[report.buildingName]) {
        bases[report.buildingName] = {
          name: report.buildingName,
          reportCount: 0,
          lastReport: null
        };
      }
      bases[report.buildingName].reportCount++;
      if (!bases[report.buildingName].lastReport || 
          new Date(report.timestamp) > new Date(bases[report.buildingName].lastReport)) {
        bases[report.buildingName].lastReport = report.timestamp;
      }
    });
    return Object.values(bases);
  };

  const generateAISummary = async () => {
    if (!selectedBase) return;
    
    const baseReports = reports.filter(r => r.buildingName === selectedBase);
    if (baseReports.length === 0) return;

    setLoading(true);
    setConversation(prev => [...prev, {
      role: 'user',
      content: `Analyse les données du bâtiment ${selectedBase}`
    }]);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Tu es un assistant militaire. Analyse ces rapports quotidiens du bâtiment "${selectedBase}" et fournis un résumé stratégique concis en français.

Données des rapports:
${JSON.stringify(baseReports, null, 2)}

Fournis:
1. Vue d'ensemble de l'état opérationnel
2. Tendances des ressources (carburant, eau, vivres)
3. Points d'attention critiques
4. Recommandations

Sois concis et professionnel.`
          }]
        })
      });

      const data = await response.json();
      const aiResponse = data.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');

      setConversation(prev => [...prev, {
        role: 'assistant',
        content: aiResponse
      }]);
    } catch (error) {
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: `Erreur lors de l'analyse: ${error.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const selectBase = (baseName) => {
    setSelectedBase(baseName);
    setConversation([]);
  };

  const bases = getBasesList();
  const selectedBaseReports = selectedBase ? reports.filter(r => r.buildingName === selectedBase) : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold">Système de Gestion Militaire</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'form'
                  ? 'bg-slate-900 text-green-400 border-b-2 border-green-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-5 h-5" />
              Rapport Quotidien
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-slate-900 text-green-400 border-b-2 border-green-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ship className="w-5 h-5" />
              Tableau de Bord
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'form' ? (
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-xl p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du Bâtiment</label>
                <input
                  type="text"
                  value={formData.buildingName}
                  onChange={(e) => handleInputChange('buildingName', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mot du Commandant</label>
                <textarea
                  value={formData.commanderNote}
                  onChange={(e) => handleInputChange('commanderNote', e.target.value)}
                  rows="4"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Photo du Jour
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {photoPreview && (
                  <div className="mt-4">
                    <img 
                      src={photoPreview} 
                      alt="Aperçu" 
                      className="w-full h-48 object-cover rounded-lg border border-slate-600"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Légende Photo du Jour
                </label>
                <input
                  type="text"
                  value={formData.photoCaption}
                  onChange={(e) => handleInputChange('photoCaption', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Description de la photo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Satisfaction Générale
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.satisfaction}
                    onChange={(e) => handleInputChange('satisfaction', parseInt(e.target.value))}
                    className="flex-1"
                    style={{
                      accentColor: getSatisfactionColor(formData.satisfaction)
                    }}
                  />
                  <div 
                    className="w-16 h-10 rounded flex items-center justify-center font-bold"
                    style={{ backgroundColor: getSatisfactionColor(formData.satisfaction) }}
                  >
                    {formData.satisfaction}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Fuel className="w-4 h-4" /> Carburant (jours)
                  </label>
                  <input
                    type="number"
                    value={formData.fuel}
                    onChange={(e) => handleInputChange('fuel', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Droplets className="w-4 h-4" /> Eau (jours)
                  </label>
                  <input
                    type="number"
                    value={formData.water}
                    onChange={(e) => handleInputChange('water', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Vivres (jours)
                  </label>
                  <input
                    type="number"
                    value={formData.provisions}
                    onChange={(e) => handleInputChange('provisions', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Armement</label>
                <textarea
                  value={formData.armament}
                  onChange={(e) => handleInputChange('armament', e.target.value)}
                  rows="2"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="État de l'armement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Défibrillateurs</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.defibrillators.available}
                    onChange={(e) => handleDefibChange('available', e.target.value)}
                    className="w-20 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="2"
                    required
                  />
                  <span className="text-xl">/</span>
                  <input
                    type="number"
                    value={formData.defibrillators.total}
                    onChange={(e) => handleDefibChange('total', e.target.value)}
                    className="w-20 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="3"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prévision à J+1</label>
                <textarea
                  value={formData.previsionJ1}
                  onChange={(e) => handleInputChange('previsionJ1', e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Prévisions et planification pour demain"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Soumettre le Rapport
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6 h-[calc(100vh-240px)]">
            {/* Base List */}
            <div className="bg-slate-800 rounded-lg p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Ship className="w-5 h-5 text-green-500" />
                Bâtiments
              </h3>
              {bases.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucun rapport disponible</p>
              ) : (
                <div className="space-y-2">
                  {bases.map(base => (
                    <button
                      key={base.name}
                      onClick={() => selectBase(base.name)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedBase === base.name
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      <div className="font-medium">{base.name}</div>
                      <div className="text-sm opacity-75">{base.reportCount} rapports</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="col-span-3 flex flex-col gap-4">
              {/* Profile Card */}
              {selectedBase && (
                <div className="bg-slate-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">{selectedBase}</h2>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">Rapports</div>
                      <div className="text-xl font-semibold text-green-400">{selectedBaseReports.length}</div>
                    </div>
                    {selectedBaseReports.length > 0 && (
                      <>
                        <div>
                          <div className="text-slate-400">Dernier rapport</div>
                          <div className="text-xl font-semibold">{new Date(selectedBaseReports[selectedBaseReports.length - 1].date).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Satisfaction moy.</div>
                          <div className="text-xl font-semibold">
                            {(selectedBaseReports.reduce((acc, r) => acc + r.satisfaction, 0) / selectedBaseReports.length).toFixed(1)}/10
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Eau moyenne</div>
                          <div className="text-xl font-semibold">
                            {(selectedBaseReports.reduce((acc, r) => acc + parseInt(r.water || 0), 0) / selectedBaseReports.length).toFixed(0)} jours
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Conversation */}
              <div className="flex-1 bg-slate-800 rounded-lg flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {conversation.length === 0 && selectedBase && (
                    <div className="text-center text-slate-400 py-8">
                      <p>Cliquez sur "Générer l'Analyse IA" pour obtenir un résumé des données</p>
                    </div>
                  )}
                  {!selectedBase && (
                    <div className="text-center text-slate-400 py-8">
                      <p>Sélectionnez un bâtiment pour voir l'analyse</p>
                    </div>
                  )}
                  {conversation.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-3xl rounded-lg p-4 ${
                        msg.role === 'user' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-slate-700 text-slate-100'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {selectedBase && selectedBaseReports.length > 0 && (
                  <div className="p-4 border-t border-slate-700">
                    <button
                      onClick={generateAISummary}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      {loading ? 'Analyse en cours...' : 'Générer l\'Analyse IA'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArmyBaseSystem;