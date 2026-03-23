import MessageInput from "./MessageInput";
import { replyToMessage } from "../../services/messageService";
import useChatStore from "../../store/chatStore";

export default function ThreadInput() {
  const {
    threadMessage,
    addThreadReply,
    activeChannel,
    dmUser,
    isDM,
  } = useChatStore();

  const handleThreadSend = async (payload) => {
    try {
      const res = await replyToMessage(
        threadMessage._id,
        payload
      );

      addThreadReply(res.data);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MessageInput
      isThread
      onSendOverride={handleThreadSend}
      parentMessageId={threadMessage._id}
      replyTo={threadMessage}
    />
  );
}
