/**
 * Eventtts Color Palette Reference
 * 
 * This component demonstrates the new color scheme inspired by eventtts.live
 * Use this as a reference when building UI components
 */

export default function ColorReference() {
  return (
    <div className="p-8 space-y-8">
      {/* Primary Colors */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Primary Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-primary"></div>
            <p className="text-sm font-medium">Primary (Red)</p>
            <code className="text-xs text-muted-foreground">bg-primary</code>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-secondary"></div>
            <p className="text-sm font-medium">Secondary (Blue)</p>
            <code className="text-xs text-muted-foreground">bg-secondary</code>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-accent"></div>
            <p className="text-sm font-medium">Accent (Light Red)</p>
            <code className="text-xs text-muted-foreground">bg-accent</code>
          </div>
        </div>
      </section>

      {/* Feature Icon Colors */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Feature Icon Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <div className="h-20 w-20 rounded-full icon-gradient-purple shadow-feature-icon mx-auto"></div>
            <p className="text-sm font-medium text-center">Purple</p>
            <code className="text-xs text-muted-foreground block text-center">icon-gradient-purple</code>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-20 rounded-full icon-gradient-cyan shadow-feature-icon mx-auto"></div>
            <p className="text-sm font-medium text-center">Cyan</p>
            <code className="text-xs text-muted-foreground block text-center">icon-gradient-cyan</code>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-20 rounded-full icon-gradient-green shadow-feature-icon mx-auto"></div>
            <p className="text-sm font-medium text-center">Green</p>
            <code className="text-xs text-muted-foreground block text-center">icon-gradient-green</code>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-20 rounded-full icon-gradient-orange shadow-feature-icon mx-auto"></div>
            <p className="text-sm font-medium text-center">Orange</p>
            <code className="text-xs text-muted-foreground block text-center">icon-gradient-orange</code>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-20 rounded-full icon-gradient-pink shadow-feature-icon mx-auto"></div>
            <p className="text-sm font-medium text-center">Pink</p>
            <code className="text-xs text-muted-foreground block text-center">icon-gradient-pink</code>
          </div>
        </div>
      </section>

      {/* Gradient Backgrounds */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Gradient Backgrounds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-32 rounded-lg bg-gradient-red-hero flex items-center justify-center">
              <p className="text-white font-bold text-xl">Red Hero</p>
            </div>
            <code className="text-xs text-muted-foreground">bg-gradient-red-hero</code>
          </div>
          <div className="space-y-2">
            <div className="h-32 rounded-lg bg-gradient-blue-section flex items-center justify-center">
              <p className="text-white font-bold text-xl">Blue Section</p>
            </div>
            <code className="text-xs text-muted-foreground">bg-gradient-blue-section</code>
          </div>
        </div>
      </section>

      {/* Soft Backgrounds */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Soft Section Backgrounds</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="h-32 rounded-lg bg-soft-pink flex items-center justify-center">
              <p className="font-medium">Soft Pink</p>
            </div>
            <code className="text-xs text-muted-foreground">bg-soft-pink</code>
          </div>
          <div className="space-y-2">
            <div className="h-32 rounded-lg bg-soft-blue flex items-center justify-center">
              <p className="font-medium">Soft Blue</p>
            </div>
            <code className="text-xs text-muted-foreground">bg-soft-blue</code>
          </div>
          <div className="space-y-2">
            <div className="h-32 rounded-lg bg-soft-purple flex items-center justify-center">
              <p className="font-medium">Soft Purple</p>
            </div>
            <code className="text-xs text-muted-foreground">bg-soft-purple</code>
          </div>
        </div>
      </section>

      {/* Button Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Button Styles</h2>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
            Primary CTA
          </button>
          <button className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
            Secondary Button
          </button>
          <button className="px-6 py-3 bg-white text-foreground border border-border rounded-lg font-medium hover:bg-accent transition-colors">
            Outline Button
          </button>
        </div>
      </section>

      {/* Card Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Card Styles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow">
            <h3 className="font-bold text-lg mb-2">Simple Card</h3>
            <p className="text-muted-foreground">Clean card with subtle shadow</p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-6 border border-border">
            <h3 className="font-bold text-lg mb-2">Bordered Card</h3>
            <p className="text-muted-foreground">Card with border accent</p>
          </div>
          <div className="bg-soft-pink rounded-lg shadow-card p-6">
            <h3 className="font-bold text-lg mb-2">Tinted Card</h3>
            <p className="text-muted-foreground">Soft background variation</p>
          </div>
        </div>
      </section>

      {/* Text Gradients */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Text Gradients</h2>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gradient">
            Red Gradient Heading
          </h1>
          <h1 className="text-4xl font-bold text-gradient-blue">
            Blue Gradient Heading
          </h1>
        </div>
      </section>
    </div>
  );
}
