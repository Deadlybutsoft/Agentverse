
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Content, Part } from '@google/genai';
import SettingsModal from '../components/SettingsModal';
import { 
    ChatBubbleIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ClipboardIcon,
    CloseIcon,
    LightbulbIcon,
    PaperclipIcon,
    PlusIcon,
    SettingsIcon,
    UserProfileIcon,
    CheckIcon,
    ArrowUpIcon,
    SquareIcon
} from '../components/Icons';

const getApiKey = (): string | null => {
    const userApiKey = localStorage.getItem('gemini-api-key');
    if (userApiKey) {
        return userApiKey;
    }
    return process.env.API_KEY || null;
};

const AiMessageAction: React.FC<{ icon: React.ReactNode; onClick?: () => void }> = ({ icon, onClick }) => (
    <button onClick={onClick} className="text-gray-400 hover:text-white transition-all active:scale-90">
        {icon}
    </button>
);

interface UploadedFile {
    name: string;
    type: string;
    base64Data: string;
    isImage: boolean;
}

interface Message {
    role: 'user' | 'model';
    content: string;
    files?: UploadedFile[];
}

const MarkdownRenderer: React.FC<{ content: string; isLoading?: boolean }> = ({ content, isLoading }) => {
    const pattern = /(```[\s\S]*?```|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;

    const parts = content.split(pattern).filter(part => part);

    const elements = parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
            const code = part.substring(3, part.length - 3).trim();
            return (
                <pre key={index} className="bg-black/50 p-3 rounded-md my-2 overflow-x-auto">
                    <code className="text-white font-mono text-sm">{code}</code>
                </pre>
            );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.substring(1, part.length - 1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="bg-black/50 text-red-300 font-mono px-1.5 py-0.5 rounded-sm">{part.substring(1, part.length - 1)}</code>;
        }
        return part;
    });

    return (
        <div className="text-white text-base leading-relaxed whitespace-pre-wrap font-mono">
            {elements}
            {isLoading && <span className="blinking-cursor" />}
        </div>
    );
};

const Dashboard: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [chatTitle, setChatTitle] = useState('New Chat');
    const [copiedStates, setCopiedStates] = useState<{ [key: number]: boolean }>({});
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [thinkingDots, setThinkingDots] = useState('.');
    
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
    }, [messages, isLoading]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);
    
    useEffect(() => {
        let interval: number;
        if (isLoading && (messages.length === 0 || messages[messages.length - 1].role === 'user')) {
            interval = window.setInterval(() => {
                setThinkingDots(dots => (dots.length >= 3 ? '.' : dots + '.'));
            }, 300);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoading, messages]);

    const handleSendMessage = async (e?: React.FormEvent, prompt?: string) => {
        if (e) e.preventDefault();
        const currentInput = (prompt || inputValue).trim();
    
        if ((!currentInput && uploadedFiles.length === 0) || isLoading) return;
    
        const apiKey = getApiKey();
        if (!apiKey) {
            alert("No API Key configured. Please add your Gemini API Key in the Settings menu (bottom left) to continue.");
            return;
        }
    
        const userMessage: Message = {
            role: 'user',
            content: currentInput,
            files: [...uploadedFiles],
        };
    
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        if (!prompt) setInputValue('');
        setUploadedFiles([]);
        setIsLoading(true);
        
        let shouldStop = false;
        generationControllerRef.current = { stop: () => { shouldStop = true; } };
    
        try {
            const ai = new GoogleGenAI({ apiKey });
            
            const contents: Content[] = updatedMessages.map(msg => {
                const parts: Part[] = [];
                let textContent = msg.content;
    
                if (msg.files && msg.files.length > 0) {
                    msg.files.filter(f => f.isImage).forEach(file => {
                        parts.push({
                            inlineData: {
                                mimeType: file.type,
                                data: file.base64Data,
                            },
                        });
                    });
                    
                    const nonImageFiles = msg.files.filter(f => !f.isImage);
                    if (nonImageFiles.length > 0) {
                        const fileNames = nonImageFiles.map(f => f.name).join(', ');
                        textContent += `\n\n(For context, the following files were also attached: ${fileNames}. You cannot read their contents.)`;
                    }
    
                    if (msg.files.some(f => f.isImage) && !textContent) {
                        textContent = "Describe the attached image(s).";
                    }
                }
    
                if (textContent) {
                    parts.push({ text: textContent });
                }
    
                return {
                    role: msg.role,
                    parts: parts,
                };
            }).filter(c => c.parts.length > 0);

            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: contents,
            });
    
            setMessages(prev => [...prev, { role: 'model', content: '' }]);
    
            for await (const chunk of responseStream) {
                if (shouldStop) break;
                const text = chunk.text;
                if (text) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const lastMsg = newMsgs[newMsgs.length - 1];
                        if (lastMsg && lastMsg.role === 'model') {
                            lastMsg.content += text;
                        }
                        return newMsgs;
                    });
                }
            }
        } catch (error) {
            console.error("Error calling Gemini API", error);
            let errorMessage = "Sorry, I encountered an error. Please try again.";
            if (error instanceof Error && error.message.includes('API key not valid')) {
                errorMessage = "Your API key is invalid. Please check it in the Settings menu.";
            }
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastMsg = newMsgs[newMsgs.length - 1];
                if (lastMsg?.role === 'model' && lastMsg.content === '') {
                    lastMsg.content = errorMessage;
                    return newMsgs;
                }
                return [...newMsgs, { role: 'model', content: errorMessage }];
            });
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

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [index]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [index]: false }));
        }, 2000);
    };
    
    const handleNewChat = () => {
        setMessages([]);
        setChatTitle('New Chat');
        setUploadedFiles([]);
        setInputValue('');
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        if (uploadedFiles.length + files.length > 3) {
            alert("You can upload a maximum of 3 files.");
            return;
        }

        // Fix: Explicitly type `file` as `File` to fix type inference issues.
        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const base64String = (loadEvent.target?.result as string).split(',')[1];
                const newFile: UploadedFile = {
                    name: file.name,
                    type: file.type,
                    base64Data: base64String,
                    isImage: file.type.startsWith('image/'),
                };
                setUploadedFiles(prev => [...prev, newFile]);
            };
            reader.readAsDataURL(file);
        });
        
        event.target.value = ''; // Reset file input to allow re-uploading the same file
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
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
                                {message.files && message.files.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {message.files.map((file, fileIndex) => (
                                            <div key={fileIndex}>
                                                {file.isImage ? (
                                                    <img src={`data:${file.type};base64,${file.base64Data}`} alt={file.name} className="h-24 w-24 object-cover rounded-lg" />
                                                ) : (
                                                    <div className="h-24 w-24 bg-[#2d2d2d] rounded-lg flex flex-col items-center justify-center p-2 text-center">
                                                        <PaperclipIcon className="w-8 h-8 mb-1 text-gray-400" />
                                                        <span className="text-xs text-gray-300 break-all">{file.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {message.content && <p className="text-white whitespace-pre-wrap font-mono">{message.content}</p>}
                            </div>
                        </div>
                    ) : (
                        <div key={index} className="flex justify-start">
                             <div className="flex flex-col gap-4 max-w-[80%]">
                                <div>
                                    <MarkdownRenderer content={message.content} isLoading={isLoading && index === messages.length - 1} />
                                </div>
                                <div className="flex items-center gap-4">
                                    <AiMessageAction icon={copiedStates[index] ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />} onClick={() => handleCopy(message.content, index)} />
                                </div>
                            </div>
                        </div>
                    )
                ))}
                
                {isLoading && (messages.length === 0 || messages[messages.length - 1].role === 'user') && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%]">
                            <div className="flex items-center gap-2 text-white">
                                <LightbulbIcon className="w-5 h-5 animate-pulse" />
                                <span>Thinking{thinkingDots}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </main>

        <footer className="px-4 md:px-6 py-3 flex justify-center">
            <div className="w-full max-w-4xl">
                <form onSubmit={handleSendMessage} className="bg-[#212121] rounded-3xl overflow-hidden flex flex-col border border-white/10">
                    {uploadedFiles.length > 0 && (
                        <div className="px-5 pt-3 flex flex-wrap gap-2 border-b border-white/10 pb-3">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="relative group">
                                    {file.isImage ? (
                                        <img
                                            src={`data:${file.type};base64,${file.base64Data}`}
                                            alt={file.name}
                                            className="h-20 w-20 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 bg-[#2d2d2d] rounded-lg flex flex-col items-center justify-center p-2 text-center">
                                            <PaperclipIcon className="w-6 h-6 mb-1 text-gray-400" />
                                            <span className="text-xs text-gray-300 truncate w-full">{file.name}</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black rounded-full text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity border border-white/50"
                                        aria-label={`Remove ${file.name}`}
                                    >
                                        <CloseIcon className="w-3 h-3"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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
                           <input type="file" id="file-upload" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple disabled={uploadedFiles.length >= 3} />
                           <label htmlFor="file-upload" className={`cursor-pointer text-white p-3 rounded-full inline-block ${uploadedFiles.length >= 3 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4a4a4b]'}`}>
                              <PlusIcon className="w-6 h-6" />
                           </label>
                        </div>
                        <div>
                            {isLoading ? (
                                <button type="button" onClick={() => generationControllerRef.current?.stop()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black transition-all active:scale-90">
                                    <SquareIcon className="w-6 h-6" />
                                </button>
                            ) : (
                                <button type="submit" disabled={!inputValue.trim() && uploadedFiles.length === 0} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black transition-all active:scale-90 hover:scale-110 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed">
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
