'use server';

import { scrapeAmazonProduct } from "../scraper";

export async function scrapeAndStoreProducts(productUrl: string) {
    if(!productUrl) return

    try {
        const scrapedProduct = await scrapeAmazonProduct(productUrl)
    } catch (error) {
        throw new Error(`Failed to scrape and store products: ${error}`)
    }
}