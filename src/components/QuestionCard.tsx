import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AudioRecorder from "./AudioRecorder";
import AudioPlayer from "./AudioPlayer";
import PrepCountdown from "./PrepCountdown";
import WritingEditor from "./WritingEditor";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { GripVertical } from "lucide-react";
import { getSpeakingPreparationTimes } from "@/lib/pteTimings";

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
  // Prep/record times based on sub-type and content
  const getSpeakingTimes = (subType: string, content: any) => {
    return getSpeakingPreparationTimes(subType, content);
  };

  // === SPEAKING ===
  if (question.type === "speaking") {
    const needsAudio = ["Repeat Sentence", "Re-tell Lecture", "Answer Short Question"].includes(st);
    const times = getSpeakingTimes(st, question.content);

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
              autoPlay={true}
              maxPlays={1}
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
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Real PTE Listening: Audio plays <strong>only ONCE</strong> automatically.</p>
          </div>
          <AudioPlayer text={typeof question.content === 'string' ? question.content : JSON.stringify(question.content)} label="Listen carefully and type what you hear" autoPlay={true} maxPlays={1} />
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
          <AudioPlayer text={typeof question.content === 'string' ? question.content : JSON.stringify(question.content)} label="Listen to the lecture" autoPlay={true} rate={0.85} maxPlays={1} />
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
          <AudioPlayer text={fullText} label="Listen and fill in the missing words" autoPlay={true} maxPlays={1} />
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
          <AudioPlayer text={audioText} label="Listen carefully - some words on screen are different from what you hear" autoPlay={true} rate={0.85} maxPlays={1} />
          <HighlightIncorrectWords question={question} onAnswerChange={onAnswerChange} />
        </div>
      );
    }
    // MC-based listening (Highlight Correct Summary, Select Missing Word, MC Single)
    if (question.options && question.options.length > 0) {
      return (
        <div className="space-y-4">
          <AudioPlayer text={typeof question.content === 'string' ? question.content : JSON.stringify(question.content)} label="Listen to the recording" autoPlay={true} rate={0.85} maxPlays={1} />
          <MultipleChoice question={question} onAnswerChange={onAnswerChange} isMultiple={false} hideContent />
        </div>
      );
    }
    // Fallback
    return (
      <div className="space-y-4">
        <AudioPlayer text={typeof question.content === 'string' ? question.content : JSON.stringify(question.content)} label="Listen to the recording" autoPlay={true} maxPlays={1} />
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
  const initialOptions = Array.isArray(question.options) ? question.options : [];
  const [sourceItems, setSourceItems] = useState<{ id: string, text: string }[]>(
    initialOptions.map((opt, i) => ({ id: `s-${i}`, text: opt }))
  );
  const [targetItems, setTargetItems] = useState<{ id: string, text: string }[]>([]);
  const [draggedItem, setDraggedItem] = useState<{ list: 'source' | 'target', index: number } | null>(null);

  const handleDragStart = (list: 'source' | 'target', index: number) => {
    setDraggedItem({ list, index });
  };

  const handleDrop = (e: React.DragEvent, targetList: 'source' | 'target', dropIndex?: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    let newSource = [...sourceItems];
    let newTarget = [...targetItems];

    let itemToMove;
    if (draggedItem.list === 'source') {
      itemToMove = newSource[draggedItem.index];
      newSource.splice(draggedItem.index, 1);
    } else {
      itemToMove = newTarget[draggedItem.index];
      newTarget.splice(draggedItem.index, 1);
    }

    if (targetList === 'source') {
      newSource.push(itemToMove);
    } else {
      if (dropIndex !== undefined) {
        newTarget.splice(dropIndex, 0, itemToMove);
      } else {
        newTarget.push(itemToMove);
      }
    }

    setSourceItems(newSource);
    setTargetItems(newTarget);
    setDraggedItem(null);
    onAnswerChange?.(JSON.stringify(newTarget.map(t => t.text)));
  };

  return (
    <div className="space-y-4">
      {question.content && (
        <div className="rounded-xl border bg-muted/50 p-4">
          <p className="text-sm text-foreground">{typeof question.content === 'string' ? question.content : JSON.stringify(question.content)}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Column */}
        <div 
          className="border-2 border-dashed border-border rounded-xl p-4 min-h-[300px] flex flex-col gap-2 bg-card"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'source')}
        >
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">Source Paragraphs</div>
          {sourceItems.map((item, i) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart('source', i)}
              className="flex items-start gap-3 rounded-lg border border-primary/20 bg-background p-3 cursor-grab hover:border-primary/50 transition-colors shadow-sm"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
          {sourceItems.length === 0 && <div className="m-auto text-sm text-muted-foreground">All items moved</div>}
        </div>

        {/* Target Column */}
        <div 
          className="border-2 border-primary/30 rounded-xl p-4 min-h-[300px] flex flex-col gap-2 bg-primary/5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'target')}
        >
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2 text-center">Correct Order</div>
          {targetItems.map((item, i) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart('target', i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.stopPropagation(); handleDrop(e, 'target', i); }}
              className="flex items-start gap-3 rounded-lg border-2 border-primary bg-background p-3 cursor-grab shadow-sm"
            >
              <div className="flex items-start gap-2 flex-1">
                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="text-sm leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
          {targetItems.length === 0 && <div className="m-auto text-sm text-primary/60 font-semibold">Drag paragraphs here</div>}
        </div>
      </div>
    </div>
  );
}

// === FILL IN THE BLANKS ===
function FillInBlanks({ question, onAnswerChange, isListening }: {
  question: Question; onAnswerChange?: (answer: string) => void; isListening?: boolean;
}) {
  const [blanks, setBlanks] = useState<Record<string, string>>({});
  const options = Array.isArray(question.options) ? question.options : [];
  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  const isReadWrite = question.subType === "Fill in the Blanks (R&W)";

  // Parse content to find blanks
  const content = typeof question.content === 'string' ? question.content : JSON.stringify(question.content || "");
  const parts = content.split(/(___BLANK\d+___)/g);

  const updateBlank = (key: string, value: string) => {
    const next = { ...blanks, [key]: value };
    setBlanks(next);
    onAnswerChange?.(JSON.stringify(next));
  };

  const handleDrop = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (draggedWord) {
      updateBlank(key, draggedWord);
      setDraggedWord(null);
    }
  };

  return (
    <div className="space-y-6">
      {isListening && (
        <div className="text-xs font-bold text-primary uppercase tracking-wider">🎧 Audio Transcript - Fill in the missing words</div>
      )}
      <div className="rounded-xl border bg-muted/50 p-6 text-base leading-[2.5] shadow-inner">
        {parts.map((part, i) => {
          const match = part.match(/___BLANK(\d+)___/);
          if (match) {
            const key = `BLANK${match[1]}`;
            
            if (isReadWrite) {
              // R&W: Dropdown selection
              return (
                <select
                  key={i}
                  className="inline-block mx-1.5 h-8 min-w-[120px] rounded border-2 border-primary/30 bg-background px-2 text-sm focus:border-primary focus:outline-none"
                  value={blanks[key] || ""}
                  onChange={(e) => updateBlank(key, e.target.value)}
                >
                  <option value="" disabled></option>
                  {options.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              );
            }
            
            if (isListening) {
              // Listening: Input box
              return (
                <Input
                  key={i}
                  className="inline-block w-32 mx-1.5 text-sm h-8 border-2 border-primary/30 bg-background"
                  value={blanks[key] || ""}
                  onChange={(e) => updateBlank(key, e.target.value)}
                />
              );
            }

            // Reading FIB: Drag and Drop Zone
            return (
              <span
                key={i}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, key)}
                className={`inline-flex items-center justify-center mx-1.5 h-8 min-w-[100px] px-3 rounded border-2 border-dashed transition-colors ${
                  blanks[key] ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-background hover:border-primary/50'
                }`}
                onDoubleClick={() => { if(blanks[key]) updateBlank(key, "") }} // double click to clear
              >
                {blanks[key] || ""}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
      
      {options.length > 0 && !isListening && !isReadWrite && (
        <div className="rounded-xl border-2 border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wider text-center">Drag words from here</p>
          <div className="flex flex-wrap justify-center gap-3">
            {options.map((word, i) => {
              // If word is already in a blank, we can optionally hide it or dim it.
              // Standard PTE doesn't hide them, but we can dim it for UX.
              const isUsed = Object.values(blanks).includes(word);
              return (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setDraggedWord(word)}
                  onDragEnd={() => setDraggedWord(null)}
                  className={`bg-primary/10 text-primary text-sm font-bold px-4 py-2 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${
                    isUsed ? 'opacity-50 border-primary/20' : 'border-primary shadow-sm hover:-translate-y-0.5'
                  }`}
                >
                  {word}
                </div>
              );
            })}
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
