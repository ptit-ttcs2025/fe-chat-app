interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="typing-indicator-footer">
      <span className="typing-indicator-modern">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </span>
      <span>{typingUsers[0]} đang nhập...</span>
    </div>
  );
};

export default TypingIndicator;

