export function UserSkeleton() {
  return (
    <div className="space-y-3 p-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div className="h-3 w-28 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );
}
