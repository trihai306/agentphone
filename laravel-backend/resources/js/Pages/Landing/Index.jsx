import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import HeroSection from '@/Components/Landing/HeroSection';
import FeaturesSection from '@/Components/Landing/FeaturesSection';
import HowItWorksSection from '@/Components/Landing/HowItWorksSection';
import AboutSection from '@/Components/Landing/AboutSection';
import CTASection from '@/Components/Landing/CTASection';

/**
 * Landing Page - Main marketing page for Agent Automation System
 * Assembles all landing page sections in a professional layout
 *
 * @param {Object} props - Component props from Inertia
 * @param {string} props.appName - Application name from Laravel config
 */
export default function Index({ appName = 'Agent Automation' }) {
    return (
        <>
            <Head>
                <title>{`${appName} - Intelligent Automation Platform`}</title>
                <meta
                    name="description"
                    content="Harness the power of intelligent agents to streamline repetitive tasks, boost productivity, and unlock new possibilities for your business. No coding required."
                />
                <meta
                    name="keywords"
                    content="automation, agent, workflow, productivity, no-code, intelligent automation"
                />
                <meta property="og:title" content={`${appName} - Intelligent Automation Platform`} />
                <meta
                    property="og:description"
                    content="Automate your digital workflows with intelligent agents. Boost productivity and unlock new possibilities."
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${appName} - Intelligent Automation Platform`} />
                <meta
                    name="twitter:description"
                    content="Automate your digital workflows with intelligent agents. Boost productivity and unlock new possibilities."
                />
            </Head>

            <MainLayout>
                {/* Hero Section - Main headline and CTA */}
                <HeroSection />

                {/* Features Section - Showcasing automation capabilities */}
                <FeaturesSection />

                {/* How It Works Section - Step-by-step process explanation */}
                <HowItWorksSection />

                {/* About Section - Product introduction and value proposition */}
                <AboutSection />

                {/* CTA Section - Final call-to-action with contact form */}
                <CTASection />
            </MainLayout>
        </>
    );
}
