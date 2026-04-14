export function MessageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          {/* Avatar */}
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-gray-300 rounded"></div>
            <div className="h-3 w-full bg-gray-200 rounded"></div>
            <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
