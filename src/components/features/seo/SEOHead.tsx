import { useEffect } from 'react';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'profile';
    profileName?: string;
    profilePrice?: number;
    profileCity?: string;
}

export function SEOHead({
    title = 'SpotGP - Acompanhantes e Massagistas',
    description = 'Encontre acompanhantes e massagistas verificados em todo o Brasil. Perfis detalhados, fotos reais e contato direto.',
    image = '/og-image.jpg',
    url,
    type = 'website',
    profileName,
    profilePrice,
    profileCity,
}: SEOHeadProps) {
    // Build full title
    const fullTitle = profileName
        ? `${profileName} - ${title}`
        : title;

    // Build description with profile info if available
    let metaDescription = description;
    if (profileName) {
        const parts: string[] = [];
        if (profileCity) parts.push(profileCity);
        if (profilePrice) parts.push(`R$ ${profilePrice}/hora`);
        if (parts.length > 0) {
            metaDescription = `${profileName}. ${parts.join(' | ')}. ${description}`;
        } else {
            metaDescription = `${profileName}. ${description}`;
        }
    }

    // Build image URL
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const imageUrl = image.startsWith('http') ? image : (typeof window !== 'undefined' ? `${window.location.origin}${image}` : image);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        // Update document title
        document.title = fullTitle;

        // Update or create meta tags
        const updateMetaTag = (name: string, content: string, property = false) => {
            const attribute = property ? 'property' : 'name';
            let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }
            element.content = content;
        };

        // Primary Meta Tags
        updateMetaTag('title', fullTitle);
        updateMetaTag('description', metaDescription);
        updateMetaTag('keywords', 'acompanhantes, massagistas, acompanhantes de luxo, massagem, relaxamento, Brasil');
        updateMetaTag('robots', 'index, follow');
        updateMetaTag('language', 'Portuguese');
        updateMetaTag('author', 'SpotGP');

        // Open Graph / Facebook
        updateMetaTag('og:type', type, true);
        updateMetaTag('og:url', currentUrl, true);
        updateMetaTag('og:title', fullTitle, true);
        updateMetaTag('og:description', metaDescription, true);
        updateMetaTag('og:image', imageUrl, true);
        updateMetaTag('og:site_name', 'SpotGP', true);
        updateMetaTag('og:locale', 'pt_BR', true);

        // Twitter
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:url', currentUrl);
        updateMetaTag('twitter:title', fullTitle);
        updateMetaTag('twitter:description', metaDescription);
        updateMetaTag('twitter:image', imageUrl);

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = currentUrl;
    }, [fullTitle, metaDescription, imageUrl, currentUrl, type]);

    return null; // This component doesn't render anything
}

