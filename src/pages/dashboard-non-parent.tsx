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
        <div className="min-h-screen bg-white">
            <div className="w-full">
                <div className="w-full bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-12 rounded-b-3xl shadow-lg">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-5xl font-bold text-white mb-2">Welcome back! 👋</h1>
                        <p className="text-blue-100 text-lg mb-4">{user?.email}</p>
                        {/* <p className="text-blue-50 text-base">Choose an option below to get started</p> */}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8 mt-8">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300 text-left group"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Children</h2>
                        <p className="text-gray-600">Add your own children to the system</p>
                    </button>

                    <button
                        onClick={() => router.push("/rapor")}
                        className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300 text-left group"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Rapor</h2>
                        <p className="text-gray-600">Manage rapor of accessible students</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
