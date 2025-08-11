'use client'

import { useState } from 'react'
import styles from './page.module.css'
import { fetchPropertyById, getPropertyRequestUrl } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function Home() {
    const [propertyCode, setPropertyCode] = useState('')
    const [showPopup, setShowPopup] = useState(false)
    const [popupMessage, setPopupMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const code = propertyCode.trim()
        if (!code) return

        setIsLoading(true)
        try {
            // console.log('Searching property with code:', code)
            const requestUrl = getPropertyRequestUrl(code)
            // console.log('Primary Request URL:', requestUrl)
            const data = await fetchPropertyById(code)
            if (data) {
                // console.log('Property data:', data)
                // Navigate to details using query param compatible with Angular style
                router.push(`/details?property_id=${encodeURIComponent(code)}`)
            } else {
                // console.log('No property found for code:', code)
                // console.log('Tried URL:', requestUrl)
                setPopupMessage('No property found with the provided code. Please check the code and try again.')
                setShowPopup(true)
            }
        } catch (err) {
            // console.error('Search error:', err)
            setPopupMessage('An error occurred while searching for the property. Please try again.')
            setShowPopup(true)
        } finally {
            setIsLoading(false)
        }
    }

    const closePopup = () => {
        setShowPopup(false)
        setPopupMessage('')
    }

    return (
        <div className={styles.container}>
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <div className={styles.logo}>
                        <img
                            src="/images/web_logo.svg"
                            alt="Cape Agents"
                            className={styles.logoImage}
                            onError={(e) => {
                                // Fallback to text if image not found
                                e.currentTarget.style.display = 'none';
                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextElement) {
                                    nextElement.style.display = 'block';
                                }
                            }}
                        />
                        <div className={styles.logoText} style={{ display: 'none' }}>
                            <h1>CAPE<span className={styles.agents}>AGENTS</span></h1>
                            <p className={styles.tagline}>CO.ZA</p>
                        </div>
                    </div>

                    <div className={styles.formWrapper}>
                        <div className={styles.formContainer}>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="propertyCode" className={styles.label}>
                                        Enter the property code to view details
                                    </label>
                                    <div className={styles.formRow}>
                                        <input
                                            type="text"
                                            id="propertyCode"
                                            value={propertyCode}
                                            onChange={(e) => setPropertyCode(e.target.value)}
                                            className={styles.input}
                                            placeholder=""
                                            required
                                        />
                                        <button type="submit" className={styles.submitButton} disabled={isLoading}>
                                            {isLoading ? (
                                                <div className={styles.spinner}></div>
                                            ) : 'SUBMIT'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popup Overlay */}
            {showPopup && (
                <div className={styles.popupOverlay}>
                    <div className={styles.popupContainer}>
                        <div className={styles.popupContent}>
                            <h3 className={styles.popupTitle}>Property Code Not Found</h3>
                            <p className={styles.popupMessage}>{popupMessage}</p>
                            <button onClick={closePopup} className={styles.popupButton}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}