'use client';

/**
 * Button Test Page - Visual Regression Testing
 *
 * Displays all button variants in enabled and disabled states
 * for visual comparison and WCAG contrast validation.
 *
 * Story 9-5: Disabled Button Contrast Fix
 */

import { Button } from '@/components/ui/button';

export default function ButtonTestPage() {
  return (
    <div className="min-h-screen bg-background p-8 space-y-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Button Contrast Test</h1>
        <p className="text-muted-foreground">
          Visual regression test for Story 9-5: Disabled Button Contrast Fix
        </p>

        {/* Default Variant */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Default Variant</h2>
          <div className="flex gap-4 items-center">
            <Button>Enabled Button</Button>
            <Button disabled>Disabled Button</Button>
          </div>
        </section>

        {/* Destructive Variant */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Destructive Variant</h2>
          <div className="flex gap-4 items-center">
            <Button variant="destructive">Enabled Delete</Button>
            <Button variant="destructive" disabled>
              Disabled Delete
            </Button>
          </div>
        </section>

        {/* Outline Variant */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Outline Variant</h2>
          <div className="flex gap-4 items-center">
            <Button variant="outline">Enabled Outline</Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
          </div>
        </section>

        {/* Secondary Variant */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Secondary Variant</h2>
          <div className="flex gap-4 items-center">
            <Button variant="secondary">Enabled Secondary</Button>
            <Button variant="secondary" disabled>
              Disabled Secondary
            </Button>
          </div>
        </section>

        {/* Ghost Variant */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Ghost Variant</h2>
          <div className="flex gap-4 items-center">
            <Button variant="ghost">Enabled Ghost</Button>
            <Button variant="ghost" disabled>
              Disabled Ghost
            </Button>
          </div>
        </section>

        {/* Link Variant */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Link Variant</h2>
          <div className="flex gap-4 items-center">
            <Button variant="link">Enabled Link</Button>
            <Button variant="link" disabled>
              Disabled Link
            </Button>
          </div>
        </section>

        {/* Form Context Example */}
        <section className="space-y-4 border-t pt-8">
          <h2 className="text-lg font-semibold">Form Context (AC3 Test)</h2>
          <p className="text-sm text-muted-foreground">
            Side-by-side comparison: Can you immediately tell which is clickable?
          </p>
          <div className="p-6 border rounded-lg bg-surface">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter some text..."
                className="w-full rounded-md border border-border bg-background px-4 py-3"
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button disabled className="flex-1">
                  Submit (disabled)
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* WCAG Note */}
        <section className="border-t pt-8">
          <h2 className="text-lg font-semibold mb-2">WCAG AA Validation</h2>
          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <p>
              <strong>Enabled buttons:</strong> Must meet 4.5:1 contrast (normal text)
            </p>
            <p>
              <strong>Disabled buttons:</strong> Exempt from contrast requirements, but
              must be visually distinguishable
            </p>
            <p className="text-muted-foreground">
              AC4: Use browser DevTools or contrast checker to verify
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
