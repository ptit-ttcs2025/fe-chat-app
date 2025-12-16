interface ChatSearchProps {
  showSearch: boolean;
  searchKeyword: string;
  onSearchChange: (value: string) => void;
}

const ChatSearch = ({ showSearch, searchKeyword, onSearchChange }: ChatSearchProps) => {
  return (
    <div className={`chat-search search-wrap contact-search ${showSearch ? 'visible-chat' : ''}`}>
      <form>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm tin nhắn..."
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <span className="input-group-text">
            <i className="ti ti-search" />
          </span>
        </div>
      </form>
    </div>
  );
};

export default ChatSearch;

