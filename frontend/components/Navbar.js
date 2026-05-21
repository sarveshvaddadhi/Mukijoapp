import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="bg-slate-900 text-white p-4 flex justify-between items-center">

            <h1 className="text-2xl font-bold text-blue-500">
                Mukijo
            </h1>

            <div className="flex gap-4">

                <Link
                    href="/login"
                    className="bg-blue-600 px-4 py-2 rounded-lg"
                >
                    Login
                </Link>

                <Link
                    href="/register"
                    className="bg-green-600 px-4 py-2 rounded-lg"
                >
                    Register
                </Link>

            </div>

        </nav>
    );
}