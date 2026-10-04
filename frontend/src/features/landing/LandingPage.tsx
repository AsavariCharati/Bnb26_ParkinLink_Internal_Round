import React, { useEffect } from 'react';
import { LandingNav } from './components/LandingNav';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { ProblemSection } from './components/ProblemSection';
import { CapabilitySection } from './components/CapabilitySection';
import { ProductShowcase } from './components/ProductShowcase';
import { HowItWorks } from './components/HowItWorks';
import { EvidenceSection } from './components/EvidenceSection';
import { EvaluationSection } from './components/EvaluationSection';
import { WhyBlackBox } from './components/WhyBlackBox';
import { DesignedFor } from './components/DesignedFor';
import { FAQ } from './components/FAQ';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';

export const LandingPage: React.FC = () => {
  // Ensure page always starts at top when landing page mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary">
      {/* Fixed navigation */}
      <LandingNav />

      {/* Main content — pt-16 to clear fixed nav */}
      <main className="pt-16">
        {/* 1 — Hero */}
        <Hero />

        {/* 2 — Capability strip */}
        <TrustStrip />

        {/* 3 — Problem framing */}
        <ProblemSection />

        {/* 4 — Capability cards */}
        <CapabilitySection />

        {/* 5 — Interactive product showcase */}
        <ProductShowcase />

        {/* 6 — How it works (4-step) */}
        <HowItWorks />

        {/* 7 — Evidence pipeline */}
        <EvidenceSection />

        {/* 8 — Evaluation metrics */}
        <EvaluationSection />

        {/* 9 — Why Black Box / principles */}
        <WhyBlackBox />

        {/* 10 — Designed for */}
        <DesignedFor />

        {/* 11 — FAQ */}
        <FAQ />

        {/* 12 — Final CTA */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
