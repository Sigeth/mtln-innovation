import { useState, useEffect } from 'react';
import { Ship, FileText, Send, Calendar, Fuel, Droplets, Package, Shield, Heart, Image as ImageIcon, TrendingUp } from 'lucide-react';

const ArmyBaseSystem = () => {
  const [activeTab, setActiveTab] = useState('form');
  const [reports, setReports] = useState([]);
  const [selectedBase, setSelectedBase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [stats, setStats] = useState([]);
  const [userRole, setUserRole] = useState('commandant'); // 'commandant' or 'prefet'
  
  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000); // 2 weeks ago
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  });

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
        const result = await window.localStorage.get('army-reports');
        if (result) {
          setReports(JSON.parse(result.value));
        }
      } catch (error) {
        console.log('No existing reports found');
      }
    };
    loadData();
  }, []);

  // Load dashboard stats
  useEffect(() => {
    if (activeTab === 'summary') {
      fetchStats();
    }
  }, [activeTab, dateRange]);

  // When role changes to commandant, reset to form tab and select first building
  useEffect(() => {
    if (userRole === 'commandant') {
      setActiveTab('form');
      if (bases.length > 0 && !selectedBase) {
        setSelectedBase(bases[0].name);
      }
    }
  }, [userRole]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      const response = await fetch(`/api/stats?${params}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReport)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const updatedReports = [...reports, newReport];
      setReports(updatedReports);

      await window.localStorage.set('army-reports', JSON.stringify(updatedReports));
      
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
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(`Erreur lors de l'envoi: ${error.message}`);
    }
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

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userMessage })
      });

      const data = await response.json();
      if (data.success) {
        setConversation(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setConversation(prev => [...prev, { role: 'assistant', content: `Erreur: ${data.error}` }]);
      }
    } catch (error) {
      setConversation(prev => [...prev, { role: 'assistant', content: `Erreur de connexion: ${error.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getGlobalStats = () => {
    if (stats.length === 0) return null;
    return {
      totalBuildings: stats.length,
      avgSatisfaction: (stats.reduce((acc, s) => acc + (parseFloat(s.avg_satisfaction) || 0), 0) / stats.length).toFixed(1),
      totalReports: stats.reduce((acc, s) => acc + s.total_reports, 0)
    };
  };

  const bases = getBasesList();
  const selectedBaseReports = selectedBase ? reports.filter(r => r.buildingName === selectedBase) : [];
  const globalStats = getGlobalStats();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold">Horizon</h1>
            </div>
            
            {/* Role Toggle */}
            <div className="flex items-center gap-3 bg-slate-700 rounded-full p-1">
              <button
                onClick={() => setUserRole('commandant')}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  userRole === 'commandant'
                    ? 'bg-green-600 text-white'
                    : 'text-slate-300 hover:text-slate-100'
                }`}
              >
                Commandant
              </button>
              <button
                onClick={() => setUserRole('prefet')}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  userRole === 'prefet'
                    ? 'bg-green-600 text-white'
                    : 'text-slate-300 hover:text-slate-100'
                }`}
              >
                Préfet Maritime
              </button>
            </div>
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
      <div></div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'form' ? (
          <div className="max-w-3xl mx-auto">
            {userRole === 'commandant' && bases.length > 0 && (
              <div className="mb-6 bg-slate-800 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Bâtiment</label>
                <select
                  value={selectedBase || ''}
                  onChange={(e) => setSelectedBase(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un bâtiment</option>
                  {bases.map(base => (
                    <option key={base.name} value={base.name}>
                      {base.name} ({base.reportCount} rapports)
                    </option>
                  ))}
                </select>
              </div>
            )}

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
          <div className="flex flex-col gap-6 h-full">
            {/* Global Stats Section - Only for Préfet */}
            {userRole === 'prefet' && (
              <>
                {loading ? (
                  <div className="text-center py-8 text-slate-400">Chargement des données...</div>
                ) : globalStats ? (
                  <div className="bg-slate-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                        Statistiques Globales
                      </h2>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <span className="text-slate-400">à</span>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="text-slate-400 mb-1">Bâtiments</div>
                        <div className="text-2xl font-semibold text-green-400">{globalStats.totalBuildings}</div>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="text-slate-400 mb-1">Total Rapports</div>
                        <div className="text-2xl font-semibold">{globalStats.totalReports}</div>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="text-slate-400 mb-1">Satisfaction moy.</div>
                        <div 
                          className="text-2xl font-semibold rounded px-2 py-1"
                          style={{ color: getSatisfactionColor(parseFloat(globalStats.avgSatisfaction)) }}
                        >
                          {globalStats.avgSatisfaction}/10
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Buildings Stats Section */}
                {stats.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Détails par Bâtiment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.map(stat => (
                        <div key={stat.building_name} className="bg-slate-700 rounded-lg p-4 space-y-2">
                          <h4 className="font-semibold text-green-400">{stat.building_name}</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Satisfaction</span>
                              <span 
                                className="font-medium rounded px-2"
                                style={{ color: getSatisfactionColor(parseFloat(stat.avg_satisfaction) || 0) }}
                              >
                                {(parseFloat(stat.avg_satisfaction) || 0).toFixed(1)}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Fuel className="w-3 h-3" /> Carburant
                              </span>
                              <span className="font-medium">{stat.fuel || 'N/A'} j</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Droplets className="w-3 h-3" /> Eau
                              </span>
                              <span className="font-medium">{stat.water || 'N/A'} j</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Package className="w-3 h-3" /> Vivres
                              </span>
                              <span className="font-medium">{stat.provisions || 'N/A'} j</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Rapports</span>
                              <span>{stat.total_reports}</span>
                            </div>
                            {stat.last_report_date && (
                              <div className="text-xs text-slate-500 pt-1 border-t border-slate-600">
                                Dernier: {new Date(stat.last_report_date).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Commandant Single Building Stats */}
            {userRole === 'commandant' && stats.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Statistiques de mon Bâtiment</h3>
                {stats.slice(0, 1).map(stat => (
                  <div key={stat.building_name} className="bg-slate-700 rounded-lg p-6 space-y-4">
                    <h4 className="font-semibold text-lg text-green-400">{stat.building_name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1">Satisfaction</div>
                        <div 
                          className="text-2xl font-semibold rounded px-2"
                          style={{ color: getSatisfactionColor(parseFloat(stat.avg_satisfaction) || 0) }}
                        >
                          {(parseFloat(stat.avg_satisfaction) || 0).toFixed(1)}/10
                        </div>
                      </div>
                      <div className="bg-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1 flex items-center gap-1">
                          <Fuel className="w-3 h-3" /> Carburant
                        </div>
                        <div className="text-2xl font-semibold">{stat.fuel || 'N/A'} j</div>
                      </div>
                      <div className="bg-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1 flex items-center gap-1">
                          <Droplets className="w-3 h-3" /> Eau
                        </div>
                        <div className="text-2xl font-semibold">{stat.water || 'N/A'} j</div>
                      </div>
                      <div className="bg-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1 flex items-center gap-1">
                          <Package className="w-3 h-3" /> Vivres
                        </div>
                        <div className="text-2xl font-semibold">{stat.provisions || 'N/A'} j</div>
                      </div>
                      <div className="bg-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1">Rapports</div>
                        <div className="text-2xl font-semibold">{stat.total_reports}</div>
                      </div>
                    </div>
                    {stat.last_report_date && (
                      <div className="text-sm text-slate-400 pt-2 border-t border-slate-600">
                        Dernier rapport: {new Date(stat.last_report_date).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* AI Chat Section - Available for both roles */}
            <div className="bg-slate-800 rounded-lg p-6 flex flex-col h-96">
              <h3 className="text-xl font-semibold mb-4">Assistant IA</h3>
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-slate-900 rounded p-4">
                {conversation.length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    <p>Posez vos questions sur les données des bâtiments</p>
                  </div>
                )}
                {conversation.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-2xl rounded-lg p-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-slate-700 text-slate-100'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Posez votre question..."
                  disabled={chatLoading}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArmyBaseSystem;