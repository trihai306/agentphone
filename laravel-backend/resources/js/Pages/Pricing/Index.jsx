import { useState } from 'react';
import { Link } from '@inertiajs/react';
import LandingLayout from '../../Layouts/LandingLayout';

export default function Index({ plans }) {
    const [billingPeriod, setBillingPeriod] = useState('month');

    return (
        <LandingLayout>
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
                        Choose the perfect plan for your needs. All plans include a 14-day free trial.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
                        <button
                            onClick={() => setBillingPeriod('month')}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                billingPeriod === 'month'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingPeriod('year')}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                billingPeriod === 'year'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Yearly
                            <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
                                Save 20%
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 -mt-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            billingPeriod={billingPeriod}
                        />
                    ))}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-gray-50 dark:bg-gray-800 py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <FAQItem
                            question="Can I change my plan later?"
                            answer="Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
                        />
                        <FAQItem
                            question="What payment methods do you accept?"
                            answer="We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise plans."
                        />
                        <FAQItem
                            question="Is there a free trial?"
                            answer="Yes! All plans come with a 14-day free trial. No credit card required to start."
                        />
                        <FAQItem
                            question="Can I cancel anytime?"
                            answer="Absolutely. You can cancel your subscription at any time from your account settings. No questions asked."
                        />
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Ready to get started?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of users managing their devices efficiently
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all"
                    >
                        Start Free Trial
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </div>
        </LandingLayout>
    );
}

function PricingCard({ plan, billingPeriod }) {
    const price = billingPeriod === 'year' ? Math.floor(plan.price * 0.8) : plan.price;
    const totalYearly = price * 12;

    return (
        <div
            className={`relative rounded-2xl transition-all ${
                plan.highlighted
                    ? 'bg-gradient-to-b from-blue-600 to-purple-600 shadow-2xl scale-105 md:scale-110'
                    : 'bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl'
            }`}
        >
            {/* Popular Badge */}
            {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        Most Popular
                    </span>
                </div>
            )}

            <div className="p-8">
                {/* Plan Name */}
                <h3
                    className={`text-2xl font-bold mb-2 ${
                        plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}
                >
                    {plan.name}
                </h3>

                {/* Description */}
                <p
                    className={`mb-6 ${
                        plan.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                    {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                    <div className="flex items-baseline">
                        <span
                            className={`text-5xl font-bold ${
                                plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                            }`}
                        >
                            ${price}
                        </span>
                        <span
                            className={`ml-2 ${
                                plan.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            /{billingPeriod}
                        </span>
                    </div>
                    {billingPeriod === 'year' && plan.price > 0 && (
                        <p
                            className={`text-sm mt-2 ${
                                plan.highlighted ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            ${totalYearly} billed annually
                        </p>
                    )}
                </div>

                {/* CTA Button */}
                <Link
                    href="/register"
                    className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all mb-8 ${
                        plan.highlighted
                            ? 'bg-white text-blue-600 hover:bg-gray-50 shadow-lg'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {plan.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                </Link>

                {/* Features */}
                <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <svg
                                className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                                    plan.highlighted ? 'text-blue-200' : 'text-green-500'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span
                                className={
                                    plan.highlighted ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                                }
                            >
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                <span className="font-semibold text-gray-900 dark:text-white">{question}</span>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                        isOpen ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-400">{answer}</p>
                </div>
            )}
        </div>
    );
}
