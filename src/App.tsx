import { useState, useEffect } from 'react';
import { Mic, Square, RotateCcw, AlertCircle, Send, Wand2, Bot, Palette, ShoppingCart, Download, Share2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { CREATIVE_DIRECTOR_PROMPT, NANO_BANANA_PROMPT } from './prompts.js';
import Card from './components/Card.tsx';

// --- TYPE DEFINITIONS ---
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Add these interfaces to your file

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      isFinal: boolean;
      [key: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}


// Define the types for your component's props
type SpeechToTextInputProps = {
  onTranscriptChange: (transcript: string) => void;
  placeholder: string;
  value: string;
  onClear: () => void;
  disabled?: boolean;
};

// --- SPEECH-TO-TEXT COMPONENT ---
// A reusable component for handling voice input.
const SpeechToTextInput: React.FC<SpeechToTextInputProps> = ({
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
      
      recognitionInstance.onresult = (event: SpeechRecognitionEvent ) => {
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
      
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent ) => {
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


// BRAND NAME POPUP COMPONENT 
interface BrandPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (brandName: string) => void;
  onSkip: () => void;
}

const BrandNamePopup: React.FC<BrandPopupProps> = ({ isOpen, onClose, onSubmit, onSkip }) => {
  const [brandName, setBrandName] = useState('');

  const handleSubmit = () => {
    onSubmit(brandName.trim());
    setBrandName('');
    onClose();
  };

  const handleSkip = () => {
    onSkip();
    setBrandName('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-300">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">T-Shirt Mockup</h2>
          <p className="text-gray-600 text-sm">
            Would you like to add your brand name to the t-shirt design?
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name (Optional)
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter your brand name..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to confirm or Escape to cancel
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              Skip & Continue
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              Add Brand Name
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}


// --- MAIN AI STUDIO COMPONENT ---
const AiCreativeCommerceStudio = () => {
  // --- STATE MANAGEMENT ---
  const [showMainApp, setShowMainApp] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('geminiApiKey') || ''); 
  const [transcript, setTranscript] = useState('');
  const [enhanceTranscript, setEnhanceTranscript] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState(''); 
  const [showBrandPopup, setShowBrandPopup] = useState(false);
  
  // -- Modification State --
  const [modifyInput, setModifyInput] = useState(''); 
  const [modificationMode, setModificationMode] = useState('voice'); 
  const [chat, setChat] = useState<any>(null); // State for the conversational chat instance
  
  // -- Loading and UI State --
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [currentDesignUrl, setCurrentDesignUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Initializing...'); 


   useEffect(() => {
    if (apiKey) {
      localStorage.setItem('geminiApiKey', apiKey);
    }
  }, [apiKey]);

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
  }, 1000);
};

  // ADDED: New helper function for prompt enhancement
  const getEnhancedPrompt = async (rawIdea: string) => {
    try {
      const ai = new GoogleGenAI(
        { apiKey: apiKey }
      );

      // CORRECTED METHOD: Use ai.models.generateContent for single text requests
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", 
        contents: [{ text: CREATIVE_DIRECTOR_PROMPT(rawIdea) }], 
      });

      // Correctly extract the text from the response structure
      const enhancedPromptText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      setEnhancedPrompt(enhancedPromptText);
      return enhancedPromptText || null;

    } catch (error) {
      console.error("Prompt enhancement failed:", error);
      showError("Could not enhance the creative idea.");
      return null;
    }
  };

  // --- API LOGIC ---
  const processApiResponse = (response: any) => {
    const imagePart = response.candidates && response.candidates[0]?.content?.parts?.find((part: any) => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      const { data, mimeType } = imagePart.inlineData;
      const imageUrl = `data:${mimeType};base64,${data}`;
      setCurrentDesignUrl(imageUrl);
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
    setLoadingMessage('✨ Enhancing your creative idea...');

    // Step 1: Combine user's ideas
    let rawIdea = transcript;
    if (enhanceTranscript) {
      rawIdea += ` with these style preferences: "${enhanceTranscript}"`;
    }

    // Step 2: Call the enhancement function
    const enhancedPromptText = await getEnhancedPrompt(rawIdea);
    
    if (!enhancedPromptText) {
      setIsLoading(false);
      return;
    }
    setLoadingMessage('🎨 Generating your design with Nano Banana...');
    // Step 3: Combine with Nano Banana prompt
    const finalPromptForImageModel = NANO_BANANA_PROMPT(enhancedPromptText);
    
    try {
      const ai = new GoogleGenAI({ apiKey:apiKey});
      
      const newChat = ai.chats.create({ model: "gemini-2.5-flash-image-preview" });
      
      setChat(newChat);

      
      const response = await newChat.sendMessage({ message: finalPromptForImageModel });
      
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


  const handleBrandSubmit = async (brandName: string) => {
  showLoading();
  
  let demoPrompt = `Place the latest design on a realistic t-shirt mockup.`;

  try {
    if (brandName) {
      demoPrompt += ` The t-shirt should also feature the brand name "${brandName}" in a stylish, complementary font.`;
    } else {
      demoPrompt += ` The t-shirt should feature a stylish, generic brand name that complements the design aesthetic.`;
    }
    
    const response = await chat.sendMessage({ message: demoPrompt });
    processApiResponse(response);
    showSuccess("T-shirt mockup generated!");
  } catch(error) {
    console.error('T-shirt demo failed:', error);
    setIsLoading(false);
    showError('Could not generate the t-shirt mockup.');
  }
}

const handleBrandSkip = async () => {
  handleBrandSubmit(''); // Call with empty string to skip
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
  setShowBrandPopup(true);
  };

  // const demoOnTshirt = async () => {
  //   if (!chat) return;
  //   const brandName = window.prompt("Please enter your brand name (leave blank for none):");
  //   if (brandName === null) return; // User cancelled
  //   showLoading();

  //   let demoPrompt = `Place the latest design on a realistic t-shirt mockup.`;

  //   try {
  //       if (brandName.trim()) {
  //           demoPrompt += ` The t-shirt should also feature the brand name "${brandName}" in a stylish, complementary font.`;
  //       } else {
  //           const followupResponse = await chat.sendMessage({ message: "Based on our conversation and the design style, suggest a fitting brand name and concept."});
  //           const suggestedBrand = followupResponse.response.text();
  //           demoPrompt += ` The t-shirt should represent a brand concept like this: ${suggestedBrand}.`;
  //       }
  //       const response = await chat.sendMessage({message : demoPrompt});
  //       processApiResponse(response);
  //       showSuccess("T-shirt mockup generated!");
  //   } catch(error) {
  //       console.error('T-shirt demo failed:', error);
  //       setIsLoading(false);
  //       showError('Could not generate the t-shirt mockup.');
  //   }
  // };

  // --- UI RENDER LOGIC ---
  if (!showMainApp) {
    // A more refined and animated landing page
    return (
      <div className="w-full min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 opacity-80"></div>
        {/* Animated background shapes for a modern feel */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full opacity-20 filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full opacity-20 filter blur-3xl animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            AI Creative Studio
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-2xl">
            Transform your voice into commercially-ready designs. Powered by Nano Banana AI.
          </p>
          <button
            onClick={() => setShowMainApp(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-full overflow-hidden transition-all duration-300 ease-in-out hover:bg-indigo-700 hover:scale-105"
          >
            <span className="absolute left-0 w-full h-0 transition-all duration-300 ease-in-out bg-white opacity-10 group-hover:h-full"></span>
            <span className="relative">🚀 Start Creating Now</span>
          </button>
        </div>
      </div>
    );
  }

  // The main application UI, now cleaner and more professional
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            🎨 AI Creative Studio
          </h1>
          <div className="flex items-center gap-2">
            <input
              type="password"
              className="px-4 py-2 text-sm border rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Your Gemini API Key"
              value={apiKey}
              onChange={(e) => validateApiKey(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Panel: Inputs - Using a more spacious layout */}
        <div className="lg:col-span-3 space-y-8">
          <Card title="Your Creative Idea" icon={<Wand2 />} step={1}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                💡 <strong>Describe your design idea:</strong> What do you want to create? Be specific about the subject, style, colors, or mood. 
                Example: "A minimalist mountain logo for outdoor apparel brand"
              </p>
              <div className="flex gap-2">
                <SpeechToTextInput
                  onTranscriptChange={setTranscript}
                  placeholder='e.g., "A minimalist mountain logo for outdoor apparel"'
                  value={transcript}
                  onClear={() => setTranscript('')}
                />
              </div>
              <div className="flex gap-2">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && transcript.trim()) {
                      e.preventDefault();
                      generateDesign();
                    }
                  }}
                  placeholder="Or type your design idea here... (Press Enter to generate)"
                  className="flex-grow p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          <Card title="Style & Enhancement" icon={<Palette />} step={2}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                🎨 <strong>Add style preferences (Optional):</strong> Specify colors, art style, mood, or additional details to enhance your design.
                Example: "Make it vintage style with earth tones and hand-drawn elements"
              </p>
              <div className="flex gap-2">
                <SpeechToTextInput
                  onTranscriptChange={setEnhanceTranscript}
                  placeholder='e.g., "Make it vintage style with earth tones"'
                  value={enhanceTranscript}
                  onClear={() => setEnhanceTranscript('')}
                />
              </div>
              <div className="flex gap-2">
                <textarea
                  value={enhanceTranscript}
                  onChange={(e) => setEnhanceTranscript(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && transcript.trim()) {
                      e.preventDefault();
                      generateDesign();
                    }
                  }}
                  placeholder="Or type style preferences here... (Press Enter to generate)"
                  className="flex-grow p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                />
              </div>
            </div>
            <button
              onClick={generateDesign}
              disabled={!transcript || isLoading}
              className="w-full mt-6 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🍌 Generate with Nano Banana
            </button>
          </Card>

          <Card title="Iterate & Modify" icon={<Bot />} step={3}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                ✨ <strong>Modify your design:</strong> Ask for specific changes to improve your design. Be clear about what you want to change.
                Example: "Make the logo bigger", "Change colors to blue and gold", "Add more details"
              </p>
              <div className="flex justify-end mb-4">
                <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-full">
                  <button onClick={() => setModificationMode('voice')} className={`px-4 py-1 text-sm rounded-full transition-colors ${modificationMode === 'voice' ? 'bg-white shadow' : ''}`}>Voice</button>
                  <button onClick={() => setModificationMode('text')} className={`px-4 py-1 text-sm rounded-full transition-colors ${modificationMode === 'text' ? 'bg-white shadow' : ''}`}>Text</button>
                </div>
              </div>
              {modificationMode === 'voice' ? (
                <>
                  <SpeechToTextInput onTranscriptChange={setModifyInput} placeholder='e.g., "Make the sun bigger"' value={modifyInput} onClear={() => setModifyInput('')} disabled={!currentDesignUrl || isLoading} />
                  <textarea
                    value={modifyInput}
                    onChange={(e) => setModifyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && modifyInput.trim() && currentDesignUrl) {
                        e.preventDefault();
                        applyModification();
                      }
                    }}
                    placeholder="Or edit modifications here... (Press Enter to apply)"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={2}
                    disabled={!currentDesignUrl || isLoading}
                  />
                  <button onClick={applyModification} disabled={!currentDesignUrl || isLoading || !modifyInput.trim()} className="w-full mt-4 py-3 bg-gray-800 text-white font-semibold rounded-full disabled:opacity-50">Apply Voice Modification</button>
                </>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={modifyInput}
                    onChange={(e) => setModifyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && modifyInput.trim() && currentDesignUrl) {
                        e.preventDefault();
                        applyModification();
                      }
                    }}
                    placeholder="Type your changes... (Press Enter to apply)"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    disabled={!currentDesignUrl || isLoading}
                  />
                  <button onClick={applyModification} className="w-full py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50" disabled={!currentDesignUrl || isLoading || !modifyInput.trim()}>
                    <Send className="inline w-4 h-4 mr-2" />
                    Apply Modification
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel: Preview - Sticky for better context */}
        <div className="lg:col-span-2 sticky top-24 h-fit">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Live Preview</h2>
            
            {/* Enhanced loading state with progress and time */}
            {isLoading && (
              <div className="text-center p-6 bg-indigo-50 rounded-xl mb-4">
                <div className="text-4xl animate-spin mb-4">⚙️</div>
                <h3 className="text-lg font-semibold text-indigo-800 mb-3">{loadingMessage}</h3>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Progress info */}
                <div className="flex justify-between text-sm text-indigo-600 mb-2">
                  <span>{Math.round(progress)}% complete</span>
                  <span>{timeRemaining}s remaining</span>
                </div>
                
                <p className="text-sm text-indigo-600">Please wait a moment...</p>
              </div>
            )}

            {/* Notifications are now inside the right panel */}
            {errorMessage && <div className="p-3 mb-4 bg-red-100 text-red-800 border-l-4 border-red-500 rounded-r-lg" role="alert">{errorMessage}</div>}
            {successMessage && <div className="p-3 mb-4 bg-green-100 text-green-800 border-l-4 border-green-500 rounded-r-lg" role="alert">{successMessage}</div>}
            {enhancedPrompt && !isLoading && <div className="p-3 mb-4 bg-gray-100 text-gray-800 border-l-4 border-gray-400 rounded-r-lg italic text-sm">{enhancedPrompt}</div>}
            
            <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden mb-4">
              {currentDesignUrl ? (
                <img src={currentDesignUrl} alt="Generated Design" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-500">
                  <Palette size={48} className="mx-auto mb-2" />
                  <p>Your design will appear here</p>
                </div>
              )}
            </div>
            
            {currentDesignUrl && !isLoading && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={regenerateDesign} className="flex-1 btn-secondary"><RotateCcw size={16} /> Regenerate</button>
                  <button onClick={demoOnTshirt} className="flex-1 btn-secondary"><ShoppingCart size={16} /> T-Shirt Mockup</button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button className="flex-1 btn-primary"><Download size={16} /> Download</button>
                  <button className="flex-1 btn-primary"><Share2 size={16} /> Share</button>
                </div>
              </div>
            )}

            {showBrandPopup && (
  <BrandNamePopup
    isOpen={showBrandPopup}
    onClose={() => setShowBrandPopup(false)}
    onSubmit={handleBrandSubmit}
    onSkip={handleBrandSkip}
  />
)}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiCreativeCommerceStudio;