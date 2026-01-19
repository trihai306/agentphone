import { Head } from '@inertiajs/react';

/**
 * SeoHead - Reusable SEO component for meta tags
 * 
 * @param {object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Meta description (max 160 chars recommended)
 * @param {string} props.keywords - Comma-separated keywords
 * @param {string} props.image - OG image URL (optional)
 * @param {string} props.url - Canonical URL (optional)
 * @param {string} props.type - OG type (default: 'website')
 * @param {object} props.structuredData - JSON-LD structured data (optional)
 */
export default function SeoHead({
    title,
    description = 'CLICKAI - Nền tảng tự động hoá quy trình doanh nghiệp với AI. Quản lý thiết bị thông minh, workflow automation, tiết kiệm 80% thời gian vận hành.',
    keywords = 'tự động hoá, automation, workflow, quản lý thiết bị, AI, clickai',
    image = '/images/og-default.jpg',
    url,
    type = 'website',
    structuredData = null,
}) {
    const siteName = 'CLICKAI';
    const twitterHandle = '@clickai_vn';

    // Build full title
    const fullTitle = title?.includes('CLICKAI')
        ? title
        : `${title} | ${siteName}`;

    return (
        <Head>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Canonical URL */}
            {url && <link rel="canonical" href={url} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            {url && <meta property="og:url" content={url} />}
            <meta property="og:locale" content="vi_VN" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content={twitterHandle} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data (JSON-LD) */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Head>
    );
}

/**
 * Pre-built structured data schemas
 */
export const schemas = {
    // Organization schema for homepage
    organization: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'CLICKAI',
        url: 'https://clickai.vn',
        logo: 'https://clickai.vn/images/logo.png',
        description: 'Nền tảng tự động hoá quy trình doanh nghiệp với AI',
        sameAs: [
            'https://facebook.com/clickai.vn',
            'https://twitter.com/clickai_vn',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+84-xxx-xxx-xxx',
            contactType: 'customer service',
            availableLanguage: ['Vietnamese', 'English'],
        },
    },

    // WebSite schema with search action
    website: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'CLICKAI',
        url: 'https://clickai.vn',
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://clickai.vn/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
        },
    },

    // FAQ schema generator
    faqPage: (faqs) => ({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    }),

    // SoftwareApplication schema
    softwareApplication: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'CLICKAI',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, Android',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'VND',
        },
    },
};
