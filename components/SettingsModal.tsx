import React, { useState } from 'react';
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

  const renderContent = () => {
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