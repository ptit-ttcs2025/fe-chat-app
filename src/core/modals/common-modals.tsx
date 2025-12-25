
import NewChat from './newChat'
import DeleteAccount from './delete-account'
import DeleteChat from './delete-chat'
import VideoCall from './video-call'
import VideoGroup from './video-group'
import StartVideoCall from './start-video-call'
import VoiceAttend from './voice-attend'
import VoiceCall from './voice-call'
import VoiceGroup from './voice-group'
import NewGroup from './new-group'
import AddGroup from './add-group'
import AddContact from './add-contact'
import MuteUser from './mute-user'
import BlockUser from './block-user'
import ContactDetails from './contact-details'
import EditContact from './edit-contact'
import InviteModal from './invite-modal'
import FriendRequests from './friend-requests'
import Notifications from './notifications'
import { GroupCreationProvider } from '@/contexts/GroupCreationContext'

const CommonModals = () => {
  return (
    <>
    <NewChat/>
    <GroupCreationProvider>
      <NewGroup/>
      <AddGroup/>
    </GroupCreationProvider>
    <DeleteChat/>
    <DeleteAccount/>
    <VideoCall/>
    <VideoGroup/>
    <StartVideoCall/>
    <VoiceAttend/>
    <VoiceCall/>
    <VoiceGroup/>
    <AddContact/>
    <FriendRequests/>
    <Notifications/>
    <MuteUser/>
    <BlockUser/>
    <ContactDetails/>
    <EditContact/>
    <InviteModal/>
    </>
  )
}

export default CommonModals