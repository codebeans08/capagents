'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faPaperPlane, faChevronLeft, faChevronRight, faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Thumbs, FreeMode } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'
import 'swiper/css/free-mode'
import styles from './details.module.css'
import { fetchPropertyById } from '@/lib/api'
import type { PropertyData } from '@/lib/api'

// Type imported from API for consistency

// Constants
const PLACEHOLDER_IMAGE = '/images/placeholder-property.jpg'
const LOGO_IMAGE = '/images/web_logo.svg'

// Dummy data - Used when API data is unavailable
const DUMMY_PROPERTY_DATA: PropertyData = {
    id: 'CB2042',
    name: 'THE CRYSTALLINE',
    address: '35 Woodford Ave, Camps Bay, Cape Town, 8040, South Africa',
    sleeps: 6,
    bathrooms: 2,
    bedrooms: 3,
    suburb: 'Camps Bay',
    price: 'R 2,500,000',
    propertyType: 'Villa',
    size: '250 sqm',
    yearBuilt: '2018',
    parking: '2 Garage Spaces',
    description: 'Experience luxury living at its finest in this stunning contemporary villa nestled in the heart of Camps Bay. The Crystalline offers breathtaking ocean views, modern amenities, and sophisticated design throughout. This exceptional property features an open-plan living area that seamlessly flows onto expansive outdoor terraces, perfect for entertaining while enjoying the spectacular sunset views over the Atlantic Ocean.',
    features: [
        'Ocean Views', 'Swimming Pool', 'Modern Kitchen', 'Air Conditioning',
        'Security System', 'Garden', 'Balcony', 'Fireplace'
    ],
    amenities: [
        'High-speed WiFi', 'Smart TV', 'Washing Machine', 'Dishwasher',
        'Coffee Machine', 'BBQ Area', 'Outdoor Furniture', 'Beach Access'
    ],
    images: [
        '/images/accordion_image.jpg',
        '/images/accordion_image.jpg',
        '/images/accordion_image.jpg',
        '/images/accordion_image.jpg',
        '/images/accordion_image.jpg',
        '/images/accordion_image.jpg'
    ],
    location: {
        latitude: -33.9553,
        longitude: 18.3776,
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3310.2441!2d18.3776!3d-33.9553!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc675e4b7b7b7b%3A0x1234567890abcdef!2sCamps%20Bay%2C%20Cape%20Town%2C%20South%20Africa!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus'
    },
    contact: {
        agent: 'Cape Agents Real Estate',
        phone: '+27 21 123 4567',
        email: 'info@capeagents.co.za',
        officeHours: 'Monday - Friday: 9:00 AM - 6:00 PM'
    }
}

// Removed feature accordion sections

export default function PropertyDetails() {
    const router = useRouter()

    // State management
    const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
    const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null)
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [descriptionGroups, setDescriptionGroups] = useState<string[]>([])
    const [descriptionRemainder, setDescriptionRemainder] = useState<string>('')
    const [showScrollTop, setShowScrollTop] = useState<boolean>(false)

    // Fetch property data - Uses API if configured, otherwise falls back to dummy
    const fetchPropertyData = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Try API if env is present and an id can be derived from URL
            let loaded: PropertyData | null = null
            try {
                const url = new URL(window.location.href)
                let idParam =
                    url.searchParams.get('property_id') ||
                    url.searchParams.get('id') ||
                    url.pathname.split('/').pop() || ''

                // Fallback: support Angular-style hash routing like #/?property_id=CB156
                if (!idParam && url.hash) {
                    const hash = url.hash.replace(/^#\/?/, '')
                    const hashParams = new URLSearchParams(hash.split('?')[1] || hash)
                    idParam = hashParams.get('property_id') || ''
                }

                if (idParam) {
                    loaded = await fetchPropertyById(idParam)
                }
            } catch (_) {
                // ignore URL parsing errors
            }

            setPropertyData(loaded ?? DUMMY_PROPERTY_DATA)
        } catch (err) {
            setError('Failed to load property data')
            // console.error('Error fetching property data:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Helpers to render only when data exists
    const hasText = useCallback((value?: string | null) => {
        return typeof value === 'string' && value.trim().length > 0
    }, [])
    const hasNumber = useCallback((value?: number | null) => {
        return typeof value === 'number' && Number.isFinite(value) && value > 0
    }, [])

    // Load data on component mount
    useEffect(() => {
        fetchPropertyData()
    }, [fetchPropertyData])

    // Cleanup Swiper instances on unmount
    useEffect(() => {
        return () => {
            if (mainSwiper && !mainSwiper.destroyed) {
                try {
                    // Check if the swiper element still exists in DOM before destroying
                    if (mainSwiper.el && mainSwiper.el.parentNode) {
                        mainSwiper.destroy(true, true)
                    }
                } catch (error) {
                    console.warn('Error destroying main swiper:', error)
                }
            }
            if (thumbsSwiper && !thumbsSwiper.destroyed) {
                try {
                    // Check if the swiper element still exists in DOM before destroying
                    if (thumbsSwiper.el && thumbsSwiper.el.parentNode) {
                        thumbsSwiper.destroy(true, true)
                    }
                } catch (error) {
                    console.warn('Error destroying thumbs swiper:', error)
                }
            }
        }
    }, [mainSwiper, thumbsSwiper])

    // Scroll to top functionality
    useEffect(() => {
        let isMounted = true

        const handleScroll = () => {
            if (!isMounted) return

            try {
                const scrollY = window.scrollY
                setShowScrollTop(scrollY > 300)
            } catch (error) {
                console.warn('Error in scroll handler:', error)
            }
        }

        // Check initial scroll position
        handleScroll()

        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            isMounted = false
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const scrollToTop = () => {
        try {
            if (typeof window !== 'undefined' && window.scrollTo) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                })
            }
        } catch (error) {
            console.warn('Error scrolling to top:', error)
            // Fallback to instant scroll
            try {
                window.scrollTo(0, 0)
            } catch (fallbackError) {
                console.warn('Fallback scroll also failed:', fallbackError)
            }
        }
    }

    // Parse description into groups: nearest previous <p> + the following <ul>
    useEffect(() => {
        const html = propertyData?.description ?? ''
        if (!hasText(html)) {
            setDescriptionGroups([])
            setDescriptionRemainder('')
            return
        }

        try {
            // Check if DOMParser is available (for SSR compatibility)
            if (typeof DOMParser === 'undefined') {
                setDescriptionGroups([])
                setDescriptionRemainder('')
                return
            }

            const parser = new DOMParser()
            const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')

            // Safety check for valid document
            if (!doc || !doc.body || !doc.body.firstElementChild) {
                setDescriptionGroups([])
                setDescriptionRemainder('')
                return
            }

            const container = doc.body.firstElementChild as HTMLElement
            if (!container || !container.children || container.children.length === 0) {
                setDescriptionGroups([])
                setDescriptionRemainder('')
                return
            }

            const elements = Array.from(container.children)
            if (!elements || elements.length === 0) {
                setDescriptionGroups([])
                setDescriptionRemainder('')
                return
            }

            const consumed = new Set<number>()
            const groups: string[] = []

            for (let i = 0; i < elements.length; i += 1) {
                if (consumed.has(i)) continue

                const el = elements[i]
                if (!el || !el.tagName || typeof el.tagName !== 'string') continue

                if (el.tagName.toLowerCase() === 'ul') {
                    let prevPIndex = i - 1
                    while (
                        prevPIndex >= 0 &&
                        prevPIndex < elements.length &&
                        (consumed.has(prevPIndex) ||
                            !elements[prevPIndex] ||
                            !elements[prevPIndex].tagName ||
                            typeof elements[prevPIndex].tagName !== 'string' ||
                            elements[prevPIndex].tagName.toLowerCase() !== 'p')
                    ) {
                        prevPIndex -= 1
                    }

                    const startIndex = Math.max(0, Math.min(prevPIndex >= 0 ? prevPIndex : i, elements.length - 1))

                    // Build group HTML string directly instead of cloning nodes
                    let groupHtml = ''
                    for (let k = startIndex; k <= i && k < elements.length; k += 1) {
                        if (!consumed.has(k) && elements[k]) {
                            try {
                                groupHtml += elements[k].outerHTML || ''
                                consumed.add(k)
                            } catch (error) {
                                console.warn('Failed to get outerHTML:', error)
                                consumed.add(k)
                            }
                        }
                    }

                    if (groupHtml) {
                        groups.push(groupHtml)
                    }
                }
            }

            // Remaining nodes (e.g., trailing <p>) are rendered after groups
            let remainderHtml = ''
            for (let i = 0; i < elements.length; i += 1) {
                if (!consumed.has(i) && elements[i] && i < elements.length) {
                    try {
                        remainderHtml += elements[i].outerHTML || ''
                    } catch (error) {
                        console.warn('Failed to get outerHTML:', error)
                    }
                }
            }

            setDescriptionGroups(groups)
            setDescriptionRemainder(remainderHtml)

        } catch (error) {
            console.warn('Error parsing description:', error)
            setDescriptionGroups([])
            setDescriptionRemainder('')
        }
    }, [propertyData?.description, hasText])

    // Navigation handlers
    const handleBackToSearch = useCallback(() => {
        router.push('/')
    }, [router])

    // Image navigation state is controlled by Swiper; thumbnails call goToImage

    const goToImage = useCallback((index: number) => {
        setCurrentImageIndex(index)
        if (mainSwiper && !mainSwiper.destroyed && mainSwiper.el && mainSwiper.el.parentNode) {
            try {
                mainSwiper.slideTo(index)
            } catch (error) {
                console.warn('Error navigating to image:', error)
            }
        }
    }, [mainSwiper])

    // Handle main swiper slide change
    const handleSlideChange = useCallback((swiper: SwiperType) => {
        try {
            if (swiper && !swiper.destroyed && swiper.el && swiper.el.parentNode) {
                setCurrentImageIndex(swiper.activeIndex)
            }
        } catch (error) {
            console.warn('Error handling slide change:', error)
        }
    }, [])

    // Share handlers
    const handleShare = useCallback(async () => {
        if (!propertyData) return

        const shareData = {
            title: `${propertyData.name} - ${propertyData.id}`,
            text: `Check out this property: ${propertyData.name}`,
            url: window.location.href,
        }

        try {
            if (navigator.share && navigator.canShare?.(shareData)) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(window.location.href)
                alert('Link copied to clipboard!')
            }
        } catch (err) {
            // console.error('Error sharing:', err)
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href)
                alert('Link copied to clipboard!')
            } catch (clipboardErr) {
                // console.error('Clipboard error:', clipboardErr)
            }
        }
    }, [propertyData])

    const handleWhatsAppShare = useCallback(() => {
        if (!propertyData) return

        const message = `Check out this property: ${propertyData.name} - ${propertyData.id}\n${propertyData.address}\nPrice: ${propertyData.price}\n${window.location.href}`
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    }, [propertyData])

    // Image error handler
    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.currentTarget
        if (target.src !== PLACEHOLDER_IMAGE) {
            target.src = PLACEHOLDER_IMAGE
        }
    }, [])

    // Loading state
    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.overlay}>
                    <div className={styles.content}>
                        <div className={styles.loading}>Loading property details...</div>
                    </div>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !propertyData) {
        return (
            <div className={styles.container}>
                <div className={styles.overlay}>
                    <div className={styles.content}>
                        <div className={styles.error}>
                            {error || 'Property not found'}
                            <button onClick={handleBackToSearch} className={styles.backButton}>
                                Back to Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <div className={styles.logo}>
                        <a href="/" className={styles.logoLink}>
                            <img
                                src={LOGO_IMAGE}
                                alt="Cape Agents"
                                className={styles.logoImage}
                                onError={(e) => {
                                    const target = e.currentTarget
                                    target.style.display = 'none'
                                    const nextElement = target.nextElementSibling as HTMLElement
                                    if (nextElement) {
                                        nextElement.style.display = 'block'
                                    }
                                }}
                            />
                            <div className={styles.logoText} style={{ display: 'none' }}>
                                <h1>CAPE<span className={styles.agents}>AGENTS</span></h1>
                                <p className={styles.tagline}>CO.ZA</p>
                            </div>
                        </a>
                    </div>

                    <div className={styles.detailsWrapper}>
                        <div className={styles.detailsContainer}>
                            <div className={styles.header}>
                                <h2 className={styles.propertyTitle}>
                                    Property Details: <span><a href={propertyData.property_url} target="_blank" rel="noopener noreferrer" className={styles.propertyTitleLink}>{propertyData.id} - {propertyData.name}</a></span>
                                </h2>
                                <button
                                    onClick={handleBackToSearch}
                                    className={styles.backButton}
                                >
                                    Back to Search
                                </button>
                            </div>

                            {propertyData.images.filter(Boolean).length > 0 && (
                                <div className={styles.imageSlider}>
                                    {/* Main Swiper */}
                                    <Swiper
                                        modules={[Navigation, Thumbs]}
                                        onSwiper={(swiper) => {
                                            if (swiper && swiper.el && swiper.el.parentNode) {
                                                setMainSwiper(swiper)
                                            }
                                        }}
                                        onSlideChange={handleSlideChange}
                                        navigation={{
                                            nextEl: '.swiper-button-next-custom',
                                            prevEl: '.swiper-button-prev-custom',
                                        }}
                                        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                                        className={styles.mainSwiper}
                                        spaceBetween={10}
                                        slidesPerView={1}
                                    >
                                        {propertyData.images.filter(Boolean).map((image, index) => (
                                            <SwiperSlide key={index}>
                                                <div className={styles.mainImageContainer}>
                                                    <img
                                                        src={image}
                                                        alt={`${propertyData.name} - Image ${index + 1}`}
                                                        className={styles.mainImage}
                                                        onError={handleImageError}
                                                    />
                                                </div>
                                            </SwiperSlide>
                                        ))}

                                        {/* Custom Navigation Buttons */}
                                        <div className="swiper-button-prev-custom" aria-label="Previous slide">
                                            <svg width="100%" height="100%" viewBox="0 0 43 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="21.5" cy="21.5" r="21" fill="#E2E2E2" stroke="#E2E2E2" />
                                                <path d="M26 9L13 21L26 33" stroke="#1D1D1D" strokeWidth="2" strokeLinecap="square" />
                                            </svg>
                                        </div>
                                        <div className="swiper-button-next-custom" aria-label="Next slide">
                                            <svg width="100%" height="100%" viewBox="0 0 43 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="21.5" cy="21.5" r="21" transform="rotate(-180 21.5 21.5)" fill="#E2E2E2" stroke="#E2E2E2" />
                                                <path d="M17 34L30 22L17 10" stroke="#1D1D1D" strokeWidth="2" strokeLinecap="square" />
                                            </svg>
                                        </div>
                                    </Swiper>

                                    {/* Thumbnail Swiper */}
                                    <Swiper
                                        modules={[FreeMode]}
                                        onSwiper={(swiper) => {
                                            if (swiper && swiper.el && swiper.el.parentNode) {
                                                setThumbsSwiper(swiper)
                                            }
                                        }}
                                        spaceBetween={8}
                                        slidesPerView={5}
                                        freeMode={true}
                                        watchSlidesProgress={true}
                                        className={styles.thumbSwiper}
                                        breakpoints={{
                                            320: {
                                                slidesPerView: 3,
                                                spaceBetween: 6,
                                            },
                                            480: {
                                                slidesPerView: 4,
                                                spaceBetween: 6,
                                            },
                                            768: {
                                                slidesPerView: 5,
                                                spaceBetween: 8,
                                            },
                                        }}
                                    >
                                        {propertyData.images.filter(Boolean).map((image, index) => (
                                            <SwiperSlide key={index}>
                                                <div
                                                    className={`${styles.thumbnail} ${index === currentImageIndex ? styles.activeThumbnail : ''}`}
                                                    onClick={() => goToImage(index)}
                                                >
                                                    <img
                                                        src={image}
                                                        alt={`${propertyData.name} thumbnail ${index + 1}`}
                                                        className={styles.thumbnailImage}
                                                        onError={handleImageError}
                                                    />
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            )}

                            <div className={styles.propertyInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Id:</span>
                                    <span className={styles.value}>{propertyData.id}</span>
                                    <div className={styles.shareSection}>
                                        <span className={styles.shareLabel}>Share:</span>
                                        <button
                                            onClick={handleWhatsAppShare}
                                            className={`${styles.shareButton} ${styles.whatsappButton}`}
                                            title="Share on WhatsApp"
                                        >
                                            <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M18.1199 13.6004L14.5117 11.7965C14.4052 11.7435 14.2865 11.7196 14.1677 11.7271C14.0489 11.7346 13.9342 11.7733 13.8352 11.8394L12.0672 13.0175C11.1722 12.5594 10.4439 11.8313 9.98575 10.9363L11.1652 9.16956C11.2312 9.07054 11.2699 8.95585 11.2774 8.83708C11.285 8.7183 11.261 8.59965 11.208 8.49309L9.40393 4.88525C9.34784 4.77237 9.26132 4.67741 9.15414 4.61107C9.04695 4.54474 8.92336 4.50966 8.79731 4.5098C7.66094 4.5098 6.57111 4.96119 5.76757 5.76465C4.96404 6.56812 4.51262 7.65785 4.51262 8.79412C4.5156 11.3648 5.5382 13.8293 7.35608 15.647C9.17396 17.4647 11.6387 18.4872 14.2096 18.4902C15.3459 18.4902 16.4358 18.0388 17.2393 17.2353C18.0428 16.4319 18.4942 15.3422 18.4942 14.2059C18.4943 14.0801 18.4593 13.9569 18.3932 13.8499C18.327 13.743 18.2324 13.6566 18.1199 13.6004ZM14.2096 17.1373C11.9974 17.1346 9.87671 16.2547 8.31251 14.6906C6.74831 13.1266 5.86836 11.006 5.86568 8.79412C5.86574 8.08664 6.12169 7.40305 6.58631 6.86948C7.05092 6.3359 7.69284 5.98835 8.39365 5.89093L9.82113 8.74564L8.6496 10.5022C8.58805 10.5949 8.55029 10.7012 8.53967 10.812C8.52905 10.9227 8.54589 11.0343 8.58871 11.137C9.21081 12.6159 10.3874 13.7924 11.8665 14.4145C11.9692 14.4573 12.0808 14.4741 12.1915 14.4635C12.3023 14.4529 12.4087 14.4151 12.5013 14.3536L14.258 13.1822L17.113 14.6095C17.0156 15.3103 16.668 15.9521 16.1344 16.4167C15.6007 16.8813 14.9171 17.1372 14.2096 17.1373ZM11.5034 2.53469e-07C9.50968 -0.000418252 7.55007 0.517418 5.81684 1.50271C4.08362 2.488 2.63632 3.90689 1.61694 5.62018C0.597556 7.33348 0.0411108 9.28232 0.00219191 11.2755C-0.036727 13.2687 0.443218 15.2378 1.39494 16.9896L0.0847261 20.921C-0.00803013 21.1991 -0.0214912 21.4975 0.0458517 21.7829C0.113195 22.0682 0.25868 22.3292 0.466002 22.5365C0.673323 22.7438 0.934288 22.8892 1.21965 22.9566C1.50501 23.0239 1.80348 23.0104 2.08162 22.9177L6.01339 21.6076C7.55247 22.4427 9.26196 22.9154 11.0115 22.9897C12.761 23.0639 14.5044 22.7376 16.1087 22.0358C17.713 21.334 19.1359 20.2752 20.2688 18.9401C21.4017 17.6049 22.2147 16.0287 22.6459 14.3317C23.0771 12.6347 23.115 10.8616 22.7568 9.14763C22.3986 7.4337 21.6537 5.82419 20.579 4.44182C19.5042 3.05944 18.128 1.94072 16.5552 1.17095C14.9824 0.401172 13.2545 0.00067744 11.5034 2.53469e-07ZM11.5034 21.6471C9.71957 21.6475 7.96712 21.1777 6.42269 20.2851C6.31973 20.2259 6.20318 20.1945 6.08442 20.1938C6.01163 20.1942 5.93934 20.206 5.87019 20.2287L1.65428 21.6335C1.61454 21.6468 1.5719 21.6487 1.53114 21.6391C1.49037 21.6295 1.45309 21.6087 1.42347 21.5791C1.39386 21.5495 1.37307 21.5122 1.36345 21.4714C1.35383 21.4307 1.35576 21.388 1.36901 21.3483L2.77393 17.1373C2.80433 17.0463 2.81503 16.9498 2.80531 16.8544C2.79559 16.759 2.76567 16.6667 2.71756 16.5837C1.59819 14.6502 1.14825 12.4014 1.43755 10.1861C1.72685 7.97086 2.73922 5.91298 4.31758 4.33176C5.89595 2.75053 7.95209 1.73435 10.167 1.44088C12.3819 1.1474 14.6318 1.59302 16.5675 2.70862C18.5033 3.82422 20.0167 5.54743 20.8731 7.61089C21.7294 9.67436 21.8808 11.9627 21.3037 14.121C20.7265 16.2793 19.4532 18.1867 17.6813 19.5475C15.9093 20.9083 13.7377 21.6463 11.5034 21.6471Z" fill="#1D1D1D" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className={styles.shareButton}
                                            title="Share this property"
                                        >
                                            <svg width="25" height="23" viewBox="0 0 25 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M24.5337 0.431305C24.3349 0.245646 24.0853 0.112853 23.8111 0.0469716C23.537 -0.0189096 23.2487 -0.01543 22.9765 0.0570421H22.964L1.14861 6.14457C0.838775 6.2271 0.563525 6.39429 0.359349 6.62398C0.155172 6.85367 0.0317112 7.135 0.0053313 7.4307C-0.0210486 7.72639 0.0508983 8.02247 0.211635 8.2797C0.372372 8.53693 0.614307 8.74315 0.905372 8.87104L10.6304 13.2242L15.3543 22.1637C15.4815 22.4143 15.6841 22.6262 15.9381 22.7744C16.192 22.9226 16.4868 23.0009 16.7876 23C16.833 23 16.8796 23 16.9251 22.9948C17.2473 22.9715 17.554 22.8578 17.8037 22.6692C18.0535 22.4806 18.2344 22.2261 18.322 21.9399L24.9372 1.87504V1.86354C25.0164 1.61352 25.0208 1.34845 24.9497 1.09635C24.8787 0.844256 24.735 0.614482 24.5337 0.431305ZM23.6244 1.51855L17.0149 21.5813V21.5928C17.0022 21.6344 16.9759 21.6714 16.9395 21.6987C16.9031 21.7259 16.8585 21.7422 16.8116 21.7452C16.7648 21.7481 16.7181 21.7377 16.678 21.7153C16.6378 21.6929 16.6062 21.6596 16.5875 21.62L11.9637 12.8823L17.5332 7.75975C17.5966 7.70147 17.6468 7.63229 17.6811 7.55614C17.7154 7.48 17.733 7.39839 17.733 7.31597C17.733 7.23355 17.7154 7.15194 17.6811 7.07579C17.6468 6.99965 17.5966 6.93046 17.5332 6.87218C17.4698 6.8139 17.3946 6.76768 17.3118 6.73614C17.229 6.7046 17.1403 6.68836 17.0507 6.68836C16.9611 6.68836 16.8723 6.7046 16.7896 6.73614C16.7068 6.76768 16.6315 6.8139 16.5682 6.87218L10.9987 11.9948L1.49074 7.73675C1.4486 7.71869 1.4135 7.68919 1.39016 7.65221C1.36682 7.61524 1.35637 7.57257 1.36021 7.52996C1.36405 7.48735 1.382 7.44685 1.41164 7.41392C1.44128 7.38098 1.48118 7.35719 1.52597 7.34576H1.53848L23.3516 1.26347C23.3899 1.25357 23.4305 1.25339 23.4689 1.26296C23.5073 1.27253 23.5422 1.29149 23.5698 1.31783C23.5979 1.34363 23.6181 1.37574 23.6285 1.41095C23.6388 1.44616 23.639 1.48326 23.629 1.51855H23.6244Z" fill="#1D1D1D" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {hasText(propertyData.name) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Name:</span>
                                        <span className={styles.value}>{propertyData.name}</span>
                                    </div>
                                )}

                                {hasText(propertyData.address) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Address:</span>
                                        <span className={styles.value}>{propertyData.address}</span>
                                    </div>
                                )}

                                {hasText(propertyData.suburb) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Suburb:</span>
                                        <span className={styles.value}>{propertyData.suburb}</span>
                                    </div>
                                )}

                                {hasNumber(propertyData.sleeps) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Sleeps:</span>
                                        <span className={styles.value}>{propertyData.sleeps}</span>
                                    </div>
                                )}

                                {hasNumber(propertyData.bedrooms) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Bedrooms:</span>
                                        <span className={styles.value}>{propertyData.bedrooms}</span>
                                    </div>
                                )}

                                {hasNumber(propertyData.bathrooms) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Bathrooms:</span>
                                        <span className={styles.value}>{propertyData.bathrooms}</span>
                                    </div>
                                )}

                                {hasText(propertyData.price) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Price:</span>
                                        <span className={styles.value}>{propertyData.price}</span>
                                    </div>
                                )}

                                {hasText(propertyData.propertyType) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Property Type:</span>
                                        <span className={styles.value}>{propertyData.propertyType}</span>
                                    </div>
                                )}

                                {hasText(propertyData.size) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Size:</span>
                                        <span className={styles.value}>{propertyData.size}</span>
                                    </div>
                                )}

                                {hasText(propertyData.yearBuilt) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Year Built:</span>
                                        <span className={styles.value}>{propertyData.yearBuilt}</span>
                                    </div>
                                )}

                                {hasText(propertyData.parking) && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Parking:</span>
                                        <span className={styles.value}>{propertyData.parking}</span>
                                    </div>
                                )}
                            </div>

                            {/* Property Attributes/Features Section */}
                            {propertyData.attributes && propertyData.attributes.length > 0 && (
                                <div className={styles.section}>
                                    <h3 className={styles.sectionTitle}>Attributes:</h3>
                                    <div className={styles.attributesGrid}>
                                        {propertyData.attributes!.map((attribute, index) => (
                                            <div key={attribute.id || index} className={styles.attributeItem}>
                                                <span className={styles.attributeBullet}>•</span>
                                                <span className={styles.attributeText}>{attribute.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}



                            {hasText(propertyData.description) && (
                                <div className={styles.section}>
                                    <h3 className={styles.sectionTitle}>Description:</h3>
                                    <div className={styles.description}>
                                        {descriptionGroups.length > 0 ? (
                                            <>
                                                {hasText(descriptionRemainder) && (
                                                    <div
                                                        className="description-remainder"
                                                        dangerouslySetInnerHTML={{ __html: (() => {
                                                            // Process the description to remove location content
                                                            let processedDescription = descriptionRemainder;
                                                            
                                                            if (descriptionRemainder?.toUpperCase().includes('LOCATION')) {
                                                                // Create a temporary div to parse the HTML
                                                                const tempDiv = document.createElement('div');
                                                                tempDiv.innerHTML = descriptionRemainder;
                                                                
                                                                const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
                                                                const locationIndex = paragraphs.findIndex(p =>
                                                                    p.textContent?.toUpperCase().includes('LOCATION')
                                                                );

                                                                if (locationIndex !== -1) {
                                                                    // Remove the LOCATION paragraph and all location-related paragraphs
                                                                    const paragraphsToRemove = paragraphs.slice(locationIndex, -1);
                                                                    paragraphsToRemove.forEach(p => p.remove());
                                                                    
                                                                    // Also remove the LOCATION paragraph itself
                                                                    if (paragraphs[locationIndex]) {
                                                                        paragraphs[locationIndex].remove();
                                                                    }
                                                                    
                                                                    // Get the cleaned HTML
                                                                    processedDescription = tempDiv.innerHTML;
                                                                }
                                                            }
                                                            
                                                            return processedDescription;
                                                        })() }}
                                                    />
                                                )}
                                                <div className={styles.descriptionGroups}>
                                                    {descriptionGroups.map((groupHtml, idx) => (
                                                        <div key={idx} className={styles.descriptionGroup} dangerouslySetInnerHTML={{ __html: groupHtml }} />
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ __html: propertyData.description }} />
                                        )}
                                    </div>
                                </div>
                            )}



                            {/* Location Section */}
                            {(() => {
                                if (descriptionRemainder?.toUpperCase().includes('LOCATION')) {
                                    // Create a temporary div to parse the HTML
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = descriptionRemainder;
                                    
                                    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
                                    const locationIndex = paragraphs.findIndex(p =>
                                        p.textContent?.toUpperCase().includes('LOCATION')
                                    );

                                    if (locationIndex !== -1) {
                                        // LOCATION ke baad ke saare <p>, last one exclude
                                        const afterLocation = paragraphs.slice(locationIndex + 1, -1);
                                        const locationContent = afterLocation.map(p => p.textContent?.trim() || '');
                                        
                                        return (
                                            <div className={styles.locationSection}>
                                                <h4>Location:</h4>
                                                {locationContent.map((item, index) => (
                                                    <p key={index}>{item}</p>
                                                ))}
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            })()}

                            {/* Be Aware Section */}
                            {propertyData.be_aware && (
                                <div className={styles.beAwareSection}>
                                    <h3 className={styles.sectionTitle}>Be Aware:</h3>
                                    <div className={styles.beAwareContent}>
                                        {Array.isArray(propertyData.be_aware) ? (
                                            propertyData.be_aware.map((policy, index) => (
                                                <div key={index} className={styles.policyItem}>
                                                    <span className={styles.policyTitle}>{policy.title}</span>
                                                    <span className={styles.policyDescription}> {policy.description}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className={styles.beAwareText}>
                                                {propertyData.be_aware}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className={styles.accordionMapSection}>
                                {hasText(propertyData.location?.mapUrl) && (
                                    <div className={styles.mapContainer}>
                                        {/* <h3 className={styles.mapTitle}>Map:</h3> */}
                                        <div className={styles.mapWrapper}>
                                            <iframe
                                                src={propertyData.location.mapUrl}
                                                className={styles.mapIframe}
                                                allowFullScreen
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                title={`Map showing location of ${propertyData.name}`}
                                            />
                                            <div className={styles.mapOverlay}>
                                                <div className={styles.mapPin}>📍</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className={styles.scrollToTopButton}
                    title="Scroll to top"
                    aria-label="Scroll to top of page"
                >
                    <FontAwesomeIcon icon={faArrowUp} />
                </button>
            )}
        </div>
    )
}