/**
 * Group Members Modal
 * Modal hiển thị danh sách thành viên nhóm với search và quản lý
 */

import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import ImageWithBasePath from "../common/imageWithBasePath";
import type { IGroupMember } from "@/apis/group/group.type";

interface GroupMembersModalProps {
  show: boolean;
  onHide: () => void;
  groupId: string;
  members: IGroupMember[];
  isLoadingMembers: boolean;
  isAdmin: boolean;
  onRemoveMember: (memberId: string) => Promise<void>;
  onAddMembers: () => void;
}

const GroupMembersModal = ({
  show,
  onHide,
  groupId: _groupId,
  members,
  isLoadingMembers,
  isAdmin,
  onRemoveMember,
  onAddMembers,
}: GroupMembersModalProps) => {
  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredMembers = searchKeyword.trim()
    ? members.filter((m) =>
        m.displayName.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : members;

  const handleRemove = async (member: IGroupMember) => {
    if (member.role === "ADMIN") {
      alert("Không thể xóa admin khỏi nhóm");
      return;
    }

    if (
      globalThis.confirm(`Bạn có chắc muốn xóa ${member.displayName} khỏi nhóm?`)
    ) {
      try {
        await onRemoveMember(member.userId);
      } catch (error) {
        console.error("❌ Error removing member:", error);
      }
    }
  };

  const handleClose = () => {
    setSearchKeyword("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Thành viên nhóm ({members.length})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Search */}
        <div className="d-flex gap-2 mb-3">
          <Form.Control
            type="text"
            placeholder="Tìm kiếm thành viên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          {isAdmin && (
            <Button variant="primary" onClick={onAddMembers}>
              <i className="ti ti-plus me-1" />
              Thêm
            </Button>
          )}
        </div>

        {/* Members List */}
        <div
          style={{
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          {isLoadingMembers ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center text-muted py-4">
              Không tìm thấy thành viên
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="d-flex align-items-center justify-content-between p-3 border-bottom"
              >
                <div className="d-flex align-items-center">
                  <div className="position-relative">
                    <ImageWithBasePath
                      src={
                        member.avatarUrl ||
                        "assets/img/avatar/avatar-default.png"
                      }
                      alt={member.displayName}
                      className="rounded-circle"
                      style={{ width: "48px", height: "48px" }}
                    />
                    {member.isOnline && (
                      <span
                        className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle"
                        style={{
                          width: "14px",
                          height: "14px",
                        }}
                      />
                    )}
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-0">{member.displayName}</h6>
                    <div className="d-flex align-items-center gap-2">
                      {member.role === "ADMIN" && (
                        <span className="badge bg-primary">Admin</span>
                      )}
                      <small className="text-muted">
                        {member.isOnline ? (
                          <span className="text-success">
                            <i className="ti ti-circle-filled fs-7 me-1" />
                            Trực tuyến
                          </span>
                        ) : (
                          <span className="text-muted">
                            <i className="ti ti-circle-filled fs-7 me-1" />
                            Offline
                          </span>
                        )}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {isAdmin && member.role !== "ADMIN" && (
                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-light"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-dots-vertical" />
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => handleRemove(member)}
                        >
                          <i className="ti ti-trash me-2" />
                          Xóa khỏi nhóm
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default GroupMembersModal;

