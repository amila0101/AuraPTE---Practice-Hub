// Real PTE exam time limits per sub-type (in minutes)
export function getQuestionTimeLimit(skill: string, subType: string): number {
  const timings: Record<string, Record<string, number>> = {
    speaking: {
      "Read Aloud": 1.5,        // ~40s prep + 35s record
      "Repeat Sentence": 0.5,
      "Describe Image": 1.5,    // 25s prep + 40s record
      "Re-tell Lecture": 1.5,   // 10s prep + 40s record
      "Answer Short Question": 0.5,
    },
    writing: {
      "Summarize Written Text": 10,
      "Write Essay": 20,
    },
    reading: {
      "Multiple Choice (Single)": 2,
      "Multiple Choice (Multiple)": 2,
      "Re-order Paragraphs": 2,
      "Fill in the Blanks (R)": 2,
      "Fill in the Blanks (R&W)": 2,
    },
    listening: {
      "Summarize Spoken Text": 10,
      "Multiple Choice (Single)": 2,
      "Fill in the Blanks": 2,
      "Highlight Correct Summary": 2,
      "Select Missing Word": 1.5,
      "Highlight Incorrect Words": 2,
      "Write from Dictation": 1,
    },
  };

  return timings[skill]?.[subType] ?? 2;
}
