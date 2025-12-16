export default function Button({ children, variant = 'primary', onClick, disabled, className = '', ...props }: any) {
    const styles = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-[var(--card)] hover:bg-[var(--border)] text-[var(--fg)] border border-[var(--border)]',
        danger: 'bg-red-600 hover:bg-red-700 text-white'
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${styles[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}