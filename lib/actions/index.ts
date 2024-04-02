'use server';

import { revalidatePath } from "next/cache";
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

        const newProduct = await Product.findOneAndUpdate(
            { url: scrapedProduct.url }, 
            product,
            { upsert: true, new: true } 
        )
        
        revalidatePath(`/products/${newProduct._id}`)

    } catch (error: any) {
        throw new Error(`Failed to scrape and store products: ${error}`)
    }
}

export async function getProductById(productId: string) {
    try {
        connectToDB()

        const product = await Product.findOne({ _id: productId })

        if(!product) return null

        return product
    } catch (error) {
        console.log(error)
    }
}

export async function getAllProducts() {
    try {
        connectToDB()

        const products = await Product.find()

        return products
    } catch (error) {
        console.log(error)
    }
}
