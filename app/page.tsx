import { Converter } from "@/components/converter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-6 sm:px-8 lg:py-10">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              File conversion
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal sm:text-4xl">
              Convert Office files to PDF
            </h1>
          </div>
          <ThemeToggle />
        </header>
        <Converter />
        <section className="text-sm text-muted-foreground">
          <p>Supports .xlsx, .docx, and .pptx.</p>
        </section>
      </div>
    </main>
  );
}
