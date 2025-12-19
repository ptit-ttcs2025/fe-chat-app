interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="typing-indicator-absolute">
      <span className="typing-indicator-modern">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </span>
      <span className="typing-text">{typingUsers[0]} đang nhập...</span>
    </div>
  );
};

export default TypingIndicator;
