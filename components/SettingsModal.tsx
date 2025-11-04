import React, { useState, useEffect } from 'react';
import { CloseIcon, UserIcon, LinkIcon, HistoryIcon, CreditCardIcon, FolderIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'Account' | 'Connect' | 'Schedule' | 'API Keys' | 'Data';

const settingsTabs: { name: SettingsTab, icon: React.FC<{className?: string}> }[] = [
    { name: 'Account', icon: UserIcon },
    { name: 'Connect', icon: LinkIcon },
    { name: 'Schedule', icon: HistoryIcon },
    { name: 'API Keys', icon: CreditCardIcon },
    { name: 'Data', icon: FolderIcon },
];


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Account');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('gemini-api-key');
      setSavedApiKey(storedKey);
      setApiKeyInput('');
      setApiKeyError(null);
      if (!storedKey) {
        setActiveTab('API Keys');
      } else {
        setActiveTab('Account');
      }
    }
  }, [isOpen]);

  const maskApiKey = (key: string): string => {
    if (key.length <= 8) return "••••••••";
    return `${key.substring(0, 4)}••••••••••••••••••••${key.substring(key.length - 4)}`;
  };

  const handleSaveApiKey = () => {
    const keyToSave = apiKeyInput.trim();
    if (keyToSave.length !== 39 || /\s/.test(keyToSave)) {
      setApiKeyError('Invalid API Key format. Please enter a valid 39-character key.');
      return;
    }
    
    localStorage.setItem('gemini-api-key', keyToSave);
    setSavedApiKey(keyToSave);
    setApiKeyInput('');
    setApiKeyError(null);
    alert('API Key saved successfully!');
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('gemini-api-key');
    setSavedApiKey(null);
    alert('API Key removed. The application will now use its default key.');
  };

  const renderContent = () => {
    if (activeTab === 'API Keys') {
        return (
          <div className="text-white flex flex-col gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-white">Manage Gemini API Key</h3>
              <p className="text-gray-400">Your API key is stored locally in your browser. Providing your own key can help avoid rate limits on the application's default key.</p>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <label htmlFor="current-key" className="block text-sm font-medium text-gray-300 mb-2">Current Active Key</label>
                <span className={`px-2 py-0.5 text-xs rounded-full ${savedApiKey ? 'bg-blue-500/30 text-blue-300' : 'bg-green-500/30 text-green-300'}`}>
                    {savedApiKey ? 'User Provided' : 'Application Default'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 mt-1">
                <p id="current-key" className="font-mono text-gray-400 bg-black/20 px-3 py-2 rounded-md w-full truncate">
                  {savedApiKey ? maskApiKey(savedApiKey) : 'Using default application API key.'}
                </p>
                {savedApiKey && (
                  <button
                    onClick={handleRemoveApiKey}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600/50 hover:bg-red-600/80 rounded-lg transition-colors flex-shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
  
            <div className="flex flex-col gap-2">
              <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300">
                {savedApiKey ? 'Replace with New API Key' : 'Enter Your API Key'}
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="api-key-input"
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    if (apiKeyError) setApiKeyError(null);
                  }}
                  placeholder="Enter your 39-character Gemini API key"
                  className={`w-full bg-white/5 border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:border-purple-500 transition-all ${apiKeyError ? 'border-red-500/50 ring-red-500/50' : 'border-white/10 focus:ring-purple-500'}`}
                  aria-invalid={!!apiKeyError}
                  aria-describedby="api-key-error"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput.trim()}
                  className="px-6 py-2 font-semibold text-black bg-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  Save
                </button>
              </div>
              {apiKeyError && <p id="api-key-error" className="text-sm text-red-400 mt-1">{apiKeyError}</p>}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 transition-colors mt-2 self-start">
                  Get your Gemini API key from Google AI Studio &rarr;
              </a>
            </div>
          </div>
        );
      }

    return (
        <div className="text-white">
            <h3 className="text-3xl font-semibold mb-6 text-white">{activeTab}</h3>
            <p className="text-gray-300">
                Settings and options for the '{activeTab}' section will be displayed here. 
                This is a placeholder for the actual settings interface.
            </p>
        </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <div
        className={`relative w-full max-w-4xl h-[600px] bg-[#212121]/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Close modal"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-1/3 border-r border-white/10 p-4">
                    <nav className="flex flex-col gap-1">
                    {settingsTabs.map(({ name, icon: Icon }) => (
                        <button
                        key={name}
                        onClick={() => setActiveTab(name)}
                        className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-colors ${
                            activeTab === name
                            ? 'bg-white/10 text-white'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                        >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{name}</span>
                        </button>
                    ))}
                    </nav>
                </aside>

                <main className="w-2/3 p-6 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;