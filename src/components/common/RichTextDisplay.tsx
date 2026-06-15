import React from "react";
import { sanitizeRichTextHtml } from "./richText";

type RichTextDisplayProps = {
  html?: string;
  fallback?: string;
  className?: string;
};

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ html, fallback = "", className = "" }) => {
  const content = sanitizeRichTextHtml(html || fallback || "");

  if (!content) return null;

  return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
};

export default RichTextDisplay;
