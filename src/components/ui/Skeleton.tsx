// src/components/ui/Skeleton.tsx
export const Skeleton = ({ className = '', count = 1 }: { className?: string; count?: number }) => (
    <div className="space-y-3">
        {Array(count).fill(0).map((_, i) => (
            <div key={i} className={`skeleton h-16 ${className}`} />
        ))}
    </div>
)