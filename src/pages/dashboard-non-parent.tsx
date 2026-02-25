import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import type { User } from "@supabase/supabase-js";

export default function DashboardNonParent() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/");
                return;
            }
            setUser(session.user);
            setLoading(false);
        };
        checkAuth();
    }, [router]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome, {user?.email}</h1>
                    <p className="text-lg text-gray-600">Select a page to navigate to</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300 text-left group"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition"></div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Children</h2>
                        <p className="text-gray-600">Add your own children to the system</p>
                    </button>

                    <button
                        onClick={() => router.push("/rapor")}
                        className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300 text-left group"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition"></div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Rapor</h2>
                        <p className="text-gray-600">Manage rapor of accessible students</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
