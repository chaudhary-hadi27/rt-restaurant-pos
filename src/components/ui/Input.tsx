export default function Input({ label, error, className = '', ...props }: any) {
    return (
        <div className="space-y-1">
            {label && <label className="block text-sm font-medium text-[var(--fg)]">{label}</label>}
            <input
                className={`w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-blue-600 ${className}`}
                {...props}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    )
}