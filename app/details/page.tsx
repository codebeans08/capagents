'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faPaperPlane, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
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

    // Parse description into groups: nearest previous <p> + the following <ul>
    useEffect(() => {
        const html = propertyData?.description ?? ''
        if (!hasText(html)) {
            setDescriptionGroups([])
            setDescriptionRemainder('')
            return
        }
        try {
            const parser = new DOMParser()
            const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
            const container = (doc.body.firstElementChild || doc.body) as HTMLElement
            const elements = Array.from(container.children)
            const consumed = new Set<number>()
            const groups: string[] = []

            for (let i = 0; i < elements.length; i += 1) {
                if (consumed.has(i)) continue
                const el = elements[i]
                if (el.tagName.toLowerCase() === 'ul') {
                    let prevPIndex = i - 1
                    while (
                        prevPIndex >= 0 &&
                        (consumed.has(prevPIndex) || elements[prevPIndex].tagName.toLowerCase() !== 'p')
                    ) {
                        prevPIndex -= 1
                    }
                    const startIndex = prevPIndex >= 0 ? prevPIndex : i
                    const fragment = doc.createElement('div')
                    for (let k = startIndex; k <= i; k += 1) {
                        if (!consumed.has(k)) {
                            fragment.appendChild(elements[k].cloneNode(true))
                            consumed.add(k)
                        }
                    }
                    groups.push(fragment.innerHTML)
                }
            }

            // Remaining nodes (e.g., trailing <p>) are rendered after groups
            const remainderFrag = doc.createElement('div')
            for (let i = 0; i < elements.length; i += 1) {
                if (!consumed.has(i)) {
                    remainderFrag.appendChild(elements[i].cloneNode(true))
                }
            }

            setDescriptionGroups(groups)
            setDescriptionRemainder(remainderFrag.innerHTML)
        } catch (_) {
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
        if (mainSwiper) {
            mainSwiper.slideTo(index)
        }
    }, [mainSwiper])

    // Handle main swiper slide change
    const handleSlideChange = useCallback((swiper: SwiperType) => {
        setCurrentImageIndex(swiper.activeIndex)
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
                    </div>

                    <div className={styles.detailsWrapper}>
                        <div className={styles.detailsContainer}>
                            <div className={styles.header}>
                                <h2 className={styles.propertyTitle}>
                                    Property Details: <span>{propertyData.id} - {propertyData.name}</span>
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
                                        onSwiper={setMainSwiper}
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
                                            <FontAwesomeIcon icon={faChevronLeft} size="lg" />
                                        </div>
                                        <div className="swiper-button-next-custom" aria-label="Next slide">
                                            <FontAwesomeIcon icon={faChevronRight} size="lg" />
                                        </div>
                                    </Swiper>

                                    {/* Thumbnail Swiper */}
                                    <Swiper
                                        modules={[FreeMode]}
                                        onSwiper={setThumbsSwiper}
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
                                            <FontAwesomeIcon icon={faWhatsapp} size="lg" />
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className={styles.shareButton}
                                            title="Share this property"
                                        >
                                            <FontAwesomeIcon icon={faPaperPlane} size="lg" />
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
                                    <div className={styles.attributesList}>
                                        {propertyData.attributes!.map((attribute, index) => (
                                            <span key={attribute.id || index} className={styles.attributeText}>
                                                {attribute.name}
                                                {index < propertyData.attributes!.length - 1 ? ', ' : ''}
                                            </span>
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
                                                    <div dangerouslySetInnerHTML={{ __html: descriptionRemainder }} />
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

                            {/* Property Summary Section */}
                            <div className={styles.propertySummarySection}>
                                <div className={styles.propertySummary}>
                                    <span className={styles.summaryName}>{propertyData.name}</span>
                                    <span className={styles.summarySeparator}>, </span>
                                    <span className={styles.summarySuburb}>{propertyData.suburb}</span>
                                    <span className={styles.summarySeparator}>, </span>
                                    <span className={styles.summaryBedrooms}>{propertyData.bedrooms} bedroom</span>
                                    {propertyData.bedrooms !== 1 && <span>s</span>}
                                    <span className={styles.summarySeparator}>, </span>
                                    <span className={styles.summaryPool}>Swimming pool</span>
                                    <span className={styles.summarySeparator}>, </span>
                                    <span className={styles.summaryId}>{propertyData.id}</span>
                                </div>
                            </div>

                            {/* Be Aware Section */}
                            {propertyData.be_aware && (
                                <div className={styles.section}>
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
        </div>
    )
}