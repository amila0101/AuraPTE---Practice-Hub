import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AudioRecorder from "./AudioRecorder";
import AudioPlayer from "./AudioPlayer";
import PrepCountdown from "./PrepCountdown";
import WritingEditor from "./WritingEditor";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { GripVertical } from "lucide-react";

export interface Question {
  id: number | string;
  type: "speaking" | "writing" | "reading" | "listening";
  subType: string;
  title: string;
  content: any; // Can be malformed by AI
  instruction: string;
  options?: string[] | null;
  correct_answer?: Record<string, unknown> | null;
  image_url?: string | null;
}

interface QuestionCardProps {
  question: Question;
  direction: number;
  onAnswerChange?: (answer: string) => void;
}

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
};

const QuestionCard = ({ question, direction, onAnswerChange }: QuestionCardProps) => {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={question.id}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="space-y-6"
      >
        {/* Question header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
              {question.type}
            </span>
            <span className="text-xs text-muted-foreground">{question.subType}</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">{question.title}</h2>
          <p className="text-sm text-muted-foreground">{question.instruction}</p>
        </div>

        {/* Render sub-type specific content */}
        <SubTypeRenderer question={question} onAnswerChange={onAnswerChange} />
      </motion.div>
    </AnimatePresence>
  );
};

// Sub-type specific rendering
function SubTypeRenderer({ question, onAnswerChange }: { question: Question; onAnswerChange?: (answer: string) => void }) {
  const st = question.subType;
  // Prep/record times based on sub-type (matching real PTE timings)
  const getSpeakingTimes = (subType: string) => {
    switch (subType) {
      case "Read Aloud": return { prep: 40, record: 35 };
      case "Repeat Sentence": return { prep: 3, record: 15 };
      case "Describe Image": return { prep: 25, record: 40 };
      case "Re-tell Lecture": return { prep: 10, record: 40 };
      case "Answer Short Question": return { prep: 3, record: 10 };
      default: return { prep: 30, record: 30 };
    }
  };

  // === SPEAKING ===
  if (question.type === "speaking") {
    const needsAudio = ["Repeat Sentence", "Re-tell Lecture", "Answer Short Question"].includes(st);
    const times = getSpeakingTimes(st);

    return (
      <div className="space-y-4">
        {/* Instruction with timing info */}
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          {st === "Read Aloud" && (
            <p>Look at the text below. In <strong className="text-foreground">{times.prep} seconds</strong>, you must read this text aloud as naturally as possible. You have <strong className="text-foreground">{times.record} seconds</strong> to read aloud.</p>
          )}
          {st === "Describe Image" && (
            <p>Look at the image below. In <strong className="text-foreground">{times.prep} seconds</strong>, please speak into the microphone and describe in detail what the image is showing. You will have <strong className="text-foreground">{times.record} seconds</strong> to give your response.</p>
          )}
          {st === "Repeat Sentence" && (
            <p>You will hear a sentence. After listening, you have <strong className="text-foreground">{times.record} seconds</strong> to repeat the sentence.</p>
          )}
          {st === "Re-tell Lecture" && (
            <p>You will hear a lecture. After it finishes, you have <strong className="text-foreground">{times.prep} seconds</strong> to prepare and <strong className="text-foreground">{times.record} seconds</strong> to re-tell the lecture in your own words.</p>
          )}
          {st === "Answer Short Question" && (
            <p>You will hear a question. After listening, give a short answer within <strong className="text-foreground">{times.record} seconds</strong>.</p>
          )}
        </div>



        {st === "Describe Image" ? (
          <div className="rounded-xl border-2 border-primary/20 bg-muted/30 p-4 space-y-3">
            <div className="text-xs font-bold text-primary uppercase tracking-wider">📊 Image / Chart</div>
            {question.image_url ? (
              <div className="flex justify-center">
                <img 
                  src={question.image_url} 
                  alt="Describe this image" 
                  className="max-w-full max-h-[400px] rounded-lg border shadow-sm object-contain"
                />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line font-mono">{typeof question.content === 'string' ? question.content : JSON.stringify(question.content)}</p>
            )}
          </div>
        ) : needsAudio ? (
          <div className="space-y-3">
            <AudioPlayer 
              text={typeof question.content === 'string' ? question.content : JSON.stringify(question.content)} 
              label={st === "Repeat Sentence" ? "Listen and repeat this sentence" : st === "Re-tell Lecture" ? "Listen to the lecture" : "Listen to the question"}
              autoPlay={false}
            />
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/50 p-6">
            <p className="text-base leading-relaxed text-foreground whitespace-pre-line">{typeof question.content === 'string' ? question.content : JSON.stringify(question.content)}</p>
          </div>
        )}


      </div>
    );
  }

  // === WRITING ===
  if (question.type === "writing") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-muted/50 p-6">
          {st === "Summarize Written Text" && (
            <div className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">📝 Read the passage below</div>
          )}
          {st === "Write Essay" && (
            <div className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">✍️ Essay Topic</div>
          )}
          <p className="text-base leading-relaxed text-foreground whitespace-pre-line">{typeof question.content === 'string' ? question.content : JSON.stringify(question.content)}</p>
        </div>
        <div>
          {st === "Summarize Written Text" && (
            <p className="text-xs text-muted-foreground mb-2 font-semibold">
              ⚠️ Write ONE single sentence (5-75 words). Time limit: 10 minutes.
            </p>
          )}
          {st === "Write Essay" && (
            <p className="text-xs text-muted-foreground mb-2 font-semibold">
              ⚠️ Write 200-300 words. Time limit: 20 minutes.
            </p>
          )}
          <WritingEditor onChange={(text) => onAnswerChange?.(text)} />
        </div>
      </div>
    );
  }

  // === READING ===
  if (question.type === "reading") {
    const readingInstruction: Record<string, string> = {
      "Multiple Choice (Single)": "Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.",
      "Multiple Choice (Multiple)": "Read the text and answer the question by selecting all the correct responses. More than one response is correct.",
      "Re-order Paragraphs": "The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.",
      "Fill in the Blanks (R)": "In the text below, some words are missing. Drag words from the box below to fill in the blanks.",
      "Fill in the Blanks (R&W)": "Below is a text with blanks. Click on each blank and select the correct word from the dropdown list.",
    };

    return (
      <div className="space-y-4">
        {/* APEUni-style instruction bar */}
        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {readingInstruction[st] || question.instruction}
          </p>
        </div>

        {st === "Re-order Paragraphs" ? (
          <ReorderParagraphs question={question} onAnswerChange={onAnswerChange} />
        ) : st === "Fill in the Blanks (R)" || st === "Fill in the Blanks (R&W)" ? (
          <FillInBlanks question={question} onAnswerChange={onAnswerChange} />
        ) : (
          <MultipleChoice question={question} onAnswerChange={onAnswerChange} isMultiple={st === "Multiple Choice (Multiple)"} />
        )}
      </div>
    );
  }

  // === LISTENING ===
  if (question.type === "listening") {
    if (st === "Write from Dictation") {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border bg-amber-500/10 border-amber-500/30 px-4 py-2.5 flex items-center gap-2">
            <span className="text-amber-500 text-sm">🎧</span>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Real PTE Listening: Audio plays up to <strong>2 times</strong>. Use your attempts wisely!</p>
          </div>
          <AudioPlayer text={typeof question.content === 'string' ? question.content : JSON.stringify(question.content)} label="Listen carefully and type what you hear" autoPlay={false} maxPlays={2} />
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Type the sentence exactly as you heard it:</p>
            <WritingEditor onChange={(text) => onAnswerChange?.(text)} />
          </div>
        </div>
      );
    }
    if (st === "Summarize Spoken Text") {
      return (
        <div className="space-y-4">
          <AudioPlayer text={typeof question.content === 'string' ? question.content : JSON.stringify(question.content)} label="Listen to the lecture" autoPlay={false} rate={0.85} maxPlays={2} />
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Write a summary of 50-70 words. Time limit: 10 minutes.</p>
            <WritingEditor onChange={(text) => onAnswerChange?.(text)} />
          </div>
        </div>
      );
    }
    if (st === "Fill in the Blanks") {
      // For listening fill in blanks, get the full text (without blanks) for audio
      const safeContent = typeof question.content === 'string' ? question.content : JSON.stringify(question.content || "");
      const fullText = safeContent.replace(/___BLANK\d+___/g, (match) => {
        const key = match.replace(/___/g, "");
        const ca = question.correct_answer as Record<string, Record<string, string>> | null;
        return ca?.blanks?.[key] || "blank";
      });
      return (
        <div className="space-y-4">
          <AudioPlayer text={fullText} label="Listen and fill in the missing words" autoPlay={false} maxPlays={2} />
          <FillInBlanks question={question} onAnswerChange={onAnswerChange} isListening />
        </div>
      );
    }
    if (st === "Highlight Incorrect Words") {
      // For this type, the audio says the CORRECT version, the screen shows incorrect words
      // Build the correct audio text from correct_answer
      const ca = question.correct_answer as { incorrect_words?: Array<{ word: string; correct_word: string; position: number }> } | null;
      let audioText = typeof question.content === 'string' ? question.content : JSON.stringify(question.content || "");
      if (ca?.incorrect_words && Array.isArray(ca.incorrect_words)) {
        const words = audioText.split(/\s+/);
        for (const iw of ca.incorrect_words) {
          if (iw && iw.position < words.length && iw.correct_word) {
            const punct = (words[iw.position] || "").replace(/[a-zA-Z'-]/g, "");
            words[iw.position] = iw.correct_word + punct;
          }
        }
        audioText = words.join(" ");
      }
      return (
        <div className="space-y-4">
          <AudioPlayer text={audioText} label="Listen carefully - some words on screen are different from what you hear" autoPlay={false} rate={0.85} maxPlays={2} />
          <HighlightIncorrectWords question={question} onAnswerChange={onAnswerChange} />
        </div>
      );
    }
    // MC-based listening (Highlight Correct Summary, Select Missing Word, MC Single)
    if (question.options && question.options.length > 0) {
      return (
        <div className="space-y-4">
          <AudioPlayer text={typeof question.content === 'string' ? question.content : JSON.stringify(question.content)} label="Listen to the recording" autoPlay={false} rate={0.85} maxPlays={2} />
          <MultipleChoice question={question} onAnswerChange={onAnswerChange} isMultiple={false} hideContent />
        </div>
      );
    }
    // Fallback
    return (
      <div className="space-y-4">
        <AudioPlayer text={typeof question.content === 'string' ? question.content : JSON.stringify(question.content)} label="Listen to the recording" autoPlay={false} />
        <WritingEditor onChange={(text) => onAnswerChange?.(text)} />
      </div>
    );
  }

  // Fallback
  return (
    <div className="rounded-xl border bg-muted/50 p-6">
      <p className="text-base leading-relaxed text-foreground whitespace-pre-line">{typeof question.content === 'string' ? question.content : JSON.stringify(question.content)}</p>
    </div>
  );
}

// === MULTIPLE CHOICE COMPONENT ===
function MultipleChoice({ question, onAnswerChange, isMultiple, hideContent }: {
  question: Question; onAnswerChange?: (answer: string) => void; isMultiple: boolean; hideContent?: boolean;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const options = Array.isArray(question.options) ? question.options : [];

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (isMultiple) {
      next.has(i) ? next.delete(i) : next.add(i);
    } else {
      next.clear();
      next.add(i);
    }
    setSelected(next);
    const answers = Array.from(next).map(idx => options[idx]);
    onAnswerChange?.(JSON.stringify(answers));
  };

  return (
    <div className="space-y-3">
      {!hideContent && (
        <div className="rounded-xl border bg-muted/50 p-6">
          <p className="text-base leading-relaxed text-foreground whitespace-pre-line">{typeof question.content === 'string' ? question.content : JSON.stringify(question.content)}</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground font-semibold">
        {isMultiple ? "Select ALL correct answers:" : "Select ONE correct answer:"}
      </p>
      {options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-center gap-3 rounded-lg border-2 bg-card p-4 cursor-pointer transition-all ${
            selected.has(i) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onClick={() => toggle(i)}
        >
          <input
            type={isMultiple ? "checkbox" : "radio"}
            name={`q-${question.id}`}
            checked={selected.has(i)}
            onChange={() => {}}
            className="accent-primary h-4 w-4"
          />
          <span className="text-sm">{opt}</span>
        </label>
      ))}
    </div>
  );
}

// === RE-ORDER PARAGRAPHS ===
function ReorderParagraphs({ question, onAnswerChange }: { question: Question; onAnswerChange?: (answer: string) => void }) {
  const [items, setItems] = useState<string[]>(Array.isArray(question.options) ? question.options : []);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const moveItem = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    onAnswerChange?.(JSON.stringify(next));
  };

  return (
    <div className="space-y-3">
      {question.content && (
        <div className="rounded-xl border bg-muted/50 p-4">
          <p className="text-sm text-foreground">{typeof question.content === 'string' ? question.content : JSON.stringify(question.content)}</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground font-semibold">Drag to reorder the paragraphs into the correct sequence:</p>
      {items.map((item, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (dragIndex !== null && dragIndex !== i) moveItem(dragIndex, i); setDragIndex(null); }}
          className={`flex items-start gap-3 rounded-xl border-2 bg-card p-4 cursor-grab transition-all ${
            dragIndex === i ? "opacity-50 border-primary" : "border-border hover:border-primary/30"
          }`}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex items-start gap-2 flex-1">
            <span className="bg-primary/10 text-primary text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shrink-0">{i + 1}</span>
            <p className="text-sm leading-relaxed">{item}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// === FILL IN THE BLANKS ===
function FillInBlanks({ question, onAnswerChange, isListening }: {
  question: Question; onAnswerChange?: (answer: string) => void; isListening?: boolean;
}) {
  const [blanks, setBlanks] = useState<Record<string, string>>({});
  const options = Array.isArray(question.options) ? question.options : [];

  // Parse content to find blanks
  const content = typeof question.content === 'string' ? question.content : JSON.stringify(question.content || "");
  const parts = content.split(/(___BLANK\d+___)/g);
  const blankKeys = parts.filter(p => p.match(/___BLANK\d+___/)).map(p => p.replace(/___/g, ""));

  const updateBlank = (key: string, value: string) => {
    const next = { ...blanks, [key]: value };
    setBlanks(next);
    onAnswerChange?.(JSON.stringify(next));
  };

  return (
    <div className="space-y-4">
      {isListening && (
        <div className="text-xs font-bold text-primary uppercase tracking-wider">🎧 Audio Transcript - Fill in the missing words</div>
      )}
      <div className="rounded-xl border bg-muted/50 p-6 leading-relaxed">
        {parts.map((part, i) => {
          const match = part.match(/___BLANK(\d+)___/);
          if (match) {
            const key = `BLANK${match[1]}`;
            return (
              <Input
                key={i}
                className="inline-block w-32 mx-1 text-sm h-8 border-2 border-primary/30 bg-background"
                placeholder={`blank ${match[1]}`}
                value={blanks[key] || ""}
                onChange={(e) => updateBlank(key, e.target.value)}
              />
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
      {options.length > 0 && !isListening && (
        <div>
          <p className="text-xs text-muted-foreground font-semibold mb-2">Word bank (drag or type):</p>
          <div className="flex flex-wrap gap-2">
            {options.map((word, i) => (
              <span key={i} className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1.5 rounded-lg border border-primary/20">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// === HIGHLIGHT INCORRECT WORDS ===
function HighlightIncorrectWords({ question, onAnswerChange }: { question: Question; onAnswerChange?: (answer: string) => void }) {
  const content = typeof question.content === 'string' ? question.content : JSON.stringify(question.content || "");
  const words = content.split(/\s+/);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleWord = (i: number) => {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
    const selectedWords = Array.from(next).map(idx => words[idx]);
    onAnswerChange?.(JSON.stringify(selectedWords));
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-primary uppercase tracking-wider">🎧 Click on the words that are DIFFERENT from what you hear</div>
      <div className="rounded-xl border bg-muted/50 p-6 leading-loose">
        {words.map((word, i) => (
          <span
            key={i}
            onClick={() => toggleWord(i)}
            className={`inline cursor-pointer px-0.5 py-0.5 rounded transition-all ${
              selected.has(i) 
                ? "bg-destructive/20 text-destructive line-through font-bold" 
                : "hover:bg-primary/10"
            }`}
          >
            {word}{" "}
          </span>
        ))}
      </div>
    </div>
  );
}

export default QuestionCard;
