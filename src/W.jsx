'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Trash2,
  Save,
  FileText,
  Award,
  Volume2,
  Clock,
  Settings,
  StopCircle
} from 'lucide-react'

export default function WordQuiz () {
  const [words, setWords] = useState([])
  const [currentWord, setCurrentWord] = useState(null)
  const [options, setOptions] = useState([])
  const [message, setMessage] = useState('')
  const [isCorrect, setIsCorrect] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [points, setPoints] = useState(
    localStorage.getItem('wordQuizPoints') || 0
  )
  const [streak, setStreak] = useState(0)
  const [savedFiles, setSavedFiles] = useState([])
  const [showFileManager, setShowFileManager] = useState(false)
  const [currentFileName, setCurrentFileName] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [difficulty, setDifficulty] = useState('medium')
  const [showSettings, setShowSettings] = useState(false)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const timerRef = useRef(null)

  const formatNumber = num => {
    if (num >= 1_000_000_000_000) {
      return (num / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '') + 'T'
    }
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
    }
    return num.toString()
  }

  useEffect(() => {
    const savedFilesData = localStorage.getItem('wordQuizFiles')
    if (savedFilesData) {
      setSavedFiles(JSON.parse(savedFilesData))
    }

    const savedPoints = localStorage.getItem('wordQuizPoints')
    if (savedPoints) {
      setPoints(Number.parseInt(savedPoints, 10))
    }

    const savedDifficulty = localStorage.getItem('wordQuizDifficulty')
    if (savedDifficulty) {
      setDifficulty(savedDifficulty)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('wordQuizPoints', points.toString())
  }, [points])

  useEffect(() => {
    localStorage.setItem('wordQuizDifficulty', difficulty)
  }, [difficulty])

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && currentWord) {
      clearTimeout(timerRef.current)
      if (isCorrect === null) {
        setIsCorrect(false)
        setStreak(0)
        setMessage(`⏱️ Time's up! The correct answer was: ${currentWord.uz}`)
        speak('Time is up!')

        setTimeout(() => {
          generateQuestion(words)
          setTimeout(() => setIsCorrect(null), 300)
        }, 1500)
      }
    }

    return () => clearTimeout(timerRef.current)
  }, [timeLeft, currentWord, isCorrect])

  const getDifficultyTime = () => {
    switch (difficulty) {
      case 'easy':
        return 20
      case 'medium':
        return 10
      case 'hard':
        return 5
      default:
        return 10
    }
  }

  const getDifficultyOptions = () => {
    switch (difficulty) {
      case 'easy':
        return 2
      case 'medium':
        return 4
      case 'hard':
        return 6
      default:
        return 4
    }
  }

  const getDifficultyPoints = streak => {
    const basePoints = streak * 10
    switch (difficulty) {
      case 'easy':
        return Math.min(basePoints, 30)
      case 'medium':
        return Math.min(basePoints, 50)
      case 'hard':
        return Math.min(basePoints, 100)
      default:
        return Math.min(basePoints, 50)
    }
  }

  const speak = text => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    speechSynthesis.speak(utterance)
  }

  const handleFileUpload = event => {
    const file = event.target.files[0]
    if (!file) return

    setIsLoading(true)
    setCurrentFileName(file.name)

    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target.result
      const parsedWords = text
        .split('\n')
        .map(line => {
          const parts = line.split(':')
          if (parts.length !== 2) return null
          return { eng: parts[0].trim(), uz: parts[1].trim() }
        })
        .filter(item => item !== null)

      if (parsedWords.length === 0) {
        alert("Faylda hech qanday to'g'ri formatlangan ma'lumot topilmadi!")
        setIsLoading(false)
        return
      }

      setWords(parsedWords)
      generateQuestion(parsedWords)
      setIsLoading(false)
    }

    reader.readAsText(file)
  }

  const saveCurrentFile = () => {
    if (!currentFileName || words.length === 0) return

    const fileData = {
      name: currentFileName,
      words: words,
      date: new Date().toISOString()
    }

    const updatedFiles = [
      ...savedFiles.filter(f => f.name !== currentFileName),
      fileData
    ]
    setSavedFiles(updatedFiles)
    localStorage.setItem('wordQuizFiles', JSON.stringify(updatedFiles))

    setMessage('File saved successfully!')
    setTimeout(() => setMessage(''), 2000)
  }

  const loadSavedFile = fileData => {
    setWords(fileData.words)
    setCurrentFileName(fileData.name)
    generateQuestion(fileData.words)
    setShowFileManager(false)
  }

  const deleteSavedFile = fileName => {
    const updatedFiles = savedFiles.filter(f => f.name !== fileName)
    setSavedFiles(updatedFiles)
    localStorage.setItem('wordQuizFiles', JSON.stringify(updatedFiles))
  }

  const generateQuestion = wordList => {
    if (wordList.length === 0) return

    const randomIndex = Math.floor(Math.random() * wordList.length)
    const correctWord = wordList[randomIndex]

    const optionsSet = new Set()
    optionsSet.add(correctWord.uz)

    const optionCount = Math.min(getDifficultyOptions(), wordList.length)

    while (optionsSet.size < optionCount) {
      const randomOption =
        wordList[Math.floor(Math.random() * wordList.length)].uz
      optionsSet.add(randomOption)
    }

    const shuffledOptions = [...optionsSet].sort(() => Math.random() - 0.5)
    setCurrentWord(correctWord)
    setOptions(shuffledOptions)
    setMessage('')
    setIsCorrect(null)
    setTimeLeft(getDifficultyTime())
    speak(correctWord.eng)
  }

  const handleSpeak = () => {
    if (currentWord) {
      speak(currentWord.eng)
    }
  }

  const handleAnswer = answer => {
    clearTimeout(timerRef.current)
    const correct = answer === currentWord.uz
    setIsCorrect(correct)

    if (correct) {
      const newStreak = streak + 1
      setStreak(newStreak)

      const pointsToAdd = getDifficultyPoints(newStreak)
      setPoints(prevPoints => prevPoints + pointsToAdd)

      setMessage(`✅ To'g'ri javob! +${pointsToAdd} points`)
      speak('Correct!')
    } else {
      setStreak(0)
      setMessage(`❌ Noto'g'ri, to'g'ri javob: ${currentWord.uz}`)
      speak('No!')
    }

    setTimeout(() => {
      generateQuestion(words)
      setTimeout(() => setIsCorrect(null), 300)
    }, 1500)
  }

  const changeDifficulty = newDifficulty => {
    setDifficulty(newDifficulty)
    setShowSettings(false)
    if (currentWord) {
      generateQuestion(words)
    }
  }

  const stopQuiz = () => {
    clearTimeout(timerRef.current)
    setCurrentWord(null)
    setOptions([])
    setStreak(0)
    setMessage('')
    setShowStopConfirm(false)
    speechSynthesis.cancel()
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-800 p-4 sm:p-6 text-white'>
      <div className='w-full max-w-md mb-4 sm:mb-8 text-center'>
        <h1 className='text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-400'>
          Word Quiz Game
        </h1>
        <p className='text-purple-200 mb-4'>Test your vocabulary knowledge</p>

        <div className='flex flex-wrap justify-center sm:justify-between items-center gap-2'>
          <div className='flex items-center gap-2 bg-black bg-opacity-30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base'>
            <Award className='text-yellow-400' size={16} />
            <span className='font-bold text-yellow-100'>
              {formatNumber(points)} points
            </span>
          </div>

          {streak > 1 && (
            <div className='flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full animate-pulse text-sm sm:text-base'>
              <Sparkles className='text-yellow-200' size={14} />
              <span className='font-bold text-white'>{streak}x streak!</span>
            </div>
          )}

          <div className='flex gap-2'>
            {currentWord && (
              <button
                onClick={() => setShowStopConfirm(true)}
                className='bg-red-500 bg-opacity-30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-opacity-50 transition-all'
                title='Stop Quiz'
              >
                <StopCircle size={16} className='text-red-200' />
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className='bg-black bg-opacity-30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-opacity-50 transition-all'
            >
              <Settings size={16} className='text-purple-200' />
            </button>
            <button
              onClick={() => setShowFileManager(!showFileManager)}
              className='bg-black bg-opacity-30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-opacity-50 transition-all'
            >
              <FileText size={16} className='text-purple-200' />
            </button>
          </div>
        </div>
      </div>

      {showStopConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-slate-800 rounded-xl p-6 max-w-xs w-full animate-fade-in'>
            <h3 className='text-lg font-bold mb-3 text-white'>Stop Quiz?</h3>
            <p className='text-slate-300 mb-4'>
              Are you sure you want to stop the current quiz? Your streak will
              be lost.
            </p>
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => setShowStopConfirm(false)}
                className='px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={stopQuiz}
                className='px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-1'
              >
                <StopCircle size={16} /> Stop Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className='w-full max-w-md mb-4 sm:mb-8 bg-black bg-opacity-20 backdrop-blur-md rounded-2xl p-4 sm:p-6 animate-fade-in'>
          <h2 className='text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2'>
            <Settings size={18} className='text-purple-300' />
            Difficulty Settings
          </h2>

          <div className='grid grid-cols-3 gap-2 mb-4'>
            <button
              onClick={() => changeDifficulty('easy')}
              className={`p-2 rounded-lg font-medium text-sm ${
                difficulty === 'easy'
                  ? 'bg-green-500 text-white'
                  : 'bg-white bg-opacity-10 hover:bg-opacity-20 text-green-200'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => changeDifficulty('medium')}
              className={`p-2 rounded-lg font-medium text-sm ${
                difficulty === 'medium'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white bg-opacity-10 hover:bg-opacity-20 text-yellow-200'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => changeDifficulty('hard')}
              className={`p-2 rounded-lg font-medium text-sm ${
                difficulty === 'hard'
                  ? 'bg-red-500 text-white'
                  : 'bg-white bg-opacity-10 hover:bg-opacity-20 text-red-200'
              }`}
            >
              Hard
            </button>
          </div>

          <div className='space-y-2 text-sm text-purple-100'>
            <div className='flex justify-between'>
              <span>Time per question:</span>
              <span>{getDifficultyTime()} seconds</span>
            </div>
            <div className='flex justify-between'>
              <span>Number of options:</span>
              <span>{getDifficultyOptions()}</span>
            </div>
            <div className='flex justify-between'>
              <span>Max points per question:</span>
              <span>{getDifficultyPoints(10)}</span>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(false)}
            className='w-full mt-4 py-2 bg-purple-600 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all text-sm sm:text-base text-white'
          >
            Close
          </button>
        </div>
      )}

      {showFileManager && (
        <div className='w-full max-w-md mb-4 sm:mb-8 bg-black bg-opacity-20 backdrop-blur-md rounded-2xl p-4 sm:p-6 animate-fade-in'>
          <h2 className='text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2'>
            <FileText size={18} className='text-purple-300' />
            Saved Word Lists
          </h2>

          {savedFiles.length === 0 ? (
            <p className='text-center text-purple-200 py-3 sm:py-4'>
              No saved files yet
            </p>
          ) : (
            <div className='space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto pr-1 sm:pr-2'>
              {savedFiles.map((file, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between bg-white bg-opacity-10 p-2 sm:p-3 rounded-lg hover:bg-opacity-20 transition-all'
                >
                  <div className='min-w-0 flex-1 mr-2'>
                    <p className='font-medium text-sm sm:text-base truncate text-white'>
                      {file.name}
                    </p>
                    <p className='text-xs text-purple-300'>
                      {file.words.length} words
                    </p>
                  </div>
                  <div className='flex gap-1 sm:gap-2 flex-shrink-0'>
                    <button
                      onClick={() => loadSavedFile(file)}
                      className='p-1.5 sm:p-2 rounded-full bg-green-500 bg-opacity-20 hover:bg-opacity-40 transition-all'
                    >
                      <FileText size={14} className='text-green-200' />
                    </button>
                    <button
                      onClick={() => deleteSavedFile(file.name)}
                      className='p-1.5 sm:p-2 rounded-full bg-red-500 bg-opacity-20 hover:bg-opacity-40 transition-all'
                    >
                      <Trash2 size={14} className='text-red-200' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowFileManager(false)}
            className='w-full mt-3 sm:mt-4 py-2 bg-purple-600 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all text-sm sm:text-base text-white'
          >
            Close
          </button>
        </div>
      )}

      {!currentWord && !showFileManager && !showSettings && (
        <div className='relative group mb-4 sm:mb-8 w-full max-w-md'>
          <label className='flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 bg-white bg-opacity-10 rounded-xl shadow-2xl cursor-pointer border-2 border-dashed border-white border-opacity-30 hover:border-opacity-60 transition-all duration-300 group-hover:scale-105'>
            <input
              type='file'
              accept='.txt'
              onChange={handleFileUpload}
              className='hidden'
            />
            <FileText className='w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 text-purple-300 transition-all' />
            <span className='text-lg sm:text-xl font-medium text-white mb-2'>
              {isLoading
                ? 'Loading...'
                : words.length > 0
                ? 'Change word list'
                : 'Upload word list'}
            </span>
            <span className='text-xs sm:text-sm text-purple-300 text-center px-2'>
              (.txt file with english:translation format)
            </span>
          </label>
        </div>
      )}

      {currentWord && !isLoading && !showFileManager && !showSettings && (
        <div className='relative w-full max-w-md bg-black bg-opacity-20 backdrop-blur-lg p-4 sm:p-8 rounded-2xl shadow-2xl text-center transition-all duration-500 animate-fade-in'>
          <div className='absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2'>
            <button
              onClick={saveCurrentFile}
              className='p-1.5 sm:p-2 rounded-full bg-green-500 bg-opacity-20 hover:bg-opacity-40 transition-all'
              title='Save word list'
            >
              <Save size={14} className='text-green-200' />
            </button>
          </div>

          <div className='absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1'>
            <Clock size={14} className='text-yellow-300' />
            <div className='w-16 h-5 bg-gray-800 rounded-full overflow-hidden'>
              <div
                className={`h-full ${
                  timeLeft > getDifficultyTime() * 0.6
                    ? 'bg-green-500'
                    : timeLeft > getDifficultyTime() * 0.3
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${(timeLeft / getDifficultyTime()) * 100}%` }}
              ></div>
            </div>
            <span className='text-xs text-yellow-200'>{timeLeft}s</span>
          </div>

          <div className='mb-5 sm:mb-8 mt-6'>
            <div className='text-xs sm:text-sm text-purple-300 mb-1 truncate max-w-full'>
              <span
                className={`
                px-2 py-0.5 rounded-full text-xs mr-2
                ${
                  difficulty === 'easy'
                    ? 'bg-green-500 text-white'
                    : difficulty === 'medium'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-red-500 text-white'
                }
              `}
              >
                {difficulty.toUpperCase()}
              </span>
              {currentFileName}
            </div>
            <h2 className='text-2xl sm:text-3xl font-extrabold mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 flex items-center justify-center gap-2'>
              {currentWord.eng}
              <button
                onClick={handleSpeak}
                className='p-1.5 sm:p-2 rounded-full bg-purple-500 bg-opacity-20 hover:bg-opacity-40 transition-all'
              >
                <Volume2 size={14} className='text-white' />
              </button>
            </h2>
            <p className='text-purple-200 text-sm sm:text-base'>
              What is the translation?
            </p>
          </div>

          <div
            className={`grid ${
              options.length > 4
                ? difficulty === 'hard'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  : 'grid-cols-2'
                : options.length <= 2
                ? 'grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-2'
            } gap-3 sm:gap-4 mb-4 sm:mb-6`}
          >
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={isCorrect !== null}
                className={`
                  p-3 sm:p-4 font-semibold rounded-xl shadow-lg 
                  ${
                    isCorrect === null
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105 text-white'
                      : ''
                  }
                  ${
                    isCorrect !== null && currentWord.uz === option
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 scale-105 text-white'
                      : ''
                  }
                  ${
                    isCorrect === false && currentWord.uz !== option
                      ? 'bg-gradient-to-br from-gray-500 to-gray-600 opacity-50 text-gray-200'
                      : ''
                  }
                  transition-all duration-300 hover:shadow-xl text-xs sm:text-sm
                `}
              >
                <p className='uppercase'>{option}</p>
              </button>
            ))}
          </div>

          {message && (
            <div
              className={`p-3 sm:p-4 rounded-xl ${
                message.includes('✅')
                  ? 'bg-green-500 bg-opacity-20 text-green-100'
                  : message.includes('❌')
                  ? 'bg-red-500 bg-opacity-20 text-red-100'
                  : message.includes('⏱️')
                  ? 'bg-yellow-500 bg-opacity-20 text-yellow-100'
                  : 'bg-blue-500 bg-opacity-20 text-blue-100'
              } animate-fade-in text-sm sm:text-base`}
            >
              <p className='font-bold'>{message}</p>
            </div>
          )}
        </div>
      )}
      <p className='text-sm text-gray-500 absolute bottom-2'>
        Coded by :{' '}
        <a
          className='text-blue-600 hover:underline'
          href='https://t.me/ItsNoWonder'
        >
          Ahmadjon
        </a>
      </p>
    </div>
  )
}
