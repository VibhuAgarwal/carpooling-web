import Link from "next/link";
import ProfileMenu from "./ProfileMenu";

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          CarPool
        </Link>

        <ProfileMenu />
      </div>
    </header>
  );
}
