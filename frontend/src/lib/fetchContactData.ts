// src/lib/fetchContactData.ts

{/*import { SupportChannel } from "@/services/supportApi";
import { SocialMediaLink } from "@/services/socialApi";
import { Office } from "@/services/officesApi";

export interface ContactPageData {
    supportChannels: SupportChannel[];
    socialMediaLinks: SocialMediaLink[];
    offices: Office[];
}

/**
 * Fetch all contact page data in a single parallel request
 * This prevents rate limiting by consolidating API calls
 * Used for server-side rendering
 */
{/*export async function fetchContactPageData(): Promise<ContactPageData> {
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

    try {
        // Fetch all data in parallel
        const [supportChannelsRes, socialLinksRes, officesRes] = await Promise.all([
            fetch(`${baseURL}/api/support-channels`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                next: { revalidate: 60 }, // Cache for 60 seconds
            }),
            fetch(`${baseURL}/api/social-media-links`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                next: { revalidate: 60 },
            }),
            fetch(`${baseURL}/api/offices`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                next: { revalidate: 60 },
            }),
        ]);

        // Parse all responses
        const [supportChannelsData, socialLinksData, officesData] = await Promise.all([
            supportChannelsRes.ok ? supportChannelsRes.json() : { data: [] },
            socialLinksRes.ok ? socialLinksRes.json() : { data: [] },
            officesRes.ok ? officesRes.json() : { data: [] },
        ]);

        // Filter and sort data
        const supportChannels = (supportChannelsData.data || [])
            .filter((channel: SupportChannel) => channel.is_active)
            .sort((a: SupportChannel, b: SupportChannel) => a.sort_order - b.sort_order);

        const socialMediaLinks = (socialLinksData.data || [])
            .filter((link: SocialMediaLink) => link.is_active)
            .sort((a: SocialMediaLink, b: SocialMediaLink) => a.sort_order - b.sort_order);

        const offices = (officesData.data || [])
            .filter((office: Office) => office.is_active)
            .sort((a: Office, b: Office) => a.sort_order - b.sort_order);

        return {
            supportChannels,
            socialMediaLinks,
            offices,
        };
    } catch (error) {
        console.error("Error fetching contact page data:", error);
        // Return empty arrays as fallback
        return {
            supportChannels: [],
            socialMediaLinks: [],
            offices: [],
        };
    }
}
*/}}