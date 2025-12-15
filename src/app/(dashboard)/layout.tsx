import Sidebar from '@/components/layout/sidebar';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
            <Sidebar />
            <main className="ml-16 p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}