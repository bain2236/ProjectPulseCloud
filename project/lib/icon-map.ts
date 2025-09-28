import {
  Github,
  Linkedin,
  FileText,
  Instagram,
  Youtube,
  Code,
  LucideProps,
} from 'lucide-react';
import React from 'react';

export const getIconForLink = (
  label: string
): React.ComponentType<LucideProps> => {
  const lowerCaseLabel = label.toLowerCase();

  if (lowerCaseLabel.includes('github')) {
    return Github;
  }
  if (lowerCaseLabel.includes('linkedin')) {
    return Linkedin;
  }
  if (lowerCaseLabel.includes('cv')) {
    return FileText;
  }
  if (lowerCaseLabel.includes('instagram')) {
    return Instagram;
  }
  if (lowerCaseLabel.includes('youtube')) {
    return Youtube;
  }
  if (lowerCaseLabel.includes('dev.to')) {
    return Code; // Using a generic code icon for Dev.to
  }

  return Code; // Default icon
};
