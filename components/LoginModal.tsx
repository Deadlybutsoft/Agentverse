
import React from 'react';
import { GoogleIcon, EmailIcon, CloseIcon } from './Icons';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const particleCount = 50;
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 150 + Math.random() * 100;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const duration = 0.5 + Math.random() * 1.5;
    const delay = Math.random() * 2;
    const rotation = angle + Math.PI;

    return (
      <div
        key={i}
        className="particle"
        // Fix: Cast style object to React.CSSProperties to allow for CSS custom properties.
        style={{
          '--x': `${x}px`,
          '--y': `${y}px`,
          '--rot': `${rotation}rad`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        } as React.CSSProperties}
      />
    );
  });

  const handleDemoLogin = () => {
    onClose();
    window.location.hash = '#dashboard';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-5xl bg-gray-900/50 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-purple-900/20 overflow-hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close modal"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <div className="grid md:grid-cols-2">
          {/* Left Side: Image */}
          <div className="hidden md:block relative overflow-hidden">
            <img
              src="https://res.cloudinary.com/dkvkxermy/image/upload/v1762052362/blackwhole__small_blackhole_in_ntdjvj.png"
              alt="A black hole in space"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {particles}
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center">
            <h2 className="text-5xl font-script font-medium italic text-white mb-8">Join the Agentverse</h2>
            <div className="w-full max-w-sm space-y-4">
              <button
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-700/50 border border-gray-600 rounded-lg text-white font-semibold hover:bg-gray-700 transition-colors"
              >
                <GoogleIcon className="w-6 h-6" />
                Continue with Google
              </button>
              <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-700/50 border border-gray-600 rounded-lg text-white font-semibold hover:bg-gray-700 transition-colors">
                <EmailIcon className="w-6 h-6" />
                Continue with Email
              </button>
              <button
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center py-3 px-4 bg-transparent border border-gray-700 rounded-lg text-gray-400 font-semibold hover:bg-gray-800 hover:text-white transition-colors"
              >
                Continue as Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
