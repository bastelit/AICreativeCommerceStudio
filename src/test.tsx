import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, RotateCcw, AlertCircle } from 'lucide-react';

// TypeScript declarations for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      // Create recognition instance
      const recognition = new SpeechRecognition();
      
      // Configure recognition settings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Handle results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('Speech recognition result:', event);
        let finalTranscript = '';
        let interim = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
        setInterimTranscript(interim);
        setError(''); // Clear any previous errors
      };
      
      // Handle errors
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'no-speech':
            setError('No speech detected. Please try speaking again.');
            break;
          case 'audio-capture':
            setError('Microphone not available. Please check your microphone.');
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access.');
            break;
          case 'network':
            setError('Network error. Please check your internet connection.');
            break;
          default:
            setError(`Recognition error: ${event.error}`);
        }
        
        // Don't auto-restart on permission errors
        if (event.error !== 'not-allowed' && event.error !== 'audio-capture') {
          if (isListeningRef.current) {
            setTimeout(() => {
              startRecognition();
            }, 1000);
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };
      
      // Handle end event
      recognition.onend = () => {
        console.log('Recognition ended, isListening:', isListeningRef.current);
        
        // Only restart if we should still be listening
        if (isListeningRef.current) {
          setTimeout(() => {
            startRecognition();
          }, 100);
        } else {
          setIsListening(false);
        }
      };
      
      // Handle start event
      recognition.onstart = () => {
        console.log('Recognition started');
        setIsListening(true);
        setError('');
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser.');
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, []);

  const startRecognition = () => {
    if (recognitionRef.current && !isListening) {
      try {
        console.log('Starting recognition...');
        isListeningRef.current = true;
        recognitionRef.current.start();
        setError('');
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Failed to start speech recognition. Please try again.');
        isListeningRef.current = false;
      }
    }
  };

  const stopRecognition = () => {
    console.log('Stopping recognition...');
    isListeningRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
    
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setError('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      alert('Text copied to clipboard!');
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = transcript;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Text copied to clipboard!');
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Speech Recognition Not Supported
          </h2>
          <p className="text-gray-600 mb-4">
            Your browser doesn't support speech recognition. Please try:
          </p>
          <ul className="text-left text-gray-600 text-sm space-y-1">
            <li>• Use Chrome, Edge, or Safari</li>
            <li>• Enable microphone permissions</li>
            <li>• Use HTTPS connection</li>
            <li>• Update your browser to the latest version</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Speech to Text Converter
            </h1>
            <p className="text-gray-600">
              Click the microphone button and start speaking
            </p>
          </div>

          {/* Status Indicator */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                isListening 
                  ? 'bg-green-100 text-green-800 animate-pulse' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isListening ? (
                  <>
                    <Mic className="w-5 h-5" />
                    <span className="font-medium">Listening...</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-5 h-5" />
                    <span>Microphone off</span>
                  </>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleListening}
                disabled={!isSupported}
                className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all transform hover:scale-105 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {isListening ? (
                  <>
                    <Square className="w-5 h-5" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>Start Recording</span>
                  </>
                )}
              </button>
              
              <button
                onClick={resetTranscript}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center space-x-2 transition-all transform hover:scale-105"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Transcript Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Transcription
              </h2>
              {transcript && (
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm transition-colors"
                >
                  Copy Text
                </button>
              )}
            </div>
            
            <div className="min-h-[250px] p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              {transcript || interimTranscript ? (
                <div className="text-gray-800 leading-relaxed text-lg">
                  <span className="font-medium">{transcript}</span>
                  {interimTranscript && (
                    <span className="text-blue-600 italic bg-blue-50 px-1 rounded">
                      {interimTranscript}
                    </span>
                  )}
                  {isListening && !interimTranscript && (
                    <span className="text-gray-400 animate-pulse">●</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 italic text-center text-lg">
                    {isListening 
                      ? 'Listening... Start speaking now!' 
                      : 'Click "Start Recording" and begin speaking...'
                    }
                  </p>
                </div>
              )}
            </div>
            
            {/* Statistics */}
            {transcript && (
              <div className="mt-4 flex space-x-4 text-sm text-gray-500">
                <span>Words: {transcript.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                <span>Characters: {transcript.length}</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-3">
              💡 Tips for Better Speech Recognition:
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-blue-700 text-sm space-y-2">
                <li>• Speak clearly and at a moderate pace</li>
                <li>• Use a quiet environment</li>
                <li>• Position microphone 6-12 inches away</li>
                <li>• Avoid background noise</li>
              </ul>
              <ul className="text-blue-700 text-sm space-y-2">
                <li>• Ensure stable internet connection</li>
                <li>• Allow microphone permissions</li>
                <li>• Use Chrome/Edge for best results</li>
                <li>• Speak in complete sentences</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;