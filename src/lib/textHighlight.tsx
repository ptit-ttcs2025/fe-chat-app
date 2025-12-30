/**
 * Text Highlight Utility
 * Highlight keywords in text content for search functionality
 */

import React from 'react';

/**
 * Escape special regex characters in a string
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Highlight keywords in text content
 * @param text - The text content to highlight
 * @param keyword - The keyword to highlight (case-insensitive)
 * @returns React node with highlighted keywords
 */
export const highlightText = (
  text: string,
  keyword: string
): React.ReactNode => {
  if (!text || !keyword || !keyword.trim()) {
    return text;
  }

  const trimmedKeyword = keyword.trim();
  const escapedKeyword = escapeRegex(trimmedKeyword);
  
  try {
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Check if this part matches the keyword (case-insensitive)
      if (regex.test(part)) {
        // Reset regex lastIndex for next test
        regex.lastIndex = 0;
        return (
          <mark
            key={index}
            style={{
              backgroundColor: '#ffeb3b',
              color: '#1a1a1a',
              padding: '2px 0',
              borderRadius: '2px',
              fontWeight: 500,
            }}
          >
            {part}
          </mark>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  } catch (error) {
    // Fallback if regex fails (shouldn't happen with escaped keyword)
    console.warn('Error highlighting text:', error);
    return text;
  }
};

