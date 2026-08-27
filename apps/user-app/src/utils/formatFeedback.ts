function stripOverallScore(feedback: string): string {
  return feedback
    .split("\n")
    .filter((l) => !/^\s*Overall\s*Score\s*:/i.test(l.trim()))
    .join("\n");
}

export function formatFeedbackAsMarkdown(feedback: string): string {
  if (!feedback) return "";
  feedback = stripOverallScore(feedback);

  if (feedback.includes("##") || feedback.includes("###") || feedback.includes("- ")) {
    return feedback;
  }

  const lines = feedback.split("\n").map((line) => line.trim());
  const formattedLines: string[] = [];
  const mainHeaders = ["Strengths", "Weaknesses", "Improvements Needed", "Justification of the Score"];

  lines.forEach((line) => {
    if (mainHeaders.some((header) => line === header)) {
      formattedLines.push(`## ${line}`);
      return;
    }

    if (/^\d+\./.test(line)) {
      const prevLine = formattedLines[formattedLines.length - 1];
      const isPreviousAHeader = mainHeaders.some((header) => prevLine?.includes(`## ${header}`));
      if (isPreviousAHeader && !formattedLines[formattedLines.length - 1]?.includes("- ")) {
        formattedLines.push("");
      }
      formattedLines.push(line.replace(/^\d+\.\s*/, "- "));
      return;
    }

    if (line.length > 0) {
      formattedLines.push(line);
    }
  });

  return formattedLines.join("\n");
}
