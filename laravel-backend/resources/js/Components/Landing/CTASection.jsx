import { useState } from 'react';
import Button from '@/Components/UI/Button';

/**
 * CTASection - Call-to-action section with contact form
 * Features gradient background, contact form, and compelling CTA messaging
 */
export default function CTASection() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        message: '',
    });
    const [formStatus, setFormStatus] = useState('idle'); // idle, submitting, success, error

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormStatus('submitting');

        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            setFormStatus('success');
            setFormData({
                name: '',
                email: '',
                company: '',
                message: '',
            });
        }, 1500);
    };

    return (
        <section
            id="contact"
            className="relative py-20 lg:py-28 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Gradient orbs */}
                <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="absolute top-1/2 right-0 h-64 w-64 -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">
                    {/* Left column - CTA content */}
                    <div className="mb-12 lg:mb-0 text-center lg:text-left">
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-1.5">
                            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
                            <span className="text-sm font-medium text-blue-100">
                                Get Started Today
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                            Ready to Transform{' '}
                            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Your Workflow?
                            </span>
                        </h2>

                        {/* Description */}
                        <p className="mb-8 text-lg text-blue-100/80 leading-relaxed">
                            Join thousands of businesses already saving time and boosting productivity
                            with our intelligent automation platform. Start your free trial today and
                            experience the future of work.
                        </p>

                        {/* Benefits list */}
                        <ul className="mb-8 space-y-4">
                            {[
                                'Free 14-day trial, no credit card required',
                                'Full access to all automation features',
                                'Dedicated onboarding support',
                                'Cancel anytime, no questions asked',
                            ].map((benefit, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-3 text-blue-100"
                                >
                                    <svg
                                        className="h-5 w-5 flex-shrink-0 text-green-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-base">{benefit}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Trust indicators */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="h-5 w-5 text-yellow-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-sm text-blue-100">
                                    4.9/5 Rating
                                </span>
                            </div>
                            <div className="text-sm text-blue-200/60">|</div>
                            <div className="text-sm text-blue-100">10,000+ Happy Users</div>
                            <div className="text-sm text-blue-200/60">|</div>
                            <div className="text-sm text-blue-100">Enterprise Ready</div>
                        </div>
                    </div>

                    {/* Right column - Contact form */}
                    <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm border border-white/10 shadow-2xl">
                        <h3 className="mb-2 text-2xl font-bold text-white">
                            Contact Us
                        </h3>
                        <p className="mb-6 text-blue-100/70">
                            Fill out the form below and we'll get back to you within 24 hours.
                        </p>

                        {formStatus === 'success' ? (
                            <div className="rounded-lg bg-green-500/20 border border-green-400/30 p-6 text-center">
                                <svg
                                    className="mx-auto mb-4 h-12 w-12 text-green-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <h4 className="mb-2 text-xl font-bold text-white">
                                    Thank You!
                                </h4>
                                <p className="text-green-100">
                                    Your message has been sent. We'll be in touch soon!
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFormStatus('idle')}
                                    className="mt-4 text-green-300 hover:text-white hover:bg-green-500/20"
                                >
                                    Send Another Message
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Name field */}
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-blue-100 mb-2"
                                    >
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="John Doe"
                                        className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-blue-200/50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-colors"
                                    />
                                </div>

                                {/* Email field */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-blue-100 mb-2"
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="john@example.com"
                                        className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-blue-200/50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-colors"
                                    />
                                </div>

                                {/* Company field */}
                                <div>
                                    <label
                                        htmlFor="company"
                                        className="block text-sm font-medium text-blue-100 mb-2"
                                    >
                                        Company{' '}
                                        <span className="text-blue-300/50">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="company"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        placeholder="Acme Inc."
                                        className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-blue-200/50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-colors"
                                    />
                                </div>

                                {/* Message field */}
                                <div>
                                    <label
                                        htmlFor="message"
                                        className="block text-sm font-medium text-blue-100 mb-2"
                                    >
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows={4}
                                        placeholder="Tell us about your automation needs..."
                                        className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-blue-200/50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-colors resize-none"
                                    />
                                </div>

                                {/* Submit button */}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={formStatus === 'submitting'}
                                    className="w-full shadow-lg shadow-blue-500/25"
                                >
                                    {formStatus === 'submitting' ? (
                                        <>
                                            <svg
                                                className="mr-2 h-5 w-5 animate-spin"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send Message</span>
                                            <svg
                                                className="ml-2 h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                                />
                                            </svg>
                                        </>
                                    )}
                                </Button>

                                {/* Privacy note */}
                                <p className="text-center text-xs text-blue-200/50">
                                    By submitting this form, you agree to our{' '}
                                    <a
                                        href="#"
                                        className="underline hover:text-blue-300 transition-colors"
                                    >
                                        Privacy Policy
                                    </a>{' '}
                                    and{' '}
                                    <a
                                        href="#"
                                        className="underline hover:text-blue-300 transition-colors"
                                    >
                                        Terms of Service
                                    </a>
                                    .
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                {/* Bottom section - Quick contact options */}
                <div className="mt-16 grid gap-6 sm:grid-cols-3">
                    {/* Email contact */}
                    <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-blue-500/20 p-3 text-blue-300">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                                />
                            </svg>
                        </div>
                        <h4 className="mb-1 font-bold text-white">Email Us</h4>
                        <p className="text-sm text-blue-200/70">support@agentauto.com</p>
                    </div>

                    {/* Phone contact */}
                    <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-green-500/20 p-3 text-green-300">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                                />
                            </svg>
                        </div>
                        <h4 className="mb-1 font-bold text-white">Call Us</h4>
                        <p className="text-sm text-blue-200/70">+1 (555) 123-4567</p>
                    </div>

                    {/* Live chat */}
                    <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-purple-500/20 p-3 text-purple-300">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                                />
                            </svg>
                        </div>
                        <h4 className="mb-1 font-bold text-white">Live Chat</h4>
                        <p className="text-sm text-blue-200/70">Available 24/7</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
