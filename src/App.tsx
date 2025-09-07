import { useState } from 'react';
import { Mic, Square, RotateCcw, AlertCircle, Send } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- TYPE DEFINITIONS ---
// These are placed at the top level for clarity and to prevent redeclaration.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- SPEECH-TO-TEXT COMPONENT ---
// A reusable component for handling voice input.
const SpeechToTextInput = ({ 
  onTranscriptChange, 
  placeholder, 
  value,
  onClear,
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState<any>(null); // Use 'any' for simplicity with vendor prefixes

  const initializeRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interim = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interim = transcript;
          }
        }
        
        if (finalTranscript) {
          onTranscriptChange(value + finalTranscript);
        }
        setInterimTranscript(interim);
        setError('');
      };
      
      recognitionInstance.onerror = (event: any) => {
        switch (event.error) {
          case 'no-speech':
            setError('No speech detected. Please try speaking again.');
            break;
          case 'audio-capture':
            setError('Microphone not available. Check your microphone.');
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow access.');
            break;
          case 'network':
            setError('Network error. Please check your connection.');
            break;
          default:
            setError(`Recognition error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setError('');
      };
      
      return recognitionInstance;
    }
    return null;
  };

  const startRecognition = () => {
    if (disabled) return;
    const recognitionInstance = recognition || initializeRecognition();
    if (recognitionInstance) {
      setRecognition(recognitionInstance);
      try {
        recognitionInstance.start();
      } catch (err) {
        setError('Failed to start speech recognition.');
      }
    } else {
      setError('Speech recognition not supported in this browser.');
    }
  };

  const stopRecognition = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleListening = () => {
    isListening ? stopRecognition() : startRecognition();
  };

  const clearTranscript = () => {
    if (onClear) {
      onClear();
    }
    setInterimTranscript('');
    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <button
          onClick={toggleListening}
          disabled={disabled}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            isListening
              ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse'
              : 'bg-gradient-to-r from-red-400 to-teal-400 hover:scale-105'
          }`}
        >
          {isListening ? (
            <><Square className="w-5 h-5" /><span>Stop Recording</span></>
          ) : (
            <><Mic className="w-5 h-5" /><span>Start Recording</span></>
          )}
        </button>
        <button
          onClick={clearTranscript}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium hover:scale-105 transition-all duration-300"
        >
          <RotateCcw className="w-5 h-5" />
          Clear
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      <div className={`p-4 rounded-lg min-h-[4rem] flex items-center transition-all duration-300 text-left ${
        value || interimTranscript 
          ? 'bg-white border-2 border-green-400 text-gray-800' 
          : 'bg-purple-50 border-2 border-dashed border-purple-300 text-gray-500 justify-center'
      }`}>
        <span className="break-words">{value || interimTranscript || placeholder}</span>
        {interimTranscript && (
          <span className="text-blue-600 italic bg-blue-50 px-1 rounded ml-2">
            {interimTranscript}
          </span>
        )}
        {isListening && !interimTranscript && !value && (
          <span className="text-gray-400 animate-pulse ml-2">●</span>
        )}
      </div>
    </div>
  );
};


// --- MAIN AI STUDIO COMPONENT ---
const AiCreativeCommerceStudio = () => {
  // --- STATE MANAGEMENT ---
  const [showMainApp, setShowMainApp] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [transcript, setTranscript] = useState('');
  const [enhanceTranscript, setEnhanceTranscript] = useState('');
  
  // -- Modification State --
  const [modifyInput, setModifyInput] = useState(''); // Holds both text and voice input for modifications
  const [modificationMode, setModificationMode] = useState('voice'); // 'voice' or 'text'
  const [chat, setChat] = useState<any>(null); // State for the conversational chat instance
  
  // -- Loading and UI State --
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [currentDesignUrl, setCurrentDesignUrl] = useState('');
  const [designInfo, setDesignInfo] = useState({ style: '-', dimensions: '-', qualityScore: '-' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState(1);

  // --- HELPER FUNCTIONS ---
  const validateApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      showSuccess('API key configured successfully!');
    }
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showLoading = () => {
    setIsLoading(true);
    setProgress(0);
    setTimeRemaining(15);
    setLoadingStep(1);
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 6.67;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
      setTimeRemaining(prev => Math.max(0, prev - 1));
      setLoadingStep(prev => {
        if (progress < 25) return 1;
        if (progress < 50) return 2;
        if (progress < 75) return 3;
        return 4;
      });
    }, 1000);
  };

  // --- API LOGIC ---
  const processApiResponse = (response: any) => {
    const imagePart = response.candidates && response.candidates[0]?.content?.parts?.find((part: any) => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      const { data, mimeType } = imagePart.inlineData;
      const imageUrl = `data:${mimeType};base64,${data}`;
      setCurrentDesignUrl(imageUrl);
      setDesignInfo({ style: 'AI Generated', dimensions: 'Resolution from AI', qualityScore: 'N/A' });
    } else {
      console.error("API response did not contain image data:", response);
      throw new Error("No image data found in the API response. The model may have returned text instead.");
    }
    setIsLoading(false);
  };
const generateDesign = async () => {
    if (!apiKey || !transcript) {
      showError(!apiKey ? 'Please enter your Gemini API key first.' : 'Please provide your design idea first.');
      return;
    }
    showLoading();
    
    let prompt = `Create a high-quality, commercial-ready design based on this idea: "${transcript}"`;
    if (enhanceTranscript) {
      prompt += ` with these style preferences: "${enhanceTranscript}"`;
    }
    prompt += '. Make it suitable for print-on-demand products, especially t-shirts. Focus on clean, scalable vector-style artwork.';
    
    try {
      const ai = new GoogleGenAI(apiKey);
      
      const newChat = ai.chats.create({ model: "gemini-2.5-flash-image-preview" });
      
      setChat(newChat);

      // CORRECTED LINE: Wrap the prompt in the required array structure
      const response = await newChat.sendMessage({ message: prompt });
      
      processApiResponse(response);
      
    } catch (error) {
      console.error('API call failed:', error);
      setIsLoading(false);
      showError('Failed to generate design. Check API key and console.');
    }
  };

  const applyModification = async () => {
    if (!chat) {
      showError('No active design session to modify.');
      return;
    }
    if (!modifyInput.trim()) {
      showError('Please provide a modification instruction.');
      return;
    }

    setIsLoading(true);
    const modificationPrompt = modifyInput; // Grab the value before clearing
    setModifyInput(''); // Clear input after sending

    try {
      console.log("Sending modification prompt:", modificationPrompt);

      // CORRECTED LINE: Wrap the prompt in the required array structure
      const response = await chat.sendMessage({ message: modificationPrompt });
      
      console.log("Modification response:", response);
      processApiResponse(response);

    } catch (error) {
      console.error('API modification failed:', error);
      setIsLoading(false);
      showError('Failed to apply modification.');
    }
  };
  const regenerateDesign = async () => {
    if (!chat) {
      showError('No design to regenerate.');
      return;
    }
    setModifyInput("Generate a completely different variation with a fresh creative approach.");
    // Use a timeout to ensure state update before calling applyModification
    setTimeout(() => applyModification(), 0);
  };

  const demoOnTshirt = async () => {
    if (!chat) return;
    const brandName = window.prompt("Please enter your brand name (leave blank for none):");
    if (brandName === null) return; // User cancelled
    showLoading();

    let demoPrompt = `Place the latest design on a realistic t-shirt mockup.`;

    try {
        if (brandName.trim()) {
            demoPrompt += ` The t-shirt should also feature the brand name "${brandName}" in a stylish, complementary font.`;
        } else {
            const followupResponse = await chat.sendMessage("Based on our conversation and the design style, suggest a fitting brand name and concept.");
            const suggestedBrand = followupResponse.response.text();
            demoPrompt += ` The t-shirt should represent a brand concept like this: ${suggestedBrand}.`;
        }
        const response = await chat.sendMessage(demoPrompt);
        processApiResponse(response);
        showSuccess("T-shirt mockup generated!");
    } catch(error) {
        console.error('T-shirt demo failed:', error);
        setIsLoading(false);
        showError('Could not generate the t-shirt mockup.');
    }
  };

  // --- UI RENDER LOGIC ---
  if (!showMainApp) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center text-white p-8 relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-yellow-300 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-300 rounded-full animate-ping"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
            🎨 AI Creative Commerce Studio
          </h1>
          <p className="text-xl md:text-2xl mb-2 opacity-90">From Voice Ideas to Products</p>
          <p className="text-lg md:text-xl mb-12 opacity-80">in 60 seconds</p>
          <button 
            onClick={() => setShowMainApp(true)}
            className="bg-gradient-to-r from-red-500 to-teal-400 text-white px-8 py-4 text-xl rounded-full hover:scale-105 transform transition-all duration-300 shadow-2xl hover:shadow-3xl animate-bounce"
          >
            🎤 Start Creating Now
          </button>
          <p className="absolute bottom-8 text-sm opacity-70">✨ Powered by Nano Banana AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">🎨 AI Creative Studio</h2>
          <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full backdrop-blur-md">
            <span className="font-semibold">🔑 Gemini API Key:</span>
            <input
              type="password"
              className="bg-transparent text-white px-3 py-1 rounded-full border-none outline-none placeholder-white placeholder-opacity-70"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => validateApiKey(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="container mx-auto px-6 pt-4">
        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r-lg" role="alert">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-r-lg" role="alert">{successMessage}</div>
        )}
      </div>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 container mx-auto">
        {/* Input Panel */}
        <div className="bg-white rounded-3xl p-8 shadow-xl space-y-8">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Step 1: 🎤 Voice Your Idea</h3>
            <SpeechToTextInput onTranscriptChange={setTranscript} placeholder='e.g., "A minimalist mountain logo for outdoor apparel"' value={transcript} onClear={() => setTranscript('')} />
          </div>

          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Step 2: 🤖 AI Enhancement</h3>
            <SpeechToTextInput onTranscriptChange={setEnhanceTranscript} placeholder='e.g., "Make it vintage style with earth tones"' value={enhanceTranscript} onClear={() => setEnhanceTranscript('')} />
            <button onClick={generateDesign} disabled={!transcript || isLoading} className="w-full mt-4 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform duration-300">
              🍌 Generate with Nano Banana
            </button>
          </div>

          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-l-4 border-purple-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">Step 3: 🔧 Modify Your Design</h3>
              <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-full">
                <button onClick={() => setModificationMode('voice')} className={`px-4 py-1 text-sm rounded-full transition-colors ${modificationMode === 'voice' ? 'bg-white shadow' : 'bg-transparent'}`}>Voice</button>
                <button onClick={() => setModificationMode('text')} className={`px-4 py-1 text-sm rounded-full transition-colors ${modificationMode === 'text' ? 'bg-white shadow' : 'bg-transparent'}`}>Text</button>
              </div>
            </div>
            {modificationMode === 'voice' ? (
              <>
                <SpeechToTextInput onTranscriptChange={setModifyInput} placeholder='e.g., "Make the sun bigger"' value={modifyInput} onClear={() => setModifyInput('')} disabled={!currentDesignUrl || isLoading} />
                <button onClick={applyModification} disabled={!currentDesignUrl || isLoading || !modifyInput.trim()} className="w-full mt-4 px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-full disabled:opacity-50">Apply Voice Modification</button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input type="text" value={modifyInput} onChange={(e) => setModifyInput(e.target.value)} placeholder="Type your changes..." className="flex-grow p-3 border-2 border-gray-300 rounded-full focus:outline-none focus:border-purple-500" disabled={!currentDesignUrl || isLoading} />
                <button onClick={applyModification} className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50" disabled={!currentDesignUrl || isLoading || !modifyInput.trim()}><Send className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-3xl p-8 shadow-xl sticky top-24 h-fit">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">🎨 Live Preview</h3>
          {isLoading && (
            <div className="text-center p-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl mb-6">
              <div className="text-6xl mb-4 animate-bounce">🍌</div>
              <h3 className="text-xl font-bold mb-4">Nano Banana Generating...</h3>
              <div className="bg-gray-200 h-3 rounded-full mb-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
              <p className="mb-4">{Math.round(progress)}% Complete</p>
              <div className="text-left space-y-2 mb-4 text-sm">
                <p className={`transition-opacity duration-300 ${loadingStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>✨ Analyzing vision...</p>
                <p className={`transition-opacity duration-300 ${loadingStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>🎨 Generating design...</p>
                <p className={`transition-opacity duration-300 ${loadingStep >= 3 ? 'opacity-100' : 'opacity-40'}`}>🔧 Optimizing quality...</p>
                <p className={`transition-opacity duration-300 ${loadingStep >= 4 ? 'opacity-100' : 'opacity-40'}`}>🎯 Finalizing...</p>
              </div>
              <p>ETA: <span className="font-bold">{timeRemaining}</span>s</p>
            </div>
          )}
          <div className={`rounded-2xl min-h-[20rem] flex items-center justify-center mb-6 transition-all duration-300 ${currentDesignUrl ? 'bg-white shadow-lg' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300'}`}>
            {currentDesignUrl ? (<img src={currentDesignUrl} alt="Generated Design" className="max-w-full max-h-96 rounded-lg shadow-md" />) : (<p className="text-gray-500">Your generated design will appear here</p>)}
          </div>
          {currentDesignUrl && !isLoading && (
            <>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <p><strong>🎨 Style:</strong> <span>{designInfo.style}</span></p>
                <p><strong>📐 Dimensions:</strong> <span>{designInfo.dimensions}</span></p>
                <p><strong>🎯 Print Quality Score:</strong> <span>{designInfo.qualityScore}</span></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={regenerateDesign} className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-full hover:scale-105 transition-transform duration-300">🔄 Regenerate</button>
                <button onClick={demoOnTshirt} className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-full hover:scale-105 transition-transform duration-300">👕 Demo on T-shirt</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AiCreativeCommerceStudio;