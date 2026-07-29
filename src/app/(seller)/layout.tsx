import Navbar from "@/app/components/Navbar";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
