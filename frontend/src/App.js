import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('eng');
  const [imageHistory, setImageHistory] = useState([]);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [theme, setTheme] = useState('light');
  const [extractionMode, setExtractionMode] = useState('questions'); // 'questions' or 'all'
  const fileInputRef = useRef(null);

  // Language options for Tesseract.js
  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' },
    { code: 'kor', name: 'Korean' }
  ];

  // Load saved preferences on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('textsratHistory');
    const savedTheme = localStorage.getItem('textsratTheme');
    const savedMode = localStorage.getItem('textsratMode');
    
    if (savedHistory) {
      setImageHistory(JSON.parse(savedHistory));
    }
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedMode) {
      setExtractionMode(savedMode);
    }
  }, []);

  // Function to extract questions from text
  const extractQuestions = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n').filter(line => line.trim());
    const questions = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if line contains question patterns
      if (
        trimmedLine.includes('?') ||
        trimmedLine.match(/^\d+[\.\)]\s*/) ||
        trimmedLine.match(/^[a-zA-Z][\.\)]\s*/) ||
        trimmedLine.match(/^Q\d*[\.\:\s]/i) ||
        trimmedLine.match(/^Question\s*\d*/i) ||
        trimmedLine.match(/^What|^How|^When|^Where|^Why|^Who|^Which|^Can|^Could|^Would|^Should|^Do|^Does|^Did|^Is|^Are|^Was|^Were/i) ||
        trimmedLine.match(/^Find|^Calculate|^Solve|^Determine|^Explain|^Describe|^Define|^Compare|^Analyze/i)
      ) {
        questions.push(trimmedLine);
      }
    });
    
    return questions;
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('textsratTheme', newTheme);
  };

  const toggleExtractionMode = () => {
    const newMode = extractionMode === 'questions' ? 'all' : 'questions';
    setExtractionMode(newMode);
    localStorage.setItem('textsratMode', newMode);
  };

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        extractText(e.target.result, file.name);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file (JPG, PNG, GIF, etc.)');
    }
  };

  const extractText = (imageData, fileName) => {
    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');
    setExtractedQuestions([]);
    setError('');

    Tesseract.recognize(imageData, selectedLanguage, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
        }
      }
    })
    .then(({ data: { text } }) => {
      setExtractedText(text);
      
      // Extract questions if in questions mode
      if (extractionMode === 'questions') {
        const questions = extractQuestions(text);
        setExtractedQuestions(questions);
      }
      
      setIsProcessing(false);
      
      // Save to history
      const historyItem = {
        id: Date.now(),
        fileName: fileName || 'Unknown',
        image: imageData,
        text: text,
        questions: extractionMode === 'questions' ? extractQuestions(text) : [],
        language: selectedLanguage,
        mode: extractionMode,
        timestamp: new Date().toISOString()
      };
      
      const newHistory = [historyItem, ...imageHistory.slice(0, 4)]; // Keep last 5 items
      setImageHistory(newHistory);
      localStorage.setItem('textsratHistory', JSON.stringify(newHistory));
    })
    .catch(err => {
      console.error('Error:', err);
      setError('Failed to extract text from image. Please try again.');
      setIsProcessing(false);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const getCurrentText = () => {
    if (extractionMode === 'questions') {
      return extractedQuestions.join('\n');
    }
    return extractedText;
  };

  const copyToClipboard = () => {
    const textToCopy = getCurrentText();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text:', err);
    });
  };

  const downloadText = () => {
    const textToDownload = getCurrentText();
    if (!textToDownload) return;
    
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textsrat-${extractionMode}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setImage(null);
    setExtractedText('');
    setExtractedQuestions([]);
    setProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadFromHistory = (historyItem) => {
    setImage(historyItem.image);
    setExtractedText(historyItem.text);
    setExtractedQuestions(historyItem.questions || []);
    setSelectedLanguage(historyItem.language);
    setExtractionMode(historyItem.mode || 'questions');
  };

  const clearHistory = () => {
    setImageHistory([]);
    localStorage.removeItem('textsratHistory');
  };

  const themeClasses = {
    light: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      cardBg: 'bg-white',
      text: 'text-gray-800',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-500',
      border: 'border-gray-300',
      hover: 'hover:bg-gray-50'
    },
    dark: {
      bg: 'bg-gradient-to-br from-gray-900 to-black',
      cardBg: 'bg-gray-800',
      text: 'text-gray-100',
      textSecondary: 'text-gray-300',
      textMuted: 'text-gray-400',
      border: 'border-gray-600',
      hover: 'hover:bg-gray-700'
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      {/* Header */}
      <header className={`${currentTheme.cardBg} shadow-sm border-b border-blue-100`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-blue-600">TextSrat</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-sm ${currentTheme.textMuted}`}>
                Extract text from any image with AI
              </div>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${currentTheme.hover} ${currentTheme.border} border transition-colors`}
              >
                {theme === 'light' ? (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Image Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`${currentTheme.cardBg} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${currentTheme.text}`}>Upload Image</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="extraction-mode" className={`text-sm font-medium ${currentTheme.textSecondary}`}>
                      Extract:
                    </label>
                    <button
                      onClick={toggleExtractionMode}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        extractionMode === 'questions' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {extractionMode === 'questions' ? 'Questions Only' : 'All Text'}
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="language-select" className={`text-sm font-medium ${currentTheme.textSecondary}`}>
                      Language:
                    </label>
                    <select
                      id="language-select"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className={`px-3 py-1 border ${currentTheme.border} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentTheme.cardBg} ${currentTheme.text}`}
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Smart Extraction Info */}
              {extractionMode === 'questions' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-blue-700 text-sm">Smart mode: Only questions and numbered items will be extracted</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  dragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : error 
                    ? 'border-red-300 hover:border-red-400' 
                    : `${currentTheme.border} hover:border-blue-400 ${theme === 'light' ? 'hover:bg-blue-50' : 'hover:bg-gray-700'}`
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <svg className={`mx-auto h-12 w-12 ${currentTheme.textMuted} mb-4`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className={`${currentTheme.textSecondary} mb-2`}>Drag and drop an image here, or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className={`text-sm ${currentTheme.textMuted} mt-2`}>
                  Supports JPG, PNG, GIF, and more
                </p>
              </div>

              {/* Image Preview */}
              {image && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-medium ${currentTheme.text}`}>Preview</h3>
                    <button
                      onClick={clearAll}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className={`border rounded-lg overflow-hidden ${currentTheme.border}`}>
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full h-64 object-contain bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isProcessing && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${currentTheme.textSecondary}`}>Processing...</span>
                    <span className="text-sm text-blue-600 font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Text Output Section */}
            <div className={`${currentTheme.cardBg} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${currentTheme.text}`}>
                  {extractionMode === 'questions' ? 'Extracted Questions' : 'Extracted Text'}
                </h2>
                <div className="flex space-x-2">
                  {(extractedText || extractedQuestions.length > 0) && (
                    <>
                      <button
                        onClick={copyToClipboard}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                          copySuccess 
                            ? 'bg-green-600 text-white' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={downloadText}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Text Display */}
              <div className={`min-h-[300px] border rounded-lg p-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'} ${currentTheme.border}`}>
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className={currentTheme.textSecondary}>Extracting text from image...</p>
                    </div>
                  </div>
                ) : extractionMode === 'questions' && extractedQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {extractedQuestions.map((question, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 border-blue-500 ${theme === 'light' ? 'bg-blue-50' : 'bg-gray-800'}`}>
                        <p className={`${currentTheme.text} text-sm leading-relaxed`}>
                          {question}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : extractionMode === 'all' && extractedText ? (
                  <div className={`whitespace-pre-wrap ${currentTheme.text} font-mono text-sm leading-relaxed`}>
                    {extractedText}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className={`text-center ${currentTheme.textMuted}`}>
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Upload an image to extract {extractionMode === 'questions' ? 'questions' : 'text'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            {(extractedText || extractedQuestions.length > 0) && (
              <div className={`${currentTheme.cardBg} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold ${currentTheme.text} mb-3`}>Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {extractionMode === 'questions' ? extractedQuestions.length : extractedText.length}
                    </div>
                    <div className={`text-sm ${currentTheme.textMuted}`}>
                      {extractionMode === 'questions' ? 'Questions' : 'Characters'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {extractionMode === 'questions' 
                        ? extractedQuestions.join(' ').split(/\s+/).filter(word => word.length > 0).length
                        : extractedText.split(/\s+/).filter(word => word.length > 0).length
                      }
                    </div>
                    <div className={`text-sm ${currentTheme.textMuted}`}>Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {extractionMode === 'questions' ? extractedQuestions.length : extractedText.split(/\n/).length}
                    </div>
                    <div className={`text-sm ${currentTheme.textMuted}`}>Lines</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          <div className="space-y-6">
            <div className={`${currentTheme.cardBg} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${currentTheme.text}`}>History</h2>
                {imageHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {imageHistory.length === 0 ? (
                <div className={`text-center ${currentTheme.textMuted} py-8`}>
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No recent extractions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {imageHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-3 ${currentTheme.hover} cursor-pointer transition-colors ${currentTheme.border}`}
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.image}
                          alt="Thumbnail"
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${currentTheme.text} truncate`}>
                            {item.fileName}
                          </p>
                          <div className="flex items-center space-x-2">
                            <p className={`text-xs ${currentTheme.textMuted}`}>
                              {languages.find(lang => lang.code === item.language)?.name}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.mode === 'questions' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.mode === 'questions' ? 'Q' : 'All'}
                            </span>
                          </div>
                          <p className={`text-xs ${currentTheme.textMuted}`}>
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`mt-2 text-xs ${currentTheme.textSecondary} truncate`}>
                        {item.mode === 'questions' && item.questions && item.questions.length > 0
                          ? item.questions[0].substring(0, 100) + '...'
                          : item.text.substring(0, 100) + '...'
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`${currentTheme.cardBg} border-t ${currentTheme.border} mt-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className={currentTheme.textMuted}>
              Powered by <span className="text-blue-600 font-semibold">Tesseract.js</span> - 
              AI-powered text extraction made simple
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;