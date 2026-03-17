import { useEffect } from "react";
import Channels from "../sidebar/Channels";
import DirectMessages from "../sidebar/DirectMessages";
import { getChannels } from "../../services/channelService";
import useChatStore from "../../store/chatStore";
import { useParams } from "react-router-dom";

export default function Sidebar() {
  const { id } = useParams();

  const setChannels = useChatStore((s) => s.setChannels);
  const channels = useChatStore((s) => s.channels);

  useEffect(() => {
    const fetchChannels = async () => {
      const res = await getChannels(id);
      setChannels(res.data);
    };

    fetchChannels();
  }, [id]);

  return (
    <div className="w-64 bg-white border-r p-4">

      <h2 className="font-semibold text-lg mb-6">
        Workspace
      </h2>

      <Channels channels={channels} />

      <DirectMessages />

    </div>
  );
}
