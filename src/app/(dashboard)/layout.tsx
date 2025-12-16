// src/app/(dashboard)/layout.tsx
import Sidebar from '@/components/layout/sidebar';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
            <Sidebar />
            <main className="lg:ml-[64px] transition-all duration-300">
                <div className="p-4 md:p-6 lg:p-8 pt-20 lg:pt-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}