import React from 'react';
import { SparkleIcon } from '../components/Icons';

const GeneratorPage: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white flex flex-col items-center justify-center isolate p-4">
      {/* Background Effects */}
      <div className="stars"></div>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="twinkle-star" style={{ top: '10%', left: '10%', animationDelay: '0s', animationDuration: '2.5s' }}></div>
        <div className="twinkle-star" style={{ top: '25%', left: '85%', animationDelay: '0.2s', animationDuration: '1.8s' }}></div>
        <div className="twinkle-star" style={{ top: '50%', left: '50%', animationDelay: '0.4s', animationDuration: '2.2s' }}></div>
        <div className="twinkle-star" style={{ top: '5%', left: '40%', animationDelay: '0.8s', animationDuration: '2.8s' }}></div>
        <div className="twinkle-star" style={{ top: '60%', left: '95%', animationDelay: '1s', animationDuration: '1.9s' }}></div>
        <div className="twinkle-star" style={{ top: '80%', left: '70%', animationDelay: '1.2s', animationDuration: '2.1s' }}></div>
        <div className="twinkle-star" style={{ top: '35%', left: '5%', animationDelay: '1.4s', animationDuration: '1.7s' }}></div>
        {/* Added Stars */}
        <div className="twinkle-star" style={{ top: '15%', left: '30%', animationDelay: '0.1s', animationDuration: '2.0s' }}></div>
        <div className="twinkle-star" style={{ top: '20%', left: '70%', animationDelay: '0.3s', animationDuration: '1.6s' }}></div>
        <div className="twinkle-star" style={{ top: '12%', left: '90%', animationDelay: '0.5s', animationDuration: '2.4s' }}></div>
        <div className="twinkle-star" style={{ top: '30%', left: '25%', animationDelay: '0.7s', animationDuration: '1.9s' }}></div>
        <div className="twinkle-star" style={{ top: '8%', left: '65%', animationDelay: '0.9s', animationDuration: '2.6s' }}></div>
        <div className="twinkle-star" style={{ top: '40%', left: '55%', animationDelay: '1.1s', animationDuration: '2.3s' }}></div>
        {/* More stars for the top area */}
        <div className="twinkle-star" style={{ top: '8%', left: '22%', animationDelay: '1.3s', animationDuration: '1.8s' }}></div>
        <div className="twinkle-star" style={{ top: '18%', left: '58%', animationDelay: '1.5s', animationDuration: '2.5s' }}></div>
        <div className="twinkle-star" style={{ top: '28%', left: '8%', animationDelay: '1.7s', animationDuration: '2.1s' }}></div>
        <div className="twinkle-star" style={{ top: '38%', left: '78%', animationDelay: '1.9s', animationDuration: '1.6s' }}></div>
        <div className="twinkle-star" style={{ top: '2%', left: '50%', animationDelay: '2.1s', animationDuration: '2.9s' }}></div>
        <div className="twinkle-star" style={{ top: '22%', left: '95%', animationDelay: '2.3s', animationDuration: '1.7s' }}></div>
        <div className="twinkle-star" style={{ top: '32%', left: '35%', animationDelay: '2.5s', animationDuration: '2.2s' }}></div>
        <div className="twinkle-star" style={{ top: '14%', left: '45%', animationDelay: '2.7s', animationDuration: '2.0s' }}></div>
        <div className="twinkle-star" style={{ top: '26%', left: '15%', animationDelay: '2.9s', animationDuration: '1.5s' }}></div>
        <div className="twinkle-star" style={{ top: '36%', left: '88%', animationDelay: '3.1s', animationDuration: '2.7s' }}></div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(56,16,124,0.3),rgba(0,0,0,0))] z-0"></div>

      {/* Header */}
      <header
        className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-20 animate-fade-in-down"
        style={{ animationDelay: '0.1s' }}
      >
        <button onClick={() => window.location.hash = ''} className="text-2xl font-bold tracking-wider font-saira">Agentverse</button>
        <button
          onClick={() => window.location.hash = ''}
          className="rounded-full border border-white/30 bg-transparent px-5 py-2 text-sm font-semibold hover:bg-white/10 transition-colors duration-300"
        >
          Logout
        </button>
      </header>
      
      {/* Main Content */}
      <main className="z-10 flex flex-col items-center justify-center text-center h-full w-full max-w-4xl mx-auto px-4">
        <div className="flex flex-col items-center gap-6 w-full">
          <h1
            className="text-5xl md:text-7xl font-bold tracking-normal text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            Unleash Your <span className="font-script font-medium italic text-white">Creativity</span>
          </h1>
          <p
            className="max-w-xl text-lg text-gray-400 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            Describe the universe you want to build, and watch it come to life.
          </p>

          <div 
            className="w-full mt-8 animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="relative w-full">
              <textarea
                rows={3}
                placeholder="A galaxy swirling with neon colors and crystal planets..."
                className="w-full bg-gray-900/50 border border-white/20 rounded-xl p-4 pr-36 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none text-lg"
                aria-label="Creative prompt input"
              />
              <button
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg bg-gray-200 px-6 py-2 text-black font-semibold hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-gray-200/40 flex items-center gap-2"
              >
                <SparkleIcon className="w-5 h-5"/>
                Generate
              </button>
            </div>
          </div>

          <div 
            className="w-full mt-10 animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Your Creation</h2>
            <div className="w-full min-h-[300px] bg-black/20 border border-dashed border-white/20 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Your generated masterpiece will appear here.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GeneratorPage;