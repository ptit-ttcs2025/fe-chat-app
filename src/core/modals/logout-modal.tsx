import React from 'react';
import { Link } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { useLogout } from '../..//hooks/useLogout';

type props = {
    showModal?: boolean;
    setShowModal: CallableFunction;
}

const LogoutModal: React.FC<props> = ({
                                          showModal,
                                          setShowModal
                                      }) => {
    const { handleLogout, isLoading } = useLogout();

    const handleClose = () => {
        setShowModal(false);
    };

    const onLogout = async () => {
        await handleLogout();
        setShowModal(false);
    };

    return (
        <>
            {/* Logout */}
            <Modal centered show={showModal}>
                <div className="modal-header">
                    <h4 className="modal-title">Logout</h4>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={handleClose}
                        aria-label="Close"
                        disabled={isLoading}
                    >
                        <i className="ti ti-x" />
                    </button>
                </div>
                <div className="modal-body">
                    <form>
                        <div className="block-wrap text-center mb-3">
              <span className="user-icon mb-3 mx-auto bg-transparent-danger">
                <i className="ti ti-logout text-danger" />
              </span>
                            <p className="text-grya-9">Bạn có chắc chắn muốn đăng xuất không?</p>
                        </div>
                        <div className="row g-3">
                            <div className="col-6">
                                <Link
                                    to="#"
                                    className="btn btn-outline-primary w-100"
                                    onClick={handleClose}
                                    aria-label="Close"
                                >
                                    Cancel
                                </Link>
                            </div>
                            <div className="col-6">
                                <button
                                    type="button"
                                    className="btn btn-primary w-100"
                                    onClick={onLogout}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Đang đăng xuất...
                                        </>
                                    ) : (
                                        'Logout'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>
            {/* /Logout */}
        </>
    );
};

export default LogoutModal;
