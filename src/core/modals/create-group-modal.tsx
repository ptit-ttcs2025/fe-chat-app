/**
 * Create Group Modal
 * Modal tạo nhóm mới với form fields theo API requirements
 * UI design: Avatar upload, character counters, radio buttons cho loại nhóm
 */

import { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { useChatConversations } from "@/hooks/useChatConversations";
import { friendApis } from "@/apis/friend/friend.api";
import http from "@/lib/apiBase";
import ImageWithBasePath from "../common/imageWithBasePath";

interface CreateGroupModalProps {
  show: boolean;
  onHide: () => void;
}

interface Friend {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

const CreateGroupModal = ({ show, onHide }: CreateGroupModalProps) => {
  // Form state
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSendMessageAllowed, setIsSendMessageAllowed] = useState(true);
  
  // Step management (Step 1: Basic info, Step 2: Select members)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Member selection
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  // Upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { createGroup, isCreating } = useGroupManagement({ groupId: null });
  const { refresh: refreshConversations } = useChatConversations({
    type: "GROUP",
  });

  // Fetch friends list (chỉ ở step 2)
  useEffect(() => {
    if (show && currentStep === 2) {
      fetchFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, currentStep, searchKeyword]);

  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const friendsList = await friendApis.searchFriends({
        q: searchKeyword,
        pageNumber: 0,
        pageSize: 100,
      });

      const mappedFriends = friendsList.map((friend) => ({
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

  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar to server
  const uploadAvatar = async (file: File): Promise<string> => {
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "AVATARS");

      const response = await http.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Response format: { statusCode, message, data: { id, fileUrl, ... } }
      if (response.data?.data?.fileUrl) {
        return response.data.data.fileUrl;
      }
      throw new Error("Upload failed");
    } catch (error) {
      console.error("❌ Error uploading avatar:", error);
      throw error;
    } finally {
      setIsUploadingAvatar(false);
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

  // Step 1: Validate basic info
  const handleNextStep = (e?: React.MouseEvent | React.FormEvent) => {
    console.log("🔵 handleNextStep START", { 
      groupName, 
      description, 
      groupNameLength: groupName.length,
      descriptionLength: description.length,
      currentStep,
      event: e ? e.type : 'no event'
    });
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!groupName.trim()) {
      console.log("❌ Validation failed: Empty group name");
      alert("Vui lòng nhập tên nhóm");
      return;
    }
    if (groupName.length > 50) {
      console.log("❌ Validation failed: Group name too long");
      alert("Tên nhóm không được vượt quá 50 ký tự");
      return;
    }
    if (description.length > 200) {
      console.log("❌ Validation failed: Description too long");
      alert("Mô tả không được vượt quá 200 ký tự");
      return;
    }
    
    console.log("✅ Validation passed, moving to step 2");
    setCurrentStep(2);
    console.log("✅ Step changed to 2");
  };

  // Step 2: Submit form
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload avatar file if selected
      if (avatarFile) {
        try {
          finalAvatarUrl = await uploadAvatar(avatarFile);
        } catch (error) {
          alert("Không thể tải avatar lên. Vui lòng thử lại.");
          return;
        }
      }

      await createGroup({
        name: groupName.trim(),
        description: description.trim() || undefined,
        avatarUrl: finalAvatarUrl || undefined,
        isPublic,
        isSendMessageAllowed,
        memberIds: selectedMembers.length > 0 ? selectedMembers : undefined,
      });

      // Refresh conversations list
      refreshConversations();

      // Reset form
      handleClose();

      alert("Tạo nhóm thành công!");
    } catch (error: any) {
      console.error("❌ Error creating group:", error);
      alert(error.response?.data?.message || "Không thể tạo nhóm. Vui lòng thử lại.");
    }
  };

  const handleClose = () => {
    setGroupName("");
    setDescription("");
    setAvatarUrl("");
    setAvatarFile(null);
    setAvatarPreview("");
    setIsPublic(false);
    setIsSendMessageAllowed(true);
    setSelectedMembers([]);
    setSearchKeyword("");
    setCurrentStep(1);
    onHide();
  };

  const filteredFriends = searchKeyword.trim()
    ? friends.filter((f) =>
        f.displayName.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : friends;

  // Debug: Log when modal opens
  useEffect(() => {
    if (show) {
      console.log("🔵 CreateGroupModal opened", { currentStep, groupName });
    }
  }, [show, currentStep, groupName]);

  // Test function to trigger next step from outside (for debugging)
  useEffect(() => {
    if (show) {
      (window as any).testNextStep = () => {
        console.log("🔵 Test function called from window");
        handleNextStep();
      };
    }
    return () => {
      delete (window as any).testNextStep;
    };
  }, [show, groupName, description, currentStep]);

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered
      backdrop="static"
      keyboard={true}
      enforceFocus={false}
      restoreFocus={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>Tạo nhóm mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentStep === 1 ? (
          // Step 1: Basic Information
          <Form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              e.stopPropagation();
              console.log("🔵 Form onSubmit triggered");
              handleNextStep(e); 
            }}
            noValidate
          >
            {/* Avatar Upload */}
            <div className="text-center mb-4">
              <div
                className="position-relative d-inline-block"
                style={{ cursor: "pointer" }}
                onClick={() => avatarInputRef.current?.click()}
              >
                <div
                  className="border border-2 border-dashed rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderColor: "#667eea",
                    backgroundColor: avatarPreview ? "transparent" : "#f8f9fa",
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="rounded-circle"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <>
                      <i
                        className="ti ti-users"
                        style={{ fontSize: "48px", color: "#667eea" }}
                      />
                      <span
                        className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "32px",
                          height: "32px",
                          fontSize: "18px",
                        }}
                      >
                        +
                      </span>
                    </>
                  )}
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarSelect}
              />
              {isUploadingAvatar && (
                <div className="mt-2">
                  <small className="text-muted">Đang tải avatar...</small>
                </div>
              )}
            </div>

            {/* Group Name */}
            <Form.Group className="mb-3">
              <Form.Label>
                Tên nhóm <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tên nhóm"
                value={groupName}
                onChange={(e) => {
                  console.log("🔵 Group name changed:", e.target.value);
                  setGroupName(e.target.value);
                }}
                maxLength={50}
                required
              />
              <Form.Text className="text-muted">
                {groupName.length}/50 ký tự
              </Form.Text>
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label>
                Mô tả nhóm
                <i
                  className="ti ti-info-circle ms-2"
                  style={{ fontSize: "14px", cursor: "help" }}
                  title="Mô tả ngắn về nhóm"
                />
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập mô tả về nhóm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
              />
              <Form.Text className="text-muted">
                {description.length}/200 ký tự
              </Form.Text>
            </Form.Group>

            {/* Group Type - Radio Buttons */}
            <Form.Group className="mb-3">
              <Form.Label>Loại nhóm</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  id="public-group"
                  name="groupType"
                  label={
                    <div className="d-flex align-items-center">
                      <i className="ti ti-world me-2" style={{ color: "#667eea" }} />
                      <div>
                        <div className="fw-semibold">Công khai</div>
                        <small className="text-muted">
                          Mọi người có thể tìm thấy và tham gia
                        </small>
                      </div>
                    </div>
                  }
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mb-2 p-3 border rounded"
                />
                <Form.Check
                  type="radio"
                  id="private-group"
                  name="groupType"
                  label={
                    <div className="d-flex align-items-center">
                      <i className="ti ti-lock me-2" style={{ color: "#667eea" }} />
                      <div>
                        <div className="fw-semibold">Riêng tư</div>
                        <small className="text-muted">
                          Chỉ thành viên được mời mới có thể tham gia
                        </small>
                      </div>
                    </div>
                  }
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="p-3 border rounded"
                />
              </div>
            </Form.Group>

            {/* Send Message Permission */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="send-message-allowed"
                label="Cho phép thành viên gửi tin nhắn"
                checked={isSendMessageAllowed}
                onChange={(e) => setIsSendMessageAllowed(e.target.checked)}
              />
            </Form.Group>
          </Form>
        ) : (
          // Step 2: Select Members
          <div>
            <h6 className="mb-3">Chọn thành viên</h6>
            
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
                  Không tìm thấy bạn bè
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
                      className="me-2"
                    />
                    <ImageWithBasePath
                      src={
                        friend.avatarUrl ||
                        "assets/img/avatar/avatar-default.png"
                      }
                      alt={friend.displayName}
                      className="rounded-circle"
                      style={{ width: "40px", height: "40px" }}
                    />
                    <span className="ms-2">{friend.displayName}</span>
                  </div>
                ))
              )}
            </div>
            <small className="text-muted mt-2 d-block">
              Đã chọn {selectedMembers.length} thành viên
            </small>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ position: 'relative', zIndex: 10001 }}>
        <Button variant="secondary" onClick={handleClose}>
          <i className="ti ti-x me-1" />
          Hủy
        </Button>
        {currentStep === 1 ? (
          <Button 
            variant="primary" 
            onClick={(e) => {
              console.log("🔵🔵🔵 Button onClick triggered", { 
                groupName, 
                currentStep,
                groupNameTrimmed: groupName.trim(),
                groupNameLength: groupName.length,
                eventType: e.type,
                target: e.target,
                timestamp: new Date().toISOString()
              });
              try {
                e.preventDefault();
                e.stopPropagation();
                handleNextStep(e);
              } catch (error) {
                console.error("❌ Error in onClick handler:", error);
              }
            }}
            onMouseDown={(e) => {
              console.log("🔵 Button onMouseDown triggered");
            }}
            onMouseUp={(e) => {
              console.log("🔵 Button onMouseUp triggered");
            }}
            type="button"
            disabled={false}
            style={{ 
              zIndex: 10000, 
              position: 'relative',
              pointerEvents: 'auto !important',
              cursor: 'pointer !important',
              opacity: 1
            }}
            className="btn-next-step"
            data-testid="next-button"
          >
            Tiếp theo <i className="ti ti-arrow-right ms-1" />
          </Button>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={() => setCurrentStep(1)}>
              <i className="ti ti-arrow-left me-1" />
              Quay lại
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isCreating || isUploadingAvatar}
            >
              {isCreating || isUploadingAvatar ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Đang tạo...
                </>
              ) : (
                "Tạo nhóm"
              )}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CreateGroupModal;
