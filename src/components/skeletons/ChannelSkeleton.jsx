export function ChannelSkeleton() {
  return (
    <div className="space-y-2 px-2">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between animate-pulse"
        >
          <div className="h-3 w-24 bg-gray-300 rounded"></div>
          <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
        </div>
      ))}
    </div>
  );
}
