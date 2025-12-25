
import GroupInfo from './group-info'
import MessageInfo from './message-info'
import GroupSettings from './group-settings'
import InviteModal from './invite-modal'
import MuteNotification from './mute-notification'
import MessageDisapper from './message-disapper'
import ApproveParticipants from './approve-participants'
import PendingRequests from './pending-requests'
import ReportUser from './report-user'
import MuteUser from './mute-user'
import NewGroup from './new-group'
import AddGroup from './add-group'
import EditGroup from './edit-group'
import EditAdmin from './edit-admin'
import GroupLogout from './group-logout'
import ReportGroup from './report-group'
import { GroupCreationProvider } from '@/contexts/GroupCreationContext'

const CommonGroupModal = () => {
  return (
    <>
    <MuteUser/>
    <MessageInfo/>
    <GroupInfo/>
    <GroupSettings/>
    <InviteModal/>
    <MuteNotification/>
    <MessageDisapper/>
    <ApproveParticipants/>
    <PendingRequests/>
    <ReportUser/>
    <GroupCreationProvider>
      <NewGroup/>
      <AddGroup/>
    </GroupCreationProvider>
    <EditGroup/>
    <EditAdmin/>
    <GroupLogout/>
    <ReportGroup/>
    </>
  )
}

export default CommonGroupModal