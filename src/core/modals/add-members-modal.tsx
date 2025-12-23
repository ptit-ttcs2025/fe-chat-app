/**
 * Add Members Modal
 * Modal thêm thành viên vào nhóm
 */

import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { friendApis } from "@/apis/friend/friend.api";
import ImageWithBasePath from "../common/imageWithBasePath";
import type { IGroupMember } from "@/apis/group/group.type";

interface AddMembersModalProps {
  show: boolean;
  onHide: () => void;
  groupId: string;
  currentMembers: IGroupMember[];
  onAddMembers: (memberIds: string[]) => Promise<void>;
}

interface Friend {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

const AddMembersModal = ({
  show,
  onHide,
  groupId,
  currentMembers,
  onAddMembers,
}: AddMembersModalProps) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  // Fetch friends (không bao gồm members hiện tại)
  useEffect(() => {
    if (show && groupId) {
      fetchFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, groupId, searchKeyword]);

  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    try {
      // friendApis.searchFriends returns IFriend[] directly
      const friendsList = await friendApis.searchFriends({
        q: searchKeyword,
        pageNumber: 0,
        pageSize: 100,
      });

      // Filter out current members
      const currentMemberIds = currentMembers.map((m) => m.userId);
      const mappedFriends = friendsList
        .filter((friend) => {
          const userId = friend.userId || friend.friendId;
          return !currentMemberIds.includes(userId);
        })
        .map((friend) => ({
          userId: friend.userId || friend.friendId,
          displayName: friend.displayName,
          avatarUrl: friend.avatarUrl,
        }));
      setFriends(mappedFriends);
    } catch (error) {
      console.error("❌ Error fetching friends:", error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleToggleMember = (userId: string) => {
    setSelectedMembers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMembers.length === 0) {
      alert("Vui lòng chọn ít nhất một thành viên");
      return;
    }

    setIsAdding(true);
    try {
      await onAddMembers(selectedMembers);
      handleClose();
      alert("Thêm thành viên thành công!");
    } catch (error: any) {
      console.error("❌ Error adding members:", error);
      alert(error.response?.data?.message || "Không thể thêm thành viên. Vui lòng thử lại.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setSearchKeyword("");
    onHide();
  };

  const filteredFriends = searchKeyword.trim()
    ? friends.filter((f) =>
        f.displayName.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : friends;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Thêm thành viên</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Search */}
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </Form.Group>

          {/* Friends List */}
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              padding: "8px",
            }}
          >
            {isLoadingFriends ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center text-muted py-3">
                {friends.length === 0
                  ? "Tất cả bạn bè đã là thành viên"
                  : "Không tìm thấy bạn bè"}
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.userId}
                  className="d-flex align-items-center p-2 border-bottom"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleToggleMember(friend.userId)}
                >
                  <Form.Check
                    type="checkbox"
                    checked={selectedMembers.includes(friend.userId)}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <ImageWithBasePath
                    src={friend.avatarUrl || "assets/img/avatar/avatar-default.png"}
                    alt={friend.displayName}
                    className="rounded-circle mx-2"
                    style={{ width: "40px", height: "40px" }}
                  />
                  <span>{friend.displayName}</span>
                </div>
              ))
            )}
          </div>
          <small className="text-muted mt-2 d-block">
            Đã chọn {selectedMembers.length} thành viên
          </small>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={selectedMembers.length === 0 || isAdding}
        >
          {isAdding ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Đang thêm...
            </>
          ) : (
            `Thêm (${selectedMembers.length})`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddMembersModal;

