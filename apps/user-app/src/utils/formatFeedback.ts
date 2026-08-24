/**
 * Client-side utility to ensure feedback is properly formatted as Markdown.
 * This handles legacy plain-text feedback and ensures consistent rendering.
 */

export function formatFeedbackAsMarkdown(feedback: string): string {
  if (!feedback) {
    return "No feedback available yet.";
  }

  // If feedback already contains Markdown headers, assume it's properly formatted
  if (feedback.includes("###") || feedback.includes("##") || feedback.includes("-\n")) {
    return feedback;
  }

  // For plain text feedback, add basic Markdown formatting
  // Split by double newlines to preserve paragraph structure
  const paragraphs = feedback.split("\n\n");
  
  // Process each paragraph
  const formattedParagraphs = paragraphs.map((paragraph, index) => {
    // Skip empty paragraphs
    if (!paragraph.trim()) {
      return "";
    }

    // If paragraph starts with a number followed by a dot, treat as a list item
    if (/^\d+\.\s/.test(paragraph)) {
      return paragraph;
    }

    // If paragraph starts with a hyphen, treat as a list item
    if (/^-\s/.test(paragraph)) {
      return paragraph;
    }

    // If paragraph contains common section keywords, format as a header
    const sectionKeywords = [
      "Overall Score",
      "Justification",
      "Strengths",
      "Weaknesses",
      "Specific Improvement Suggestions",
      "Score:",
    ];

    for (const keyword of sectionKeywords) {
      if (paragraph.includes(keyword)) {
        return `### ${paragraph}`;
      }
    }

    // Default: return as a regular paragraph
    return paragraph;
  });

  // Join with double newlines for proper Markdown paragraph spacing
  return formattedParagraphs.join("\n\n");
}
