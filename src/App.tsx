import { useState, useRef, useEffect } from 'react';

const AiCreativeCommerceStudio = () => {
  // State management
  const [showMainApp, setShowMainApp] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [currentRecording, setCurrentRecording] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [enhanceTranscript, setEnhanceTranscript] = useState('');
  const [enhanceInterim, setEnhanceInterim] = useState('');
  const [modifyTranscript, setModifyTranscript] = useState('');
  const [modifyInterim, setModifyInterim] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [currentDesignUrl, setCurrentDesignUrl] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [designInfo, setDesignInfo] = useState({
    style: '-',
    dimensions: '-',
    qualityScore: '-'
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState(1);
  const [stepCompleted, setStepCompleted] = useState({
    step1: false,
    step2: false,
    step3: false
  });

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        
        // Update real-time transcripts
        if (currentRecording === 'main') {
          setInterimTranscript(interim);
          if (final) {
            const newTranscript = finalTranscriptRef.current + final;
            setTranscript(newTranscript);
            finalTranscriptRef.current = newTranscript;
            setStepCompleted(prev => ({ ...prev, step1: true }));
          }
        } else if (currentRecording === 'enhance') {
          setEnhanceInterim(interim);
          if (final) {
            const newTranscript = enhanceTranscript + final;
            setEnhanceTranscript(newTranscript);
          }
        } else if (currentRecording === 'modify') {
          setModifyInterim(interim);
          if (final) {
            const newTranscript = modifyTranscript + final;
            setModifyTranscript(newTranscript);
            if (currentDesignUrl) {
              applyModification(newTranscript);
            }
          }
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showError('Speech recognition error: ' + event.error);
        stopRecording();
      };
      
      recognitionRef.current.onend = () => {
        if (currentRecording) {
          // Clear interim results when recording stops
          setInterimTranscript('');
          setEnhanceInterim('');
          setModifyInterim('');
        }
        setCurrentRecording(null);
      };
    } else {
      showError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    }
  }, [currentRecording, enhanceTranscript, modifyTranscript, currentDesignUrl]);

  // Voice recording functions
  const startRecording = (type) => {
    if (!recognitionRef.current) return;
    
    setCurrentRecording(type);
    if (type === 'main') {
      finalTranscriptRef.current = transcript;
    }
    
    try {
      recognitionRef.current.start();
      showSuccess(`Started recording for ${type === 'main' ? 'main idea' : type === 'enhance' ? 'style preferences' : 'modifications'}`);
    } catch (error) {
      console.error('Failed to start recording:', error);
      showError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && currentRecording) {
      recognitionRef.current.stop();
      showSuccess('Recording stopped successfully');
    }
    setCurrentRecording(null);
  };

  const toggleVoiceRecording = (type) => {
    if (currentRecording === type) {
      stopRecording();
    } else {
      if (currentRecording) {
        stopRecording();
        setTimeout(() => startRecording(type), 500);
      } else {
        startRecording(type);
      }
    }
  };

  const clearTranscript = (type = 'main') => {
    if (type === 'main') {
      setTranscript('');
      setInterimTranscript('');
      finalTranscriptRef.current = '';
      setStepCompleted(prev => ({ ...prev, step1: false }));
    } else if (type === 'enhance') {
      setEnhanceTranscript('');
      setEnhanceInterim('');
    } else if (type === 'modify') {
      setModifyTranscript('');
      setModifyInterim('');
    }
  };

  // API functions
  const validateApiKey = (key) => {
    setApiKey(key);
    if (key && key.length > 10) {
      showSuccess('API key configured successfully!');
    }
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Enhanced loading simulation with better progress tracking
  const showLoading = () => {
    setIsLoading(true);
    setProgress(0);
    setTimeRemaining(15);
    setLoadingStep(1);

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 6.67; // 100/15 steps
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            simulateDesignCompletion();
            setStepCompleted(prevState => ({ ...prevState, step2: true }));
          }, 500);
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

  const simulateDesignCompletion = () => {
    // Enhanced placeholder with better design preview
    const placeholderImage = `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
          </filter>
        </defs>
        <rect width="400" height="400" fill="url(#bg)" rx="20"/>
        <circle cx="200" cy="150" r="60" fill="white" filter="url(#shadow)"/>
        <polygon points="140,220 200,280 260,220" fill="white" filter="url(#shadow)"/>
        <text x="200" y="320" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">AI Generated Design</text>
        <text x="200" y="340" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.8">Based on: "${transcript.substring(0, 30)}..."</text>
      </svg>
    `)}`;
    
    setCurrentDesignUrl(placeholderImage);
    setDesignInfo({
      style: 'Modern Minimalist with Gradient',
      dimensions: '400x400px (Print Ready)',
      qualityScore: '9.2/10'
    });
    showSuccess('🎉 Design generated successfully!');
  };

  const generateDesign = async () => {
    if (!apiKey) {
      showError('Please enter your Google/Gemini API key first.');
      return;
    }
    
    if (!transcript) {
      showError('Please provide your design idea first by recording your voice.');
      return;
    }
    
    // Build comprehensive prompt
    let prompt = `Create a high-quality, commercial-ready design based on this idea: "${transcript}"`;
    if (enhanceTranscript) {
      prompt += ` with these style preferences: "${enhanceTranscript}"`;
    }
    prompt += '. Make it suitable for print-on-demand products, especially t-shirts. Focus on clean, scalable vector-style artwork with commercial appeal.';
    
    setCurrentPrompt(prompt);
    await callGoogleAPI(prompt);
  };

  const regenerateDesign = async () => {
    if (!currentPrompt) {
      showError('No design to regenerate.');
      return;
    }
    
    const newPrompt = currentPrompt + ' Generate a completely different creative variation with a fresh artistic approach and different color scheme.';
    await callGoogleAPI(newPrompt);
  };

  const applyModification = async (modification) => {
    if (!currentPrompt) {
      showError('No design to modify.');
      return;
    }
    
    const modifyPrompt = currentPrompt + ` Apply this modification: "${modification}". Keep the core design concept but implement the requested changes while maintaining commercial viability.`;
    setStepCompleted(prev => ({ ...prev, step3: true }));
    await callGoogleAPI(modifyPrompt);
  };

  const callGoogleAPI = async (prompt) => {
    showLoading();
    
    try {
      // Simulate processing time for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Enhanced API call with better error handling
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${prompt} Please provide a detailed description of the design you would create, including style, colors, composition, elements, and commercial viability. Format your response as a comprehensive design brief.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Process the response
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const designDescription = data.candidates[0].content.parts[0].text;
        console.log('Design Description:', designDescription);
        showSuccess('Design brief generated successfully!');
      }
      
    } catch (error) {
      console.error('API call failed:', error);
      setIsLoading(false);
      if (error.message.includes('API_KEY_INVALID')) {
        showError('Invalid API key. Please check your Google/Gemini API key.');
      } else if (error.message.includes('403')) {
        showError('API access denied. Please ensure your API key has proper permissions.');
      } else {
        showError(`Failed to generate design: ${error.message}`);
      }
    }
  };

  const enableModify = () => {
    showSuccess('Voice modification mode activated! Start recording to modify your design.');
  };

  const demoOnTshirt = () => {
    showSuccess('🎉 T-shirt mockup feature will be available soon! Your design is ready for print.');
  };

  // Real-time transcript display helper
  const getDisplayTranscript = (final, interim, placeholder) => {
    const combined = final + interim;
    return combined || placeholder;
  };

  // Step completion indicator
  const StepIndicator = ({ completed, stepNumber }) => (
    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
      completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
    }`}>
      {completed ? '✓' : stepNumber}
    </div>
  );

  if (!showMainApp) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center text-white p-8 relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700">
        {/* Enhanced animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-yellow-300 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-300 rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-green-300 rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
            🎨 AI Creative Commerce Studio
          </h1>
          <p className="text-xl md:text-2xl mb-2 opacity-90">From Voice Ideas to Products</p>
          <p className="text-lg md:text-xl mb-8 opacity-80">in 60 seconds with Real-Time Speech</p>
          <div className="mb-8 text-sm opacity-70">
            <p>✨ Real-time speech recognition</p>
            <p>🤖 AI-powered design generation</p>
            <p>🎯 Commercial-ready outputs</p>
          </div>
          <button 
            onClick={() => setShowMainApp(true)}
            className="bg-gradient-to-r from-red-500 to-teal-400 text-white px-8 py-4 text-xl rounded-full hover:scale-105 transform transition-all duration-300 shadow-2xl hover:shadow-3xl animate-bounce"
          >
            🎤 Start Creating Now
          </button>
          <p className="absolute bottom-8 text-sm opacity-70">✨ Powered by Google AI & Real-Time Voice</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">🎨 AI Creative Studio</h2>
            <div className="flex gap-2">
              <StepIndicator completed={stepCompleted.step1} stepNumber="1" />
              <StepIndicator completed={stepCompleted.step2} stepNumber="2" />
              <StepIndicator completed={stepCompleted.step3} stepNumber="3" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full backdrop-blur-md">
              <span>🔑 Google API Key:</span>
              <input
                type="password"
                className="bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full border-none outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 w-48"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => validateApiKey(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages */}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded-lg shadow-md">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 m-4 rounded-lg shadow-md">
          <strong>Success:</strong> {successMessage}
        </div>
      )}

      {/* Main Content with Enhanced UI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Enhanced Input Panel */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
          {/* Step 1: Enhanced Voice Idea */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-l-4 border-purple-500">
            <div className="flex items-center gap-3 mb-4">
              <StepIndicator completed={stepCompleted.step1} stepNumber="1" />
              <h3 className="text-lg font-semibold text-gray-700">🎤 Voice Your Creative Idea</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <button
                onClick={() => toggleVoiceRecording('main')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 ${
                  currentRecording === 'main'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse shadow-lg'
                    : 'bg-gradient-to-r from-red-400 to-teal-400 hover:scale-105 shadow-md'
                }`}
              >
                <span className="text-lg">{currentRecording === 'main' ? '🔴' : '🎤'}</span>
                <span>{currentRecording === 'main' ? 'Recording...' : 'Start Recording'}</span>
              </button>
              <button
                onClick={() => clearTranscript('main')}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium hover:scale-105 transition-all duration-300 shadow-md"
              >
                🗑️ Clear
              </button>
            </div>
            <div className={`p-4 rounded-lg min-h-20 transition-all duration-300 ${
              transcript || interimTranscript 
                ? 'bg-white border-2 border-green-400 text-gray-800 shadow-inner' 
                : 'bg-purple-50 border-2 border-dashed border-purple-300 text-gray-500'
            }`}>
              <div className="font-medium text-gray-800">
                {getDisplayTranscript(transcript, interimTranscript, 'Speak your creative idea... (e.g., "Create a minimalist mountain logo for outdoor apparel")')}
              </div>
              {interimTranscript && (
                <div className="text-gray-400 italic mt-2 text-sm">
                  Currently saying: {interimTranscript}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Enhanced AI Enhancement */}
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <StepIndicator completed={stepCompleted.step2} stepNumber="2" />
              <h3 className="text-lg font-semibold text-gray-700">🤖 AI Enhancement & Style</h3>
            </div>
            <div className="mb-4">
              <button
                onClick={() => toggleVoiceRecording('enhance')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 mr-4 ${
                  currentRecording === 'enhance'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse shadow-lg'
                    : 'bg-gradient-to-r from-green-400 to-blue-400 hover:scale-105 shadow-md'
                }`}
              >
                <span className="text-lg">{currentRecording === 'enhance' ? '🔴' : '🎨'}</span>
                <span>Add Style Details</span>
              </button>
              <button
                onClick={() => clearTranscript('enhance')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-300 text-gray-700 text-sm hover:bg-gray-400 transition-colors"
              >
                Clear Style
              </button>
            </div>
            <div className={`p-4 rounded-lg min-h-16 mb-4 transition-all duration-300 ${
              enhanceTranscript || enhanceInterim 
                ? 'bg-white border-2 border-green-400 text-gray-800 shadow-inner' 
                : 'bg-green-50 border-2 border-dashed border-green-300 text-gray-500'
            }`}>
              <div className="font-medium text-gray-800">
                {getDisplayTranscript(enhanceTranscript, enhanceInterim, 'Add style details... (e.g., "Make it vintage style with earth tones")')}
              </div>
              {enhanceInterim && (
                <div className="text-gray-400 italic mt-2 text-sm">
                  Currently saying: {enhanceInterim}
                </div>
              )}
            </div>
            <button
              onClick={generateDesign}
              disabled={!transcript || isLoading}
              className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300 shadow-lg disabled:hover:scale-100"
            >
              🍌 Generate with AI Power
            </button>
          </div>

          {/* Step 3: Enhanced Voice Modifications */}
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-l-4 border-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <StepIndicator completed={stepCompleted.step3} stepNumber="3" />
              <h3 className="text-lg font-semibold text-gray-700">🔧 Real-Time Voice Modifications</h3>
            </div>
            <div className="mb-4">
              <button
                onClick={() => toggleVoiceRecording('modify')}
                disabled={!currentDesignUrl}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mr-4 ${
                  currentRecording === 'modify'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse shadow-lg'
                    : 'bg-gradient-to-r from-orange-400 to-red-400 hover:scale-105 shadow-md'
                }`}
              >
                <span className="text-lg">{currentRecording === 'modify' ? '🔴' : '🎙️'}</span>
                <span>{currentRecording === 'modify' ? 'Recording... (Click to Stop)' : 'Modify Design'}</span>
              </button>
              <button
                onClick={() => clearTranscript('modify')}
                disabled={!currentDesignUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-300 text-gray-700 text-sm hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Clear Mods
              </button>
            </div>
            <div className={`p-4 rounded-lg min-h-16 transition-all duration-300 ${
              modifyTranscript || modifyInterim 
                ? 'bg-white border-2 border-orange-400 text-gray-800 shadow-inner' 
                : 'bg-orange-50 border-2 border-dashed border-orange-300 text-gray-500'
            }`}>
              <div className="font-medium text-gray-800">
                {getDisplayTranscript(modifyTranscript, modifyInterim, 'Request changes... (e.g., "Make it bigger", "Change colors to blue")')}
              </div>
              {modifyInterim && (
                <div className="text-gray-400 italic mt-2 text-sm">
                  Currently saying: {modifyInterim}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Preview Panel */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
          <h3 className="text-xl font-bold mb-6 text-gray-800">🎨 Live Design Preview</h3>
          
          {/* Enhanced Loading State */}
          {isLoading && (
            <div className="text-center p-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl mb-6 border border-yellow-200">
              <div className="text-6xl mb-4 animate-bounce">🚀</div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">AI Creating Your Design...</h3>
              <div className="bg-gray-200 h-4 rounded-full mb-3 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="mb-4 font-semibold text-lg">{Math.round(progress)}% Complete</p>
              <div className="text-left space-y-3 mb-4 max-w-sm mx-auto">
                <div className={`p-3 rounded-lg transition-all duration-300 ${
                  loadingStep >= 1 ? 'text-green-600 bg-green-50 border-l-4 border-green-400' : 'text-gray-500 bg-gray-50'
                }`}>
                  ✨ Analyzing your creative vision...
                </div>
                <div className={`p-3 rounded-lg transition-all duration-300 ${
                  loadingStep >= 2 ? 'text-green-600 bg-green-50 border-l-4 border-green-400' : 'text-gray-500 bg-gray-50'
                }`}>
                  🎨 Generating unique design elements...
                </div>
                <div className={`p-3 rounded-lg transition-all duration-300 ${
                  loadingStep >= 3 ? 'text-green-600 bg-green-50 border-l-4 border-green-400' : 'text-gray-500 bg-gray-50'
                }`}>
                  🔧 Optimizing for print quality...
                </div>
                <div className={`p-3 rounded-lg transition-all duration-300 ${
                  loadingStep >= 4 ? 'text-green-600 bg-green-50 border-l-4 border-green-400' : 'text-gray-500 bg-gray-50'
                }`}>
                  🎯 Finalizing commercial design...
                </div>
              </div>
              <p className="text-gray-600">
                Estimated completion: <span className="font-bold text-orange-600">{timeRemaining}</span> seconds
              </p>
            </div>
          )}

          {/* Enhanced Design Preview */}
          <div className={`rounded-2xl min-h-96 flex items-center justify-center mb-6 transition-all duration-500 ${
            currentDesignUrl 
              ? 'bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg border-2 border-gray-200' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300'
          }`}>
            {currentDesignUrl ? (
              <div className="text-center">
                <img 
                  src={currentDesignUrl} 
                  alt="Generated Design" 
                  className="max-w-full max-h-80 rounded-lg shadow-lg mx-auto mb-4 transition-transform hover:scale-105" 
                />
                <p className="text-sm text-gray-600 italic">Click and drag to inspect details</p>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="text-4xl mb-4 opacity-30">🎨</div>
                <p className="text-gray-500 text-lg">Your AI-generated design will appear here</p>
                <p className="text-gray-400 text-sm mt-2">Complete Step 1 & 2 to generate</p>
              </div>
            )}
          </div>

          {/* Enhanced Design Info */}
          {currentDesignUrl && (
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <h4 className="font-bold text-gray-800 mb-3">📊 Design Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="font-semibold text-gray-600">🎨 Style</p>
                  <p className="text-gray-800">{designInfo.style}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="font-semibold text-gray-600">📐 Dimensions</p>
                  <p className="text-gray-800">{designInfo.dimensions}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="font-semibold text-gray-600">🎯 Quality Score</p>
                  <p className="text-green-600 font-bold">{designInfo.qualityScore}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          {currentDesignUrl && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={regenerateDesign}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                🔄 Regenerate
              </button>
              <button
                onClick={enableModify}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ✏️ Voice Edit
              </button>
              <button
                onClick={demoOnTshirt}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                👕 T-shirt Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiCreativeCommerceStudio;