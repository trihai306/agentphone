import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import { Alert, Button } from '@/Components/UI';

export default function Index() {
    const { t } = useTranslation();
    const { flash } = usePage().props;
    const [showSuccess, setShowSuccess] = useState(!!flash.success);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/contact', {
            onSuccess: () => {
                reset();
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 5000);
            },
        });
    }

    return (
        <LandingLayout>
            <SeoHead
                title="Liên Hệ CLICKAI - Hỗ trợ 24/7"
                description="Liên hệ với đội ngũ hỗ trợ CLICKAI qua email, điện thoại hoặc form. Hỗ trợ kỹ thuật 24/7, tư vấn giải pháp automation cho doanh nghiệp."
                keywords="liên hệ clickai, contact, hỗ trợ, support, tư vấn"
                url="https://clickai.vn/contact"
            />
            {/* Hero */}
            <section className="relative bg-gradient-to-b from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-24 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(59, 130, 246) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 rounded-full px-4 py-2 mb-6">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">{t('contact.title')}</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        {t('contact.hero_title')}
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {t('contact.hero_subtitle')}
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        {t('contact.hero_description')}
                    </p>
                </div>
            </section>

            {/* Success Message */}
            {showSuccess && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
                    <Alert type="success" title={t('contact.success_title')} onClose={() => setShowSuccess(false)}>
                        {t('contact.success_message')}
                    </Alert>
                </div>
            )}

            {/* Contact Form Section */}
            <section className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-5 gap-12">
                        {/* Contact Info */}
                        <div className="lg:col-span-2">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                {t('contact.get_in_touch')}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                {t('contact.form_description')}
                            </p>

                            <div className="space-y-6">
                                <ContactInfoCard
                                    icon="email"
                                    title={t('contact.email')}
                                    value="support@devicehub.com"
                                    description={t('contact.email_description')}
                                />
                                <ContactInfoCard
                                    icon="phone"
                                    title={t('contact.phone')}
                                    value="+1 (555) 123-4567"
                                    description={t('contact.phone_description')}
                                />
                                <ContactInfoCard
                                    icon="location"
                                    title={t('contact.address')}
                                    value="123 Tech Street"
                                    description="San Francisco, CA 94105"
                                />
                            </div>

                            {/* Social Links */}
                            <div className="mt-10">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                                    {t('contact.follow_us')}
                                </h3>
                                <div className="flex space-x-4">
                                    <SocialButton icon="twitter" href="#" />
                                    <SocialButton icon="github" href="#" />
                                    <SocialButton icon="linkedin" href="#" />
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="lg:col-span-3">
                            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField
                                            label={t('contact.name')}
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            error={errors.name}
                                            placeholder="John Doe"
                                            icon="user"
                                        />
                                        <FormField
                                            label={t('contact.email')}
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            error={errors.email}
                                            placeholder="john@example.com"
                                            icon="email"
                                        />
                                    </div>

                                    <FormField
                                        label={t('contact.subject')}
                                        type="text"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        error={errors.subject}
                                        placeholder={t('contact.subject_placeholder')}
                                        icon="subject"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('contact.message')} *
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                value={data.message}
                                                onChange={(e) => setData('message', e.target.value)}
                                                rows={6}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                                placeholder={t('contact.message_placeholder')}
                                                required
                                            />
                                            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                                {data.message.length}/2000
                                            </div>
                                        </div>
                                        {errors.message && <p className="mt-2 text-sm text-red-600">{errors.message}</p>}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        variant="gradient"
                                        className="w-full !py-4"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>{t('contact.sending')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{t('contact.send')}</span>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('contact.faq_title')}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t('contact.faq_subtitle')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <FAQItem
                            question={t('contact.faq_q1')}
                            answer={t('contact.faq_a1')}
                        />
                        <FAQItem
                            question={t('contact.faq_q2')}
                            answer={t('contact.faq_a2')}
                        />
                        <FAQItem
                            question={t('contact.faq_q3')}
                            answer={t('contact.faq_a3')}
                        />
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

function FormField({ label, type, value, onChange, error, placeholder, icon }) {
    const icons = {
        user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        email: "M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z",
        subject: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label} *
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d={icons[icon]} />
                    </svg>
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}

function ContactInfoCard({ icon, title, value, description }) {
    const icons = {
        email: "M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z",
        phone: "M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z",
        location: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
    };

    return (
        <div className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d={icons[icon]} />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {title}
                </h3>
                <p className="text-gray-900 dark:text-white font-medium mb-0.5">
                    {value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {description}
                </p>
            </div>
        </div>
    );
}

function SocialButton({ icon, href }) {
    const icons = {
        twitter: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
        github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22",
        linkedin: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
    };

    return (
        <a
            href={href}
            className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white transition-all hover:scale-110"
            target="_blank"
            rel="noopener noreferrer"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
            </svg>
        </a>
    );
}

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <span className="font-semibold text-gray-900 dark:text-white">{question}</span>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <p className="text-gray-600 dark:text-gray-400">{answer}</p>
                </div>
            )}
        </div>
    );
}
