/**
 * Onboarding tour — fixed sidebar item visible to all tenant users.
 * The HTML lives at /public/onboarding/index.html (standalone bundle,
 * Skinner brand colors). We embed it as a same-origin iframe so the
 * cliente never leaves the panel. To update the tour, replace the file
 * in apps/web/public/onboarding/index.html — no code change needed.
 */
export default function OnboardingPage() {
  return (
    <div className="h-screen flex flex-col bg-blanc-casse">
      <div className="px-8 py-5 border-b border-sable/20 bg-white">
        <h1 className="font-serif text-2xl text-carbone">Onboarding</h1>
        <p className="text-sm text-pierre font-light mt-1">
          Tour guiado para configurar e tirar o maximo do seu painel Skinner.
        </p>
      </div>
      <iframe
        src="/onboarding/index.html"
        title="Skinner Onboarding Tour"
        className="flex-1 w-full border-0"
      />
    </div>
  );
}
