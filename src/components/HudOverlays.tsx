import React, { useState } from 'react';
import { X, Play, Volume2, VolumeX, CheckCircle, AlertTriangle, HelpCircle, Award } from 'lucide-react';

// Video Data
export interface VideoData {
  url: string;
  title: string;
  isMuted?: boolean;
}

// Quiz Question
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  note?: string;
}

export interface QuizData {
  topic: string;
  questions: QuizQuestion[];
}

// Structured Review
export interface ReviewFinding {
  label: string;
  status: 'passed' | 'warning' | 'failed' | 'info';
  detail: string;
}

export interface ReviewData {
  title: string;
  summary: string;
  findings: ReviewFinding[];
}

// Content display
export interface ContentData {
  title: string;
  text: string;
}

interface HudOverlaysProps {
  video: VideoData | null;
  onCloseVideo: () => void;
  quiz: QuizData | null;
  onCloseQuiz: (score?: { correct: number; total: number }) => void;
  review: ReviewData | null;
  onCloseReview: () => void;
  content: ContentData | null;
  onCloseContent: () => void;
}

export const HudOverlays: React.FC<HudOverlaysProps> = ({
  video,
  onCloseVideo,
  quiz,
  onCloseQuiz,
  review,
  onCloseReview,
  content,
  onCloseContent,
}) => {
  // Video audio state
  const [videoMuted, setVideoMuted] = useState(true);

  // Quiz state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Convert YouTube link to embed format if needed
  const getEmbedUrl = (raw: string) => {
    try {
      if (raw.includes('youtube.com/watch?v=')) {
        const id = new URL(raw).searchParams.get('v');
        return `https://www.youtube.com/embed/${id}?autoplay=1&mute=${videoMuted ? 1 : 0}`;
      }
      if (raw.includes('youtu.be/')) {
        const id = raw.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1&mute=${videoMuted ? 1 : 0}`;
      }
      if (raw.includes('youtube.com/embed')) {
        const sep = raw.includes('?') ? '&' : '?';
        return `${raw}${sep}autoplay=1&mute=${videoMuted ? 1 : 0}`;
      }
      return raw;
    } catch {
      return raw;
    }
  };

  const handleQuizAnswer = (opt: string) => {
    if (showAnswer || !quiz) return;
    setSelectedOption(opt);
    setShowAnswer(true);
    const q = quiz.questions[currentQIndex];
    if (opt.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const nextQuizQuestion = () => {
    if (!quiz) return;
    if (currentQIndex + 1 < quiz.questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <>
      {/* 1. HUD VIDEO PLAYER OVERLAY (positioned in avatar frame) */}
      {video && (
        <div className="absolute inset-2 z-30 flex flex-col bg-[#00060a]/95 border-2 border-[#00d4ff]/60 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,212,255,0.2)]">
          <div className="flex items-center justify-between px-3 py-2 bg-[#011520] border-b border-[#0d3347]">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-xs font-bold text-[#8ffcff] tracking-wide truncate max-w-xs">
                {video.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVideoMuted(!videoMuted)}
                className="p-1 rounded text-[#3a8a9a] hover:text-[#00d4ff] transition-colors"
                title={videoMuted ? 'Unmute' : 'Mute'}
              >
                {videoMuted ? <VolumeX className="w-4 h-4 text-[#ffaa00]" /> : <Volume2 className="w-4 h-4 text-[#00ff88]" />}
              </button>
              <button
                onClick={onCloseVideo}
                className="p-1 rounded text-[#3a8a9a] hover:text-[#ff3355] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <iframe
              src={getEmbedUrl(video.url)}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE QUIZ OVERLAY */}
      {quiz && (
        <div className="absolute inset-2 z-30 flex flex-col bg-[#00060a]/95 border-2 border-[#ffaa00]/70 rounded-lg overflow-hidden shadow-[0_0_35px_rgba(255,170,0,0.25)] select-none">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#1f1501] border-b border-[#4d3202]">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#ffaa00]" />
              <span className="text-xs font-bold text-[#ffaa00] tracking-widest uppercase">
                JARVIS QUIZ // {quiz.topic}
              </span>
            </div>
            <button
              onClick={() => {
                onCloseQuiz({ correct: correctCount, total: quiz.questions.length });
                setCurrentQIndex(0);
                setCorrectCount(0);
                setSelectedOption(null);
                setShowAnswer(false);
                setQuizFinished(false);
              }}
              className="p-1 rounded text-[#ffaa00]/60 hover:text-[#ff3355]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between">
            {!quizFinished ? (
              <>
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#ffaa00]/80 tracking-wider mb-2">
                    <span>QUESTION {currentQIndex + 1} OF {quiz.questions.length}</span>
                    <span>SCORE: {correctCount} PTS</span>
                  </div>

                  <h3 className="text-sm md:text-base font-bold text-[#ffffff] mb-4 leading-snug">
                    {quiz.questions[currentQIndex].question}
                  </h3>

                  <div className="space-y-2">
                    {quiz.questions[currentQIndex].options.map((opt, idx) => {
                      const isChosen = selectedOption === opt;
                      const isCorrect = opt.trim().toLowerCase() === quiz.questions[currentQIndex].answer.trim().toLowerCase();

                      let btnStyle = 'border-[#0d3347] bg-[#010d14] text-[#8ffcff] hover:border-[#00d4ff]/50';
                      if (showAnswer) {
                        if (isCorrect) {
                          btnStyle = 'border-[#00ff88] bg-[#002b1f] text-[#00ff88] font-bold';
                        } else if (isChosen) {
                          btnStyle = 'border-[#ff3355] bg-[#2b000a] text-[#ff3355]';
                        } else {
                          btnStyle = 'opacity-40 border-[#0d3347] bg-[#010d14] text-[#5e6a7e]';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={showAnswer}
                          onClick={() => handleQuizAnswer(opt)}
                          className={`w-full text-left p-3 rounded-md border text-xs md:text-sm tracking-wide transition-all ${btnStyle}`}
                        >
                          <span className="font-mono mr-2 text-[#3a8a9a]">[{String.fromCharCode(65 + idx)}]</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {showAnswer && quiz.questions[currentQIndex].note && (
                    <div className="mt-4 p-2.5 rounded bg-[#011520] border border-[#0d3347] text-xs text-[#8ffcff]">
                      <span className="font-bold text-[#00d4ff] mr-1">EXPLANATION:</span>
                      {quiz.questions[currentQIndex].note}
                    </div>
                  )}
                </div>

                {showAnswer && (
                  <div className="mt-4 pt-3 border-t border-[#0d3347] flex justify-end">
                    <button
                      onClick={nextQuizQuestion}
                      className="px-4 py-2 bg-[#ffaa00] hover:bg-[#ffb733] text-black font-bold text-xs tracking-widest uppercase rounded shadow transition-all"
                    >
                      {currentQIndex + 1 < quiz.questions.length ? 'NEXT QUESTION' : 'COMPLETE QUIZ'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Award className="w-12 h-12 text-[#ffaa00] mb-3 animate-bounce" />
                <h3 className="text-lg font-bold text-[#ffffff] mb-1">QUIZ COMPLETE</h3>
                <p className="text-sm text-[#3a8a9a] mb-4">Topic: {quiz.topic}</p>
                <div className="text-2xl font-bold font-mono text-[#00ff88] mb-6">
                  {correctCount} / {quiz.questions.length} CORRECT
                  <span className="block text-xs text-[#8ffcff] font-sans font-normal mt-1">
                    ({Math.round((correctCount / quiz.questions.length) * 100)}% accuracy)
                  </span>
                </div>
                <button
                  onClick={() => {
                    onCloseQuiz({ correct: correctCount, total: quiz.questions.length });
                  }}
                  className="px-5 py-2.5 bg-[#00d4ff] hover:bg-[#33ddff] text-black font-bold text-xs tracking-widest uppercase rounded shadow"
                >
                  RETURN TO HUD
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. STRUCTURED REVIEW OVERLAY (player.show_review) */}
      {review && (
        <div className="absolute inset-2 z-30 flex flex-col bg-[#00060a]/95 border-2 border-[#00d4ff]/70 rounded-lg overflow-hidden shadow-[0_0_35px_rgba(0,212,255,0.25)]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#011520] border-b border-[#0d3347]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#00ff88]" />
              <span className="text-xs font-bold text-[#00d4ff] tracking-widest uppercase truncate max-w-sm">
                DIAGNOSTIC REVIEW // {review.title}
              </span>
            </div>
            <button
              onClick={onCloseReview}
              className="p-1 rounded text-[#3a8a9a] hover:text-[#ff3355]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="p-3 bg-[#010d14] rounded border border-[#0d3347] text-xs text-[#8ffcff] leading-relaxed">
              <span className="font-bold text-[#00d4ff] mr-1">EXECUTIVE SUMMARY:</span>
              {review.summary}
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#3a8a9a] tracking-widest uppercase mb-2">
                VERIFIED FINDINGS
              </h4>
              <div className="space-y-2">
                {review.findings.map((f, i) => {
                  let badge = 'text-[#00ff88] bg-[#002b1f] border-[#00ff88]/30';
                  let icon = <CheckCircle className="w-3.5 h-3.5 text-[#00ff88]" />;
                  if (f.status === 'warning') {
                    badge = 'text-[#ffaa00] bg-[#2b1900] border-[#ffaa00]/30';
                    icon = <AlertTriangle className="w-3.5 h-3.5 text-[#ffaa00]" />;
                  } else if (f.status === 'failed') {
                    badge = 'text-[#ff3355] bg-[#2b000a] border-[#ff3355]/30';
                    icon = <X className="w-3.5 h-3.5 text-[#ff3355]" />;
                  }

                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-[#010d14] border border-[#0d3347] flex items-start gap-2.5 text-xs"
                    >
                      <div className="pt-0.5">{icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#ffffff]">{f.label}</span>
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-mono ${badge}`}>
                            {f.status}
                          </span>
                        </div>
                        <p className="text-[#3a8a9a] mt-1 text-[11px] leading-relaxed">{f.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONTENT DISPLAY PANEL (player.show_content) */}
      {content && (
        <div className="absolute inset-2 z-30 flex flex-col bg-[#00060a]/95 border-2 border-[#00d4ff]/70 rounded-lg overflow-hidden shadow-[0_0_35px_rgba(0,212,255,0.2)]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#011520] border-b border-[#0d3347]">
            <span className="text-xs font-bold text-[#00d4ff] tracking-widest uppercase truncate max-w-sm">
              {content.title}
            </span>
            <button
              onClick={onCloseContent}
              className="p-1 rounded text-[#3a8a9a] hover:text-[#ff3355]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-[#8ffcff] whitespace-pre-wrap leading-relaxed scanlines">
            {content.text}
          </div>
        </div>
      )}
    </>
  );
};
