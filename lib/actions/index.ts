'use server';

import Product from "../models/product.models";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../ulits";

export async function scrapeAndStoreProducts(productUrl: string) {
    if(!productUrl) return

    try {
         connectToDB()

        const scrapedProduct = await scrapeAmazonProduct(productUrl)
        
        if(!scrapedProduct) return;

        let product = scrapedProduct;

        const existingProduct = await Product.findOne({ url: scrapedProduct.url })

        if (existingProduct) {
            const updatePriceHistory: any = [
                ...existingProduct.priceHistory,
                { price: scrapedProduct.currentPrice,}
            ]

            product = {
                ...existingProduct,
                priceHistory: updatePriceHistory,
                lowestPrice: getLowestPrice(updatePriceHistory),
                highestPrice: getHighestPrice(updatePriceHistory),
                averagePrice: getAveragePrice(updatePriceHistory),
            }
        } 


    } catch (error) {
        throw new Error(`Failed to scrape and store products: ${error}`)
    }
}