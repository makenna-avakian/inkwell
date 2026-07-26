import Navbar from "./components/Navbar";

/**
 * Minimal Phase 1 placeholder landing page (Unit 1 scope only). The real
 * browse/discovery gallery is built by Unit 4 (Browse & Discovery) once
 * shops and listings exist — see aidlc-docs/inception/application-design/unit-of-work.md.
 */
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8 pt-32 text-center text-gray-900">
        <h1 className="mb-4 text-5xl font-bold">Inkwell</h1>
        <p className="mx-auto max-w-xl text-lg text-gray-700">
          A commission-first marketplace for artists. Sign up to open a shop or
          request a commission — browsing and discovery are coming soon.
        </p>
      </main>
    </>
  );
}
