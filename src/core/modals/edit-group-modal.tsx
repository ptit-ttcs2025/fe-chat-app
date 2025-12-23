/**
 * Edit Group Modal
 * Modal chỉnh sửa thông tin nhóm (chỉ admin)
 */

import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import type { IGroup } from "@/apis/group/group.type";

interface EditGroupModalProps {
  show: boolean;
  onHide: () => void;
  group: IGroup | undefined | null;
  onUpdate: (data: any) => Promise<void>;
}

const EditGroupModal = ({
  show,
  onHide,
  group,
  onUpdate,
}: EditGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSendMessageAllowed, setIsSendMessageAllowed] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Pre-fill form với thông tin hiện tại
  useEffect(() => {
    if (show && group) {
      setGroupName(group.name || "");
      setDescription(group.description || "");
      setAvatarUrl(group.avatarUrl || "");
      setIsPublic(group.isPublic || false);
      setIsSendMessageAllowed(group.isSendMessageAllowed !== false);
    }
  }, [show, group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      alert("Vui lòng nhập tên nhóm");
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate({
        name: groupName.trim(),
        description: description.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        isPublic,
        isSendMessageAllowed,
      });

      alert("Cập nhật nhóm thành công!");
    } catch (error: any) {
      console.error("❌ Error updating group:", error);
      alert(error.response?.data?.message || "Không thể cập nhật nhóm. Vui lòng thử lại.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa nhóm</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Group Name */}
          <Form.Group className="mb-3">
            <Form.Label>
              Tên nhóm <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập tên nhóm"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Mô tả ngắn về nhóm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          {/* Avatar URL */}
          <Form.Group className="mb-3">
            <Form.Label>Avatar URL</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </Form.Group>

          {/* Settings */}
          <div className="mb-3">
            <Form.Check
              type="checkbox"
              label="Nhóm công khai"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mb-2"
            />
            <Form.Check
              type="checkbox"
              label="Cho phép thành viên gửi tin nhắn"
              checked={isSendMessageAllowed}
              onChange={(e) => setIsSendMessageAllowed(e.target.checked)}
            />
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!groupName.trim() || isUpdating}
        >
          {isUpdating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditGroupModal;

