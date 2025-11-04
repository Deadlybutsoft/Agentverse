import React, { useState, useEffect, useRef } from 'react';
import { TvIcon } from '../components/Icons';
import LoginModal from '../components/LoginModal';
import HeroBackground from '../components/HeroBackground';
import NeuralBackground from '../components/NeuralBackground';

declare global {
  interface Window {
    TubesCursor: any;
  }
}

const LandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tubesCursorApp = useRef<any>(null);

  useEffect(() => {
    if (window.TubesCursor && canvasRef.current) {
      const app = window.TubesCursor(canvasRef.current, {
        tubes: {
          colors: ["#f967fb", "#53bc28", "#6958d5"],
          lights: {
            intensity: 200,
            colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
          }
        }
      });
      tubesCursorApp.current = app;
    }

    const randomColors = (count: number) => {
        return new Array(count)
            .fill(0)
            .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
    };
    
    const handleClick = () => {
      if (tubesCursorApp.current?.tubes) {
        const colors = randomColors(3);
        const lightsColors = randomColors(4);
        tubesCursorApp.current.tubes.setColors(colors);
        tubesCursorApp.current.tubes.setLightsColors(lightsColors);
      }
    };

    document.body.addEventListener('click', handleClick);

    return () => {
      document.body.removeEventListener('click', handleClick);
      tubesCursorApp.current = null;
    };
  }, []);

  const tagline = "Build autonomous agents to automate anything.";
  const titlePart1 = "Unleash Your";
  const titlePart2 = "AI Workforce.";

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white flex flex-col items-center justify-center isolate p-4">
      <HeroBackground />
      <NeuralBackground />
      <canvas ref={canvasRef} className="absolute inset-0 z-[16] w-full h-full pointer-events-none"></canvas>

      {/* Header */}
      <header
        className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-center z-20 animate-fade-in-down"
        style={{ animationDelay: '0.1s' }}
      >
        <button onClick={() => window.location.hash = ''} className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg">
            <img src="https://res.cloudinary.com/dkvkxermy/image/upload/v1762160811/20bbfb2f-a218-4a21-b75f-4b75789f05d8_ycizdr.png" alt="Agentverse Logo" className="h-24 w-24" />
            <span className="text-2xl font-bold tracking-wider font-saira ml-[-1rem]">Agentverse</span>
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full border border-white/30 bg-transparent px-5 py-2 text-sm font-semibold hover:bg-white/10 transition-colors duration-300"
        >
          Login
        </button>
      </header>

      {/* Main Content */}
      <main className="z-10 flex flex-col items-center justify-center text-center h-full w-full">
        <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-4">
            <h1
              className="text-6xl md:text-8xl font-bold tracking-normal text-white"
            >
              {titlePart1.split(' ').map((word, index) => (
                <span key={index} className="inline-block animate-fade-in-up" style={{ animationDelay: `${0.9 + index * 0.07}s` }}>
                  {word}&nbsp;
                </span>
              ))}
              <span className="inline-block animate-fade-in-up font-script font-medium italic" style={{ animationDelay: `${0.9 + titlePart1.split(' ').length * 0.07}s` }}>
                  {titlePart2}
              </span>
            </h1>
          </div>

          <p
            className="max-w-lg text-xl text-gray-400"
          >
            {tagline.split(' ').map((word, index) => (
              <span key={index} className="inline-block animate-fade-in-up" style={{ animationDelay: `${0.2 + index * 0.05}s` }}>
                {word}&nbsp;
              </span>
            ))}
          </p>

          <div
            className="flex flex-col sm:flex-row items-center gap-5 mt-6 animate-fade-in-up"
            style={{ animationDelay: '1.5s' }}
          >
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-get-started relative isolate overflow-hidden rounded-full bg-gray-200 px-8 py-4 text-black font-semibold shadow-md w-full sm:w-auto text-lg"
              >
                Get Started
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-full border border-white/30 bg-transparent px-8 py-4 text-white font-semibold hover:bg-white/10 transition-colors duration-300 w-full sm:w-auto flex items-center justify-center text-lg"
              >
                <TvIcon className="w-6 h-6 mr-3" />
                Watch Demo
              </button>
          </div>
        </div>
      </main>
      
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default LandingPage;