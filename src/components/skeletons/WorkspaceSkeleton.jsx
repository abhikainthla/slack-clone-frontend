export function WorkspaceSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 p-4 space-y-4">
        <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>

        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b flex items-center px-4">
          <div className="h-4 w-40 bg-gray-300 rounded animate-pulse"></div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-gray-300 rounded"></div>
                <div className="h-3 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
