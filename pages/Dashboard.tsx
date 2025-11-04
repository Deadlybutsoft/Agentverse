import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import SettingsModal from '../components/SettingsModal';
import { 
    ChatBubbleIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ClipboardIcon,
    EditIcon,
    LightbulbIcon,
    PaperclipIcon,
    PauseIcon,
    PlusIcon,
    RefreshIcon,
    SettingsIcon,
    ShareIcon,
    ThumbDownIcon,
    ThumbUpIcon,
    UserProfileIcon,
    VolumeUpIcon,
    ArrowUpIcon,
    CheckIcon
} from '../components/Icons';

// Base64 decoding for TTS
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
  
// PCM audio data to AudioBuffer for TTS
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const AiMessageAction: React.FC<{ icon: React.ReactNode; onClick?: () => void }> = ({ icon, onClick }) => (
    <button onClick={onClick} className="text-gray-400 hover:text-white transition-all active:scale-90">
        {icon}
    </button>
);

interface Message {
    role: 'user' | 'model';
    content: string;
}

const Dashboard: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [chatTitle, setChatTitle] = useState('New Chat');
    const [copiedStates, setCopiedStates] = useState<{ [key: number]: boolean }>({});
    const [feedback, setFeedback] = useState<{ [key: number]: 'up' | 'down' | null }>({});
    
    // Cleaned up recent chats
    const [recentChats, setRecentChats] = useState<string[]>([]);
    const [activeChatIndex, setActiveChatIndex] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const generationControllerRef = useRef<{ stop: () => void } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, inputValue]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);
    
    const handleSendMessage = async (e?: React.FormEvent, prompt?: string) => {
        if (e) e.preventDefault();
        const currentInput = (prompt || inputValue).trim();
        if (!currentInput || isLoading) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: currentInput }];
        setMessages(newMessages);
        if (!prompt) setInputValue('');
        setIsLoading(true);
        
        let shouldStop = false;
        generationControllerRef.current = { stop: () => { shouldStop = true; } };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: currentInput,
            });

            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of responseStream) {
                if (shouldStop) break;
                const text = chunk.text;
                if (text) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1].content += text;
                        return newMsgs;
                    });
                }
            }
        } catch (error) {
            console.error("Error calling Gemini API", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
            generationControllerRef.current = null;
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleRegenerate = () => {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            setMessages(prev => prev.slice(0, -1)); // Remove previous model response
            handleSendMessage(undefined, lastUserMessage.content);
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [index]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [index]: false }));
        }, 2000);
    };

    const handleTTS = async (text: string) => {
        if (!text) return;
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
            }
        } catch (error) {
            console.error("Error generating speech", error);
        }
    };
    
    const handleFeedback = (index: number, type: 'up' | 'down') => {
        setFeedback(prev => ({ ...prev, [index]: prev[index] === type ? null : type }));
    };

    const handleNewChat = () => {
        setMessages([]);
        setChatTitle('New Chat');
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            console.log("Uploaded file:", file.name);
            // Here you would handle the file, e.g., read it for multimodal input
        }
    };

  return (
    <div className="flex h-screen w-full bg-[#151515] text-gray-300 font-sans">
        <aside className={`flex flex-col bg-[#151515] text-white transition-all duration-300 border-r border-white/10 ${isSidebarExpanded ? 'w-60' : 'w-20'}`}>
            <div className={`p-2 flex items-center border-b border-white/10 ${isSidebarExpanded ? 'justify-start' : 'justify-center'}`}>
                <button onClick={() => window.location.hash = ''} className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full">
                    <img src="https://res.cloudinary.com/dkvkxermy/image/upload/v1762160811/20bbfb2f-a218-4a21-b75f-4b75789f05d8_ycizdr.png" alt="Agentverse Logo" className="h-12 w-12" />
                    {isSidebarExpanded && <span className="font-bold text-xl font-saira">Agentverse</span>}
                </button>
            </div>


            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 hide-scrollbar">
                {isSidebarExpanded && recentChats.length > 0 && <h3 className="px-2 pt-2 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent</h3>}
                {recentChats.map((chat, index) => (
                    <button 
                        key={index} 
                        onClick={() => setActiveChatIndex(index)}
                        className={`flex items-center w-full rounded-lg text-left transition-colors duration-200 truncate py-2.5 ${isSidebarExpanded ? 'pl-4' : 'justify-center'} ${activeChatIndex === index ? 'bg-[#424243] text-white' : 'text-white hover:bg-[#4a4a4b]'}`}
                    >
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                            <ChatBubbleIcon className="w-full h-full" />
                        </div>
                        {isSidebarExpanded && <span className="ml-3 truncate">{chat}</span>}
                    </button>
                ))}
            </div>

            <div className="px-2 py-2 border-t border-white/10 space-y-1">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className={`flex items-center w-full rounded-lg text-left text-white hover:bg-[#4a4a4b] transition-colors py-2.5 ${isSidebarExpanded ? 'pl-4' : 'justify-center'}`}
                >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        <UserProfileIcon className="w-full h-full" />
                    </div>
                    {isSidebarExpanded && <span className="ml-3 font-medium truncate">Guest User</span>}
                </button>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className={`flex items-center w-full rounded-lg text-left text-white hover:bg-[#4a4a4b] transition-colors py-2.5 ${isSidebarExpanded ? 'pl-4' : 'justify-center'}`}
                >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        <SettingsIcon className="w-full h-full" />
                    </div>
                    {isSidebarExpanded && <span className="ml-3 font-medium">Settings</span>}
                </button>
                <button
                    onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                    className={`flex items-center w-full rounded-lg text-left text-white hover:bg-[#4a4a4b] transition-colors py-2.5 ${isSidebarExpanded ? 'pl-4' : 'justify-center'}`}
                    aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        {isSidebarExpanded ? <ChevronDoubleLeftIcon className="w-full h-full" /> : <ChevronDoubleRightIcon className="w-full h-full" />}
                    </div>
                    {isSidebarExpanded && <span className="ml-3 font-medium">Collapse</span>}
                </button>
            </div>
        </aside>

      <div className="relative isolate flex-1 flex flex-col overflow-hidden bg-[#151515]" onClick={() => isSidebarExpanded && setIsSidebarExpanded(false)}>
        <button
            onClick={handleNewChat}
            className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-white hover:bg-[#3f3f3f] transition-colors duration-200 active:scale-95 text-sm font-medium flex items-center gap-2"
            aria-label="New Chat"
        >
            <PlusIcon className="w-4 h-4" />
            New Chat
        </button>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-gray-500 mt-20">
                        <img src="https://res.cloudinary.com/dkvkxermy/image/upload/v1762160811/20bbfb2f-a218-4a21-b75f-4b75789f05d8_ycizdr.png" alt="Agentverse Logo" className="mx-auto opacity-10 mb-2 h-32 w-32 logo-shiny" />
                        <h1 className="text-4xl font-mono text-white">How can I help you today?</h1>
                    </div>
                )}

                {messages.map((message, index) => (
                    message.role === 'user' ? (
                        <div key={index} className="flex justify-end">
                            <div className="bg-[#424243] rounded-xl px-5 py-3 max-w-[80%]">
                                <p className="text-white whitespace-pre-wrap font-mono">{message.content}</p>
                            </div>
                        </div>
                    ) : (
                        <div key={index} className="flex flex-col gap-4 max-w-[80%]">
                            <div>
                                <p className="text-white text-base leading-relaxed whitespace-pre-wrap font-mono">{message.content}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <AiMessageAction icon={<RefreshIcon className="w-5 h-5" />} onClick={handleRegenerate} />
                                    <AiMessageAction icon={<VolumeUpIcon className="w-5 h-5" />} onClick={() => handleTTS(message.content)} />
                                    <AiMessageAction icon={copiedStates[index] ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />} onClick={() => handleCopy(message.content, index)} />
                                    <AiMessageAction icon={<ShareIcon className="w-5 h-5" />} onClick={() => alert('Share functionality coming soon!')}/>
                                 </div>
                                <div className="flex items-center gap-3 border-l border-[#515152] pl-3">
                                    <AiMessageAction icon={<ThumbUpIcon className="w-5 h-5" isFilled={feedback[index] === 'up'} />} onClick={() => handleFeedback(index, 'up')} />
                                    <AiMessageAction icon={<ThumbDownIcon className="w-5 h-5" isFilled={feedback[index] === 'down'} />} onClick={() => handleFeedback(index, 'down')} />
                                </div>
                            </div>
                        </div>
                    )
                ))}

                {isLoading && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <LightbulbIcon className="w-5 h-5 animate-pulse" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </main>

        <footer className="px-4 md:px-6 py-3 flex justify-center">
            <div className="w-full max-w-4xl">
                <form onSubmit={handleSendMessage} className="bg-[#212121] rounded-3xl overflow-hidden flex flex-col border border-white/10">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="How can Agentverse help?"
                        disabled={isLoading}
                        className="w-full bg-transparent px-5 py-4 text-white placeholder-gray-400 focus:outline-none resize-none overflow-y-auto max-h-48 disabled:opacity-50 hide-scrollbar font-mono"
                        style={{ lineHeight: '1.5rem' }}
                    />
                    <div className="flex justify-between items-center pl-3 pr-2 pb-2 pt-1">
                        <div>
                           <input type="file" id="file-upload" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                           <label htmlFor="file-upload" className="cursor-pointer text-white p-3 rounded-full hover:bg-[#4a4a4b] inline-block">
                              <PlusIcon className="w-6 h-6" />
                           </label>
                        </div>
                        <div>
                            {isLoading ? (
                                <button type="button" onClick={() => generationControllerRef.current?.stop()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black transition-all active:scale-90">
                                    <PauseIcon className="w-6 h-6" />
                                </button>
                            ) : (
                                <button type="submit" disabled={!inputValue.trim()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black transition-all active:scale-90 hover:scale-110 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed">
                                    <ArrowUpIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </footer>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Dashboard;