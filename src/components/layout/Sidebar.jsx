import Channels from "../sidebar/Channels";
import DirectMessages from "../sidebar/DirectMessages";

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r p-4">

      <h2 className="font-semibold text-lg mb-6">
        Acme Corp
      </h2>

      <Channels />

      <DirectMessages />

    </div>
  );
}
